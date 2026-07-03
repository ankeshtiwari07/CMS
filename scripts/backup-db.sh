#!/usr/bin/env bash
# HUMAIN CMS — Postgres backup with rotation.
# Dumps the humain DB from the running postgres container, gzips it, keeps the
# last RETENTION daily backups. Local-only (project billing disables GCS).
set -euo pipefail

CONTAINER="${PG_CONTAINER:-haow-cms-postgres-1}"
DB_USER="${PG_USER:-humain}"
DB_NAME="${PG_DB:-humain}"
BACKUP_DIR="${BACKUP_DIR:-/opt/haow-cms/backups}"
RETENTION="${RETENTION:-14}"
# Skip if root disk is dangerously full (disk-guard warns at 85%); backups are
# tiny (~MB) but never let a backup be the thing that fills the disk.
DISK_LIMIT="${DISK_LIMIT:-95}"

mkdir -p "$BACKUP_DIR"
ts="$(date -u +%Y%m%dT%H%M%SZ)"
out="$BACKUP_DIR/humain_${ts}.sql.gz"

used="$(df --output=pcent / | tail -1 | tr -dc '0-9')"
if [ "${used:-0}" -ge "$DISK_LIMIT" ]; then
  echo "[backup] ABORT: root disk ${used}% >= ${DISK_LIMIT}% limit" >&2
  exit 1
fi

# Dump. --clean makes the restore idempotent; pipe straight to gzip.
if docker exec "$CONTAINER" pg_dump -U "$DB_USER" --clean --if-exists "$DB_NAME" | gzip -c > "$out.tmp"; then
  mv "$out.tmp" "$out"
  echo "[backup] wrote $out ($(du -h "$out" | cut -f1))"
else
  rm -f "$out.tmp"
  echo "[backup] FAILED pg_dump" >&2
  exit 1
fi

# Verify the gzip is intact before rotating anything out.
if ! gzip -t "$out"; then
  echo "[backup] CORRUPT dump, removing $out" >&2
  rm -f "$out"
  exit 1
fi

# Rotate: keep the newest RETENTION, delete the rest.
ls -1t "$BACKUP_DIR"/humain_*.sql.gz 2>/dev/null | tail -n +"$((RETENTION+1))" | while read -r old; do
  echo "[backup] rotate out $old"
  rm -f "$old"
done

echo "[backup] done. $(ls -1 "$BACKUP_DIR"/humain_*.sql.gz | wc -l) backups retained."
