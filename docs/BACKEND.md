# AEON Gulf: backend and database architecture

## Goals

- Every piece of website content (text, images, services, FAQs, countries, guides, legal pages) editable from an admin dashboard, without code changes.
- All public forms (contact, quote, newsletter) validated, stored in PostgreSQL, visible and manageable in the dashboard, with email notifications to recipients the admin configures.
- Secure authentication with role-based access, audit trail, and production-ready deployment.
- The public website's design and frontend stay exactly as they are.

## Stack

| Concern | Choice | Why |
|---|---|---|
| Framework | Next.js App Router (existing app) | One codebase; server components read the database directly; server actions for mutations |
| Database | PostgreSQL 14+ | Relational integrity, JSONB for structured content, full-text friendly |
| ORM / migrations | Drizzle ORM + drizzle-kit SQL migrations | Typed queries, no binary engine, plain SQL migrations to review and commit |
| Validation | Zod | One schema per input, shared between client and server |
| Passwords | bcrypt (cost 12) | Industry standard, slow by design |
| Email | Nodemailer over SMTP | Works with any provider (Microsoft 365, Google Workspace, SES, Mailgun, Postmark) |
| Image storage | Local disk (`public/uploads`) or any S3-compatible bucket | Local for a single server; S3/R2 for multi-instance or serverless hosting |

## Request flow

```
Visitor ─▶ Next.js page (server component)
              └─▶ content layer (src/server/content.ts) ─▶ cache (tag: content) ─▶ PostgreSQL
                                                         └─▶ fallback: built-in content files if no DATABASE_URL

Visitor form ─▶ server action ─▶ Zod validation ─▶ honeypot + rate limit ─▶ INSERT submissions
                                                                         └─▶ email to configured recipients (logged)

Admin ─▶ /admin (middleware: session cookie required)
       └─▶ layout verifies session in DB ─▶ page checks role permission
       └─▶ server action ─▶ requirePermission() ─▶ Zod ─▶ UPDATE ─▶ audit_log ─▶ revalidateTag('content')
```

Content is cached and only re-read after an admin saves, so the public site stays fast and the database sees very little traffic.

## Database schema

| Table | Purpose | Key columns |
|---|---|---|
| `users` | Admin accounts | `email` (unique, lowercase), `password_hash`, `role` (admin, editor, agent, viewer), `active`, `last_login_at` |
| `sessions` | Signed-in sessions | `id` = SHA-256 of the cookie token (the raw token is never stored), `user_id`, `expires_at`, `ip`, `user_agent` |
| `login_attempts` | Brute-force protection | `email`, `ip`, `success`, `created_at` (5 failures in 15 minutes locks that email + IP) |
| `submissions` | Every form entry | `type` (contact, quote, newsletter), `status` (new, in_progress, responded, closed, spam), contact fields, `data` JSONB (all fields), `assigned_to`, `source_page` |
| `submission_notes` | Activity on an inquiry | `submission_id`, `author_id`, `kind` (note, status, assignment), `body` |
| `notification_recipients` | Who is emailed | `email`, `name`, `form_types` (array), `active` |
| `email_log` | Every notification attempt | `submission_id`, `to`, `subject`, `status` (sent, failed, skipped), `error` |
| `settings` | Site-wide settings | key/value JSONB: `contact`, `email` (from name/address), `image_slots` |
| `content_blocks` | Page text sections | key/value JSONB, one row per block (`home.hero`, `about.mission`, …); fields defined in `src/server/blocks.ts` |
| `countries` | Kuwait, Qatar, Saudi Arabia | `name`, `code`, `intro`, `quick_facts`, `authorities`, `office`, `sort` |
| `services` | The 96 service pages | `country`, `slug` (unique together), `group`, all spreadsheet fields as columns/JSONB, `published`, `sort` |
| `guides` | Insight articles | `slug`, titles, meta, `intro`, related `service`, `image`, `published` |
| `legal_pages` | Privacy, terms, cookies | `slug`, `title`, `effective`, `intro`, `sections` JSONB |
| `media` | Uploaded images | `url`, `storage_key`, `filename`, `mime`, `size`, `alt`, `uploaded_by` |
| `audit_log` | Who changed what | `user_id`, `action`, `entity`, `entity_id`, `details` JSONB |

Indexes: submissions (`status`, `type`, `created_at`), sessions (`user_id`, `expires_at`), login attempts (`email`, `created_at`), services (`country`, `group`, `sort`), audit log (`created_at`).

Structured content (FAQs, steps, benefits) is stored as JSONB on the service row: it is always read and edited together with its service, so this avoids joins without losing anything. Each JSONB shape is validated by Zod on every write.

## Roles and permissions

| Permission | Admin | Editor | Agent | Viewer |
|---|:-:|:-:|:-:|:-:|
| View dashboard | ✓ | ✓ | ✓ | ✓ |
| View inquiries | ✓ |  | ✓ | ✓ |
| Update / assign / note inquiries | ✓ |  | ✓ |  |
| Delete inquiries, export CSV | ✓ |  |  |  |
| Edit content, services, guides, legal | ✓ | ✓ |  |  |
| Upload / replace images | ✓ | ✓ |  |  |
| Notification emails, site settings | ✓ |  |  |  |
| Manage users | ✓ |  |  |  |
| Audit log | ✓ |  |  |  |

Every server action calls `requirePermission()` itself; hiding a button is never the only protection.

## Security

- **Passwords:** bcrypt cost 12, minimum 12 characters; changing a password ends that user's other sessions.
- **Sessions:** 32 random bytes in an httpOnly, Secure, SameSite=Lax cookie; the database stores only its SHA-256 hash; 7-day sliding expiry; deactivating a user deletes their sessions.
- **Login:** generic error messages; 5 failed attempts per email and IP in 15 minutes triggers a lockout; every login recorded.
- **Forms:** Zod validation server-side, length limits on every field, honeypot field, rate limit per IP (5 per 10 minutes per form), no HTML rendered from submissions.
- **Requests:** Next.js server actions reject cross-origin calls; `/admin` is `noindex` and blocked in robots.txt.
- **Headers:** HSTS, X-Frame-Options DENY, X-Content-Type-Options, Referrer-Policy, Permissions-Policy.
- **Secrets** stay in environment variables (database URL, SMTP password, S3 keys); recipients and sender details are managed in the dashboard.

## Email notifications

On a new submission the server sends one email to each active recipient configured for that form type, with all fields and a link to the inquiry in the dashboard. Each attempt is written to `email_log`. A delivery failure never loses the submission. With no SMTP configured, attempts are logged as `skipped` and submissions still appear in the dashboard. Settings has a "Send test email" button.

## Scalability and production

- Stateless app servers: sessions, rate limits and content live in PostgreSQL, so any number of instances can run behind a load balancer.
- Pooled database connections (`pg` Pool, size set by `DATABASE_POOL_SIZE`).
- Public pages are statically generated and cached; edits refresh them through cache tags (no full rebuild).
- Images on S3-compatible storage for multi-instance or serverless hosting.
- Migrations: `npm run db:migrate`; content seeding: `npm run db:seed` (idempotent, imports today's content); first admin: `npm run admin:create`.
- Health check at `/api/health` (checks the database connection).
