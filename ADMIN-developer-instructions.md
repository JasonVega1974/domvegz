# Dom Vegz — Admin & Backend: Developer Handoff

The site (`index (9).html`) is currently a **100% static, front-end-only** page. Every piece of
content is hardcoded in the HTML/JS, and the booking form only *simulates* a confirmation. To give
Dom a login + admin where he can update content without touching code, you need to add a **backend**.

This doc tells a developer exactly what to build and where it hooks into the existing page.

---

## 1. What needs to become editable

All dynamic content currently lives in **one JavaScript object** near the bottom of the file:

```js
const DOM = {
  stats:    [ { num, lab, sub } ],          // "By the numbers" cards
  heroMini: [ { b, s } ],                   // small hero stat chips
  releases: [ { t, y, c1, c2, url } ],      // music release tiles
  shows:    [ { when, t, p, tag, up } ],    // live / festival timeline
  videos:   [ { t, s } ],                   // video grid tiles
  social:   [ { n, url, p } ]               // social icons (p = SVG path)
};
```

These render into elements by ID: `#statGrid`, `#heroMini`, `#releaseGrid`, `#timeline`,
`#videoGrid`, `#photoGrid`, `#socials`. **The admin's job is to edit the data behind `DOM`** —
not the markup.

Also editable:
| Item | Where in page | Today |
|---|---|---|
| Hero portrait photo | `.portrait` placeholder in About | placeholder box |
| Media **photos** | `#photoGrid` (9 slots) | colored placeholders |
| Media **videos** | `#videoGrid` tiles | placeholder gradients, no real video |
| Booking requests | `#bookForm` submit | fake confirmation only (nothing saved/emailed) |
| Merch | "Merch" nav link | **external — already done**, points to Streamlabs. No admin needed. |

---

## 2. Recommended architecture

Pick **one** of these. Option A is fastest; Option B gives a true PIN-gated admin like the copy promises.

### Option A — Headless CMS (lowest effort, no server code)
- Use **Sanity**, **Contentful**, or **Storyblok** for content; **Cloudinary** for image/video storage.
- Convert the static page to a tiny build (Astro/Next/Vite) that fetches the CMS at build or runtime
  and renders the same `DOM` shape.
- Dom logs into the CMS dashboard (their hosted login) to edit releases, shows, photos, videos, stats.
- Booking form → a form service (**Formspree**, **Basin**) or a serverless function that emails Dom.

### Option B — Custom app with real login + admin panel (matches "PIN-gated admin")
- **Frontend:** keep this HTML (or port to Next.js). Add `/admin` and `/login` routes.
- **Backend:** Node/Express, Next API routes, or a BaaS (**Supabase** / **Firebase**).
- **Auth:** Supabase Auth / Firebase Auth, or a simple signed-cookie + PIN if it's single-user.
  ⚠️ A client-side-only PIN is **not** security — the check must happen on the server.
- **DB:** Postgres (Supabase) or Firestore. **Storage:** Supabase Storage / Firebase Storage / S3.

For a single artist who just needs to swap content occasionally, **Option A (Sanity + Cloudinary)
is the pragmatic choice.** Use Option B only if Dom wants a branded in-house admin.

---

## 3. Data model (Option B)

```
artist_content (singleton)   -> stats[], heroMini[], portraitUrl
release   (id, title, year, color1, color2, url, sort)
show      (id, date_label, title, blurb, tag, is_upcoming, sort)
video     (id, title, subtitle, video_url|embed_url, thumb_url, sort)
photo     (id, image_url, size: tall|mid|normal, sort)
social    (id, name, url, icon_path, sort)
booking   (id, name, email, event_type, event_date, details, status, created_at)
```

---

## 4. API the front-end should call

Replace the hardcoded `const DOM = {...}` with a fetch:

```js
const DOM = await fetch('/api/content').then(r => r.json());
// then run the existing render code unchanged
```

Endpoints:
- `GET  /api/content` → returns the whole `DOM` object + photos + portraitUrl (public)
- `POST /api/bookings` → save booking, email Dom, return `{ ok: true }` (public)
- `POST /api/auth/login` → PIN/credentials → session cookie (admin)
- `GET/POST/PUT/DELETE /api/admin/{releases|shows|videos|photos|social}` → CRUD (auth required)
- `POST /api/admin/upload` → image/video upload → returns hosted URL (auth required)

---

## 5. Wire up the booking form (the one functional gap)

In the current file, `#bookForm`'s submit handler just shows a message. Replace the simulation with:

```js
await fetch('/api/bookings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name, email, type: f.type.value, date: dateInput.value, details: f.details.value })
});
```

Backend then: (1) stores the row, (2) emails Dom (Resend / SendGrid / Postmark), (3) optionally
sends the booker an auto-reply. Keep the existing success UI.

---

## 6. Admin panel screens to build (Option B)

1. **Login** — PIN or email+password, server-verified, sets an httpOnly session cookie.
2. **Dashboard** — recent bookings, quick links.
3. **Bookings** — list/filter, mark contacted/confirmed.
4. **Content editors** — simple CRUD tables for Releases, Shows, Videos, Photos, Social, Stats,
   each with drag-to-reorder (the `sort` field) and an image/video uploader.
5. **Portrait** — single image upload for the About photo.

---

## 7. Security checklist
- All `/api/admin/*` routes verify the session **server-side** on every request.
- Never ship the PIN/password or any secret to the client.
- Validate + sanitize uploads (type, size); serve media from a CDN/storage bucket, not the repo.
- Rate-limit `/api/bookings` and `/api/auth/login`; add a honeypot/CAPTCHA on the public form.
- Use HTTPS; set `SameSite`/`Secure` on cookies.

---

## 8. Suggested fastest path
1. Spin up **Supabase** (Auth + Postgres + Storage) — covers login, data, and uploads in one.
2. Create the tables in §3; seed them from the current `DOM` values.
3. Add `GET /api/content` + `POST /api/bookings` (Supabase Edge Functions or Next API routes).
4. Swap the hardcoded `DOM` for the fetch in §4 and rewire the booking form in §5.
5. Build the `/admin` CRUD screens (§6) behind Supabase Auth.
6. Leave **Merch** as the external Streamlabs link — no backend needed.
