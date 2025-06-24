import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import memo from './handler/memo.js'

const app = new Hono()
app.route('/memo', memo)

app.use('*', async (c, next) => {
  console.log(`[LOG] ${c.req.method} ${c.req.path}`)
  await next()
})

serve({
  fetch: app.fetch,
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
