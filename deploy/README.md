# Self-hosting this fork on a Hostinger VPS (GHCR image)

This deploys the fork with its custom sales features. The image is built by
GitHub Actions and pushed to GitHub Container Registry (GHCR); the VPS only
pulls and runs it. No building on the server.

## 0. Prerequisites

- A **Hostinger VPS** (KVM 2 / 8 GB is enough since the VPS only runs the image;
  KVM 4 gives headroom), **Ubuntu 24.04**, with **Docker** installed (Hostinger
  has a Docker OS template).
- A **domain or subdomain** (e.g. `crm.your-domain.com`).
- Ports **80** and **443** open in the VPS firewall.

## 1. Build the image (once, and on every change)

The workflow `.github/workflows/build-fork-image.yml` runs automatically on push
to `main`, or manually from the repo's **Actions** tab (**Build fork image
(GHCR)** → **Run workflow**). When it finishes, the image exists at:

```
ghcr.io/melon-1999/twenty:latest
```

### Make the image pullable from the VPS

By default GHCR packages are **private**. Pick one:

- **Make it public** (simplest): GitHub → your profile → **Packages** → `twenty`
  → **Package settings** → **Change visibility** → Public. The VPS then pulls
  with no login.
- **Keep it private**: create a Personal Access Token (classic) with
  `read:packages`, then on the VPS:
  ```bash
  echo <TOKEN> | docker login ghcr.io -u melon-1999 --password-stdin
  ```

## 2. Point DNS at the VPS

In Hostinger hPanel → **DNS**: add an **A record** for `crm` (or your subdomain)
→ the VPS IP. Wait for it to resolve (`dig +short crm.your-domain.com`).

## 3. Configure and start on the VPS

```bash
# copy just the deploy folder (or clone the repo and cd into deploy/)
git clone https://github.com/melon-1999/twenty.git
cd twenty/deploy

cp .env.example .env
# edit .env: set DOMAIN, SERVER_URL, APP_SECRET, PG_DATABASE_PASSWORD
#   openssl rand -base64 32   # APP_SECRET
#   openssl rand -base64 24   # PG_DATABASE_PASSWORD
nano .env

docker compose -f docker-compose.prod.yml up -d
```

- The **server** runs DB migrations automatically on first start.
- **Caddy** fetches a Let's Encrypt certificate for `DOMAIN` and serves HTTPS.
- Open `https://crm.your-domain.com` and create your workspace + admin account
  (there is no seeded/prefilled login in production).

Check status / logs:
```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f server
```

## 4. Updating to a new build

After a new image is built (push to `main` or manual run):
```bash
cd twenty/deploy
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```
Migrations for new fields run automatically on server start.

## 5. Backups

```bash
# database dump (run via cron daily)
docker compose -f docker-compose.prod.yml exec -T db \
  pg_dump -U postgres default > twenty-$(date +%F).sql
```
Also back up the `server-local-data` volume if `STORAGE_TYPE=local` (uploaded
files/attachments live there).

## Notes

- The image is the `twenty` Dockerfile target (server + frontend in one image);
  the same image runs both the `server` and the `worker` service.
- `SERVER_URL` must always match the public HTTPS domain.
- To roll back, set `TAG=sha-<short>` in `.env` to a previous build and
  `up -d` again.
