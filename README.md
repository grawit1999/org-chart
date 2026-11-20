# Organization Chart Mini App

Next.js 14 (App Router) + TypeScript, NextAuth v4 (Google OAuth, JWT session, no database), 1,000 mock employees from `data/employees.json`.

## Run locally
```bash
npm install
cp .env.example .env.local   # fill in values
npm run dev                  # http://localhost:3000
```
## Google Login setup
1. Google Cloud Console → APIs & Services → OAuth consent screen. While in *Testing* mode, add the reviewer's Google account under **Test users** (or publish the app).
2. Credentials → Create OAuth client ID → *Web application*. Authorized redirect URIs:
   `http://localhost:3000/api/auth/callback/google` and `https://<your-domain>/api/auth/callback/google`.
3. Put Client ID/Secret in env vars (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`), plus `NEXTAUTH_SECRET` and `NEXTAUTH_URL` (the deployed https URL).
4. Deploy (e.g. Vercel: import the repo, add the 4 env vars, redeploy). Never commit `.env*`.

## Structure
- `scripts/generate-employees.mjs` – seeded generator + validator → `data/employees.json`
- `lib/auth.ts`, `lib/data.ts` – auth options; in-memory data and report counts
- `app/api/employees` (list), `/search?q=`, `/[id]` (404 if unknown) – all return 401 without a session
- `app/page.tsx` (server-side auth redirect), `app/login`, `components/OrgChart.tsx` (chart, filters, search, details, pan/zoom)

## API behavior
`GET /api/employees` all records · `GET /api/employees/search?q=` case-insensitive match on name/job title, `[]` when none · `GET /api/employees/:id` details + `manager_name` + `direct_report_count`, 404 when missing. Pages and APIs require login; after Logout the JWT cookie is cleared.

## Dataset generation and validation
Seeded script builds the hierarchy: CEO → C-level (L2) → directors/managers → team leads → individual contributors (6 levels). Headcount per Division: 5/190/80/130/70/150/70/60/45/140/60 = 1,000. Two managers have 30+ direct reports (max 43). Cross-department reporting exists (Director of Product reports to the CTO). Duplicate names are produced by random reuse. The same script validates: exact count, unique IDs/emails (example.com), single null manager, all managers exist, no self-reports, every employee reachable from the CEO (so no cycles), 5–7 levels, exact Department→Division mapping, all 11 Divisions populated, 30+ direct reports, duplicate names, multiple countries. Deepest example: EMP0210 (level 6), hidden until its team is expanded but findable by search.

## Handling 1,000 employees
Only expanded teams are rendered (initially CEO + direct reports). Filters render matches plus their manager chain (context-only cards are dashed/dimmed). Search runs on the server over all records, debounced.

## Department / Division
Used on cards, search results, details, and dependent filters (choosing a Department limits Divisions and clears an incompatible Division). Grouping never alters `manager_id` relationships.

## Known limitations
- Developed without running `npm install`/build in the authoring environment: run it once and fix any type errors before submitting.
- No pinch-zoom on touch; no mini-map or group containers. Choosing a search result expands the path, centers, and highlights it.

## Time spent / AI assistance
_Fill in: actual hours spent._ _Fill in honestly: AI assistance used (e.g. Claude generated the first draft of the generator and app; I reviewed, tested, and modified it)._
