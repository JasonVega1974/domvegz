# domvegz.com

Official site for Dom Vegz (EDM producer/DJ, Nampa, Idaho). Static site on GitHub Pages, custom domain via `CNAME` (domvegz.com).

## Stack

- **No framework, no bundler, no npm runtime dependencies.** Vanilla HTML/CSS/JS only. Any Node scripts (e.g. CI sync jobs) must run on bare Node 20 with native `fetch` — no `npm install` step.
- `index.html` — the entire public site. Inline `<style>` (design tokens: golden-hour festival-horizon palette — night `#000/#0B0820` → violet `#2E1758` → gold `#FFB13C/#FFD68A`, coral `#FF4D6D`, cyan `#57E7FF`, cream text `#FBF3E4`), inline `<script>`, embedded base64 "Flipside" display font + Montserrat. Canvas sky hero with waveform.
- `admin/index.html` — a separate, already-built PIN-gated admin panel. **This is the real admin, not a spec to implement.** Client-side only:
  - Dom pastes a GitHub fine-grained PAT once; it's encrypted with a PIN and stored only in that browser (never in the repo).
  - On save, it calls the GitHub Contents API directly (`OWNER=JasonVega1974`, `REPO=domvegz`, `BRANCH=main`) to PUT `content.json` and upload images under `assets/img/`.
  - `ADMIN-developer-instructions.md` at repo root is a **stale planning doc** written before this admin panel existed (it proposes a Supabase/Next.js backend that was never built). Don't treat it as current architecture — the lighter client-side PIN+PAT approach in `admin/index.html` is what's live. Safe to ignore/leave as historical context.

## Content model

- `DEFAULT_DOM` (const, inline in `index.html`, ~line 756) is the **fallback** — ships with the page, renders immediately.
- `content.json` (repo root) is the **live override**, fetched at runtime (`fetch('content.json')`) and merged with `Object.assign({}, DEFAULT_DOM, d)`. This is what the admin panel edits/commits. Keep its shape (`stats`, `heroMini`, `releases`, `shows`, `videos`, `social`, `photos`, `portraitUrl`, `settings`) in sync with `DEFAULT_DOM` — the admin panel and `renderAll()` both depend on these exact keys.
- Section anchors (`#media`, `#book`, etc.) and DOM ids (`#statGrid`, `#releaseGrid`, `#timeline`, `#videoGrid`, `#photoGrid`, `#socials`, `#heroMini`, `#marquee`) are load-bearing — nav links and `renderAll()` both target them. Don't rename without updating both.

## Gallery / cover art

- `gallery-manifest.json` (repo root) + `assets/img/gallery/*` (91 slugified cover images) — already merged into the repo. Each entry: `{ original_upload_file, image_file, title, artist_credit }`.
- Match to tracks by normalized title (lowercase, strip punctuation/`feat.`/version suffixes). A few titles have no confirmed track match yet and need Jason's manual review (see `GALLERY-README.md`): "Footage V", "Lasers V", "We Take Over (Allien House)", "Tap Out". "Endless Days" and "Endless Days (Acoustic Version)" are distinct tracks — don't merge.

## YouTube data pipeline

- Channel: `@DomVegz`, ID `UCDDzP8DrQ9JAPmgs1VpF2PQ`, uploads playlist `UUDDzP8DrQ9JAPmgs1VpF2PQ`.
- `.github/workflows/youtube-sync.yml` (nightly + manual `workflow_dispatch`) runs `scripts/fetch-youtube.mjs`, which calls the YouTube Data API v3 (`playlistItems.list` → `videos.list`) and writes `data/youtube.json`. Commits only if the file changed.
- `YOUTUBE_API_KEY` is set as a repo Actions secret (Settings → Secrets and variables → Actions). **Never appears in any tracked file** — workflow references it only as `${{ secrets.YOUTUBE_API_KEY }}`.
- Client-side (`index.html`) fetches `data/youtube.json`; on failure, falls back to the channel RSS feed, then to a "Visit the channel" CTA. Never hard-fails the page.
- `DEFAULT_DOM.videos` is legacy/unused by the Library UI (kept only so the admin panel's shape doesn't break) — marked with a comment in `index.html`.

## Guardrails

- Repo-scoped git identity only: `user.email=info@kingdom-creatives.com`, `user.name=Jason Vega`. Never `git config --global`.
- Never commit secrets. The only place `YOUTUBE_API_KEY` lives is the GitHub Actions secret.
- Preserve `DEFAULT_DOM`/`content.json` shape, section ids, and the admin panel's GitHub-token commit flow — these are load-bearing for a non-technical end user (Dom) editing the live site. If a change risks breaking that flow, stop and ask before proceeding.
- Preserve existing external integrations exactly: Spotify artist embed, SoundCloud embed, Bandsintown URLs/timeline, booking form flow.
- No frameworks, no bundlers, no npm runtime deps. Single-file architecture for `index.html` stays.
