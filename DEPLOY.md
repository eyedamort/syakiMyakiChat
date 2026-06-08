# Развёртывание

Инструкция для DevOps: как поднять **Сяки Мяки чат** в production.

## Архитектура

```
                    ┌─────────────┐
  Browser ──HTTP──► │ nginx (web) │ :80
                    │  SPA static │
                    │  /api  ─────┼──► backend:8080
                    │  /ws   ─────┼──► backend:8080 (WebSocket upgrade)
                    └─────────────┘
                           │
                    ┌──────▼──────┐
                    │   backend   │
                    │  Fastify    │
                    │  volume:    │
                    │  /app/data  │
                    └─────────────┘
```

- Один публичный порт (`WEB_PORT`, по умолчанию 80).
- TLS обычно терминируется внешним reverse proxy (Traefik, Caddy, cloud LB) перед `web`.
- Состояние сессий — JSON-файл в Docker volume `session-data`.

## Docker Compose (рекомендуется)

```bash
cp .env.example .env
docker compose up -d --build
docker compose ps
docker compose logs -f
```

Проверка:

```bash
curl http://localhost/health
curl http://localhost/api/sessions -X POST -H "Content-Type: application/json" -d '{"userName":"test"}'
```

Остановка:

```bash
docker compose down          # контейнеры
docker compose down -v       # + удалить volume с сессиями
```

### Сервисы

| Сервис | Образ | Порт | Назначение |
|--------|-------|------|------------|
| `web` | `vite-project/Dockerfile` | `${WEB_PORT:-80}:80` | Статика + reverse proxy |
| `backend` | `backend/Dockerfile` | expose 8080 (внутренняя сеть) | REST + WebSocket |

### Volumes

- `session-data` → `/app/data` в backend (`sessions.json`)

### Healthcheck

Backend: `GET /health` → `{ status: "ok", sessions: N }`.  
`web` стартует после `backend` (condition: `service_healthy`).

## nginx

Конфиг: [deploy/nginx.conf](./deploy/nginx.conf)

- `location /` — SPA, `try_files` → `index.html`
- `location /api/` — proxy на `backend:8080`
- `location /ws/` — WebSocket upgrade, таймауты 24h
- `location /health` — proxy healthcheck backend

При HTTPS снаружи важно пробросить `X-Forwarded-Proto` (уже в конфиге).

## Сборка без Compose

```bash
# Backend
docker build -t vibe-backend ./backend
docker run -d -p 8080:8080 -v vibe-data:/app/data --name vibe-backend vibe-backend

# Frontend (контекст — корень репо!)
docker build -t vibe-web -f vite-project/Dockerfile .
docker run -d -p 80:80 --link vibe-backend:backend vibe-web
```

В production лучше общая Docker network вместо `--link`.

## Раздельный деплой (фронт и бэк на разных хостах)

1. Backend: открыть `8080` (или за reverse proxy), CORS уже `origin: true`.
2. Frontend: собрать с переменными:

```bash
docker build -f vite-project/Dockerfile \
  --build-arg VITE_API_URL=https://api.example.com \
  --build-arg VITE_WS_URL=wss://api.example.com \
  -t vibe-web .
```

3. На API-хосте настроить WebSocket upgrade для `/ws/:sessionId`.

## TLS / домен

Пример с Caddy перед compose:

```
example.com {
    reverse_proxy localhost:80
}
```

Или Traefik labels на сервис `web`.  
WebSocket должен идти через тот же домен, что и SPA (same-origin) — так проще всего.

## Ресурсы

Минимально для небольшой нагрузки:

- CPU: 0.5 vCPU на сервис
- RAM: 256–512 MB backend, 64–128 MB nginx
- Диск: volume для `sessions.json` (растёт с числом сессий и размером документов)

## Логи и отладка

```bash
docker compose logs backend
docker compose logs web
```

Backend пишет access-логи Fastify.  
WebSocket close code `4409` — имя уже занято в сессии.

## Обновление

```bash
git pull
docker compose up -d --build
```

Volume `session-data` сохраняется между деплоями.

## Что не в scope compose

- PostgreSQL/Redis (сейчас in-memory + JSON file)
- Horizontal scaling WebSocket (нужен shared pub/sub)
- Бэкапы volume — настраивается на уровне инфраструктуры

## Локальная разработка (без Docker)

См. [README.md](./README.md): backend `:8080`, frontend `:5173` с Vite proxy.
