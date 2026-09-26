# Forced-Sale Finder

A distressed-property and forced-sale discovery platform. It finds properties that are actually heading to a forced sale (tax-deed, trustee, HOA, sheriff, judicial, IRS or REO), not just properties with liens. It then answers four questions for each one:

1. **Is it actually heading to sale?** A lien alone never makes a property "buyable". There must be a recorded enforcement event.
2. **What exactly would I be buying?** For example, a tax deed, a trustee's deed, a sheriff's certificate with redemption rights, or only a lien certificate.
3. **What liens and risks may remain?** The Nevada rules engine estimates which liens likely survive the sale.
4. **What must I do next?** The site shows online bidding details or step-by-step in-person instructions, and always links to the official sale.

> **Status:** search results use fictional sample data for Clark County, NV. The **Live tax sales** page shows only verified listings from the Clark County Treasurer connector (see [Live data](#live-data)).
> Nothing here is legal advice or a title determination. The site never claims title is "clear" and never takes bids or money.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # rules engine, search, connector, freshness and security tests
npm run build      # static site in dist/
```

To put the site online, see [Deploy](#deploy): Podman, any Kubernetes distribution, or OpenShift.

Development builds show fictional Clark County sample properties and professionals so every page can be tried. Production builds hide them: build with `VITE_SHOW_SAMPLE_DATA=0 npm run build` (the container image does this by default), and pages without a connected source say so instead of showing listings.


## Deploy

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
| `BASE_URL` | no | yes | The web address people use, like `https://forcedsalefinder.com`. Used in emails and for secure cookies. |
| `ADMIN_USERNAME` | no | yes | Admin sign-in name for `/#/admin`. |
| `ADMIN_PASSWORD_HASH` | **yes** | yes | Hash of the admin password (never the password itself). Created in step 3 below. |
| `FEED_SIGNING_KEY` | **yes** | yes | Private signing key (PEM) for the listings and directory feeds. Created in step 2 below. |
| `POSTMARK_SERVER_TOKEN` | **yes** | for a real site | Sends email through Postmark. Set it together with `MAIL_FROM`. See [Email](#email-postmark). |
| `MAIL_FROM` | no | with the token | Sender address verified in Postmark, like `Forced-Sale Finder <no-reply@your-domain>`. |
| `MAIL_REPLY_TO`, `POSTMARK_MESSAGE_STREAM` | no | no | Where replies go (default: `MAIL_FROM`), and the Postmark stream (default `outbound`). |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PLANS` | **yes** | no | Online card payments for advertisers: set all three or none. See [Online payments](#advertisers-signup-verification-billing-server). |
| `TRUST_PROXY` | no | no | `1` when a reverse proxy, Ingress or OpenShift router sits in front (it is in every option below). |
| `TRUST_CLOUDFLARE` | no | with Cloudflare | `1` when your domain is proxied through Cloudflare, so each visitor's own address is used for spam limits. See [Cloudflare](#cloudflare-recommended). |
| `BACKUP_KEEP` | no | no | Daily database backups to keep (default 7). `BACKUP_DIR=""` turns them off. |
| `PORT`, `DB_PATH`, `DATA_DIR`, `INGEST_STATE_DIR`, `BACKUP_DIR` | no | no | Already set correctly in the image. |

**Build options** (passed to `podman build` with `--build-arg`):

| Name | Default | What it does |
| --- | --- | --- |
| `FEED_PUBLIC_KEY` | empty | Public signing key built into the site (see step 2 below). Without it, live listings and the advertiser directory stay off. |
| `SHOW_SAMPLE_DATA` | `0` | `1` shows the fictional sample properties and professionals, for a demo site. Leave it at `0` for a real site. |
| `RUN_TESTS` | `1` | `0` skips the test suite during the build (not recommended). |

> **Emails:** without `POSTMARK_SERVER_TOKEN` and `MAIL_FROM`, confirmation links, sign-in links, leads and reports are only written to the web container's log, and the log says `WARNING: email is OFF`. Set up [Email](#email-postmark) before real visitors arrive.

### Cloudflare (recommended)

Put [Cloudflare](https://www.cloudflare.com)'s free plan in front of any option below. It speeds up the site worldwide, caches the site's static files, and absorbs attacks. The site needs no other changes.

**Prerequisites:** a free Cloudflare account, and your domain added to Cloudflare, with the domain's nameservers changed to Cloudflare's at your registrar. Or buy the domain from Cloudflare.

**Set it up**
1. **DNS:** add an `A` record for your domain (and `www` if you use it) pointing at your server or load balancer. Leave it **DNS only** (grey cloud) for now.
2. **Deploy** with any option below, and check the site works on `https://`. With the Podman option, Caddy gets its certificate in this step.
3. **Proxy on:** switch the DNS record to **Proxied** (orange cloud).
4. **SSL/TLS → Overview → Full (strict).** Never use "Flexible": it sends traffic between Cloudflare and your server unencrypted, and loops forever with the site's own HTTPS redirect.
5. **Tell the site:** set `TRUST_CLOUDFLARE=1` (Podman: in `forced-sale-finder.env`; Kubernetes/OpenShift: in `deploy/kubernetes/base/config.env`), keep `TRUST_PROXY=1`, and restart. Without it, every visitor looks like a Cloudflare server, so spam limits would lump everyone together.
6. **Optional:** allow ports 80/443 only from [Cloudflare's addresses](https://www.cloudflare.com/ips/) in your server's or cloud provider's firewall, so nobody can reach the server without going through Cloudflare.

Cloudflare's default caching is right for this site: it caches the scripts, styles, fonts and images (their names change with every release) and passes pages, API calls and the signed listing feeds straight through. You don't need page rules or a cache-everything setting.

### Email (Postmark)

The site sends plain-text transactional email only: advertiser confirmation and sign-in links, approval and payment notices, leads to advertisers with receipts to buyers, and monthly reports. Open and link tracking are turned off on every message. Postmark stops sending to addresses that bounced or marked mail as spam.

**Prerequisites**
- A [Postmark](https://postmarkapp.com) account (the free developer plan sends 100 emails a month; paid plans start at 10,000).
- Access to your domain's DNS, to verify it.

**Set it up**
1. In Postmark, create a **Server** (for example "Forced-Sale Finder"). Its default **Transactional** stream is `outbound`, which the site uses.
2. **Sender Signatures → Add Domain:** add your domain and create the **DKIM** and **Return-Path** DNS records Postmark shows. Wait until both show as verified.
3. **Request account approval** (Postmark asks a few questions about what you send). Until it's approved, Postmark only delivers to addresses at your own domain.
4. Copy the **Server API token** (your server → **API Tokens**). It's a secret: store it only as shown below, never in Git or chat.
5. Give the site the token and your sender address:
   - **Podman:** `deploy/podman/install.sh` asks for both. To add them later:
     ```bash
     printf '%s' 'YOUR-TOKEN' | podman secret create fsf-postmark-token -
     ```
     Then add `MAIL_FROM=Forced-Sale Finder <no-reply@your-domain>` to `forced-sale-finder.env` in the Quadlet folder. Also uncomment the `Secret=fsf-postmark-token` line in `forced-sale-finder-web.container`, then run `systemctl daemon-reload` and restart `forced-sale-finder-web`. With `--no-systemd`, run `install.sh` again and enter the token and address when it asks.
   - **Kubernetes / OpenShift:** add `--from-literal=POSTMARK_SERVER_TOKEN=...` when you create `forced-sale-finder-secrets`, and uncomment `MAIL_FROM` in `deploy/kubernetes/base/config.env`. To add the token to an existing Secret:
     ```bash
     read -rs -p "Postmark Server API token: " PM; echo
     kubectl patch secret forced-sale-finder-secrets -n forced-sale-finder --type merge \
       -p "{\"stringData\":{\"POSTMARK_SERVER_TOKEN\":\"$PM\"}}"
     unset PM
     ```
     Then `kubectl apply -k ...` and `kubectl rollout restart deployment/forced-sale-finder -n forced-sale-finder`. On OpenShift, use `oc` instead of `kubectl`.
6. **Check:** the web log should say `Email on: sending through Postmark as ...`. Then apply to advertise with your own address, and look for the email in Postmark's **Activity** tab.
   - To try it without sending anything, use the token `POSTMARK_API_TEST`. Postmark accepts the message but delivers nothing.

If Postmark can't be reached, the site retries once. When an email still fails, the log names the reason (without the message text). Advertisers who apply are asked to try again in a few minutes. Leads are always saved and shown on the advertiser's dashboard, even if the email doesn't go out.


### Before you start (every option)

**1. Get the code**
```bash
git clone https://github.com/radmike78/real-estate-auctions.git
cd real-estate-auctions
```

**2. Create the signing key** (once, with OpenSSL). The site signs its listings and directory; browsers check the signature with the public key built into the image.
```bash
openssl genpkey -algorithm ed25519 -out feed-signing.pem
openssl pkey -in feed-signing.pem -pubout -outform DER | base64 | tr -d '\n' > feed-public-key.txt
```
- `feed-signing.pem` is the **private key**. Keep it secret and back it up. It goes into a secret, never into Git.
- `feed-public-key.txt` is the **public key**. It's safe to share and is passed to the image build as `FEED_PUBLIC_KEY`.
- If you lose the private key, create a new pair and rebuild the image.

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
  - RHEL, Rocky or AlmaLinux 9, Fedora 40+, Ubuntu 24.04 or Debian 12;
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
  - `docker.io`, only for the optional Caddy HTTPS image, which Podman pulls from Docker Hub's registry;
  - the county sites, `api.postmarkapp.com` (email) and Stripe while running.
- **Mac or Windows** (for trying it out): install [Podman Desktop](https://podman-desktop.io) or run `podman machine init && podman machine start`, then use `--no-systemd` below.

**Install (one command)**
```bash
deploy/podman/install.sh
```
It asks for the web address, an admin username, an admin password and, optionally, your Postmark token and sender address ([Email](#email-postmark); you can add them later). Then it does everything else:
1. creates the signing key in `~/.config/forced-sale-finder/` (step 2 above);
2. builds the image and runs the tests;
3. stores the password hash and signing key as Podman secrets;
4. installs systemd services with Quadlet: `forced-sale-finder-web`, `forced-sale-finder-ingest` and, optionally, `forced-sale-finder-caddy` for automatic HTTPS;
5. starts them and checks `/healthz`.

- Run it as **root** for a system-wide install (units go in `/etc/containers/systemd/`), or as a **normal user** for a rootless install (`~/.config/containers/systemd/`).
- For a rootless install with Caddy, allow ports 80/443 once: `echo 'net.ipv4.ip_unprivileged_port_start=80' | sudo tee /etc/sysctl.d/99-unprivileged-ports.conf && sudo sysctl --system`.
- Quick try-out without systemd (also on Mac or Windows): `deploy/podman/install.sh --no-systemd`, then open http://localhost:8080.

**Install step by step (what the script does)**
```bash
# Build (on RHEL-family hosts, add --pull=newer to refresh the base images)
podman build -t localhost/forced-sale-finder:latest \
  --build-arg FEED_PUBLIC_KEY="$(cat feed-public-key.txt)" -f Containerfile .

# Secrets (step 3 above creates admin-password-hash.txt)
podman secret create fsf-admin-password-hash admin-password-hash.txt
podman secret create fsf-feed-signing-key feed-signing.pem
printf '%s' 'YOUR-POSTMARK-TOKEN' | podman secret create fsf-postmark-token -   # email; see Email (Postmark)

# systemd services via Quadlet (rootless: use ~/.config/containers/systemd and systemctl --user)
sudo mkdir -p /etc/containers/systemd
sudo cp deploy/podman/quadlet/forced-sale-finder.{env,volume} \
        deploy/podman/quadlet/forced-sale-finder-{web,ingest}.container /etc/containers/systemd/
sudo nano /etc/containers/systemd/forced-sale-finder.env      # set BASE_URL, ADMIN_USERNAME and MAIL_FROM
sudo sed -i 's|^#Secret=fsf-postmark-token|Secret=fsf-postmark-token|' /etc/containers/systemd/forced-sale-finder-web.container
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
| Update to the latest code | `git pull && deploy/podman/install.sh --update` |
| Change settings | edit `forced-sale-finder.env` in the Quadlet folder, then `sudo systemctl restart forced-sale-finder-web` |
| Copy backups off the server | `sudo podman run --rm -v forced-sale-finder-data:/data:ro -v "$PWD":/out:Z localhost/forced-sale-finder:latest sh -c 'cp /data/backups/*.db /out/'` |
| Restore a backup | stop the web service, copy the backup over `/data/db/app.db` (and delete `app.db-wal`/`app.db-shm`) with a similar `podman run`, then start it |
| Uninstall | stop the services, delete the `forced-sale-finder*` files from the Quadlet folder, `systemctl daemon-reload`, then `podman volume rm forced-sale-finder-data` (**deletes all data**) |

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
- At least 0.2 CPU and 512 MB of memory free on a node, plus 2 GB of storage.

**Steps**
1. **Image.**
   - **(a)** Use `ghcr.io/radmike78/real-estate-auctions:latest`. Set the repository variable `FEED_PUBLIC_KEY` to the contents of `feed-public-key.txt` *before* CI builds it.
   - **(b)** Build and push your own:
     ```bash
     podman build -t quay.io/<you>/forced-sale-finder:1.0 --build-arg FEED_PUBLIC_KEY="$(cat feed-public-key.txt)" -f Containerfile .
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
4. **Secret.** Add the Postmark token for email ([Email](#email-postmark)). Add the three `STRIPE_*` values only if you use online payments:
   ```bash
   read -rs -p "Postmark Server API token: " PM; echo
   kubectl create secret generic forced-sale-finder-secrets -n forced-sale-finder \
     --from-file=ADMIN_PASSWORD_HASH=admin-password-hash.txt \
     --from-file=FEED_SIGNING_KEY=feed-signing.pem \
     --from-literal=POSTMARK_SERVER_TOKEN="$PM"
   unset PM
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

The Secret is created as part of each option below:
```bash
read -rs -p "Postmark Server API token: " PM; echo
oc create secret generic forced-sale-finder-secrets \
  --from-file=ADMIN_PASSWORD_HASH=admin-password-hash.txt \
  --from-file=FEED_SIGNING_KEY=feed-signing.pem \
  --from-literal=POSTMARK_SERVER_TOKEN="$PM"
unset PM
# Optional online payments: add --from-literal=STRIPE_SECRET_KEY=... (all three STRIPE_* values)
```

**Option A: prebuilt image**
1. Set the image in `deploy/kubernetes/overlays/openshift/kustomization.yaml` (`images:`). For a private registry, add a pull secret:
   ```bash
   oc create secret docker-registry regcred --docker-server=... --docker-username=... --docker-password=...
   oc secrets link default regcred --for=pull
   ```
2. Make the password hash (step 3 of [Before you start](#before-you-start-every-option)) and create the Secret (above).
3. `oc apply -k deploy/kubernetes/overlays/openshift`
4. `oc rollout status deployment/forced-sale-finder`, then `oc get route forced-sale-finder` to get the HTTPS address.

**Option B: build inside OpenShift from Git (no registry needed)**
1. In `deploy/kubernetes/overlays/openshift-build/buildconfig.yaml`:
   - paste the contents of `feed-public-key.txt` into `FEED_PUBLIC_KEY`;
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
5. Make the password hash with the image you just built, then create the Secret:
   ```bash
   read -rs -p "Admin password (12+ characters): " PW; echo
   printf '%s\n' "$PW" | oc run fsf-hash --rm -i --quiet --restart=Never --image=forced-sale-finder:latest \
     --command -- node --import tsx server/hash-password.ts 2>/dev/null | tr -d '\n' > admin-password-hash.txt
   unset PW
   oc create secret generic forced-sale-finder-secrets \
     --from-file=ADMIN_PASSWORD_HASH=admin-password-hash.txt --from-file=FEED_SIGNING_KEY=feed-signing.pem
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
- Add the repository **variable** `FEED_PUBLIC_KEY` (Settings > Secrets and variables > Actions > Variables) with the contents of `feed-public-key.txt`.
- The first push creates the package in GitHub under Packages. Either make it public, or give your cluster a pull secret (shown above).

Then roll out new versions:
- **Podman:** `deploy/podman/install.sh --update`.
- **Kubernetes or OpenShift A:** `kubectl` or `oc rollout restart deployment/forced-sale-finder`.
- **OpenShift B:** rolls out automatically after each build.

For GitOps, point [Argo CD / OpenShift GitOps](https://argo-cd.readthedocs.io/) at `deploy/kubernetes/overlays/<option>`. The cluster then follows whatever is merged, and every change can be rolled back from Git.

### Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| Web container exits with "Set ADMIN_USERNAME and ADMIN_PASSWORD_HASH" | The secret or settings are missing. Check that the Secret has `ADMIN_PASSWORD_HASH` and `config.env` has `ADMIN_USERNAME`. |
| Pod stuck in `Pending` | No default StorageClass, or not enough resources. Run `kubectl describe pod ...` and look at Events. |
| `ImagePullBackOff` | Wrong image name, or a private registry without a pull secret. See step 1 of your option. |
| `CrashLoopBackOff` with "permission denied" on `/data` | Plain Kubernetes: keep the `fsGroup: 1001` patch in the Kubernetes overlay. OpenShift handles this automatically. |
| Live tax sales says "didn't pass our security checks" | The image was built with a different public key than the private key in the secret. Rebuild with the matching `feed-public-key.txt`. |
| Live tax sales is always empty | Expected until the Treasurer schedules an auction, and until `termsReviewedAt` is set in `ingest/sources/registry.ts` (see [Live data](#live-data)). |
| Behind Cloudflare, spam limits ("Too many ... from this network") hit many people at once | Set `TRUST_CLOUDFLARE=1` ([Cloudflare](#cloudflare-recommended)). |
| `ERR_TOO_MANY_REDIRECTS` behind Cloudflare | Cloudflare SSL mode is "Flexible". Set it to **Full (strict)**. |
| Log says `WARNING: email is OFF` | Set `POSTMARK_SERVER_TOKEN` and `MAIL_FROM` ([Email](#email-postmark)). |
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

1. **Record the terms-of-use review.** Review the county sites' terms of use, then set `termsReviewedAt` in `ingest/sources/registry.ts`. Scheduled runs don't fetch until this is set. On 2026-09-24:
   - `www.clarkcountynv.gov/robots.txt` allows all automated access.
   - `treasurer.clarkcountynv.gov` has no `robots.txt`.
   - No site terms prohibiting automated access were found.
2. **Check the pipeline without saving anything:**
   ```bash
   npm run ingest -- --dry-run
   ```
   This verifies the sites' identity, then fetches, parses and cross-checks the data. To test offline from saved responses, run `npm run ingest -- --from-dir ingest/fixtures/clark-2026-05`.
3. **Create the signing key:**
   ```bash
   npm run keys:generate
   ```
   This writes the private key to `ingest/.keys/` (gitignored) and the public key into the site. Rebuild the site afterwards.
4. **Run it:**
   ```bash
   npm run ingest -- --watch
   ```
   This long-running service checks each source when it is due and writes the signed feed to `public/data/`. Deploy that folder alongside the built site.

### How it stays current

- **Learns the real update rate.** It watches when the official list actually changes and checks about 4 times per update interval. For the Treasurer's daily list, that starts at every 6 hours.
- **Speeds up near the sale.** It checks hourly in the last 3 days before the auction, and every 15 minutes on the final day.
- **Removes parcels right away.** A parcel is withdrawn as soon as the Treasurer lines it out, it sells, or it drops off the list.
- **Hides anything not re-checked recently.** If the county site is down or the service stops, listings disappear from the site instead of going stale.

## Advertisers: signup, verification, billing (server)

Real estate agents, loan officers, mortgage companies, banks, credit unions, hard-money and private lenders, title and escrow companies, insurance agents and contractors can advertise. Each gets a dedicated profile page (`#/pros/:id`). Profiles appear in:
- **Find an agent** (`#/agents`)
- **Financing** (`#/financing`), filterable by loan type and credit situation
- **Title, insurance & repairs** (`#/pros`)

The advertiser landing page is `#/advertise`, the application form is `#/advertise/apply`, and the admin review is at `#/admin`.

**How a profile goes live** (the server enforces every step):
1. **Apply.** One form for every category, with category-specific rules: license format, the services or loan types offered, and credit situations (lenders only). All text is plain text only. Anti-spam: a hidden honeypot field and 5 applications per network per hour.
2. **Confirm email.** A single-use link, valid for 48 hours.
3. **Verify.** An admin checks the license on the official lookup for that category:

   | Category | Official lookup |
   | --- | --- |
   | Agents | NRED |
   | Loan officers, mortgage companies, private lenders | NMLS Consumer Access |
   | Banks | FDIC BankFind |
   | Credit unions | NCUA |
   | Title and insurance | Nevada Division of Insurance |
   | Contractors | Nevada State Contractors Board |

   The admin then **confirms identity through the company, using contact details from the regulator or the company, never from the application**. Approval is blocked until status, expiration (where licenses expire), name, type, company and identity are all recorded.
4. **Pay.** Once approved, the advertiser gets an email and pays **by card from their dashboard** (Stripe; see below). Each confirmed monthly payment extends their paid-through date automatically. For payments received another way, the admin records the plan and paid-through date by hand. A profile is live only while it is verified within the last 90 days **and** paid through today.
5. **Publish.** Live profiles go into `public/data/pros.json`, an Ed25519-signed file that expires after 24 hours and is republished hourly. The browser verifies it and re-checks every listing rule.

**Fair placement.** Results are filtered by what the user needs, then shown in a daily rotating order that is the same for everyone. Payment never buys a higher position. The CFPB's 2023 RESPA advisory opinion says steering consumers based on payments violates RESPA section 8 for real estate and mortgage services. Every profile is labeled "Advertisement."

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
- **How it works.** An approved advertiser clicks **Start advertising** on their dashboard and pays on Stripe's hosted Checkout page. They manage their card, receipts and cancellation on Stripe's billing portal (**Manage billing**). Card details never reach this server.
- **Pricing.** One flat monthly price per category, the same for everyone in it (no per-lead fees and no paid placement). You set the prices; the server picks the price from the advertiser's category.
- **Going live.** A listing is extended only when Stripe sends a signed `invoice.paid` webhook, through the end of the billing period plus 3 days' grace. Coming back from Checkout grants nothing by itself. Cancelling stops renewals; time already paid for stays live. A failed payment emails the advertiser.
- **Setup:**
  1. In the Stripe dashboard (start in **test mode**), create a product for each category you'll sell, each with a **monthly recurring price**. Copy each price ID (`price_...`).
  2. Add a webhook endpoint `https://YOUR-SITE/api/stripe/webhook` for these events: `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`. Copy its signing secret (`whsec_...`).
  3. Turn on the **customer portal** (Settings → Billing → Customer portal), allowing card updates, invoice history and cancellation.
  4. Set three environment variables (all three, or none to keep billing manual):
     ```bash
     export STRIPE_SECRET_KEY=sk_test_...        # a restricted key (rk_...) works too
     export STRIPE_WEBHOOK_SECRET=whsec_...
     export STRIPE_PLANS='{"agent":{"priceId":"price_...","amountLabel":"$199 / month"},"loan_officer":{"priceId":"price_...","amountLabel":"$199 / month"}}'
     ```
     Categories left out of `STRIPE_PLANS` are billed by hand.
  5. Test with Stripe's test card `4242 4242 4242 4242`, then switch to live keys.

**Run it:**
```bash
npm run keys:generate                  # once: signing key (rebuild the site after)
npm run -s admin:hash-password         # type a 12+ character password; copy the output
export ADMIN_USERNAME=you ADMIN_PASSWORD_HASH='scrypt$...'
export BASE_URL=https://your-site.example   # used in emails
npm run build && npm run server        # serves the site and API on :8080
```
During development, run `npm run server` and `npm run dev` together; the dev server forwards `/api` to the server. Emails are printed to the server log unless `POSTMARK_SERVER_TOKEN` and `MAIL_FROM` are set (see [Email](#email-postmark)). Data is stored in SQLite at `server/data/app.db`. Back it up.

## Features

**Sections**

| Page | What it does |
| --- | --- |
| Home (`#/`) | Says what the site is for (foreclosures, tax sales and short sales) and searches by **type of sale**: all sales, tax sales, foreclosure auctions, pre-foreclosures, short sales, bank-owned (REO), HOA foreclosures, sheriff and IRS sales, and liens on record (not for sale). An optional location can be added. A **buyer checklist** under the search box changes with the selected type. For sales, it lists what you need to buy (deposits, certified funds, ID, title search, deadlines). For pre-foreclosures and liens on record, it lists how to prepare in case the property goes to sale. The same checklists appear on the property search, every property page, the pre-foreclosure tracker and the short-sales guide. They are tickable and remembered per browser (`src/lib/buyerChecklists.ts`). Below are cards for agents, financing, and title, insurance and repairs. |
| Search (`#/search`) | Forced-sale search, filters, map and property pages (sample data) |
| Live tax sales (`#/live`) | Verified Clark County Treasurer listings (signed, expiring feed) |
| Pre-foreclosures (`#/pre-foreclosures`) | Follows Nevada non-judicial foreclosures: default, then notice of sale (at least 3 months later, NRS 107.080), then auction, then outcome. Per-browser watchlist that flags stage changes. **Do-not-contact warning; no owner names or contact details are shown.** Sample data until a data-use agreement with the Clark County Recorder is in place. |
| Short sales (`#/short-sales`) | What a short sale is, how to find one (through a licensed agent and the MLS), the steps, risks, and a comparison with auctions and bank-owned homes |
| Find & verify an agent (`#/agents`) | A license lookup for any agent or professional: it checks the number's format, reads the license type, and checks whether they're in our verified directory. One click copies the value and opens the official lookup (NRED, NMLS, NSCB, Division of Insurance, FDIC, NCUA), with what to check and red flags to watch for. Verified advertised agents are listed below. |
| Financing (`#/financing`) | Financing options explained, plus lenders filtered by type, loan product and credit situation. **We don't offer financing.** |
| Title, insurance & repairs (`#/pros`) | Title and escrow, insurance, and licensed contractors |
| Profiles (`#/pros/:id`) | Each advertiser's own page, with a verified-license card and a link to check it on the official lookup |
| Advertise (`#/advertise`) | What advertisers get, who can advertise, how listing works, and the application |
| Our role (`#/disclaimer`) | What the site does and doesn't do, the disclaimer for each kind of page, and a buyer due-diligence checklist. First-time visitors see a short "Before you start" notice. Every page shows the right disclaimer and a footer link. Wording is in `src/lib/disclaimers.ts`; have a Nevada attorney review it before launch. |
| Advertiser dashboard (`#/advertiser`) | Sign in with an email link; results, daily charts, leads and CSV export |

**Search and property pages**


- **Search** by city and state (`Henderson, NV`), ZIP code, street address, APN or county, and by map area ("Search this area").
- **Filters:** "only properties I can buy now", online vs. in-person bidding, sale status, sale/lien type, auction date window, maximum minimum bid, minimum estimated equity, property type, occupancy and redemption period.
- **Acquisition status** on every record: `ONLINE_BIDDING`, `IN_PERSON_AUCTION`, `SEALED_BID`, `BROKER_OFFER`, `COURT_CONFIRMATION_REQUIRED`, `LIEN_CERTIFICATE_ONLY`, `PRE_FORECLOSURE_NOT_YET_PURCHASABLE`, `SALE_CANCELLED_OR_POSTPONED`, `STATUS_REQUIRES_CONFIRMATION`, `NOT_FOR_SALE_LIEN_ONLY`.
- **Property page:**
  - a four-question summary
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
