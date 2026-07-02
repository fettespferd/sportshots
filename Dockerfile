# SportShots — Next.js standalone Build für Coolify (Dockerfile-Buildpack)
# Muster analog Brainmotion-Website/Dockerfile, aber Multi-Stage weil Next.js
# einen eigenen Server mitbringt (kein vite preview nötig).
#
# WICHTIG (Coolify): Alle NEXT_PUBLIC_*-Variablen werden zur BUILD-Zeit ins
# Client-Bundle gebacken. In der Coolify-UI muss bei diesen Variablen
# "Build Variable / Available at Buildtime" aktiviert sein. Hier bewusst
# KEINE ARG-Defaults deklarieren — Coolify stellt die Werte beim Build als
# process.env bereit; ein leeres ARG würde sie überschreiben
# (gleiches Muster wie Brainmotion, siehe docs/COOLIFY_DEPLOYMENT.md dort).

FROM node:22-slim AS deps
WORKDIR /app
COPY package*.json ./
# --include=dev: Coolify setzt NODE_ENV=production; ohne den Flag fehlen
# typescript/@types beim Build und `next build` scheitert.
RUN npm ci --include=dev

FROM node:22-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-slim AS runner
WORKDIR /app
# curl für den Coolify-Healthcheck (`curl -f http://localhost:3000/api/health`),
# das slim-Image bringt kein curl mit.
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
# Standalone-Output enthält server.js + benötigte node_modules (inkl. sharp)
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
