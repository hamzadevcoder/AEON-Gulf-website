# AEON Gulf website (Next.js + PostgreSQL)

Rebuild of aeongulf's site in the design language and motion of the Zeyna "Corporate 2" reference, written from scratch with AEON Gulf's brand, logo and content.

## Run it

`npm run dev` and `npm run build` first run `scripts/fetch-assets.mjs`, which downloads the brand fonts (Avenir LT Std, from the current site), the country flags and all photos into `public/`. Files already downloaded are skipped; without network access the site falls back to Geist and remote images. Confirm the client's Avenir licence covers web use on the new site.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start   # production
```

Requires Node 18.18+ (tested on Node 22).

## Stack

- Next.js 15.5 (App Router) + TypeScript
- GSAP 3.13 with ScrollTrigger and SplitText (all free since 3.13), via `@gsap/react`
- Lenis 1.3 for smooth scrolling, driven by GSAP's ticker
- Geist (via the `geist` package, no Google Fonts request)

## Structure

```
src/
  app/                 layout, home, /about, /contact, 404, globals.css (tokens + all styles)
  content/site.ts      all copy and data (edit here)
  lib/gsap.ts          plugin registration + motion helpers
  components/
    motion/            reusable effects (see below)
    layout/            Header (+ menu panel), Footer, GridLines
    ui/                Button (rolling label), Eyebrow, Placeholder, Icons
    sections/          home, about, contact sections
public/brand/          logos extracted from AEON_GULF_LOGO_CMYK.pdf
```

## Motion components

| Component | Effect |
|---|---|
| `TransitionProvider` / `TransitionLink` | 4-column charcoal preloader and page transitions (cover, change route, reveal) |
| `Stairs` | Staircase section edge, four grid columns, scrubbed to scroll. `direction="rise-right"` or `"rise-left"` |
| `SplitReveal` | Masked line/word/char reveal. `load` plays after the page is revealed instead of on scroll |
| `ScrubText` | Word-by-word fill tied to scroll |
| `Fade` | Fade-up; `childrenStagger` staggers direct children |
| `Odometer` | Rolling digit counters |
| `Marquee` | Drifting strip that speeds up with scroll velocity |
| `Stack` | Sticky stacking cards that shrink and dim |
| Solutions section | Giant sticky index number rolling 01 → 04 |

All effects show their final state under `prefers-reduced-motion`. If the motion code fails to start, a failsafe un-hides content and removes the overlay after 4.5s.

## Design tokens

Defined at the top of `src/app/globals.css`. Two choices still need sign-off:

- `--red: #cb333b` (AEON 1797 C) is used for the square bullets in place of the reference's navy.
- `--charcoal: #34353f` is the reference value; switch to AEON Cool Gray 11 (`#53565a`) or similar if preferred.

## Pages

| Route | What it is |
|---|---|
| `/` | Home |
| `/services` | All services, grouped, with links to each country's version |
| `/kuwait`, `/qatar`, `/saudi-arabia` | Country pages: only that country's services, authorities, contacts and links to the other markets |
| `/[country]/services/[slug]` | 96 service pages generated from `src/content/services.json` (hero, why us, benefits, 4 steps with sticky index, FAQ accordion with FAQPage schema, related services, CTA) |
| `/quote` | Get a quote form (same fields as the current site); `?country=` and `?service=` pre-fill it. Linked from the header button, menu and footer, and country-aware on country and service pages |
| `/about`, `/contact` | Company and contact pages |
| `/privacy-policy`, `/terms-and-conditions`, `/cookies-policy` | Policy text from the current site, with a contents list |

Old WordPress URLs (`/ksa`, `/kuwait/service/…`, `/about-us`, `/…/contact-us`) redirect permanently to the new ones (see `next.config.mjs`).

## Service content

`src/content/services.json` is generated from the client spreadsheet:

```bash
npm run content:import   # reads content-source/website-text.csv
```

The import fixes typos, cut-off meta descriptions, missing step headings, copied SEO keywords and Kuwait-specific details that had been reused on Qatar and Saudi pages (Kuwaiti banks, "Emirates ID", Kuwaiti authorities and visa articles). Every change is listed in `content-source/import-log.md` for the client to approve. Numeric figures on the Qatar and Saudi pages (minimum capital, fees, balances) were adapted from the Kuwait copy and still need checking by the client.

