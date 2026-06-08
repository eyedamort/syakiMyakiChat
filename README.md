# Сяки Мяки чат

Совместный WYSIWYG-редактор в реальном времени: несколько человек редактируют один документ, видят курсоры друг друга и могут вставлять картинки.

## Стек

| Часть | Технологии |
|-------|------------|
| Frontend | React, TypeScript, Vite, TipTap, react-router-dom |
| Backend | Node.js, Fastify, WebSocket |
| Деплой | Docker Compose, nginx |

## Быстрый старт (Docker)

Нужны [Docker](https://docs.docker.com/get-docker/) и Docker Compose v2.

```bash
git clone <repo-url> vibe
cd vibe
cp .env.example .env   # опционально: поменять WEB_PORT
docker compose up -d --build
```

Откройте http://localhost (или порт из `WEB_PORT`).

Подробности для DevOps — в [DEPLOY.md](./DEPLOY.md).

## Локальная разработка

Два терминала:

```bash
# Backend — порт 8080
cd backend
cp .env.example .env
npm install
npm run dev

# Frontend — порт 5173, проксирует /api и /ws на backend
cd vite-project
cp .env.example .env
npm install
npm run dev
```

Откройте http://localhost:5173

## Структура репозитория

```
vibe/
├── backend/          # API + WebSocket
├── vite-project/     # SPA (React)
├── deploy/           # nginx-конфиг для production
├── docker-compose.yml
├── DEPLOY.md         # инструкция по развёртыванию
└── README.md
```

## API (кратко)

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/health` | Healthcheck |
| POST | `/api/sessions` | Создать сессию `{ userName }` |
| GET | `/api/sessions/:id` | Информация о сессии |
| POST | `/api/sessions/:id/join` | Войти `{ userName }` |
| WS | `/ws/:sessionId` | Синхронизация редактора |

Сессии сохраняются в `backend/data/sessions.json` (volume `session-data` в Docker).

## Переменные окружения

**Backend** (`backend/.env.example`):

- `PORT` — порт HTTP/WS (по умолчанию 8080)
- `HOST` — `0.0.0.0` для Docker

**Frontend** (`vite-project/.env.example`):

- `VITE_WS_ENABLED=true` — включить синхронизацию
- `VITE_SYNC_DEBOUNCE_MS=400` — задержка перед отправкой правок
- `VITE_API_URL` / `VITE_WS_URL` — только если фронт и бэк на разных доменах

В Docker-сборке по умолчанию фронт ходит на тот же origin (`/api`, `/ws` через nginx).

## Как передать проект

1. Залейте репозиторий на GitHub/GitLab (без `.env` и `backend/data/`).
2. Отправьте другу ссылку и [DEPLOY.md](./DEPLOY.md).
3. Либо архив: `git archive` или zip без `node_modules`.

```bash
# Пример архива без лишнего
git archive --format=zip HEAD -o vibe.zip
```
