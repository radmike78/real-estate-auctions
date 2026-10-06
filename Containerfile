# DeedOwl container image. Build it with Podman or Buildah (no Docker needed):
#
#   podman build -t localhost/forced-sale-finder:latest \
#     --build-arg FEED_PUBLIC_KEY="$(cat feed-public-key.txt)" \
#     --build-arg DIRECTORY_PUBLIC_KEY="$(cat directory-public-key.txt)" -f Containerfile .
#
# One image runs both parts of the site:
#   default command                       web server + API on port 8080
#   node --import tsx ingest/run.ts --watch   listings updater (checks official sources, signs the feed)
#
# Everything the app writes goes under /data (mount a volume there). The image runs as a non-root
# user and works with OpenShift's random user IDs: /data belongs to group 0 and is group-writable.

# Red Hat UBI 9 images with Node.js 22 (Node 22.13+ is needed for the built-in SQLite module).
ARG BUILDER_IMAGE=registry.access.redhat.com/ubi9/nodejs-22:latest
ARG RUNTIME_IMAGE=registry.access.redhat.com/ubi9/nodejs-22-minimal:latest

# ---------- build: install, test, build the site ----------
FROM ${BUILDER_IMAGE} AS build
USER 0
WORKDIR /build
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
# Public halves of the two signing key pairs, compiled into the site so browsers can verify the feeds:
# FEED_PUBLIC_KEY for listings, DIRECTORY_PUBLIC_KEY for the advertiser directory. Leave one empty to
# build without it (that feed then stays off).
ARG FEED_PUBLIC_KEY=""
ARG DIRECTORY_PUBLIC_KEY=""
# Fictional sample properties and professionals are hidden in production images. Set to 1 for a demo site.
ARG SHOW_SAMPLE_DATA=0
# The public web address, for the canonical links and sitemap search engines read (scripts/prerender.ts).
ARG SITE_URL=https://deedowl.com
# Set RUN_TESTS=0 to skip the test suite (not recommended).
ARG RUN_TESTS=1
RUN if [ "$RUN_TESTS" = "1" ]; then npm test; fi \
 && VITE_FEED_PUBLIC_KEY="$FEED_PUBLIC_KEY" VITE_DIRECTORY_PUBLIC_KEY="$DIRECTORY_PUBLIC_KEY" VITE_SHOW_SAMPLE_DATA="$SHOW_SAMPLE_DATA" SITE_URL="$SITE_URL" npm run build \
 && npm prune --omit=dev --no-audit --no-fund

# ---------- runtime ----------
FROM ${RUNTIME_IMAGE}
# The web server reads the signed listings (for email alerts) with the public listings key.
ARG FEED_PUBLIC_KEY=""
USER 0
WORKDIR /opt/app-root/src
COPY --from=build /build/package.json ./
COPY --from=build /build/node_modules ./node_modules
COPY --from=build /build/dist ./dist
COPY --from=build /build/server ./server
COPY --from=build /build/ingest ./ingest
COPY --from=build /build/src ./src
RUN mkdir -p /data \
 && chown -R 1001:0 /data \
 && chmod -R g=u /data

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8080 \
    DB_PATH=/data/db/app.db \
    DATA_DIR=/data/feeds \
    INGEST_STATE_DIR=/data/ingest-state \
    BACKUP_DIR=/data/backups \
    DIST_DIR=/opt/app-root/src/dist \
    NODE_OPTIONS=--no-warnings=ExperimentalWarning \
    FEED_PUBLIC_KEY=${FEED_PUBLIC_KEY}

VOLUME ["/data"]
EXPOSE 8080
USER 1001

LABEL org.opencontainers.image.title="DeedOwl" \
      org.opencontainers.image.description="DeedOwl: forced-sale real estate education for Nevada, California, Arizona, Utah and Texas: web server, API and listings updater" \
      org.opencontainers.image.source="https://github.com/radmike78/real-estate-auctions" \
      io.k8s.display-name="DeedOwl" \
      io.openshift.expose-services="8080:http"

CMD ["node", "--import", "tsx", "server/index.ts"]
