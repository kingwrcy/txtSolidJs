import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import memo from './handler/memo.js'



const app = new Hono()

app.route('/memo', memo)




serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
