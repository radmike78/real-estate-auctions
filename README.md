# DeedOwl

A distressed-property and forced-sale discovery platform. It finds properties that are actually heading to a forced sale (tax-deed, trustee, HOA, sheriff, judicial, IRS or REO), not just properties with liens. It then answers four questions for each one:

1. **Is it actually heading to sale?** A lien alone never makes a property "buyable". There must be a recorded enforcement event.
2. **What exactly would I be buying?** For example, a tax deed, a trustee's deed, a sheriff's certificate with redemption rights, or only a lien certificate.
3. **What liens and risks may remain?** The Nevada rules engine estimates which liens likely survive the sale.
4. **What must I do next?** The site shows online bidding details or step-by-step in-person instructions, and always links to the official sale.

> **Status:** development builds add fictional sample data for Clark County, NV; production builds show only verified listings. The **Live tax sales** page shows only verified listings from the Clark County Treasurer connector (see [Live data](#live-data)).
> Nothing here is legal advice or a title determination. The site never claims title is "clear" and never takes bids or money.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # rules engine, search, connector, freshness and security tests
npm run build      # static site in dist/, plus a crawlable copy of each public page, sitemap.xml and robots.txt
```

To put the site online, see [Deploy](#deploy): Podman, any Kubernetes distribution, or OpenShift.

Development builds show fictional Clark County sample properties and professionals so every page can be tried. Production builds hide them: build with `VITE_SHOW_SAMPLE_DATA=0 npm run build` (the container image does this by default), and pages without a connected source say so instead of showing listings.


## Deploy

Every page has a normal address (for example `/learn/red-flags/`); old `#/` links from bookmarks and emails open the same page at its new address. The build writes a plain, crawlable copy of each lesson, property type, team guide and main page to `dist/<path>/index.html`, with `sitemap.xml` and `robots.txt`. Their canonical links use `SITE_URL` at build time (default `https://deedowl.com`; the container build takes it as `--build-arg SITE_URL=...`). The server answers any other page path (no file extension, not `/api/` or `/data/`) with the app, so a reverse proxy in front of it must pass every path through, not only `/`. After deploying, submit `https://<your domain>/sitemap.xml` in Google Search Console.

The site ships as **one container image**, built with **Podman** (Docker isn't used or needed). It runs in any of three ways:

| Option | Best for | Time |
| --- | --- | --- |
| [1. Podman on one Linux server](#option-1-podman-on-one-linux-server) | The simplest production setup, or trying it on a laptop | about 15 minutes |
| [2. Any Kubernetes distribution](#option-2-any-kubernetes-distribution) | k3s, RKE2, EKS, GKE, AKS, DigitalOcean, Linode, kind, minikube, ... | about 30 minutes |
| [3. OpenShift](#option-3-openshift) | OpenShift 4.x, OKD, ROSA, ARO, OpenShift Local | about 20 minutes |

### How it runs

- **One image, two processes.** The web server and API (the default command, port 8080) and the listings updater (`node --import tsx ingest/run.ts --watch`) run as two containers from the same image.
- **One data folder, `/data`.** Put a persistent volume there. It holds the database (`/data/db`), 7 daily backups (`/data/backups`), the signed feeds (`/data/feeds`) and the updater's state (`/data/ingest-state`).
- **Health check:** `GET /healthz` returns `{"ok":true}` when the server and database are working.
- **Runs one copy only.** SQLite allows one writer, so run a single copy of the web server. This is plenty for Clark County traffic. Updates stop the old copy before starting the new one, which takes 5–15 seconds.
- **Security:** it runs as a non-root user (UID 1001, group 0), with a read-only file system apart from `/data` and `/tmp`, and no extra privileges. It works under OpenShift's default `restricted-v2` policy and the Kubernetes "restricted" Pod Security Standard.

**Settings** (environment variables):

| Name | Secret? | Required | What it is |
| --- | --- | --- | --- |
| `BASE_URL` | no | yes | The web address people use, like `https://deedowl.com`. Used in emails and for secure cookies. |
| `ADMIN_USERNAME` | no | yes | Admin sign-in name for `/admin`. |
| `ADMIN_PASSWORD_HASH` | **yes** | yes | Hash of the admin password (never the password itself). Created in step 3 below. |
| `DIRECTORY_SIGNING_KEY` | **yes** | yes (web) | Private key (PEM) that signs the advertiser directory. Web server only. Created in step 2 below. |
| `FEED_SIGNING_KEY` | **yes** | yes (updater) | Private key (PEM) that signs the listings. **Listings updater only**: the web server refuses to start if it's given this key, so a break-in to the web server can't publish fake listings. |
| `RESEND_API_KEY` or `POSTMARK_SERVER_TOKEN` | **yes** | for a real site | Sends email through Resend or Postmark (one, not both). Set it together with `MAIL_FROM`. See [Email](#email-resend-or-postmark). |
| `MAIL_FROM` | no | with the key | Sender address on a domain verified with that service, like `DeedOwl <no-reply@your-domain>`. |
| `MAIL_POSTAL_ADDRESS` | no | only for general-list updates | Postal address shown only in updates to the general email list (CAN-SPAM). A PO box or mailbox service is fine. Never shown on the site or in alerts. |
| `BROADCAST_DAILY_MAX` | no | no | Most updates to the general email list sent per day; the rest go out the next day (default 50 with Resend, no limit with Postmark; `0` = no limit). |
| `RESEND_BROADCAST_FROM` | no | no | Resend only: sender for updates to the general email list, for example on its own subdomain (default: `MAIL_FROM`). |
| `MAIL_REPLY_TO`, `POSTMARK_MESSAGE_STREAM`, `POSTMARK_BROADCAST_STREAM` | no | no | Where replies go (default: `MAIL_FROM`); Postmark only: the stream for sign-in, alert and other one-to-one email (default `outbound`), and the stream for updates to the general email list (default `broadcast`). |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PLANS` | **yes** | no | Online card payments for advertisers: set all three or none. See [Online payments](#advertisers-signup-verification-billing-server). |
| `TRUST_PROXY` | no | no | `1` when a reverse proxy, Ingress or OpenShift router sits in front (it is in every option below). On Kubernetes, also set the ingress controller's Service to `externalTrafficPolicy: Local`, so the forwarded address is the visitor's and not a node's; otherwise every visitor shares one spam and sign-in limit (one bad actor could lock out the admin sign-in). With Cloudflare in front, `TRUST_CLOUDFLARE=1` (below) uses Cloudflare's visitor-address header instead. |
| `TRUST_CLOUDFLARE` | no | with Cloudflare | `1` when your domain is proxied through Cloudflare, so each visitor's own address is used for spam limits. See [Cloudflare](#cloudflare-strongly-recommended). |
| `BACKUP_KEEP` | no | no | Daily database backups to keep (default 7). `BACKUP_DIR=""` turns them off. |
| `PORT`, `DB_PATH`, `DATA_DIR`, `INGEST_STATE_DIR`, `BACKUP_DIR` | no | no | Already set correctly in the image. |

**Build options** (passed to `podman build` with `--build-arg`):

| Name | Default | What it does |
| --- | --- | --- |
| `FEED_PUBLIC_KEY` | empty | Public listings key, built into the site and the web server (see step 2 below). Without it, live listings stay off. |
| `DIRECTORY_PUBLIC_KEY` | empty | Public directory key, built into the site. Without it, the advertiser directory stays off. |
| `SHOW_SAMPLE_DATA` | `0` | `1` shows the fictional sample properties and professionals, for a demo site. Leave it at `0` for a real site. |
| `RUN_TESTS` | `1` | `0` skips the test suite during the build (not recommended). |

> **Emails:** without `RESEND_API_KEY` (or `POSTMARK_SERVER_TOKEN`) and `MAIL_FROM`, confirmation links, sign-in links, leads and reports are only written to the web container's log, and the log says `WARNING: email is OFF`. Set up [Email](#email-resend-or-postmark) before real visitors arrive.

### Cloudflare (strongly recommended)

Put [Cloudflare](https://www.cloudflare.com)'s free plan in front of any option below. It speeds up the site worldwide, caches the site's static files, and absorbs attacks. The site needs no other changes.

**Prerequisites:** a free Cloudflare account, and your domain added to Cloudflare, with the domain's nameservers changed to Cloudflare's at your registrar. Or buy the domain from Cloudflare.

**Set it up**
1. **DNS:** add an `A` record for your domain (and `www` if you use it) pointing at your server or load balancer. Leave it **DNS only** (grey cloud) for now.
2. **Deploy** with any option below, and check the site works on `https://`. With the Podman option, Caddy gets its certificate in this step.
3. **Proxy on:** switch the DNS record to **Proxied** (orange cloud).
4. **SSL/TLS → Overview → Full (strict).** Never use "Flexible": it sends traffic between Cloudflare and your server unencrypted, and loops forever with the site's own HTTPS redirect.
5. **Tell the site:** set `TRUST_CLOUDFLARE=1` (Podman: in `forced-sale-finder.env`; Kubernetes/OpenShift: in `deploy/kubernetes/base/config.env`), keep `TRUST_PROXY=1`, and restart. Without it, every visitor looks like a Cloudflare server, so spam limits would lump everyone together.
6. **Lock the server to Cloudflare (required).** Otherwise anyone who finds your server's address can skip Cloudflare and all of its protection. Allow web traffic only from [Cloudflare's addresses](https://www.cloudflare.com/ips/):
   - **Podman** (firewalld; Caddy keeps renewing its certificate through Cloudflare):
     ```bash
     sudo firewall-cmd --permanent --new-ipset=cloudflare4 --type=hash:net
     sudo firewall-cmd --permanent --new-ipset=cloudflare6 --type=hash:net --option=family=inet6
     for n in $(curl -fsS https://www.cloudflare.com/ips-v4); do sudo firewall-cmd --permanent --ipset=cloudflare4 --add-entry=$n; done
     for n in $(curl -fsS https://www.cloudflare.com/ips-v6); do sudo firewall-cmd --permanent --ipset=cloudflare6 --add-entry=$n; done
     for set in cloudflare4 cloudflare6; do for port in 80 443; do
       sudo firewall-cmd --permanent --add-rich-rule="rule source ipset=$set port port=$port protocol=tcp accept"
     done; done
     sudo firewall-cmd --permanent --remove-service=http --remove-service=https
     sudo firewall-cmd --reload
     ```
     On a cloud server, you can instead allow only Cloudflare's addresses in the provider's firewall (security group).
   - **Kubernetes:** uncomment `whitelist-source-range` in `deploy/kubernetes/overlays/kubernetes/ingress.yaml`, or set `loadBalancerSourceRanges` on your ingress controller's Service. The controller must see the real connecting address (`externalTrafficPolicy: Local`).
   - **OpenShift:** uncomment `ip_allowlist` in the overlay's `route.yaml`.
   - Step 1 made your server's address public for a while (DNS history sites keep it). If it was public for long, or ever before this setup, move to a new address after locking down.
7. **Security rules** (Cloudflare dashboard → your domain → Security). The free plan covers these:
   - **Rate limiting rule:** when `(http.request.method eq "POST" and starts_with(http.request.uri.path, "/api/") and not http.request.uri.path in {"/api/stripe/webhook" "/api/alerts/unsubscribe"})`, allow 20 requests per 10 seconds per IP, then **Block** for 10 seconds.
   - **Custom rule "admin only from me":** when `starts_with(http.request.uri.path, "/api/admin/") and not ip.src in {YOUR.HOME.IP}`, **Block**. Update it if your address changes.
   - Don't put a challenge (Managed or JS Challenge) on `/api/` paths: the site's forms send in the background and can't show one, so real visitors' forms would fail. The rate limiting rule and the site's own limits cover the forms.
   - **Custom rule "only normal requests":** when `not http.request.method in {"GET" "HEAD" "POST"}`, **Block**.
   - **DDoS protection:** keep the HTTP DDoS managed ruleset on (it is by default). Use **Under Attack mode** only during an attack: it also challenges Stripe's payment notices (Stripe retries them for 3 days).
   - **Bots:** Bot Fight Mode is optional. If you turn it on, check that a test Stripe payment still reaches the site and that the one-click unsubscribe in an alert email still works.
8. **Email service:** in Resend or Postmark, check bounces and spam complaints now and then (Postmark can email you alerts). The site also stops sending form emails (confirmations, sign-in links, leads) after 200 in one hour and logs a warning, so a spam flood can't burn through your allowance.

Cloudflare's default caching is right for this site: it caches the scripts, styles, fonts and images (their names change with every release) and passes pages, API calls and the signed listing feeds straight through. You don't need page rules or a cache-everything setting.

### Email (Resend or Postmark)

The site sends plain-text email: advertiser confirmation and sign-in links, approval and payment notices, leads to advertisers with receipts to buyers, monthly reports, and **email alerts** that people sign up for (confirmation, welcome and manage-link messages). It works with either of two email services; set up one:

- **[Resend](https://resend.com)** (recommended to start): its free plan sends about 3,000 emails a month, up to 100 a day, which covers a new site.
- **[Postmark](https://postmarkapp.com)**: excellent delivery; its free developer plan sends only 100 emails a month, and paid plans start at 10,000.

Check each service's current plans before you sign up; prices and limits change. Both stop sending to addresses that bounced or marked mail as spam. The site never turns on open or click tracking.

**Prerequisites**
- An account with the service you choose.
- Access to your domain's DNS (Cloudflare, for DeedOwl), to verify the domain.

**Set up Resend**
1. In Resend, **Domains → Add Domain**. Resend suggests a subdomain; your main domain works too.
2. Add the DNS records Resend shows (DKIM, SPF and the `send` MX record) in Cloudflare, as **DNS only** (grey cloud). They don't touch Cloudflare Email Routing: Resend's MX record is on its own `send` subdomain, and routing uses your main domain's MX records. Wait until Resend shows the domain as verified.
3. In the domain's settings, leave **open tracking** and **click tracking** off (they're off by default). Click tracking rewrites links and would break sign-in and confirmation links.
4. **API Keys → Create API Key** with **Sending access**, limited to that domain. It starts with `re_`. It's a secret: store it only as shown below, never in Git or chat.
5. Give the site the key and your sender address (an address on the verified domain):
   - **Podman:** `deploy/podman/install.sh` asks for both. To add them later:
     ```bash
     read -rs -p "Resend API key: " RK; echo
     printf '%s' "$RK" | podman secret create fsf-resend-key -
     unset RK
     ```
     Then add `MAIL_FROM=DeedOwl <no-reply@your-domain>` to `forced-sale-finder.env` in the Quadlet folder. Also uncomment the `Secret=fsf-resend-key` line in `forced-sale-finder-web.container`, then run `systemctl daemon-reload` and restart `forced-sale-finder-web`. With `--no-systemd`, run `install.sh` again and enter the key and address when it asks.
   - **Kubernetes / OpenShift:** add `--from-literal=RESEND_API_KEY=...` when you create `forced-sale-finder-secrets`, and uncomment `MAIL_FROM` in `deploy/kubernetes/base/config.env`. To add the key to an existing Secret:
     ```bash
     read -rs -p "Resend API key: " RK; echo
     kubectl patch secret forced-sale-finder-secrets -n forced-sale-finder --type merge \
       -p "{\"stringData\":{\"RESEND_API_KEY\":\"$RK\"}}"
     unset RK
     ```
     Then `kubectl apply -k ...` and `kubectl rollout restart deployment/forced-sale-finder -n forced-sale-finder`. On OpenShift, use `oc` instead of `kubectl`.
6. **Check:** the web log should say `Email on: sending through Resend as ...`. Then apply to advertise with your own address, and look for the email under **Emails** in Resend.

The site sends to Resend one message at a time, spaced out to stay under its per-second limit, and a retry can never send a message twice. Email someone is waiting for (sign-in links, confirmations, leads) always goes ahead of alerts, reports and list updates. To protect the free plan's 100 a day, updates to the general email list send at most 50 a day (`BROADCAST_DAILY_MAX`) and continue the next day, and they pause without losing anyone if Resend says the allowance is used up. If the allowance does run out, the log says `daily_quota_exceeded`: monthly reports and list updates resume on their own, but property alerts and sign-in or confirmation emails that failed meanwhile are not resent, so upgrade before you regularly get near the limit.

**Updates to the general email list** (admin → **Email list**) use the same key. To keep bulk mail from ever affecting sign-in links and alerts, you can verify a second subdomain in Resend (for example `updates.your-domain`) and set `RESEND_BROADCAST_FROM=DeedOwl <news@updates.your-domain>`. Only those updates use it.

**Set up Postmark instead**
1. In Postmark, create a **Server** (for example "DeedOwl"). Its default **Transactional** stream is `outbound`, which the site uses.
2. **Sender Signatures → Add Domain:** add your domain and create the **DKIM** and **Return-Path** DNS records Postmark shows. Wait until both show as verified.
3. **Request account approval** (Postmark asks a few questions about what you send). Until it's approved, Postmark only delivers to addresses at your own domain.
4. Copy the **Server API token** (your server → **API Tokens**). It's a secret: store it only as shown here, never in Git or chat.
5. Give the site the token and your sender address, as in step 5 above, with these names instead: the Podman secret `fsf-postmark-token` (and its `Secret=` line in `forced-sale-finder-web.container`), or `POSTMARK_SERVER_TOKEN` in the Kubernetes Secret. `install.sh` recognizes a Postmark token by itself. Set only one service: the site won't start with both keys.
6. **Check:** the web log should say `Email on: sending through Postmark as ...`, and the email appears in Postmark's **Activity** tab. To try it without sending anything, use the token `POSTMARK_API_TEST`.

With Postmark, updates to the general email list go through its separate **Broadcast** stream. New Postmark servers usually include one with the ID `broadcast`; check under your server → **Message Streams**, create one if it's missing, and set `POSTMARK_BROADCAST_STREAM` if its ID is different. In that stream's settings, have Postmark leave unsubscribe links to you (the site adds its own, which also delete the address from its database). Postmark may ask you to confirm your broadcast sending before it's enabled.

**Emails sign off with the brand and your business name** (`operatorName` in `src/lib/siteInfo.ts`), for example "DeedOwl (MRAD Software Solutions LLC)". While it's a bracketed placeholder, they sign off as DeedOwl only. No mailing address is needed for the site or for alerts. Only updates to the general email list need one: anti-spam law (CAN-SPAM) requires a postal address in those, so the admin can't send them until the server setting `MAIL_POSTAL_ADDRESS` is set (in `forced-sale-finder.env` for Podman, or `deploy/kubernetes/base/config.env`). A PO box or mailbox service is fine. It stays on the server and only appears in those emails, never on the site or in alerts. Alert emails also carry one-click unsubscribe headers (`List-Unsubscribe`), which Gmail and Yahoo require from bulk senders.

If the email service can't be reached, the site retries once. When an email still fails, the log names the reason (without the message text). Advertisers who apply are asked to try again in a few minutes. Leads are always saved and shown on the advertiser's dashboard, even if the email doesn't go out.


### Before you start (every option)

**1. Get the code**
```bash
git clone https://github.com/radmike78/real-estate-auctions.git
cd real-estate-auctions
```

**2. Create the two signing keys** (once, with OpenSSL). The listings updater signs the listings, and the web server signs the advertiser directory; browsers check both signatures with the public keys built into the image. Two separate keys mean a break-in to the web server can't publish fake listings.
```bash
for k in feed directory; do
  openssl genpkey -algorithm ed25519 -out $k-signing.pem
  openssl pkey -in $k-signing.pem -pubout -outform DER | base64 | tr -d '\n' > $k-public-key.txt
done
```
- `feed-signing.pem` and `directory-signing.pem` are the **private keys**. Keep them secret and back them up. They go into secrets, never into Git. `feed-signing.pem` goes only to the listings updater.
- `feed-public-key.txt` and `directory-public-key.txt` are the **public keys**. They're safe to share and are passed to the image build as `FEED_PUBLIC_KEY` and `DIRECTORY_PUBLIC_KEY`.
- If you lose a private key, create a new pair and rebuild the image.

**3. Create the admin password hash** (after you have an image; each option shows when). Type the password when asked; it's never shown or saved.
```bash
read -rs -p "Admin password (12+ characters): " PW; echo
# With Podman:
printf '%s\n' "$PW" | podman run --rm -i <image> node --import tsx server/hash-password.ts 2>/dev/null | tr -d '\n' > admin-password-hash.txt
# Or inside a Kubernetes/OpenShift cluster (use oc instead of kubectl on OpenShift):
# printf '%s\n' "$PW" | kubectl run fsf-hash --rm -i --quiet --restart=Never --image=<image> -n forced-sale-finder \
#   --command -- node --import tsx server/hash-password.ts 2>/dev/null | tr -d '\n' > admin-password-hash.txt
unset PW
cat admin-password-hash.txt   # should start with scrypt$
```

**4. Pick the web address** (`BASE_URL`). For HTTPS on your own domain, point the domain's DNS at your server, load balancer or OpenShift router first.

---

### Option 1: Podman on one Linux server

**Prerequisites**
- A Linux server:
  - RHEL, Rocky or AlmaLinux 9, Fedora 40+, Ubuntu 24.04 or Debian 13 (Debian 12's Podman 4.3 is too old for the systemd services);
  - at least 1 vCPU, 2 GB RAM (building uses most of it) and 10 GB of disk.
- **Podman 4.4 or newer** (Podman 5 recommended). Install it:
  - RHEL, Rocky, Alma or Fedora: `sudo dnf install -y podman git openssl`
  - Ubuntu or Debian: `sudo apt install -y podman git openssl`
- **Git** and **OpenSSL**, installed by the command above.
- **systemd**, so the site starts on boot. Every distribution above has it.
- **For HTTPS:**
  - a domain name whose DNS A record points to the server;
  - ports **80 and 443** open in the firewall, for example `sudo firewall-cmd --add-service={http,https} --permanent && sudo firewall-cmd --reload`.
- **Outbound internet:**
  - `registry.access.redhat.com` and `registry.npmjs.org` while building;
  - `docker.io`, only for the optional Caddy HTTPS and Litestream backup images, which Podman pulls from Docker Hub's registry;
  - `*.r2.cloudflarestorage.com` (or your S3-compatible storage), only if you turn on the off-site Litestream backup;
  - the county sites, `api.resend.com` or `api.postmarkapp.com` (email) and Stripe while running.
- **Mac or Windows** (for trying it out): install [Podman Desktop](https://podman-desktop.io) or run `podman machine init && podman machine start`, then use `--no-systemd` below.

**Install (one command)**
```bash
deploy/podman/install.sh
```
It asks for the web address, an admin username, an admin password and, optionally, your Resend API key (or Postmark token) and sender address ([Email](#email-resend-or-postmark); you can add them later). Then it does everything else:
1. creates the two signing keys in `~/.config/forced-sale-finder/` (step 2 above);
2. builds the image and runs the tests;
3. stores the password hash and the signing keys as Podman secrets (each container gets only its own key);
4. installs systemd services with Quadlet: `forced-sale-finder-web`, `forced-sale-finder-ingest` and, optionally, `forced-sale-finder-caddy` for automatic HTTPS;
5. starts them and checks `/healthz`.

- Run it as **root** for a system-wide install (units go in `/etc/containers/systemd/`), or as a **normal user** for a rootless install (`~/.config/containers/systemd/`).
- For a rootless install with Caddy, allow ports 80/443 once: `echo 'net.ipv4.ip_unprivileged_port_start=80' | sudo tee /etc/sysctl.d/99-unprivileged-ports.conf && sudo sysctl --system`.
- Quick try-out without systemd (also on Mac or Windows): `deploy/podman/install.sh --no-systemd`, then open http://localhost:8080.

**Install step by step (what the script does)**
```bash
# Build (on RHEL-family hosts, add --pull=newer to refresh the base images)
podman build -t localhost/forced-sale-finder:latest \
  --build-arg FEED_PUBLIC_KEY="$(cat feed-public-key.txt)" \
  --build-arg DIRECTORY_PUBLIC_KEY="$(cat directory-public-key.txt)" -f Containerfile .

# Secrets (step 3 above creates admin-password-hash.txt)
podman secret create fsf-admin-password-hash admin-password-hash.txt
podman secret create fsf-feed-signing-key feed-signing.pem             # listings updater only
podman secret create fsf-directory-signing-key directory-signing.pem   # web server only
read -rs -p 'Resend API key: ' RK; printf '%s' "$RK" | podman secret create fsf-resend-key -; unset RK   # email; see Email

# systemd services via Quadlet (rootless: use ~/.config/containers/systemd and systemctl --user)
sudo mkdir -p /etc/containers/systemd
sudo cp deploy/podman/quadlet/forced-sale-finder.{env,volume} \
        deploy/podman/quadlet/forced-sale-finder-{web,ingest}.container /etc/containers/systemd/
sudo nano /etc/containers/systemd/forced-sale-finder.env      # set BASE_URL, ADMIN_USERNAME and MAIL_FROM
sudo sed -i 's|^#Secret=fsf-resend-key|Secret=fsf-resend-key|' /etc/containers/systemd/forced-sale-finder-web.container   # or fsf-postmark-token
# Optional automatic HTTPS: also copy forced-sale-finder-caddy.{container,volume} and Caddyfile,
# then put your domain in /etc/containers/systemd/Caddyfile
sudo systemctl daemon-reload
sudo systemctl start forced-sale-finder-web forced-sale-finder-ingest   # (and forced-sale-finder-caddy)
```
There's no `systemctl enable` step: Quadlet services start at boot automatically. For a rootless install, run `sudo loginctl enable-linger $USER` once so they start without you logging in.

**Everyday tasks**

| Task | Command (rootless: add `--user` to `systemctl`, drop `sudo`) |
| --- | --- |
| Status | `sudo systemctl status forced-sale-finder-web` or `sudo podman ps` |
| Logs | `sudo podman logs -f forced-sale-finder-web` (updater: `forced-sale-finder-ingest`) |
| Update to the latest code | automatic once [automatic deploys](#automatic-deploys-with-podman) are on; otherwise `git pull && deploy/podman/install.sh --update` |
| Change settings | edit `forced-sale-finder.env` in the Quadlet folder, then `sudo systemctl restart forced-sale-finder-web` |
| Copy backups off the server | `sudo podman run --rm -v forced-sale-finder-data:/data:ro -v "$PWD":/out:Z localhost/forced-sale-finder:latest sh -c 'cp /data/backups/*.db /out/'` |
| Restore the off-site copy | `deploy/podman/offsite-backup.sh --restore` (see [Off-site database copy](#off-site-database-copy-litestream--cloudflare-r2)) |
| Restore a daily backup | stop the web service, copy the backup over `/data/db/app.db` (and delete `app.db-wal`/`app.db-shm`) with a similar `podman run`, then start it |
| Uninstall | stop the services, delete the `forced-sale-finder*` files from the Quadlet folder, `systemctl daemon-reload`, then `podman volume rm forced-sale-finder-data` (**deletes all data**) |

#### Off-site database copy (Litestream + Cloudflare R2)

The site's own daily backups stay on the server, so they don't help if the server itself is lost. [Litestream](https://litestream.io) (free, open source) runs as one more container and sends every database change (advertisers, alert sign-ups, leads, stats) to Cloudflare R2 within about 10 seconds. If the server is lost, you lose at most seconds of data. The signed listings don't need copying: the updater downloads them again from the official sources.

**Cost:** R2's free tier includes 10 GB of storage, and the database is a few megabytes, so this should cost nothing. Check R2's usage page once in a while.

Set it up once, after `install.sh`:
1. **Cloudflare dashboard → R2 Object Storage.** Note your **Account ID** (on the right). Create a bucket, for example `deedowl-db`, and leave it private.
2. **R2 → Manage API tokens → Create API token.** Permission: **Object Read & Write**, applied to **that bucket only**. Copy the **Access Key ID** and **Secret Access Key** (shown once).
3. **On the server:** run `deploy/podman/offsite-backup.sh` and paste the four values when it asks. The key is stored only as Podman secrets (`fsf-r2-access-key-id`, `fsf-r2-secret-access-key`). The script starts the `forced-sale-finder-litestream` service and waits until the first copy reaches R2.

| Task | Command |
| --- | --- |
| Is it copying? | `deploy/podman/offsite-backup.sh --status` |
| Rebuild on a new server | run `install.sh`, then `deploy/podman/offsite-backup.sh` (same R2 details), then `deploy/podman/offsite-backup.sh --restore` |
| Replace this server's database with the R2 copy | `deploy/podman/offsite-backup.sh --restore` (the current database is kept as `app.db.before-restore`) |
| Change the bucket or key | run `deploy/podman/offsite-backup.sh` again |

Also keep a copy of the two signing keys (`~/.config/forced-sale-finder/*-signing.pem`) somewhere safe, such as a password manager. Together with the R2 copy and the code on GitHub, that is everything needed to rebuild the site.

---

### Option 2: Any Kubernetes distribution

**Prerequisites**
- A Kubernetes cluster, **version 1.27 or newer**, with:
  - a **default StorageClass** that supports `ReadWriteOnce` volumes (check with `kubectl get storageclass`);
  - an **Ingress controller**. The files assume [ingress-nginx](https://kubernetes.github.io/ingress-nginx/deploy/); for Traefik (the k3s default) or another controller, change `ingressClassName` in `ingress.yaml`;
  - optional: **[cert-manager](https://cert-manager.io/docs/installation/)** with a `ClusterIssuer` for free, automatic HTTPS certificates.
- **kubectl 1.27+** on your computer, connected to the cluster. Kustomize is built in (`kubectl apply -k`).
- **A container image the cluster can pull.** Either:
  - **(a)** use the image CI publishes to GitHub Container Registry (see [Continuous delivery](#continuous-delivery)); or
  - **(b)** build it yourself with **Podman 4+** and push it to any registry (Quay.io, GHCR, Harbor, ECR, GCR, ACR, ...).
- **OpenSSL** for the signing key. **Podman** for building the image (option b) and the password hash; you can also make the hash inside the cluster.
- At least 0.2 CPU and 512 MB of memory free on a node, plus 5 GB of storage.

**Steps**
1. **Image.**
   - **(a)** Use `ghcr.io/radmike78/real-estate-auctions:latest`. Set the repository variables `FEED_PUBLIC_KEY` and `DIRECTORY_PUBLIC_KEY` to the contents of `feed-public-key.txt` and `directory-public-key.txt` *before* CI builds it.
   - **(b)** Build and push your own:
     ```bash
     podman build -t quay.io/<you>/forced-sale-finder:1.0 --build-arg FEED_PUBLIC_KEY="$(cat feed-public-key.txt)" \
       --build-arg DIRECTORY_PUBLIC_KEY="$(cat directory-public-key.txt)" -f Containerfile .
     podman login quay.io && podman push quay.io/<you>/forced-sale-finder:1.0
     ```
   Put the image name and tag in `deploy/kubernetes/overlays/kubernetes/kustomization.yaml` (`images:`).
   - If the registry is private, add a pull secret:
     ```bash
     kubectl create secret docker-registry regcred -n forced-sale-finder --docker-server=ghcr.io --docker-username=<user> --docker-password=<token>
     kubectl patch serviceaccount default -n forced-sale-finder -p '{"imagePullSecrets":[{"name":"regcred"}]}'
     ```
     (`docker-registry` is just the name of the Kubernetes secret type; no Docker software is involved.)
2. **Namespace:** `kubectl create namespace forced-sale-finder`
3. **Password hash:** step 3 of [Before you start](#before-you-start-every-option), using your image name, with Podman or inside the cluster.
4. **Secrets.** Two of them: the listings key goes in its own secret that only the listings updater reads. Add the Resend API key (or Postmark token) for email ([Email](#email-resend-or-postmark)). Add the three `STRIPE_*` values only if you use online payments:
   ```bash
   read -rs -p "Resend API key: " RK; echo
   kubectl create secret generic forced-sale-finder-secrets -n forced-sale-finder \
     --from-file=ADMIN_PASSWORD_HASH=admin-password-hash.txt \
     --from-file=DIRECTORY_SIGNING_KEY=directory-signing.pem \
     --from-literal=RESEND_API_KEY="$RK"
   kubectl create secret generic forced-sale-finder-feed-key -n forced-sale-finder \
     --from-file=FEED_SIGNING_KEY=feed-signing.pem
   unset RK
   #  Postmark instead: --from-literal=POSTMARK_SERVER_TOKEN=... (not both)
   #  --from-literal=STRIPE_SECRET_KEY=... --from-literal=STRIPE_WEBHOOK_SECRET=... --from-literal=STRIPE_PLANS='{...}'
   ```
5. **Settings:**
   - Edit `deploy/kubernetes/base/config.env`: set `BASE_URL` and `ADMIN_USERNAME`, and uncomment `MAIL_FROM` with your sender address.
   - Edit `deploy/kubernetes/overlays/kubernetes/ingress.yaml`: set your host name (twice), `ingressClassName`, and the cert-manager issuer name. Remove the annotation if you don't use cert-manager.
6. **Deploy:**
   ```bash
   kubectl apply -k deploy/kubernetes/overlays/kubernetes -n forced-sale-finder
   kubectl rollout status deployment/forced-sale-finder -n forced-sale-finder
   ```
7. **Check:** `kubectl get pods,ingress -n forced-sale-finder`, then open your address. Without DNS yet, run `kubectl port-forward -n forced-sale-finder svc/forced-sale-finder 8080:8080` and open http://localhost:8080.

**Everyday tasks**

| Task | Command |
| --- | --- |
| Logs | `kubectl logs -n forced-sale-finder deploy/forced-sale-finder -c web -f` (updater: `-c ingest`) |
| Update (`:latest` tag) | `kubectl rollout restart deployment/forced-sale-finder -n forced-sale-finder` |
| Update (versioned tag) | change `newTag` in the overlay, then `kubectl apply -k ...` again |
| Roll back | `kubectl rollout undo deployment/forced-sale-finder -n forced-sale-finder` |
| Copy backups off | `kubectl cp -n forced-sale-finder -c web <pod>:/data/backups ./backups` (pod name from `kubectl get pods`) |
| Change settings | edit `config.env`, then `kubectl apply -k ...` (the pod restarts by itself). After changing the Secret, run `kubectl rollout restart deployment/forced-sale-finder -n forced-sale-finder` |
| Remove | `kubectl delete -k deploy/kubernetes/overlays/kubernetes -n forced-sale-finder` (**deletes the data volume**) |

---

### Option 3: OpenShift

**Prerequisites**
- **OpenShift 4.12 or newer.** OKD, Red Hat OpenShift on AWS (ROSA), Azure Red Hat OpenShift (ARO), OpenShift Dedicated and [OpenShift Local](https://developers.redhat.com/products/openshift-local/overview) (for trying it on a laptop) all work.
- The **`oc` CLI**, logged in (`oc login ...`), with permission to create a project, or edit rights in an existing one.
- A **default StorageClass** (check with `oc get storageclass`). Every managed OpenShift has one.
- **OpenSSL** for the signing key.
- **Option A (prebuilt image):** Podman, and an image in a registry the cluster can pull from (same as Kubernetes step 1).
- **Option B (build in the cluster):**
  - the cluster must reach `github.com`, `registry.access.redhat.com` and `registry.npmjs.org`;
  - the project needs about **3 GiB of memory** for builds;
  - no registry account or local Podman needed: OpenShift builds with Buildah, and the password hash is made in the cluster.

No extra permissions are needed. Everything runs under OpenShift's default `restricted-v2` security policy, and OpenShift picks the user ID and volume permissions itself.

**Common steps**
1. `oc new-project forced-sale-finder`
2. Edit `deploy/kubernetes/base/config.env`: set `BASE_URL` and `ADMIN_USERNAME`, and uncomment `MAIL_FROM` with your sender address. If you don't know the address yet, leave it for now; after deploying, read it from `oc get route forced-sale-finder`, set it, and run the `oc apply -k` command again.

The two Secrets are created as part of each option below (the listings key goes in its own secret that only the listings updater reads):
```bash
read -rs -p "Resend API key: " RK; echo
oc create secret generic forced-sale-finder-secrets \
  --from-file=ADMIN_PASSWORD_HASH=admin-password-hash.txt \
  --from-file=DIRECTORY_SIGNING_KEY=directory-signing.pem \
  --from-literal=RESEND_API_KEY="$RK"
oc create secret generic forced-sale-finder-feed-key --from-file=FEED_SIGNING_KEY=feed-signing.pem
unset RK
# Postmark instead: --from-literal=POSTMARK_SERVER_TOKEN=... (not both)
# Optional online payments: add --from-literal=STRIPE_SECRET_KEY=... (all three STRIPE_* values)
```

**Option A: prebuilt image**
1. Set the image in `deploy/kubernetes/overlays/openshift/kustomization.yaml` (`images:`). For a private registry, add a pull secret:
   ```bash
   oc create secret docker-registry regcred --docker-server=... --docker-username=... --docker-password=...
   oc secrets link default regcred --for=pull
   ```
2. Make the password hash (step 3 of [Before you start](#before-you-start-every-option)) and create the Secrets (above).
3. `oc apply -k deploy/kubernetes/overlays/openshift`
4. `oc rollout status deployment/forced-sale-finder`, then `oc get route forced-sale-finder` to get the HTTPS address.

**Option B: build inside OpenShift from Git (no registry needed)**
1. In `deploy/kubernetes/overlays/openshift-build/buildconfig.yaml`:
   - paste the contents of `feed-public-key.txt` into `FEED_PUBLIC_KEY`, and of `directory-public-key.txt` into `DIRECTORY_PUBLIC_KEY`;
   - if you use a fork, change the Git `uri` and `ref`.
2. Create the webhook secret (used for automatic rebuilds):
   ```bash
   oc create secret generic forced-sale-finder-webhook --from-literal=WebHookSecretKey="$(openssl rand -hex 20)"
   ```
3. If the repository is **private**, give OpenShift read access with a GitHub token that has read-only `contents` permission, then uncomment `sourceSecret` in `buildconfig.yaml`:
   ```bash
   oc create secret generic forced-sale-finder-git --type=kubernetes.io/basic-auth \
     --from-literal=username=<github-user> --from-literal=password=<token>
   ```
4. Deploy. This starts the first build automatically; it takes about 3–5 minutes, and the tests run during the build:
   ```bash
   oc apply -k deploy/kubernetes/overlays/openshift-build
   oc logs -f bc/forced-sale-finder
   ```
   Until the next step is done, the pod waits with `CreateContainerConfigError`. That's expected.
5. Make the password hash with the image you just built, then create the Secrets:
   ```bash
   read -rs -p "Admin password (12+ characters): " PW; echo
   printf '%s\n' "$PW" | oc run fsf-hash --rm -i --quiet --restart=Never --image=forced-sale-finder:latest \
     --command -- node --import tsx server/hash-password.ts 2>/dev/null | tr -d '\n' > admin-password-hash.txt
   unset PW
   oc create secret generic forced-sale-finder-secrets \
     --from-file=ADMIN_PASSWORD_HASH=admin-password-hash.txt --from-file=DIRECTORY_SIGNING_KEY=directory-signing.pem
   oc create secret generic forced-sale-finder-feed-key --from-file=FEED_SIGNING_KEY=feed-signing.pem
   oc rollout status deployment/forced-sale-finder
   oc get route forced-sale-finder
   ```
6. **Automatic rebuilds on every push:**
   - Get the webhook URL: `oc describe bc/forced-sale-finder`, under "Webhook GitHub". Replace `<secret>` in it with the value from step 2: `oc get secret forced-sale-finder-webhook -o jsonpath='{.data.WebHookSecretKey}' | base64 -d`.
   - In GitHub, go to repository Settings > Webhooks > Add webhook, paste the URL and choose content type `application/json`.
   - From then on, each merge to `main` rebuilds the image and redeploys the site.

**Custom domain:** set `host:` in the Route (`route.yaml`) and point your domain's DNS (a CNAME) at the router. Then either add your certificate to the Route, or use cert-manager for OpenShift.

**Everyday tasks:** the same as Kubernetes with `oc` instead of `kubectl`. In the web console, go to Topology to see the pod, logs and builds.

---

### Continuous delivery

`.github/workflows/ci.yml` runs on every pull request and on every change to `main`:
1. **test:** type checks, all unit tests, and the site build.
2. **manifests:** renders the three Kubernetes/OpenShift setups and validates them against the Kubernetes and OpenShift schemas.
3. **image:** builds the image with **Podman**, starts it and checks `/healthz`. On `main`, it pushes the image to `ghcr.io/radmike78/real-estate-auctions` as `:latest` and `:<commit>`.

To turn it on for your deployments:
- Add the repository **variables** `FEED_PUBLIC_KEY` and `DIRECTORY_PUBLIC_KEY` (Settings > Secrets and variables > Actions > Variables) with the contents of `feed-public-key.txt` and `directory-public-key.txt`.
- The first push creates the package in GitHub under Packages. Either make it public, or give your cluster a pull secret (shown above).

Then roll out new versions:
- **Podman, automatically (recommended):** see [Automatic deploys with Podman](#automatic-deploys-with-podman) below.
- **Podman, by hand:** `git pull && deploy/podman/install.sh --update` (builds on the server).
- **Kubernetes or OpenShift A:** `kubectl` or `oc rollout restart deployment/forced-sale-finder`.
- **OpenShift B:** rolls out automatically after each build.

#### Automatic deploys with Podman

Merge a pull request into `main`, and the site updates itself: GitHub Actions tests it, builds the image and publishes it to GitHub Container Registry; the server checks the registry every 10 minutes (`podman auto-update`), pulls the new image and restarts. If the new version doesn't start, Podman rolls back to the previous one. Nothing on GitHub can reach the server; the server only pulls.

Set it up once, after `install.sh`:
1. On the server, run `deploy/podman/auto-deploy.sh` (as the same user that ran `install.sh`). It prints your two **public** keys.
2. In GitHub, add them as the repository **variables** `FEED_PUBLIC_KEY` and `DIRECTORY_PUBLIC_KEY` (Settings > Secrets and variables > Actions > Variables), then publish a fresh image: Actions > **CI** > **Run workflow** on `main`.
3. Answer **y** in the script. If the image is private, it asks for your GitHub username and a token that can only read packages (GitHub > Settings > Developer settings > Personal access tokens > Tokens (classic), scope `read:packages`). The token is stored only on the server, in a file readable by its owner.
4. The script checks that the published image carries your server's keys (so browsers will accept the listings), switches the services to it, and turns on the timer.

| Task | Command (rootless: add `--user` to `systemctl` and `journalctl`) |
| --- | --- |
| See whether an update is waiting | `sudo podman auto-update --dry-run` |
| Deploy right now | `sudo podman auto-update` |
| Deploy history | `sudo journalctl -u podman-auto-update.service` |
| Check every 5 minutes instead | `deploy/podman/auto-deploy.sh --every 5` |
| Roll back | Automatic when a new version fails to start. To pin an older version, set `Image=ghcr.io/radmike78/real-estate-auctions:<commit>` in the Quadlet files, then `systemctl daemon-reload` and restart |

Only changes merged into `main` are deployed. Pull requests are tested but never published, so review and merge is the "deploy" button.

For GitOps, point [Argo CD / OpenShift GitOps](https://argo-cd.readthedocs.io/) at `deploy/kubernetes/overlays/<option>`. The cluster then follows whatever is merged, and every change can be rolled back from Git.

### Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| Web container exits with "Set ADMIN_USERNAME and ADMIN_PASSWORD_HASH" | The secret or settings are missing. Check that the Secret has `ADMIN_PASSWORD_HASH` and `config.env` has `ADMIN_USERNAME`. |
| Pod stuck in `Pending` | No default StorageClass, or not enough resources. Run `kubectl describe pod ...` and look at Events. |
| `ImagePullBackOff` | Wrong image name, or a private registry without a pull secret. See step 1 of your option. |
| `CrashLoopBackOff` with "permission denied" on `/data` | Plain Kubernetes: keep the `fsGroup: 1001` patch in the Kubernetes overlay. OpenShift handles this automatically. |
| Live tax sales says "didn't pass our security checks" | The image was built with a different public key than the private key in the secret. Rebuild with the matching `feed-public-key.txt`. |
| Web container exits with "FEED_SIGNING_KEY is for the listings updater only" | The listings key was given to the web server. Put `DIRECTORY_SIGNING_KEY` in `forced-sale-finder-secrets` and `FEED_SIGNING_KEY` only in `forced-sale-finder-feed-key` (Podman: `fsf-directory-signing-key` for the web container). |
| Pod stuck in `CreateContainerConfigError` | A secret is missing. Create both `forced-sale-finder-secrets` and `forced-sale-finder-feed-key`. |
| Live tax sales is always empty | Expected until the Treasurer schedules an auction, and until `termsReviewedAt` is set in `ingest/sources/registry.ts` (see [Live data](#live-data)). |
| Behind Cloudflare, spam limits ("Too many ... from this network") hit many people at once | Set `TRUST_CLOUDFLARE=1` ([Cloudflare](#cloudflare-strongly-recommended)). |
| `ERR_TOO_MANY_REDIRECTS` behind Cloudflare | Cloudflare SSL mode is "Flexible". Set it to **Full (strict)**. |
| Log says `WARNING: email is OFF` | Set `RESEND_API_KEY` (or `POSTMARK_SERVER_TOKEN`) and `MAIL_FROM` ([Email](#email-resend-or-postmark)). |
| Web container exits with "not both" | Only one email service at a time: remove either `RESEND_API_KEY` or `POSTMARK_SERVER_TOKEN`. |
| Log says `Email to ... was not sent: Resend HTTP 401` or `403` | Wrong or restricted key, or `MAIL_FROM` isn't on a domain verified in Resend. Use a key with Sending access for that domain. |
| `... Resend HTTP 429, daily_quota_exceeded` (or `monthly_quota_exceeded`) | You've used the free plan's allowance. Sending resumes the next day (or month); emails that failed meanwhile, except monthly reports, aren't resent. Upgrade in Resend if it keeps happening. |
| Log says `Email to ... was not sent: Postmark HTTP 401` | Wrong token. Copy the **Server** API token, not the Account token. |
| `... HTTP 422, error 400` or `error 401` | `MAIL_FROM` isn't a verified (or confirmed) sender signature or domain in Postmark. |
| `... HTTP 422, error 412` | Your Postmark account is still pending approval: it only delivers to your own domain until approved. |
| `... HTTP 422, error 406` | That recipient bounced or marked mail as spam before; Postmark won't send to it. You can reactivate it in Postmark. |
| Admin sign-in fails behind HTTPS | `BASE_URL` must be the exact `https://` address people use. |
| Build runs out of memory | Give the build at least 2 GB (Podman host) or 3 GiB (OpenShift build). |


## Live data

**Other sources, not connected yet** (details and ready-to-send requests in [docs/data-access-requests.md](docs/data-access-requests.md)):
- **HUD Home Store** (HUD-owned homes). Its robots.txt disallows all automated access and it has no public feed, so the Bank-owned checklist links to HUD's own Nevada search instead. A connector will be built only with HUD's written permission or an approved feed.
- **Clark County Recorder** (notices of default and sale, and trustee's deeds that show a home became bank-owned). Available as the Recorder's official Official Record Indexes (FTP) subscription. Needed for real pre-foreclosure and bank-owned data.


The first real connector reads the **Clark County Treasurer's delinquent-property (trustee) auction** at <https://treasurer.clarkcountynv.gov/auction/Auction/AuctionList>. It uses the county's own data endpoints for auction sessions and parcels. Each parcel is cross-checked against the Assessor's parcel records on a separate county server. See [SECURITY.md](SECURITY.md) for how sources are authenticated, kept current and protected against spoofing.

**Verified against the live site on 2026-09-24:**
- The latest auction (#21) was held **May 7, 2026** in person at the Clark County Government Center. It had 142 parcels, 95 lined out and 63 sold.
- No new auction is scheduled; the Treasurer holds one "only if necessary."
- So the Live page correctly shows **no available parcels** today. It will list parcels automatically once the Treasurer publishes the next auction.

### Enabling it

1. **Terms of use: reviewed and accepted on 2026-09-26** (`termsReviewedAt` in `ingest/sources/registry.ts`). The county allows crawling that doesn't slow its servers; the quotes and decision are in [docs/source-terms-review.md](docs/source-terms-review.md). Scheduled runs skip any source without a review date.
2. **Check the pipeline without saving anything:**
   ```bash
   npm run ingest -- --dry-run
   ```
   This verifies the sites' identity, then fetches, parses and cross-checks the data. To test offline from saved responses, run `npm run ingest -- --from-dir ingest/fixtures/clark-2026-05`.
3. **Create the signing keys:**
   ```bash
   npm run keys:generate
   ```
   This writes the two private keys (listings and directory) to `ingest/.keys/` (gitignored) and the public keys into the site. Rebuild the site afterwards.
4. **Run it:**
   ```bash
   npm run ingest -- --watch
   ```
   This long-running service checks each source when it is due and writes the signed feed to `public/data/`. Deploy that folder alongside the built site.

### IRS sales (enabled)

A third connector reads **IRS seizure and court-ordered sales** from the Treasury Department's own site, <https://www.irsauctions.gov/>. It reads the site's JSON index of every ad (`/index.json`, the same data its cards show) and keeps an ad only when it is real estate in Nevada, California, Arizona or Utah: a location in one of those states, a county we can name (from the city, using the Census place lists in `src/data/places`, or the county the ad names when the city spans several), and at least one parcel number in the notice.

- **Clark County:** a Clark County ZIP and a Clark County parcel number; the County Assessor must confirm every parcel in the sale. These sales appear on Live tax sales, in search (badge "IRS sale") and on their own property pages.
- **Everywhere else in the four states:** only parcel numbers the notice labels as such (APN, AIN, Parcel Number) are read, so a phone number or price is never taken for one. These sales are listed in their own table on Live tax sales, as the IRS lists them, marked "parcel not checked by DeedOwl", with links to the IRS notice and the county assessor. They get no property page. Sale times are read in each state's time zone (Arizona has no daylight saving time).
- Checked against the live index on 2026-09-26 (139 ads nationwide, none in Nevada) and 2026-10-05 (142 ads; those in California and Arizona were past, undated or canceled), so nothing shows today. `robots.txt` allows all automated access.
- Seizure sales show the 180-day redemption period; court-ordered sales point to the court's order for the terms. Seizure sales show the 180-day redemption period; court-ordered sales point to the court's order for the terms.
- The notice text names the taxpayer, so it is never stored or published; we keep the title, place, date, minimum bid, parcels and sale terms, and link to the IRS ad.
- **Terms: reviewed and accepted on 2026-09-26** (robots.txt allows all, no terms of use, and U.S. Government works aren't copyrighted; see [docs/source-terms-review.md](docs/source-terms-review.md)). Test it with `npm run ingest -- --dry-run --source us-irs-auctions`, or offline with `--from-dir ingest/fixtures/irs-2026-09`.

### SID lien certificates (built, off: needs AMG's written permission)

A second connector reads the **special improvement district (SID) lien-certificate sales** held by Clark County and the cities. The Treasurer's [certificate-sale page](https://www.clarkcountynv.gov/government/elected_officials/county_treasurer/certificate-sale) sends buyers to the notice-of-sale page run by **Assessment Management Group** (<https://www.amgnv.com/notice-of-sale.asp>), which publishes the lists for them. It is the only non-.gov host the ingester may contact (`AGENT_HOSTS` in `ingest/sources/registry.ts`), and every parcel on its list is still confirmed against the County Assessor.

- The site shows only the parcel number, address, district, amount due and sale, marked "Lien certificate sale, not a property sale". These homes aren't for sale: no owner names, pictures, maps, Assessor links, property pages or tracking. Owner columns on the list are never read.
- On 2026-09-26 the page announced the **City of Henderson sale on October 27, 2026**; the list goes up about 3 weeks before. Its format isn't known yet, so the connector is written against a made-up list (`ingest/fixtures/amg-2026-09/made-up-list.html`).
- **AMG's Terms of Use prohibit** copying, downloading or republishing its material without AMG's prior written consent ([amgnv.com/copyright.asp](https://www.amgnv.com/copyright.asp); see [docs/source-terms-review.md](docs/source-terms-review.md)). So the connector stays off, and the SID playbook links to AMG's notice page instead. Linking is fine.
- **To enable it**, only with written permission from AMG (request email in [docs/data-access-requests.md](docs/data-access-requests.md)):
  1. Keep a copy of the permission with the project records, and set `termsReviewedAt` for `nv-clark-sid-certificate-sale` in `ingest/sources/registry.ts`.
  2. Check the connector against a real posted list: `npm run ingest -- --dry-run --source nv-clark-sid-certificate-sale` (dry runs contact a site only once its terms review is recorded). Fix the parser if the format differs, save a copy with owner names removed as the test fixture, and set `parserVerifiedAt`.

### How it stays current

- **Learns the real update rate.** It watches when the official list actually changes and checks about 4 times per update interval. For the Treasurer's daily list, that starts at every 6 hours.
- **Speeds up near the sale.** It checks hourly in the last 3 days before the auction, and every 15 minutes on the final day.
- **Removes parcels right away.** A parcel is withdrawn as soon as the Treasurer lines it out, it sells, or it drops off the list.
- **Hides anything not re-checked recently.** If the county site is down or the service stops, listings disappear from the site instead of going stale.

## Advertisers: signup, verification, billing (server)

Real estate agents, loan officers, mortgage companies, banks, credit unions, hard-money and private lenders, title and escrow companies, insurance agents, contractors, home inspectors, property managers, real estate attorneys and CPAs can advertise. Each gets a dedicated profile page (`#/pros/:id`). Profiles appear in:
- **Find an agent** (`#/agents`)
- **Financing** (`#/financing`), filterable by loan type and credit situation
- **Title, insurance & repairs** (`#/pros`)

The advertiser landing page is `#/advertise`, the application form is `#/advertise/apply`, and the admin review is at `#/admin`.

**How a profile goes live** (the server enforces every step):
1. **Apply.** One form for every category and all four states (Nevada, California, Arizona, Utah). The advertiser picks their state, their category, the counties they serve (1 to 20, from that state) and, optionally, up to 30 cities or towns from the Census list for that state (`src/data/places`; the server checks each name). The license, registration or ID number is a plain text box with no format check: the admin checks it on the official lookup. Category-specific rules cover the services or loan types offered and credit situations (lenders only). All text is plain text only. Anti-spam: a hidden honeypot field and 5 applications per network per hour.
2. **Confirm email.** A single-use link, valid for 48 hours.
3. **Verify.** An admin checks the license on the official lookup for that category and state (`regulatorFor` in `src/lib/regulators.ts`; the admin page links it). Nevada's:

   | Category | Official lookup |
   | --- | --- |
   | Agents | NRED |
   | Loan officers, mortgage companies, private lenders | NMLS Consumer Access |
   | Banks | FDIC BankFind |
   | Credit unions | NCUA |
   | Title and insurance | Nevada Division of Insurance |
   | Contractors | Nevada State Contractors Board |
   | Home inspectors, property managers | Nevada Real Estate Division (inspector of structures certificate; property management permit) |
   | Real estate attorneys | State Bar of Nevada (they must also file their ads with the Bar under RPC 7.2A) |
   | CPAs | Nevada State Board of Accountancy |

   California, Arizona and Utah use the same lookups as the Your Team pages (`src/lib/licenseLookups.ts`); banks and credit unions use FDIC and NCUA in every state. Where a state has no single lookup (California home inspectors aren't licensed; California private lenders may hold a DFPI or DRE license), the admin page says what to check instead.

   The admin then **confirms identity through the company, using contact details from the regulator or the company, never from the application**. Approval is blocked until status, name, type, company, identity and the content check are all ticked; an expiration date is optional.
4. **Choose ad areas, a plan, and pay.** Once approved, the advertiser gets an email, chooses where their ads show (see **Ad areas** below), chooses a plan (Rotating, Spotlight or Mentor Connect; see **Plans and caps** below) and pays **by card from their dashboard** (Stripe; see below). Each confirmed monthly payment extends their paid-through date automatically. For payments received another way, the admin records the plan (with its tier, and the topic for Mentor Connect), the paid-through date and how many ad areas are paid for by hand. A profile is live only while it is verified within the last 90 days **and** paid through today.
5. **Publish.** Live profiles go into `public/data/pros.json`, an Ed25519-signed file that expires after 24 hours and is republished hourly. The browser verifies it and re-checks every listing rule.
6. **Profile photos (optional).** Advertisers upload a headshot or logo from their dashboard (JPG, PNG or WebP, up to 5 MB, 10 uploads an hour). The server accepts only those formats, decodes each with a size limit and re-encodes it as a 400×400 WebP, which drops hidden data such as GPS location; the original is never kept. A new photo waits under **Admin → the advertiser → Photo waiting for review** and goes live only when approved (the previous photo stays up until then). Approved photos are stored in the database (so the daily backups and the off-site copy include them), served from `/api/pro-photos/<sha256>.webp`, and their SHA-256 is part of the signed directory: the browser checks the hash before showing a photo.

**Ad areas** (`src/lib/adAreas.ts`). Advertisers choose on their dashboard where their listing and ads show: cities or towns (from the Census list for their state, `src/data/places`), or whole counties (a county covers every city and community in it), up to 25. They're separate from the areas the advertiser says they serve, which only appear on their profile.
- **Price:** one unit of the plan's Stripe price per area (Checkout `quantity` = number of areas). A whole county costs the same as one city for now; size-based prices can come later.
- **Changes:** on a card plan, saving a different number of areas updates the subscription's quantity with `proration_behavior: always_invoice`, so Stripe charges (or credits) the difference right away. The new count takes effect when Stripe confirms it (`customer.subscription.updated`, or the quantity on `invoice.paid`); until then only the first paid-for areas are published. Swapping one area for another needs no Stripe call. Manually billed advertisers: the admin's **Ad areas paid for** count decides how many of the advertiser's areas show.
- **Visitors:** ad boxes (Featured, the rotating ad, topic ads) show advertisers whose areas cover the visitor's chosen city (or county, when they chose only a county); with only a state chosen, the whole state's. The directory list shows the visitor's area first, with **Show all of {state}**.
- Profiles from before ad areas count as holding each county they serve.

**Fair placement.** Directory results are filtered by what the user needs, then shown in a daily rotating order that is the same for everyone, whatever plan an advertiser pays for: no plan moves anyone up the list. The CFPB's 2023 RESPA advisory opinion says steering consumers based on payments violates RESPA section 8 for real estate and mortgage services. Every profile is labeled "Advertisement."

**Plans and caps** (`src/lib/adPlans.ts`, `src/lib/adTopics.ts`):

| Plan | What it adds |
| --- | --- |
| Rotating | A profile page and a place in the category's directory list, in the fair rotating order. |
| Spotlight | Rotating, plus a separate box labeled **Featured ad** on the category's directory pages, above the list (never inside it). Up to 2 advertisers are shown, picked at random on each page view. Also takes turns in the single **Advertisement** box at the top of the Your Team page (one Spotlight or Mentor Connect advertiser from any category, picked at random on each page view). Also takes turns in the **Advertisement** box beside the matching step: on My plan beside "Your next step" (whoever that step says to call: loan officer, agent, insurance, title or escrow, attorney, contractor, CPA) and on Analyze a deal beside "What's next" (by plan: Fix and sell → contractors, inspectors, short-term lenders; Keep and rent or Commercial → lenders, insurance, property managers). Only when buying through an agent (listings and bank-owned homes), never on auction or lien-certificate steps or forced-sale deals (`src/lib/contextAds.ts`). |
| Mentor Connect ("Best value") | Spotlight, plus one box labeled **Advertisement** beside one Learn or Practice topic the advertiser chooses. |

- **Two voices.** Next to each topic, DeedOwl's own short editorial block (questions to ask that kind of professional, the official license lookup, the directory link) never names or points to an advertiser. The advertiser's box is in their own voice, labeled at the top, with the fine print "Paid ad. DeedOwl checks that advertisers hold an active license but doesn't recommend, rank or review them. Compare more than one." Ad boxes and directory lists show advertisers licensed in the visitor's chosen state (every state's when none is chosen); the editorial block shows to everyone. An ad spot with no advertiser keeps its place with a labeled "space" box pointing professionals to the Advertise page.
- **Where topic ads appear:** after a lesson's explanation, after a drill's verdict and expert view, or at the end of a finished practice-case step; never inside a question, its answers or its feedback, and never on forced-sale, foreclosure, tax-sale, lien, HOA, sheriff, IRS-sale, short-sale, homeowner-help or surplus-money pages. The mapping is in `src/lib/adTopics.ts` and its rules are tested.
- **Caps** (the `CAPS` constants, counted per category in each city (a whole county takes a spot in each of its cities; founding spots per state), enforced at checkout, on area and topic changes and in admin billing, with a clear message naming the full area): 5 listed advertisers per category (every plan counts, including manually billed ones); 2 Featured spots per category (Spotlight and Mentor Connect); per category and topic, 2 topic spots for real estate settlement services (agents, lenders, banks, credit unions, title and escrow, attorneys), which take turns at random, and 1 (exclusive) for other categories. The Featured cap also limits Mentor Connect to 2 per category.
- **Ad line.** An optional one-line ad (20 to 180 characters, plain text, no web addresses, emails or phone numbers, no "best", "#1", "trusted", "guaranteed" and similar; lenders also no rates, APRs, payments or dollar amounts, which trigger Truth in Lending disclosures). It's checked on the form, by the server and by the browser (`validateAdLine`). Entered on the application (reviewed with the profile) or later from the dashboard, where it waits under **Admin → Ad lines to review**. Without one, ad boxes show the headline.
- **Founding advertisers.** In **Admin → the advertiser → Founding advertiser**, tick the box (logged as `FOUNDING_SET` / `FOUNDING_REMOVED`). Each category takes up to 2 founding advertisers in each state (`CAPS.founding` in `src/lib/adPlans.ts`); untick one to free its spot. Rejected applications don't count. Their checkout then applies the plan's `foundingCoupon` (below).
- **Removing ads or removing everything.** In **Admin → the advertiser → Ads**, **Remove ads only** turns off their ad boxes (Featured ad, the rotating ad on the Your Team page and any topic ad) while their profile page and directory listing stay live; their plan keeps its spot in the caps, and their dashboard says the ads are paused (logged as `ADS_HIDDEN` / `ADS_SHOWN`; **Turn ads back on** restores them). **Suspend listing (removes everything)** takes the profile and listing down too.
- **Results.** The dashboard and monthly report also count how often an advertiser's ad box was shown and its button clicked.

**Proving the value of an advertising fee:**
- **Every profile page has a contact form.** The buyer explicitly agrees to share their details with that one professional only. The lead is emailed to the professional right away, and the buyer gets a receipt with due-diligence reminders.
- **Advertisers sign in at `#/advertiser`** with a one-time email link; there is no password. They see results for the last 30 days, the last 90 days or last month:
  - leads (the headline number)
  - appearances in search results
  - profile views (unique visitors)
  - phone, email and website clicks
  - the share of visitors who reached out
  - daily charts, a table view, and all their leads with a **CSV download**
- **A monthly report is emailed automatically** on the 1st. An admin can also trigger it with `POST /api/admin/reports`.
- **Site stats for you** (`#/admin` → **Site stats**): daily visits, page views, the most-visited sections, research actions (calculator used, deals saved, photos opened, official and bank-owned sources opened), and advertiser totals, for the last 30 or 90 days or last month. **Print advertiser summary** prints a one-page audience summary to show prospective advertisers. A "visit" is one visitor on one day; nothing links a visitor across days, so there's no "unique people per month" figure. Admin and advertiser pages aren't counted.
- **Counting is privacy-preserving.**
  - Only daily totals are stored.
  - Unique visitors are counted with a salted hash that exists only in memory and changes daily.
  - Bots and rapid repeat clicks are ignored.
  - No visitor is tracked across days, and nothing identifying is stored.

**Online payments (Stripe):**
- **How it works.** An approved advertiser chooses a plan (and a topic for Mentor Connect) on their dashboard, clicks **Start advertising** and pays on Stripe's hosted Checkout page. They manage their card, receipts, plan and cancellation on Stripe's billing portal (**Manage billing**). Card details never reach this server.
- **Pricing.** Three monthly plans, priced by you in Stripe and named in `STRIPE_PLANS`, with one default for every category (`"*"`) and optional per-category prices. The browser only names a plan; the server picks the price (and any founding coupon) from the advertiser's category and record. No per-lead fees, and no plan changes anyone's place in the directory list. `GET /api/ad-plans` gives the Advertise page and the dashboard the price labels (never Stripe IDs).
- **Going live.** A listing is extended only when Stripe sends a signed `invoice.paid` webhook, through the end of the billing period plus 3 days' grace. The plan is read from the price on the invoice (falling back to the plan chosen at checkout), and the Mentor Connect topic from the subscription's metadata. Coming back from Checkout grants nothing by itself. Cancelling stops renewals; time already paid for stays live. A failed payment emails the advertiser, and their dashboard asks them to add a card.
- **Setup:**
  1. In the Stripe dashboard (start in **test mode**), create three products, **Rotating**, **Spotlight** and **Mentor Connect**, each with a **monthly recurring price** (for example $99, $199 and $249). For a category with different prices, add more prices. Copy each price ID (`price_...`).
  2. Add a webhook endpoint `https://YOUR-SITE/api/stripe/webhook` for these events: `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`. Copy its signing secret (`whsec_...`).
  3. Turn on the **customer portal** (Settings → Billing → Customer portal), allowing card updates, invoice history and cancellation. To let advertisers switch plans themselves, also allow customers to **switch plans** and add the three products, with the same prices as in `STRIPE_PLANS`. Leave **Update quantities** off: advertisers change their ad areas (the quantity) on their dashboard. If it's ever turned on, the server still follows the quantity Stripe reports and publishes only that many areas. The server follows the new price from `customer.subscription.updated`. Switches made there aren't checked against the caps: the Featured box still shows at most 2 per page view, and an advertiser who switches to Mentor Connect picks their topic on the dashboard, where the topic cap is checked.
  4. Set three environment variables (all three, or none to keep billing manual):
     ```bash
     export STRIPE_SECRET_KEY=sk_test_...        # a restricted key (rk_...) works too
     export STRIPE_WEBHOOK_SECRET=whsec_...
     export STRIPE_PLANS='{
       "*": {
         "standard":     {"priceId": "price_...", "amountLabel": "$99 / month",  "foundingCoupon": "FOUNDING_STANDARD", "foundingLabel": "$69 / month for 12 months"},
         "premium":      {"priceId": "price_...", "amountLabel": "$199 / month", "foundingCoupon": "FOUNDING_PREMIUM",  "foundingLabel": "$139 / month for 12 months"},
         "premium_plus": {"priceId": "price_...", "amountLabel": "$249 / month", "foundingCoupon": "FOUNDING_PLUS",     "foundingLabel": "$179 / month for 12 months"}
       }
     }'
     ```
     `"*"` covers every category not listed by name. Add an entry such as `"attorney": {"standard": {...}, "premium": {...}, "premium_plus": {...}}` to price a category differently; it then replaces `"*"` for that category. A plan left out isn't offered online. The older flat shape (`{"agent": {"priceId": "...", "amountLabel": "..."}}`) still works and means Rotating only. `foundingCoupon` and `foundingLabel` are optional; a `foundingLabel` needs a `foundingCoupon`, and one price can't stand for two plans. The server refuses to start if the JSON is wrong.
  5. **Founding prices.** For each plan, create a coupon in Stripe (Product catalog → Coupons → New): **Amount off** the regular price minus the founding price (for example $30, $60 and $70 for $69, $139 and $179), currency USD, **Duration: multiple months, 12**, and set its **ID** to the name in `foundingCoupon` (letters, digits, `_` and `-`). Mark founding advertisers in admin; their checkout applies the coupon automatically, and their dashboard shows the founding price. After 12 months Stripe charges the regular price.
  6. Test with Stripe's test card `4242 4242 4242 4242`, then switch to live keys (create the products, prices and coupons again in live mode, and update `STRIPE_PLANS`).
- **Free or discounted advertising (promotion codes).** To give an advertiser free months or a discount on any plan, use Stripe promotion codes; nothing changes on the server.
  1. In Stripe (test mode first), create a **Coupon** (Product catalog → Coupons → New): **Percentage off** (for example 100% for free, or 25%) and a **Duration**: once, multiple months (for example 6) or forever.
  2. On the coupon, add a **Promotion code**: the code advertisers type (for example `WELCOME6`). Optionally limit it to first-time customers or to one customer, set an expiry date, or cap the number of redemptions.
  3. Give the advertiser the code. On Stripe's payment page they choose **Add promotion code** (their dashboard reminds them). While a code covers the whole price they don't need to enter a card; Stripe asks for one before the free period ends. If none is added, the next invoice isn't paid, the listing isn't extended past the paid period, the advertiser is emailed, and their dashboard says **Add a card to keep advertising**.
  4. Each discounted payment is noted in the audit trail, and an invoice the code covered in full still extends the listing. Founding advertisers whose coupon is applied at checkout can't also enter a code (Stripe allows one or the other).
  5. Create the same coupon and code in live mode before you use them for real.
- **Payments received another way** (check, bank transfer): in admin, record the plan name, the plan (Rotating, Spotlight or Mentor Connect, with the topic for Mentor Connect), the paid-through date and the number of ad areas paid for (blank = all the areas they've chosen; they must choose at least one first). These advertisers count toward the caps like card-paying ones.

**Run it:**
```bash
npm run keys:generate                  # once: the two signing keys (rebuild the site after)
npm run -s admin:hash-password         # type a 12+ character password; copy the output
export ADMIN_USERNAME=you ADMIN_PASSWORD_HASH='scrypt$...'
export BASE_URL=https://your-site.example   # used in emails
npm run build && npm run server        # serves the site and API on :8080
```
During development, run `npm run server` and `npm run dev` together; the dev server forwards `/api` to the server. Emails are printed to the server log unless `RESEND_API_KEY` (or `POSTMARK_SERVER_TOKEN`) and `MAIL_FROM` are set (see [Email](#email-resend-or-postmark)). Data is stored in SQLite at `server/data/app.db`. Back it up.

## Content accuracy

Every fact the guides teach has to trace back to an official source, and the repo tracks what was checked and when:

| File | What it holds |
| --- | --- |
| `src/content/sources.ts` | Every outside link the site shows: who publishes it, its role (listing source, rules, lookup, help) and the date someone read it and matched it to the site (`checked`). |
| `src/content/facts.ts` | The key numbers and rules (deadlines, deposits, redemption periods, name rules), each tied to its sources, the date it was checked, and the exact text on the site that states it. |
| `src/content/reviews.json` | Every public page, the files that hold its words, and when its content was last reviewed. |
| `src/content/fingerprints.json` | The version of each watched official page (the Treasurer's auction notice and FAQ, the SID notice of sale, the Sheriff's sales and others) that was last read. |

**The tests enforce it** (`npm test`, which CI runs on every pull request):
- Every outside link on the site must be in `sources.ts`. Listing sources must be government, Fannie Mae/Freddie Mac, the bank that owns the property, or the county's named seller.
- A fact can only cite sources that have been checked. If its text on the site changes, the test fails until the fact is re-checked and updated.
- If a page's words change after its last review, the test fails. Check the changed text against its sources, then record it: `npm run content:reviewed -- <page-id>`. New pages must be added to `reviews.json`.
- If the server or deployment starts using a new outside service (email, payments, Cloudflare, maps), the privacy policy must name it.

**Commands**
- `npm run content:status`: sources never checked or checked more than 6 months ago, facts due for a re-check, and pages edited since their review.
- `npm run content:reviewed -- <page-id> ... [--note "what you checked"]`: record a review.
- `npm run content:check-sources`: fetch every source and report broken links and watched pages that changed. After re-reading a changed page and fixing the site, run it with `--update`.

**Every week** the GitHub workflow "Official sources" (`.github/workflows/sources.yml`) runs the source check and opens an issue, "Official sources need a check", when a link breaks or a watched page changes. A change to the Treasurer's pages usually means a new auction notice: read it, compare the deposit, dates, payment and name rules with the tax playbook and checklist, and update `sources.ts` and `facts.ts`. It uses about a minute of GitHub Actions time a week, well within the free allowance. Some sites block automated checks; the report lists them so you can open them yourself now and then.

## Features

**Your area.** The first-visit welcome asks "Where are you buying?": a state, then (optionally) a city or town, from every Census 2020 place in Nevada, California, Arizona and Utah (`src/data/places/`, sources in its README). A city in two counties asks which part. The choice is kept only in the browser (`src/lib/myArea.ts`), shown in the header as **Your area** (where it can be changed), and sets the state and county the site uses, for example the county on Find Deals.

**Sections**

| Page | What it does |
| --- | --- |
| Home (`#/`) | Says what the site is for (foreclosures, tax sales and short sales) and searches by **type of sale**: all sales, tax sales, foreclosure auctions, pre-foreclosures, short sales, bank-owned (REO), HOA foreclosures, sheriff and IRS sales, and liens on record (not for sale). An optional location can be added. A **buyer checklist** under the search box changes with the selected type. For sales, it lists what you need to buy (deposits, certified funds, ID, title search, deadlines). For pre-foreclosures and liens on record, it lists how to prepare in case the property goes to sale. The same checklists appear on the property search, every property page, the pre-foreclosure tracker and the short-sales guide. They are tickable and remembered per browser (`src/lib/buyerChecklists.ts`). Below are cards for agents, financing, and title, insurance and repairs. |
| Search (`#/search`) | Forced-sale search, filters, map and property pages. Shows every verified live listing (today: Clark County Treasurer tax-sale parcels, tagged "Treasurer list"), plus the fictional sample data in development builds only. Production builds show only verified listings, or a "being connected" message when there are none. |
| Live tax sales (`#/live`) | Verified Clark County Treasurer listings (signed, expiring feed). Each parcel links to its full property page. The browser loads and verifies the feed once (`src/data/live.ts`) and shares it with search, property pages and My deals; `src/feed/toProperty.ts` turns each parcel into a property record using only what the Treasurer and Assessor publish. Market value, liens, owner, map location and risk checks are left empty, and pages say "not searched" or "your comps" instead of guessing. |
| Pre-foreclosures (`#/pre-foreclosures`) | Follows Nevada non-judicial foreclosures: default, then notice of sale (at least 3 months later, NRS 107.080), then auction, then outcome. Per-browser watchlist that flags stage changes. **Do-not-contact warning; no owner names or contact details are shown.** Sample data until a data-use agreement with the Clark County Recorder is in place. |
| Short sales (`#/short-sales`) | What a short sale is, how to find one (through a licensed agent and the MLS), the steps, risks, and a comparison with auctions and bank-owned homes |
| Find & verify an agent (`#/agents`) | A license lookup for any agent or professional: it checks the number's format, reads the license type, and checks whether they're in our verified directory. One click copies the value and opens the official lookup (NRED, NMLS, NSCB, Division of Insurance, FDIC, NCUA), with what to check and red flags to watch for. Verified advertised agents are listed below. |
| Financing (`#/financing`) | Financing options explained, plus lenders filtered by type, loan product and credit situation. **We don't offer financing.** |
| Your deal team (`#/pros`) | Title and escrow, insurance, home inspectors, contractors, real estate attorneys, CPAs and property managers |
| Profiles (`#/pros/:id`) | Each advertiser's own page, with a verified-license card and a link to check it on the official lookup |
| Advertise (`#/advertise`) | What advertisers get, who can advertise, how listing works, and the application |
| How we help (`#/disclaimer`) | What the site offers, how each kind of sale works, the steps to invest, the official-sources and professional-advice statement, and a due-diligence checklist, followed by the details: what's not in scope, the disclaimer for each kind of page, and accuracy. First-time visitors see a short "Welcome" notice. Every page shows the right disclaimer and a footer link. Wording is in `src/lib/disclaimers.ts`. |
| Email alerts (`#/alerts`) | Free email sign-up, no account: confirm the address once (double opt-in), then change or stop alerts from the link in every email. One-click unsubscribe deletes the address. It offers general updates and **tracked properties**: choose ✉ Email me changes on any Live tax-sale parcel. Every 10 minutes the web server compares the signed listings feed with the last check and emails each person one message listing what changed on the parcels they track: removed from the list (paid off, withdrawn or sold) or back on it, a new auction date, minimum bid, format or place, plus reminders 10 days before (register) and the day before. Only verified data triggers email: the server checks the feed's signature with its signing key and ignores missing, tampered or expired feeds. An address that's already signed up confirms each new property from its own manage page, and a browser that opened its manage link can add properties in one click. **Saved searches:** ✉ Email me new matches on Live tax sales saves a search (Residential/Commercial from the Assessor land-use code, and an optional highest minimum bid; `src/lib/savedSearch.ts`). Once a day from 7 a.m. Las Vegas time, each person gets one digest of parcels that appeared on the verified list since their last digest and match (up to 25 per search shown), and nothing on days with no new matches. Parcels recorded on the very first check never count as new; parcels that come back on the list do. Up to 10 saved searches per address. **General updates:** the admin's **Email list** tab shows sign-up counts, writes plain-text updates with a preview and a test send, and sends to everyone who opted in (with confirmation of the recipient count, one send at a time, no repeat within 24 hours, and resume after a restart). It also exports the list as CSV. Code: `server/alerts.ts`, `server/tracker.ts`, `src/components/AlertsPage.tsx`, `src/components/TrackButton.tsx`, `src/components/SearchAlertButton.tsx`. |
| Advertiser dashboard (`#/advertiser`) | Sign in with an email link; results, daily charts, leads and CSV export |

**Search and property pages**


- **Search** by city and state (`Henderson, NV`), ZIP code, street address, APN or county, and by map area ("Search this area").
- **Filters:** "only properties I can buy now", online vs. in-person bidding, sale status, sale/lien type, auction date window, maximum minimum bid, minimum estimated spread (value minus minimum bid and likely surviving liens), property type, occupancy and redemption period.
- **Acquisition status** on every record: `ONLINE_BIDDING`, `IN_PERSON_AUCTION`, `SEALED_BID`, `BROKER_OFFER`, `COURT_CONFIRMATION_REQUIRED`, `LIEN_CERTIFICATE_ONLY`, `PRE_FORECLOSURE_NOT_YET_PURCHASABLE`, `SALE_CANCELLED_OR_POSTPONED`, `STATUS_REQUIRES_CONFIRMATION`, `NOT_FOR_SALE_LIEN_ONLY`.
- **Property page:**
  - a four-question summary
  - **Residential | Commercial:** a switch on the home page search, property search, live tax sales and bank-owned pages. Homes with 1–4 units and residential land are residential; apartments with 5+ units, retail, office, industrial, hotels and commercial land are commercial (`src/lib/propertyClass.ts`). Live tax-sale parcels are classified from the Clark County Assessor's land-use code, which the updater reads from each parcel's Assessor page (`ingest/lib/landUse.ts`). Parcels it can't classify, like public land or unknown vacant land, show under All.
  - **Commercial properties** also get a **value by income** calculator (rent, vacancy, operating costs and cap rate give net operating income and value; `src/lib/incomeValue.ts`). One click sends that value to the bid calculator. They also get the commercial checklist and the **Distressed commercial property** playbook (`#/playbooks/commercial`): environmental review, leases and estoppels, zoning, ADA and commercial/SBA financing.
  - **Business assets & closures** (`#/business-assets`): where equipment, inventory, vehicles and whole businesses are sold by official sellers only. That means the bankruptcy court (and PACER), District Court receiverships, the Sheriff, IRS and GSA auctions, and the Secretary of State and Department of Taxation for research. It explains how each sale works, assets vs. buying the company (including Nevada's successor tax rule, NRS 360.525), a checklist, and why buyers deal with the official seller, never with owners or employees (`src/lib/businessAssets.ts`).
  - **Photos & views** (for homes that are for sale): links to the seller's listing photos when there are any, Google Street View, and Clark County's aerial view, building sketch and Assessor record (`src/lib/propertyViews.ts`). Photos are linked, never copied. Pre-foreclosure homes get none of these links, because the Assessor record names the owner. The live tax-sale list has the same links on every parcel.
  - online auction terms (registration deadline, deposit, payment, start and end times, final payment, deed type, redemption, buyer premium, eligibility)
  - a liens table showing whether each lien likely survives and why
  - step-by-step purchase instructions
  - a 22-point due-diligence (title-risk) report
  - the property record and a timeline of events
  - a source tag on every fact showing agency, document number, recorded date, last-verified time and confidence
  - a printable report

## Code map

| Path | What it is |
| --- | --- |
| `src/types.ts` | Domain model (mirrors `db/schema.sql`) |
| `src/lib/rules.ts` | Nevada lien-survival rules engine + "what you're buying" |
| `src/lib/status.ts` | Acquisition-status definitions and purchase-step generator |
| `src/lib/diligence.ts` | Due-diligence report checks |
| `src/lib/search.ts` | Location parsing and filtering |
| `src/data/sampleProperties.ts` | Seeded fictional Clark County data (swap for real connectors) |
| `src/components/` | React UI (Leaflet map, results, property page) |
| `db/schema.sql` | Production PostgreSQL/PostGIS schema with per-fact provenance |
| `ingest/` | Live connectors: source registry, secure fetch, Clark tax-sale parser, cadence, anomaly quarantine, feed signing |
| `src/feed/` | Browser-side signature/expiry verification of the live feed |
| `src/components/LivePage.tsx` | Verified live listings page |
| `server/` | Advertiser API (node:http + node:sqlite): signup, admin approval and billing, leads, metrics, reports, signed directory |
| `src/lib/pros.ts` | Professional categories, regulators, listing rules, neutral rotation |
| `src/lib/proApplication.ts` | Shared signup validation and approval rules |
| `Containerfile` | Container image (UBI 9 + Node.js 22), built with Podman or Buildah |
| `deploy/podman/` | `install.sh` one-command installer, and Quadlet units (systemd services) for Podman |
| `deploy/kubernetes/` | Kustomize base and overlays for Kubernetes, OpenShift (prebuilt image) and OpenShift (build from Git) |
| `src/data/index.ts` | The one place pages get property and advertiser data; the `VITE_SHOW_SAMPLE_DATA` switch |
| `.github/workflows/ci.yml` | Tests, manifest validation, Podman image build and smoke test; publishes to GHCR from `main` |
| `tools/video/` | Scripted walkthrough videos of the site |

## Roadmap

1. **Clark County tax-deed sales.** Build a connector for the Treasurer's delinquent and auction lists.
2. **Nevada trustee, HOA and judicial sales.** Pull notices of default and sale from Recorder filings, with OCR.
3. **Federal and commercial auctions.** Add IRS/Treasury, HUD, GSA and licensed commercial feeds.
4. **More high-volume counties.** Add a jurisdiction rules module for each state.
5. **Paid features.** Due-diligence reports, ZIP and auction alerts, and investor workflow tools.

Before any source is ingested automatically, review its terms of use, robots rules and state public-records law (tracked in `data_source.terms_reviewed_at`). A real-estate attorney should review the lien-survival rules and the disclaimers.
