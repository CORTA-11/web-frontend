FROM node:22-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci


FROM node:22-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_LIVE_MODULES=auth,teams,ai,board,chat,docs,files,resources
ARG NEXT_PUBLIC_API_BASE_URL=/api
ARG NEXT_PUBLIC_WS_BASE_URL=
ARG API_PROXY_TARGET=http://api:8080

ENV NEXT_PUBLIC_LIVE_MODULES=$NEXT_PUBLIC_LIVE_MODULES
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_WS_BASE_URL=$NEXT_PUBLIC_WS_BASE_URL
ENV API_PROXY_TARGET=$API_PROXY_TARGET
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build


FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0

COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public

USER node
EXPOSE 3000

CMD ["node", "server.js"]
