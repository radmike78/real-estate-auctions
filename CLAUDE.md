# Project rules

- **Containers: Podman only. Never use Docker** (no Dockerfile, docker-compose, Docker CLI or Docker Desktop). Build with Podman or Buildah from `Containerfile`. Run with Podman, or on Kubernetes/OpenShift (`deploy/kubernetes`).
- Deployment instructions live in `README.md` (Deploy). Keep them and their prerequisites current whenever the Containerfile, `deploy/` or runtime settings change.
- The site is free for buyers and investors. Don't add paywalls or explain how the site is funded on public pages.
- Never contact, or help anyone contact, homeowners in pre-foreclosure.
