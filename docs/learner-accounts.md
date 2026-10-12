# Optional learner accounts

This small first version reuses the Node server, SQLite database and existing transactional email provider. It adds no runtime dependency, file service, password database or paid authentication platform. It does not by itself require a larger VM. Monitor memory, disk, database latency, email quotas and errors before deciding to scale. Run one web process against the database as in the existing deployment.

## What a learner gets

- Use the site without registering. Guest work stays in the existing browser storage.
- Sign in with a verified one-time email link. First name is optional. Email and first name are personal information.
- Signed-in work opens in an isolated in-memory workspace. Guest data is not automatically copied or overwritten. No learner tokens or account work are kept in localStorage.
- **Save my work** stores supported data. It is a manual save, not automatic cross-device syncing. A stale revision or changed account is refused instead of overwriting another save.
- Downloads remain available; there is no learner upload or import interface/API.
- The cloud allowlist covers property labels/location, sale type/plan/stage, deal checklists, recognized numerical calculator inputs (including the amount budgeted for a deal, not bank balances or account identifiers) and confirmation flags, saved listing references, lessons read, roadmap progress, practice choices/numbers and self-review completion.
- No contacts, notes, evidence text, packet text, written practice answers, personal cash worksheets, credit information, banking details or files in cloud saves. Written reflection completion is a self-review marker, not a grade or purchase approval. Downloads can contain local-only writing: keep them private.
- Deleting an account needs a fresh email sign-in in the preceding 15 minutes and revokes its sessions. Backup copies expire under the operator's configured backup retention.

The supported calculator inputs do not establish a loan offer, a guaranteed return or legal approval. All existing state/local guidance and formulas remain in the teaching tools. Location preferences remain per device, so each device still chooses its investing location.

## Activation on the existing server

Off by default; missing or invalid optional settings disable accounts without stopping the guest site. Unconfigured deployments show account saving as coming soon, without a nonworking signup form.

1. Confirm the real transactional mailer is configured (`RESEND_API_KEY` or `POSTMARK_SERVER_TOKEN`, plus verified `MAIL_FROM`). Console delivery and `POSTMARK_API_TEST` are unsuitable. Verify provider capacity and monitoring; accounts share the existing sign-in mail budget.
2. Generate **a new, dedicated** 32-byte key in the secure server administration session, for example `openssl rand -hex 32`. Do not paste the key into a PR, chat, build argument or `VITE_*` variable. Store it as a server secret named `ACCOUNT_ENCRYPTION_KEY`. Never reuse admin credentials or signing keys.
3. Preserve the encryption key separately in protected secret backup. Losing it makes saved profiles/work unreadable. Replacing it is not key rotation: a migration would be required. Protect database backups and configure/verify off-site retention. Test restoring database plus key on an isolated instance.
4. Podman: create the `fsf-account-encryption-key` secret; uncomment its `Secret=` line in `deploy/podman/quadlet/forced-sale-finder-web.container` in the installed Quadlet; set `LEARNER_ACCOUNTS=1` in the existing `forced-sale-finder.env`; reload systemd and restart the web service. Keep environment/secret files readable only by their owner. For Kubernetes/OpenShift, put the key in the web server Secret and set the feature flag in its ConfigMap; do not provide the secret to the ingest process.
5. Ensure `BASE_URL` is the exact public HTTPS origin (including any nondefault port), the proxy is trusted correctly, and Cloudflare passes learner API writes/cookies through without caching responses or challenges that consume links. Account API responses are `no-store`; never override that at the edge.
6. Check `/api/features` reports `accounts:true`. Send a real sign-in email to an address you control; open its link in the requesting browser. Confirm single use, save/reopen on a second device, logout, expiry, account deletion and preservation of guest work. This real-mail/browser test has not been substituted by the automated tests.
7. Monitor sign-in delivery failures, provider limits and generic API error counts without logging tokens, profiles, saved work or complete email addresses. Treat email inbox access as account access; encourage inbox MFA. Have an incident/restore procedure.

Rollback: set `LEARNER_ACCOUNTS=0` and restart the web server; guest functionality continues. Retain the database/key securely if accounts may be re-enabled. Do not delete them as a rollback shortcut.

## Security boundaries and evidence

- 256-bit random, hashed, single-use 15-minute verification links; atomic consume; request-browser binding via HttpOnly cookie. GET does not activate an account. Tokens are in a URL fragment, removed from the address bar on the account page; they are not placed in HTTP query strings or route logs.
- Separate learner session cookies, Secure/HttpOnly/SameSite=Strict with `__Host-` scope in production; eight-hour absolute and one-hour idle limits, rotation and server-side revocation. No admin/advertiser privilege crossover.
- Server derives ownership from the authenticated session on every read/write. A body owner is only an additional switch-account guard, never a lookup selector.
- Account POSTs require the application header and the configured public Origin. No account CORS allowance, arbitrary redirect, upload route or HTML rendering.
- Strict shared schema/projection, bounded JSON, typed finite numbers, constant choice/task IDs, plain bounded property labels, parameterized SQL, rate limits and bounded pending sign-in records. Unknown submitted keys are rejected. Validation cannot identify every kind of private information a person could type into a property label; the UI explicitly asks for property labels without personal information.
- Profile/work encryption uses AES-256-GCM with random nonces and owner-bound associated data; separate derived encryption/lookup keys. Email lookup uses keyed HMAC, not a reversible public email index. Only hashes of active link/session secrets are stored.
- Conflict/network failures retain in-memory work and offer download/recovery. Data never silently falls back to guest keys during account access.

Official implementation guidance reviewed October 12, 2026:

- [OWASP Email Validation and Verification](https://cheatsheetseries.owasp.org/cheatsheets/Email_Validation_and_Verification_Cheat_Sheet.html): ownership verification, explicit canonicalization, expiring single-use tokens. The supported mailbox policy is unquoted ASCII local parts plus an IDNA domain, preserving local-part case and plus tags; addresses outside it receive a clear validation error.
- [OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html): server sessions, cookie scope, idle/absolute expiry, no tokens in localStorage.
- [OWASP IDOR Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Insecure_Direct_Object_Reference_Prevention_Cheat_Sheet.html): object ownership on every operation.
- [OWASP CSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html), [XSS Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html), and [Cryptographic Storage](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html).

Automated HTTP tests cover email binding/replay/expiry, cookie flags, two-owner reads/writes, tampered owner and extra fields, stale revisions, multipart/size rejection, origin/header enforcement, advertiser/admin isolation, encrypted database content, deletion and disabled guest service. Storage tests cover account/guest separation, calculator round trips, safe reflection metadata, sensitive-field exclusion and invalid labels. These checks do not certify the whole deployed site, its proxy/host, actual email delivery, a penetration test or real-device usability.
