#!/usr/bin/env bash
# Deploy the HUMAIN CMS stack to the GCP `haow` VM (dedicated, /opt/haow-cms).
# Port 22 is firewalled — all access goes through IAP. Run from the repo root:
#
#   ./scripts/deploy-haow.sh            # core profile
#   PROFILE=full ./scripts/deploy-haow.sh
#
# Prereqs on your machine: gcloud authed. On the VM: docker + compose plugin.
# You must place a filled .env.production locally (gitignored) — it is copied up.
set -euo pipefail

VM="${VM:-haow}"
ZONE="${ZONE:-asia-south1-a}"
APP_DIR="${APP_DIR:-/opt/haow-cms}"
REPO="${REPO:-https://github.com/ankeshtiwari07/CMS.git}"
BRANCH="${BRANCH:-main}"
PROFILE="${PROFILE:-}"
SSH=(gcloud compute ssh "$VM" --zone="$ZONE" --tunnel-through-iap --command)

if [[ ! -f .env.production ]]; then
  echo "ERROR: .env.production not found. Copy .env.production.example and fill it in." >&2
  exit 1
fi

echo "==> Ensuring app dir + repo on $VM"
# Reset to FETCH_HEAD, not origin/$BRANCH: the VM's clone is shallow and was made
# with `-b main`, so its refspec only tracks main. `git fetch origin <branch>`
# updates FETCH_HEAD but creates no origin/<branch> ref, which made any non-main
# BRANCH= deploy die with "ambiguous argument 'origin/<branch>'". FETCH_HEAD is
# what was just fetched, so it is correct for every branch including main.
"${SSH[@]}" "sudo mkdir -p $APP_DIR && sudo chown \$(whoami) $APP_DIR && \
  if [ -d $APP_DIR/.git ]; then cd $APP_DIR && git fetch --depth 1 origin $BRANCH && git reset --hard FETCH_HEAD; \
  else git clone --depth 1 -b $BRANCH $REPO $APP_DIR; fi"

echo "==> Copying .env.production (also used as compose .env for interpolation)"
gcloud compute scp --zone="$ZONE" --tunnel-through-iap .env.production "$VM:$APP_DIR/.env.production"
# docker compose reads `.env` in the project dir for ${VAR} interpolation
# (port, passwords). Keep it identical to the container env_file.
"${SSH[@]}" "cp $APP_DIR/.env.production $APP_DIR/.env"

COMPOSE="docker compose -f docker-compose.prod.yml"
[[ -n "$PROFILE" ]] && COMPOSE="$COMPOSE --profile $PROFILE"

echo "==> Building + starting stack ($COMPOSE)"
# Write GIT_SHA into .env (compose's reliable interpolation source — a shell
# export does NOT reach compose through SSH). This changes the Dockerfile
# cache-bust ARG every commit, so the build never reuses a stale .next.
# --force-recreate guarantees containers pick up the freshly built image.
"${SSH[@]}" "cd $APP_DIR && SHA=\$(git rev-parse HEAD) && \
  ( grep -q '^GIT_SHA=' .env && sed -i \"s/^GIT_SHA=.*/GIT_SHA=\$SHA/\" .env || echo \"GIT_SHA=\$SHA\" >> .env ) && \
  $COMPOSE up -d --build --force-recreate"

echo "==> Waiting for cms, then bootstrapping schema + seeding admin (idempotent)"
# Payload's drizzle `push` is dev-gated, so the first run bootstraps the schema
# with NODE_ENV=development; thereafter production cms uses the existing tables.
# (`payload run` can hang in-container, so invoke via node --import tsx.)
"${SSH[@]}" "cd $APP_DIR && sleep 15 && \
  $COMPOSE exec -T -e NODE_ENV=development -e DB_PUSH=true -w /app/apps/cms cms \
  sh -lc 'yes | node --import tsx src/seed.ts' || true"

echo "==> Health check"
PORT="$(grep -E '^HUMAIN_HTTP_PORT=' .env.production | cut -d= -f2 || echo 8020)"
"${SSH[@]}" "curl -s -o /dev/null -w 'nginx /healthz -> %{http_code}\n' http://localhost:${PORT:-8020}/healthz"

echo "==> Docker prune (reclaim disk)"
"${SSH[@]}" "docker image prune -f >/dev/null 2>&1 || true"

echo "Done. Console: http://<haow-host>:${PORT:-8020}/login"
