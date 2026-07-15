#!/bin/bash
exec > /tmp/deckrecreate.log 2>&1
set -x
cd /opt/haow-cms || exit 9
echo "=== recreate $(date) ==="
docker compose -f docker-compose.prod.yml up -d --no-deps --force-recreate cms console ai-service web workers mcp
echo "compose_exit=$?"
sleep 4
docker restart haow-cms-nginx-1
echo "=== containers ==="
docker ps --filter "name=haow-cms" --format "{{.Names}} {{.Status}}"
echo "=== DONE $(date) ==="
