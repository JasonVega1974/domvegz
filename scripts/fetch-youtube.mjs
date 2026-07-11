// Syncs Dom Vegz's YouTube uploads into data/youtube.json. Native fetch only, no deps, Node 20+.
// Run via .github/workflows/youtube-sync.yml (nightly + manual dispatch). Never logs the API key.

const API_KEY = process.env.YOUTUBE_API_KEY;
const CHANNEL_ID = "UCDDzP8DrQ9JAPmgs1VpF2PQ";
const UPLOADS_PLAYLIST_ID = "UUDDzP8DrQ9JAPmgs1VpF2PQ";
const HANDLE = "@DomVegz";
const OUT_PATH = new URL("../data/youtube.json", import.meta.url);

if (!API_KEY) {
  console.error(
    "Missing YOUTUBE_API_KEY. Set it at Settings -> Secrets and variables -> Actions, " +
    "then re-run this workflow (or `workflow_dispatch` it manually)."
  );
  process.exit(1);
}

async function apiGet(path, params) {
  const url = new URL(`https://www.googleapis.com/youtube/v3/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("key", API_KEY);
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`YouTube API ${path} failed: ${res.status} ${res.statusText} ${body}`.slice(0, 500));
  }
  return res.json();
}

async function fetchAllVideoIds() {
  const ids = [];
  let pageToken;
  do {
    const page = await apiGet("playlistItems", {
      part: "contentDetails",
      playlistId: UPLOADS_PLAYLIST_ID,
      maxResults: "50",
      ...(pageToken ? { pageToken } : {}),
    });
    for (const item of page.items ?? []) {
      const id = item.contentDetails?.videoId;
      if (id) ids.push(id);
    }
    pageToken = page.nextPageToken;
  } while (pageToken);
  return ids;
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// ISO-8601 duration (PT#H#M#S) -> "m:ss" or "h:mm:ss"
function formatDuration(iso) {
  const m = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso || "");
  if (!m) return "0:00";
  const h = parseInt(m[1] || "0", 10);
  const min = parseInt(m[2] || "0", 10);
  const s = parseInt(m[3] || "0", 10);
  const ss = String(s).padStart(2, "0");
  if (h > 0) return `${h}:${String(min).padStart(2, "0")}:${ss}`;
  return `${min}:${ss}`;
}

async function fetchVideoDetails(ids) {
  const videos = [];
  for (const batch of chunk(ids, 50)) {
    const page = await apiGet("videos", {
      part: "snippet,statistics,contentDetails,status",
      id: batch.join(","),
    });
    for (const v of page.items ?? []) {
      const status = v.status || {};
      if (status.privacyStatus !== "public") continue;
      if (status.uploadStatus && status.uploadStatus !== "processed") continue;
      const thumbs = v.snippet?.thumbnails || {};
      videos.push({
        id: v.id,
        title: v.snippet?.title ?? "",
        publishedAt: v.snippet?.publishedAt ?? null,
        duration: formatDuration(v.contentDetails?.duration),
        views: Number(v.statistics?.viewCount ?? 0),
        thumb: {
          medium: thumbs.medium?.url ?? thumbs.default?.url ?? "",
          high: thumbs.high?.url ?? thumbs.medium?.url ?? "",
          ...(thumbs.maxres?.url ? { maxres: thumbs.maxres.url } : {}),
        },
      });
    }
  }
  videos.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  return videos;
}

async function main() {
  const ids = await fetchAllVideoIds();
  const videos = await fetchVideoDetails(ids);

  const output = {
    generatedAt: new Date().toISOString(),
    channel: {
      id: CHANNEL_ID,
      handle: HANDLE,
      url: `https://www.youtube.com/${HANDLE}`,
      musicUrl: `https://music.youtube.com/channel/${CHANNEL_ID}`,
    },
    videos,
  };

  const { writeFile, mkdir } = await import("node:fs/promises");
  await mkdir(new URL("../data/", import.meta.url), { recursive: true });
  await writeFile(OUT_PATH, JSON.stringify(output, null, 2) + "\n", "utf8");
  console.log(`Wrote ${videos.length} videos to data/youtube.json`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
