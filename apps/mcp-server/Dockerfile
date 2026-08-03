# Dedicated image for the MCP server. It has no workspace dependencies and no
# Next build, so a filtered install keeps this an order of magnitude smaller and
# faster than the shared `stack` image — and lets MCP roll independently of cms.
FROM node:22-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@9.7.0 --activate
WORKDIR /app

# All workspace manifests are needed for pnpm to resolve against the lockfile,
# but --filter means only mcp-server's dependency tree is actually fetched.
FROM base AS manifests
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/cms/package.json ./apps/cms/
COPY apps/studio/package.json ./apps/studio/
COPY apps/web/package.json ./apps/web/
COPY apps/ai-service/package.json ./apps/ai-service/
COPY apps/mcp-server/package.json ./apps/mcp-server/
COPY packages/design-tokens/package.json ./packages/design-tokens/
COPY packages/ui/package.json ./packages/ui/
COPY packages/blocks/package.json ./packages/blocks/

FROM manifests AS build
RUN pnpm install --frozen-lockfile --filter @humain/mcp-server...
COPY apps/mcp-server ./apps/mcp-server
RUN pnpm --filter @humain/mcp-server build

FROM manifests AS runtime
RUN pnpm install --frozen-lockfile --prod --filter @humain/mcp-server...
COPY --from=build /app/apps/mcp-server/dist ./apps/mcp-server/dist
ENV NODE_ENV=production
ENV MCP_TRANSPORT=http
ENV MCP_PORT=4100
EXPOSE 4100
USER node
CMD ["node", "apps/mcp-server/dist/server.js"]
