import { createServer } from 'node:http'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { createStore, ApiError } from './store.js'

export function createApi(store) {
  return createServer(async (req, res) => {
    const send = (status, body) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(body)) }
    try {
      const origin = req.headers.origin
      if (origin && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) throw new ApiError('Origem não permitida.', 403)
      const path = new URL(req.url, 'http://localhost').pathname
      if (req.method === 'GET' && path === '/api/summary') return send(200, store.summary())
      if (req.method === 'GET' && path === '/api/transactions') return send(200, store.transactions())
      if (req.method !== 'POST') return send(404, { error: 'Rota não encontrada.' })
      if (!(req.headers['content-type'] || '').startsWith('application/json')) throw new ApiError('Envie JSON.', 415)
      let body = ''
      for await (const chunk of req) { body += chunk; if (Buffer.byteLength(body) > 8192) throw new ApiError('Requisição muito grande.', 413) }
      let payload
      try { payload = JSON.parse(body) } catch { throw new ApiError('JSON inválido.') }
      if (!payload || Array.isArray(payload) || typeof payload !== 'object') throw new ApiError('Objeto JSON esperado.')
      if (path === '/api/simulations') return send(200, store.simulate(payload.amount))
      if (path === '/api/payments/review') return send(200, store.review(payload))
      if (path === '/api/payments/confirm') return send(200, store.confirm(payload.reviewId))
      return send(404, { error: 'Rota não encontrada.' })
    } catch (error) { if (!(error instanceof ApiError)) console.error(error); send(error.status || 500, { error: error instanceof ApiError ? error.message : 'Erro interno. Tente novamente.' }) }
  })
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const store = createStore(process.env.DB_PATH || fileURLToPath(new URL('../data/demo.sqlite', import.meta.url)))
  const server = createApi(store)
  server.listen(3001, '127.0.0.1', () => console.log('API local: http://127.0.0.1:3001'))
  const shutdown = () => server.close(() => { store.close(); process.exit(0) })
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}