# domvegz.com — Gallery Handoff

This folder contains 91 cover-art images for domvegz.com, pulled from Jason's
upload batch and renamed/slugified for clean use in code.

## Structure

```
domvegz/
├── assets/img/gallery/       <- all 91 cover images, slugified filenames
└── gallery-manifest.json     <- title/artist/filename mapping for every image
```

## What to do with this

1. Copy `assets/img/gallery/*` into the actual `assets/img/` (or wherever the
   site's image assets live) in the domvegz repo — merge, don't overwrite,
   in case other assets already exist at that path.
2. Use `gallery-manifest.json` as the source of truth to match each cover to
   its corresponding song entry (by title). Each entry looks like:

```json
{
  "original_upload_file": "25571.jpeg",
  "image_file": "assets/img/gallery/adventure.jpeg",
  "title": "Adventure",
  "artist_credit": "Dominic Vega & Max Woodz"
}
```

3. Match `title` (case-insensitive, ignoring punctuation) against the site's
   existing song/track data (JSON, admin panel entries, etc.) to attach the
   right `image_file` path to each track.
4. A few titles have no confirmed matching track yet and may need manual
   review from Jason:
   - "Footage V" (visual/footage asset, may not be a song)
   - "Lasers V", "We Take Over (Allien House)", "Tap Out" — older/early tracks,
     verify against current catalog before wiring into the live gallery
5. Note: two tracks share the title "Endless Days" — one standard version and
   one "Endless Days (Acoustic Version)" — these map to distinct image files
   (`endless-days.jpeg` and `endless-days-acoustic-version.jpeg`), don't merge them.
6. Artist credits across the catalog vary between "Dominic Vega" (earlier era)
   and "Dom Vegz" (current branding) — this is expected and reflects the
   artist's actual naming evolution over time, not a data error.

## Verification

Titles/artist credits were transcribed by reading the cover art images
directly — spot-check a handful against the actual site data before treating
this manifest as fully authoritative, especially for tracks with stylized or
hard-to-read typography (e.g. "Sunrise", "This Is Where I'm Meant To Be").
