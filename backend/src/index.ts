import { randomUUID } from 'node:crypto'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import websocket from '@fastify/websocket'
import { HOST, PORT } from './config.js'
import { sessionStore } from './store/sessionStore.js'
import { handleConnection } from './ws/handler.js'

const app = Fastify({ logger: true })

await app.register(cors, { origin: true })
await app.register(websocket)

app.get('/health', async () => ({
  status: 'ok',
  sessions: sessionStore.count,
}))

app.post<{ Body: { userName?: string } }>('/api/sessions', async (request, reply) => {
  const userName = request.body?.userName?.trim()
  if (!userName) {
    return reply.code(400).send({ error: 'Укажите имя' })
  }

  const session = sessionStore.create(userName)

  return {
    sessionId: session.id,
    hostName: session.hostName,
    createdAt: session.createdAt,
  }
})

app.get<{ Params: { sessionId: string } }>('/api/sessions/:sessionId', async (request, reply) => {
  const session = sessionStore.get(request.params.sessionId)
  if (!session) {
    return reply.code(404).send({ error: 'Сессия не найдена' })
  }

  return {
    sessionId: session.id,
    hostName: session.hostName,
    createdAt: session.createdAt,
    participants: session.getUsers(),
  }
})

app.post<{ Params: { sessionId: string }; Body: { userName?: string } }>(
  '/api/sessions/:sessionId/join',
  async (request, reply) => {
    const session = sessionStore.get(request.params.sessionId)
    if (!session) {
      return reply.code(404).send({ error: 'Сессия не найдена' })
    }

    const userName = request.body?.userName?.trim()
    if (!userName) {
      return reply.code(400).send({ error: 'Укажите имя' })
    }

    if (session.isNameTaken(userName)) {
      return reply.code(409).send({
        error: 'Это имя уже занято в сессии. Выберите другое.',
      })
    }

    return {
      sessionId: session.id,
      hostName: session.hostName,
      createdAt: session.createdAt,
      participants: session.getUsers(),
    }
  },
)

app.register(async (scoped) => {
  scoped.get<{ Params: { sessionId: string }; Querystring: { userName?: string; clientId?: string } }>(
    '/ws/:sessionId',
    { websocket: true },
    (socket, request) => {
      const { sessionId } = request.params
      const userName = request.query.userName?.trim() || 'Гость'
      const clientId = request.query.clientId?.trim() || randomUUID()

      handleConnection(socket, sessionId, userName, clientId)
    },
  )
})

try {
  await app.listen({ port: PORT, host: HOST })
  app.log.info(`WebSocket: ws://localhost:${PORT}/ws/:sessionId`)
} catch (error) {
  app.log.error(error)
  process.exit(1)
}
