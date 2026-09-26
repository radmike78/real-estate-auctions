# Project rules

- **Containers: Podman only. Never use Docker** (no Dockerfile, docker-compose, Docker CLI or Docker Desktop). Build with Podman or Buildah from `Containerfile`. Run with Podman, or on Kubernetes/OpenShift (`deploy/kubernetes`).
- Deployment instructions live in `README.md` (Deploy). Keep them and their prerequisites current whenever the Containerfile, `deploy/` or runtime settings change.
- The site is free for buyers and investors. Don't add paywalls or explain how the site is funded on public pages.
- Never contact, or help anyone contact, homeowners in pre-foreclosure. No owner names, Assessor-record or picture links for homes that aren't for sale.
- Listings come only from verified direct sources: government agencies, Fannie Mae/Freddie Mac, or the bank or credit union that owns the property. Never auction marketplaces or aggregators. Research and due-diligence tools (Street View, county maps, license lookups) may link elsewhere, but never as a listing source.
