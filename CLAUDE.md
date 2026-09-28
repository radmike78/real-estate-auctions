# Project rules

- **Containers: Podman only. Never use Docker** (no Dockerfile, docker-compose, Docker CLI or Docker Desktop). Build with Podman or Buildah from `Containerfile`. Run with Podman, or on Kubernetes/OpenShift (`deploy/kubernetes`).
- Deployment instructions live in `README.md` (Deploy). Keep them and their prerequisites current whenever the Containerfile, `deploy/` or runtime settings change.
- The site is free for buyers and investors. Don't add paywalls or explain how the site is funded on public pages.
- Never contact, or help anyone contact, homeowners in pre-foreclosure. No owner names, Assessor-record or picture links for homes that aren't for sale.
- Listings come only from verified direct sources: government agencies, Fannie Mae/Freddie Mac, or the bank or credit union that owns the property. Never auction marketplaces or aggregators. Research and due-diligence tools (Street View, county maps, license lookups) may link elsewhere, but never as a listing source.
- Business closures: link only official sellers (courts, court-appointed trustees and receivers, the sheriff, government agencies). Never help anyone pressure or solicit owners, employees or customers of a struggling business; point buyers to the official seller.
- Empty pages and lists: show the owl (`EmptyState` or `OwlNote`) with a clear message near the top, never a small line at the bottom. Features that need a service the owner hasn't set up yet (email, Stripe, etc.) show "Coming soon" instead of a form that can't work (`src/lib/siteFeatures.ts`).
