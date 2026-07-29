# VPS Migration Runbook — JebDekho

What to do if this app needs to move to a different server. Checked the current
setup first: nothing in the app, nginx configs, or `.env` files is tied to this
server's specific IP — everything talks over domain names or `127.0.0.1`
(loopback to same-box Postgres/Redis/Docker). So migration is really: stand up
a new box, move the data over, then repoint DNS. There is no single
"enter new IP, everything updates" step — DNS is the only piece that's
genuinely IP-parameterized, and that's automated below.

## Scripts

| Script | Runs on | What it does |
|---|---|---|
| `deploy/scripts/migrate-export-bundle.sh` | Old server | Dumps DB + copies `.env`/`.env.production`/nginx/PM2 config into one tarball |
| `deploy/scripts/migrate-bootstrap-new-server.sh` | New server | Installs deps, clones repo, restores DB, builds, configures nginx, starts PM2 |
| `deploy/scripts/migrate-update-dns.sh` | Either | Repoints all 8 subdomain A records to the new IP via the Hostinger API |

## Order of operations

1. **Provision the new VPS.** Ubuntu 22.04/24.04, at least the same specs as
   current. SSH in as root. Note its public IPv4.

2. **On the OLD server** — export everything that isn't in git:
   ```bash
   cd /var/www/jebdekho
   ./deploy/scripts/migrate-export-bundle.sh
   ```
   This writes a tarball to `/var/backups/jebdekho/migration/`. Copy it over:
   ```bash
   scp /var/backups/jebdekho/migration/jebdekho_migration_*.tar.gz root@<NEW_IP>:/root/
   ```

3. **On the NEW server** — bootstrap:
   ```bash
   JD_REPO_URL=<your git remote> ./migrate-bootstrap-new-server.sh /root/jebdekho_migration_*.tar.gz
   ```
   This installs Node/pnpm/Docker/nginx/certbot/PM2 if missing, clones the
   repo, starts Postgres/Redis via `docker compose` **from the repo root**
   (important — see "known footgun" below), restores the DB dump, builds all
   apps, drops in the nginx configs, and starts PM2. It does **not** touch DNS
   or run certbot yet — the site isn't reachable at the new IP until DNS
   points there, and certbot's domain validation needs that to already be true.

4. **Verify the new server works over its raw IP** where possible (health
   endpoints, `pm2 list` all "online", `curl localhost:3000` etc.) before
   touching DNS — this is your last easy rollback point.

5. **Cut over DNS:**
   ```bash
   HOSTINGER_API_TOKEN=<token from hPanel> \
     ./deploy/scripts/migrate-update-dns.sh <NEW_IP>
   ```
   Get a token from hPanel → API. The script asks you to retype the IP as a
   confirmation before it changes anything live. Wait for propagation
   (usually minutes, up to ~24h) — check https://dnschecker.org/#A/jebdekho.com.

6. **On the NEW server**, once DNS resolves there, issue SSL certs:
   ```bash
   certbot --nginx -d jebdekho.com -d www.jebdekho.com -d api.jebdekho.com \
     -d admin.jebdekho.com -d merchant.jebdekho.com -d rider.jebdekho.com \
     -d vendor.jebdekho.com -d franchise.jebdekho.com
   ```

7. **Smoke-test every portal** over HTTPS on the real domains (buyer, merchant,
   admin, rider, vendor, franchise) — logins, one real order end-to-end if
   possible. See `deploy/docs/PRODUCTION_VERIFICATION.md`.

8. **Enable PM2 on boot** on the new server: `pm2 startup` (follow the printed
   command), then `pm2 save`.

9. Once confident, decommission the old server. Keep the migration bundle
   tarball around for a while as a cold backup.

## Known footgun — always run `docker compose` from the repo root

The Postgres/Redis containers are defined in `docker-compose.yml` at the repo
root, with a relative bind mount: `./docker/postgres/init.sql`. If
`docker compose up` is ever run from a different working directory (e.g. a
stray subdirectory), Docker silently creates that path fresh at whatever cwd
you were in — as an empty **directory**, not the real file — and the container
gets permanently wired to that wrong path. It'll run fine until the container
needs to restart, then fail to remount and crash-loop, because Postgres itself
requires the file to exist. This exact thing happened in production on
2026-07-29 and took the API down. Rule: only ever run `docker compose` commands
from `/var/www/jebdekho` (the actual repo root), never from a copy or nested
path.

## What deliberately does NOT need to change

- `.env` / `.env.production` `DATABASE_URL`, `REDIS_URL` — all `127.0.0.1`,
  work identically on any box.
- nginx `conf.d/*.conf` — `server_name` and `proxy_pass` use domain names /
  loopback, not IPs.
- Application code — nothing reads the server's own public IP.
