#!/usr/bin/env bash
# Zero-downtime blue-green rollout for the CMS module on GKE.
# Usage: blue-green.sh <env> <image-tag>
# Rolls the IDLE color to the new image, smoke-tests it via the preview Service,
# then atomically flips the live Service selector. Rolls back on any failure.
set -euo pipefail
ENV="${1:?env}"; TAG="${2:?tag}"; NS="humain-cms"

active="$(kubectl -n "$NS" get svc cms -o jsonpath='{.spec.selector.color}')"
idle="green"; [ "$active" = "green" ] && idle="blue"
echo "▶ $ENV: active=$active  → deploying idle=$idle  tag=$TAG"

# 1. Point the idle deployment at the new image and scale it up.
kubectl -n "$NS" set image "deploy/cms-$idle" "cms=${REGISTRY}/cms:${TAG}"
kubectl -n "$NS" scale "deploy/cms-$idle" --replicas=3
kubectl -n "$NS" patch svc cms-preview -p "{\"spec\":{\"selector\":{\"app\":\"cms\",\"color\":\"$idle\"}}}"
kubectl -n "$NS" rollout status "deploy/cms-$idle" --timeout=180s

# 2. Smoke-test the idle color through the preview Service.
if ! kubectl -n "$NS" run "smoke-$TAG" --rm -i --restart=Never --image=curlimages/curl:8.8.0 -- \
      -fsS --max-time 10 "http://cms-preview:3001/api/health" >/dev/null; then
  echo "✗ smoke test failed — keeping traffic on $active, scaling idle back down"
  kubectl -n "$NS" scale "deploy/cms-$idle" --replicas=0
  exit 1
fi

# 3. Flip live traffic to the freshly-verified color (atomic selector switch).
kubectl -n "$NS" patch svc cms -p "{\"spec\":{\"selector\":{\"app\":\"cms\",\"color\":\"$idle\"}}}"
echo "✓ $ENV: live traffic now on $idle ($TAG)"

# 4. Drain the previously-active color (kept warm briefly for instant rollback).
sleep 30
kubectl -n "$NS" scale "deploy/cms-$active" --replicas=0
echo "✓ drained $active — rollout complete"
