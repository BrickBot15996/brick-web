# Setup

Accounts and infrastructure that must exist before (or while) the apps are built. Check items off as you go.

**Where to keep secrets.** Keep every key, token and password in the team's password manager. **Never commit them.**

**Where to paste them.** Copy `.env.example` to `.env` in the repo root (`cp .env.example .env`) and paste each value next to its name. `.env` is git-ignored. Each variable is labelled with the SETUP step that produces it, and with `[public]` or `[SECRET]`.

---

## Already done
- [x] DNS for brickbot.ro is managed by Cloudflare.
- [x] R2 bucket exists. Until launch it is served at `cdn-next.brickbot.ro` (`cdn.brickbot.ro` still serves the old site; see §3).
- [x] This repo belongs to the BrickBot GitHub org.

---

## 1. Do now

### Local machine
- [ ] **Node 22+:** `brew install node@22`, or use nvm/fnm.
- [ ] **pnpm:** `corepack enable`. Corepack ships with Node and provides pnpm.
- [ ] **Docker Desktop:** needed to run Supabase locally.
- [ ] **Supabase CLI:** `brew install supabase/tap/supabase`.

Wrangler (the Cloudflare CLI) is installed per project as a dev dependency, so there's nothing to install globally.

### Supabase
- [ ] **Create the project.** Region **EU Central (Frankfurt)**; use a strong database password and store it.
  - Save these: **project ref** (the id in the URL), **Project URL**, **anon/publishable key** and **service_role/secret key** (Project Settings → API).
  - The service role key bypasses all security. It must only ever live in Edge Function secrets, never in a frontend.
- [ ] **Disable public signups.** Go to Authentication → Sign In / Providers and turn off *Allow new users to sign up*. Admins can still invite users, because invites use the admin API.
- [ ] **URL configuration.** Go to Authentication → URL Configuration.
  - **Site URL:** `https://auth.brickbot.ro`
  - **Redirect URLs:** add `https://*.brickbot.ro/**`
  - Localhost URLs are added later, once the apps' dev ports are fixed.

### Cloudflare
- [ ] **R2 API token.** Go to R2 → *Manage R2 API Tokens* → *Create API token*.
  - Permission: **Object Read & Write**.
  - Scope: **only the CDN bucket**.
  - Save the **Access Key ID**, the **Secret Access Key**, the **S3 endpoint** (`https://<account-id>.r2.cloudflarestorage.com`) and the **bucket name**.
  - The CMS's upload Edge Function uses these to sign uploads.
- [ ] **R2 CORS policy.** Go to the bucket → Settings → CORS Policy and paste the policy below. It allows the CMS (and local development) to upload straight from the browser.
  ```json
  [
    {
      "AllowedOrigins": ["https://cms.brickbot.ro", "http://localhost:5173"],
      "AllowedMethods": ["GET", "HEAD", "PUT"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3600
    }
  ]
  ```
  The localhost port may change once the CMS exists; update this then.
