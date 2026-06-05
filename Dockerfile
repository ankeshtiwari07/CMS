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
EXPOSE 3000 3001 3002 4000
# Default command overridden per compose service.
CMD ["pnpm", "--filter", "@humain/cms", "start"]
