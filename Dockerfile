# Single workspace image. Each compose service runs a different `pnpm --filter`
# command from this image (disk-friendly: one build, many containers).
FROM node:22-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable && corepack prepare pnpm@9.7.0 --activate
WORKDIR /app

# ---- Install deps (cached on manifest changes) ----
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/cms/package.json ./apps/cms/
COPY apps/studio/package.json ./apps/studio/
COPY apps/web/package.json ./apps/web/
COPY apps/ai-service/package.json ./apps/ai-service/
COPY apps/mcp-server/package.json ./apps/mcp-server/
COPY packages/design-tokens/package.json ./packages/design-tokens/
COPY packages/ui/package.json ./packages/ui/
COPY packages/blocks/package.json ./packages/blocks/
RUN pnpm install --frozen-lockfile

# ---- Build all apps ----
# GIT_SHA changes per commit, so this layer (and everything below: source COPY
# + builds) is rebuilt on every new commit — never a stale `.next`.
ARG GIT_SHA=dev
RUN echo "build $GIT_SHA"
COPY . .
# Dummy build-time values so Next/Payload build never needs live services.
ENV DATABASE_URI=postgres://build:build@localhost:5432/build
ENV PAYLOAD_SECRET=build-time-secret-build-time-secret-1234
RUN pnpm --filter @humain/cms build \
 && pnpm --filter @humain/web build \
 && pnpm --filter @humain/studio build \
 && pnpm --filter @humain/ai-service build \
 && pnpm --filter @humain/mcp-server build

ENV NODE_ENV=production

# Clear the build-time placeholders. They are only needed so the Next/Payload
# builds above can run without live services, but ENV persists into the final
# image — so a container started without a real PAYLOAD_SECRET would silently
# sign cookies and tokens with a value that is committed in this file. Empty
# makes Payload refuse to boot instead, which is the failure you want.
ENV PAYLOAD_SECRET=""
ENV DATABASE_URI=""

# Run as node:22-bookworm-slim's built-in unprivileged `node` user (uid 1000).
# Every workload built from this image is a Node server on a port above 1024,
# and none of them mounts a volume, so nothing here needs root. /app must be
# writable because Next.js writes its runtime cache under .next/cache.
RUN chown -R node:node /app /pnpm
USER node

EXPOSE 3000 3001 3002 4000
# Default command overridden per compose service.
CMD ["pnpm", "--filter", "@humain/cms", "start"]