- [ ] **Turnstile** (the contact form's bot check). Go to Turnstile → *Add widget*.
  - Hostnames: `brickbot.ro` only. Turnstile won't accept `localhost`, and you don't need it: local development uses Cloudflare's dummy test keys (see `.env.example`), which work on any hostname.
  - Mode: *Managed*.
  - Save the **site key** (public, goes in the website) and the **secret key** (private, goes in Supabase Edge Function secrets).
- [ ] **Web Analytics.** Go to Analytics & Logs → Web Analytics → *Add a site*: `brickbot.ro`, then `links.brickbot.ro`. Save the snippet token if it shows one.
- [ ] **Account ID.** Copy it from the right sidebar of any zone overview page. Wrangler and the build setup need it.

### Email (Resend)
- [ ] **Create a Resend account** and add the domain `brickbot.ro`.
  - Resend shows DNS records: DKIM, SPF (on a `send` subdomain) and optionally DMARC.
  - Add them in Cloudflare DNS with **proxy off (grey cloud)**, then click *Verify*.
  - These records don't affect your existing inboxes, because they live on separate subdomains.
- [ ] **Create an API key** (sending access) and save it.
- [ ] **Connect Resend to Supabase Auth.** Go to Supabase → Authentication → Emails → SMTP Settings and enable custom SMTP:
  - Host `smtp.resend.com`, port `465`, username `resend`, password = the Resend API key.
  - Sender: `noreply@brickbot.ro`, name `BrickBot`.
  - Then go to Authentication → Rate Limits and raise the email limit. The built-in limit is only a few per hour.
- [ ] **Check the department inboxes.** Confirm these receive mail, since the contact form CCs them: `pr@`, `design@`, `engineering@`, `programming@`, `sponsorships@brickbot.ro`.

### FTC Events
- [ ] **API access.** Register at https://ftc-events.firstinspires.org/services/API/register (use a real email: it must be confirmed; answer "Yes" to the FTC team question and enter 15996).
  - FIRST emails an authorization key. Put the username in `FTC_EVENTS_USERNAME` and the key in `FTC_EVENTS_TOKEN` in the root `.env`.
  - Also add both as build environment variables (secrets) to the `website` Workers Build, so production builds get the results.

### Google
- [ ] **Google Maps embed link.** Open the BrickBot Business Profile in Google Maps → *Share* → *Embed a map* and copy the `src` URL from the iframe code. Also copy the normal *Send a link* URL, used for the "Open in Google Maps" button. Both get stored in the CMS site settings.

---

## 2. Later (when the code exists; an agent will tell you)
- [ ] **Custom access token hook.** Go to Supabase → Authentication → Hooks and enable *Customize Access Token (JWT) Claims*, pointing at the function created by the migration. It adds each user's permissions to their login token.
- [ ] **Edge Function secrets.** Use Supabase → Edge Functions → Secrets. Expected secrets:
  - R2 keys and endpoint
  - Resend API key
  - Turnstile secret
  - Cloudflare deploy hook URLs
- [ ] **Workers Builds.** For each app (`website`, `links`, `cms`, `auth`, `scheduler`), go to Workers & Pages → *Create* → *Import a repository*. Pick this repo, then set the app's root directory and build command (agents will give the exact values). Then attach the custom domain (`brickbot.ro`, `links.`, `cms.`, `auth.`).
- [ ] **Deploy hooks.** Create a deploy hook for `website` and for `links` in each project's build settings. The CMS "Publish" button and the scheduler call these URLs.
- [ ] **Localhost redirect URLs** in Supabase, and the final dev ports in the R2 CORS policy.
- [ ] **Response header rule for SVGs on the CDN** (security). Go to Rules → Transform Rules → *Modify Response Header* → *Create rule*.
  - Match: hostname equals `cdn-next.brickbot.ro` (later also `cdn.brickbot.ro`) **and** URI Path ends with `.svg`.
  - Set static headers: `Content-Security-Policy` = `default-src 'none'; style-src 'unsafe-inline'; img-src data:; sandbox` and `X-Content-Type-Options` = `nosniff`.
  - Why: the login cookie is shared with every `brickbot.ro` subdomain, so a scripted SVG opened as a page on the CDN could read it. SVGs still show up inside `<img>` tags.
- [ ] **Secure email change.** Supabase → Authentication → Sign In / Providers → Email: turn **Secure email change** ON and **Confirm email** ON.
- [ ] **R2 CORS allowed headers** must stay `*` (or include `content-type` and `content-disposition`), since SVG uploads now send `Content-Disposition`.

---

## 3. At launch
- [ ] **Cache Rule for the CDN.** Go to Rules → Cache Rules → *Create rule*.
  - Match: hostname equals `cdn.brickbot.ro`.
  - Set it eligible for cache, with **Edge TTL = 1 year** (ignore origin) and **Browser TTL = 1 year**.
  - Do this only after the placeholder images are replaced through the CMS. Otherwise re-uploading a placeholder at the same path would keep serving the old file.
- [ ] **Cutover.** Point `brickbot.ro` and `links.brickbot.ro` to the Cloudflare Workers (attaching the custom domain replaces the old Vercel DNS records). Test the legacy redirects (see CLAUDE.md §3.12), then delete the Vercel projects.
- [ ] **Move `cdn.brickbot.ro` to the new bucket** (same session as the cutover: the old site loses its images at this moment). Until launch the new bucket is served at `cdn-next.brickbot.ro`, because `cdn.brickbot.ro` still serves the old site's bucket.
  1. R2 → old bucket → Settings → Custom Domains: disconnect `cdn.brickbot.ro`.
  2. R2 → new bucket → Settings → Custom Domains: connect `cdn.brickbot.ro`.
  3. Set `CDN_URL=https://cdn.brickbot.ro` in the root `.env` and in every Workers Build's variables, then rebuild all apps. The database stores keys, not URLs, so nothing else changes.
  4. Disconnect `cdn-next.brickbot.ro`. Do the Cache Rule above for `cdn.brickbot.ro` only after this.

---

## Content the team needs to gather
- [ ] Gallery photos and videos
- [ ] Join page: department texts and photos
- [ ] Timeline milestones
- [ ] Mission / "what drives us" text
- [ ] Impact numbers: years active, total awards, people reached, outreach events
- [ ] Onshape links for each robot
- [ ] Last season's budget (categories + amounts in EUR + remaining)
- [ ] Sponsor deck PDF
- [ ] Press kit assets and descriptions (EN + RO)
- [ ] Event results from before 2019
