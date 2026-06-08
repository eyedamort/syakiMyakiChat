# Сборка из корня репозитория: docker compose build web
FROM node:22-alpine AS build

WORKDIR /app

COPY vite-project/package.json vite-project/package-lock.json ./
RUN npm install --no-audit --no-fund

COPY vite-project/ .

ARG VITE_WS_ENABLED=true
ARG VITE_SYNC_DEBOUNCE_MS=400
ARG VITE_API_URL=
ARG VITE_WS_URL=

ENV VITE_WS_ENABLED=$VITE_WS_ENABLED
ENV VITE_SYNC_DEBOUNCE_MS=$VITE_SYNC_DEBOUNCE_MS
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL

RUN npm run build

FROM nginx:alpine

COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
