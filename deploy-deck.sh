#!/bin/bash
# Rebuild the humain-cms-stack image with the deck feature + build-safe redis guard.
exec > /tmp/deckbuild2.log 2>&1
set -x
cd /opt/haow-cms || exit 9
# kill any stuck prior build
pkill -9 -f "buildx build" 2>/dev/null
pkill -9 -f "docker-compose.prod.yml build" 2>/dev/null
sleep 3
GIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo deck)
echo "=== BUILD START $(date) sha=$GIT_SHA ==="
docker compose -f docker-compose.prod.yml build --build-arg GIT_SHA=deck2-$GIT_SHA
echo "=== BUILD_EXIT=$? $(date) ==="