## Images

All photography is registered in `src/content/images.ts`: photos from the client's current site plus three free-licence Unsplash images (Riyadh skyline, document signing, accounting desk). Old-site photos showing Hong Kong, Shanghai and Suzhou were left out.

Images load from their original URLs until `scripts/fetch-assets.mjs` has downloaded them all; after that the site serves its own copies automatically.

## Placeholders to replace before launch

- Hero background video (currently a cross-fading slideshow starting with the current site's main banner) and client logos
- Testimonials (`content/site.ts`, flagged `placeholder: true` and noted on the page)
- The four figures in the numbers section (confirm with AEON Gulf)
- Qatar and Saudi Arabia office details
- Contact, quote and newsletter forms: no backend yet. The quote form opens the visitor's email app with the request filled in, addressed to info@aeongulf.com
- Insights cards ("Coming soon")
- Footer legal links (`#`)

## Not built yet

- Arabic / RTL version (Geist has no Arabic; pair with an Arabic face)
- Side-by-side timing calibration against the reference

## SEO

- Every page has its own title (60 characters or fewer), meta description, canonical URL, Open Graph and Twitter tags (`src/lib/seo.ts`). Service page titles and descriptions come from the client spreadsheet; titles over 60 characters were shortened on import and logged.
- Structured data (JSON-LD): Organization and WebSite on every page; Service, FAQPage and BreadcrumbList on service pages; ProfessionalService with an offer catalogue on country pages; ItemList on /services; Article, FAQPage and BreadcrumbList on guides; AboutPage on /about.
- `/sitemap.xml` and `/robots.txt` are generated (`src/app/sitemap.ts`, `robots.ts`). One `<h1>` per page, ordered headings, alt text on images, old WordPress URLs 301 to the new ones.
- **Before launch set `NEXT_PUBLIC_SITE_URL`** (for example `https://www.aeongulf.com`) in the hosting environment, then submit the sitemap in Google Search Console.

## Backend and admin dashboard

Architecture and database design: [`docs/BACKEND.md`](docs/BACKEND.md).

### First-time setup

```bash
cp .env.example .env.local        # fill in DATABASE_URL, AUTH_SECRET, NEXT_PUBLIC_SITE_URL, SMTP_*
npm install
npm run db:migrate                # create the tables (run again after updating the project: it only applies what is new)
npm run db:seed                   # import today's website content (services, countries, guides, legal pages)
npm run admin:create -- --email you@aeongulf.com --name "Your Name"   # asks for a password (12+ characters)
npm run build && npm start
```

Then sign in at `/admin`. Under **Settings & emails**, set who receives inquiry notifications and send a test email.

### What the dashboard manages

| Area | What you can do |
|---|---|
| Inquiries | Every contact, quote and newsletter submission: search, filter, change status, assign, add internal notes, bulk-update, export CSV, see which notification emails were sent |
| Services | All 96 service pages: every field (SEO, hero, overview, benefits, steps, FAQs, call to action), publish/hide, create, delete |
| Pages | Click any page (Home, About, Services, Contact, Get a quote, country pages, footer) to see its sections as cards; open a card to edit it. **+ New page** creates a new page from a starting layout, then **+ Add a section** picks from 10 templates (banner, statement with photo, text article, cards, numbered list, FAQ, photo banner, numbers, enquiry form, call to action). Sections can be reordered, hidden, copied and deleted; pages stay as drafts until published, and can be added to the main menu |
| Countries | Introductions, quick facts, authorities, office details |
| Guides | Create and edit Insights guides |
| Legal pages | Privacy policy, terms, cookies policy |
| Images | Replace any photo on the site, upload a library of images |
| Settings & emails | Notification recipients per form, sender details, test email, website contact details, email log |
| Users & roles | Create users, set roles, deactivate, reset passwords |
| Audit log | Every sign-in and change |

Roles: **Administrator** (everything), **Content editor** (content and images), **Inquiries agent** (inquiries), **Viewer** (read-only inquiries). Permissions are enforced on the server for every action.

Saving in the dashboard updates the public website immediately (cached pages are refreshed on save). Without `DATABASE_URL` the website still runs on its built-in content, but forms and the dashboard are unavailable.

### Production checklist

- PostgreSQL 14+ with automated backups (`DATABASE_SSL=true` for most managed databases).
- `AUTH_SECRET`: a long random value (`openssl rand -base64 32`).
- `NEXT_PUBLIC_SITE_URL`: the real `https://` domain (used in canonical URLs, sitemap and email links).
- SMTP credentials from your email provider; the sender address must be allowed by that provider (SPF/DKIM).
- Image uploads: keep `UPLOAD_DIR` on a persistent, backed-up volume, or use an S3-compatible bucket (required for multiple servers or serverless hosting).
- Run `npm run db:migrate` on every deploy before starting the new version.
- Health check for load balancers / uptime monitoring: `GET /api/health`.
- Serve over HTTPS only (the session cookie is `Secure` in production).

### Scripts

| Command | Purpose |
|---|---|
| `npm run db:migrate` | Apply database migrations |
| `npm run db:generate` | Create a migration after changing `src/server/db/schema.ts` |
| `npm run db:seed` | Import built-in content (`-- --force` overwrites services, countries, guides and legal pages) |
| `npm run admin:create` | Create or reset an administrator |
| `npm run typecheck` | TypeScript check |

### Tested

Against PostgreSQL 16 with a local SMTP server: form validation, storage and notification emails (with reply-to set to the visitor); honeypot and per-IP rate limits; login lockout after 5 failures; inquiry status, assignment, notes, bulk update and CSV export; content edits appearing on the live site (page text, services, new and hidden services, image replacement); rejection of non-image uploads; role restrictions for each role, including direct server-action calls; deactivated users signed out; last-administrator protection; every dashboard page at phone width; and the public site's SEO and layout checks.

## Languages (English and Arabic)

- English lives at the normal addresses (`/about`); Arabic under `/ar` (`/ar/about`), fully right to left, with the IBM Plex Sans Arabic font. A language switch is in the header (and in the menu on phones).
- `src/middleware.ts` serves both languages from one set of pages in `src/app/[lang]`. Interface text (buttons, labels, form messages, page titles) is in `src/i18n/dict.ts`; built-in Arabic page content is in `src/content/ar.ts`.
- **Dashboard:** every editor (pages, services, countries, guides, legal pages) has **English | العربية** tabs. Arabic text is stored separately and never changes the English site. **Website > Interface text** edits every button and label in both languages.
- **Services:** the Services list shows which services have a full Arabic page. Until one does, its Arabic address shows a short Arabic summary with a quote form, and is kept out of Google (noindex, not in the sitemap, no hreflang). Guides appear in Arabic once their related service is translated.
- **SEO:** each page declares its English and Arabic versions to Google (hreflang), and the sitemap lists both.
- Inquiries record which language the visitor used.
- Have the Arabic reviewed by a native speaker, and the Arabic legal pages by the client's legal adviser, before launch.

After updating, run `npm run db:migrate` (adds the Arabic columns) before deploying.

## Header, menu, footer and language dropdown

- **Dashboard > Site > Header & Footer** edits, in English and Arabic: the header button (text, link, show/hide), the country and language dropdowns (show/hide), the main menu links and "Popular services" list (add, rename, reorder, remove), the footer description, tagline, newsletter text, links, legal links, social links, copyright line, and the public email and phone. Defaults are the original site; "Restore original" returns a section to them. Use `{country}` in a link to open the page for the country the visitor is on.
- The language switch is a dropdown in the header (on phones and tablets it is in the open menu).
- Navigation is stored in the `navigation` setting; footer text in the `footer` and `ar:footer` page blocks.

## Forms and spam

- Every form shows which fields need attention, moves the cursor to the first one, and accepts phone numbers typed with Arabic digits.
- The hidden anti-spam field is named `hp_ref`. If it is ever filled (for example by browser autofill) the inquiry is **kept** but marked as spam and no email is sent, so a real inquiry is never lost. The Inquiries page tells you how many were caught, with a link to review them.

## Arabic Insights

- The three guides and the services they are built from (Kuwait branch formation, Qatar annual compliance, Saudi bank account opening) have built-in Arabic (`src/content/ar-services.ts`, `ar.ts`), so the Insights section, listing and guide pages appear on the Arabic site. Further services and guides are translated from the dashboard (Arabic tab).
