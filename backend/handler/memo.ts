import bcrypt from 'bcryptjs'
import { and, eq, gt, sql, type InferSelectModel } from 'drizzle-orm'
import { Hono } from 'hono'
import { rateLimiter, type Store } from "hono-rate-limiter"
import { bodyLimit } from 'hono/body-limit'
import { marked } from 'marked'
import MemoryStore from "../util/limit.js"
import db, { memos } from '../db/schema.js'
import { generateShortUrl } from '../util/id.js'
import NodeCache from 'node-cache'

const cache = new NodeCache({
  stdTTL: 60 * 60, // 1 hour
  checkperiod: 120,
  useClones: false, // Disable cloning for performance
})


const app = new Hono()
type saveMemoBody = {
  content: string
  type: 'text' | 'markdown'
  password?: string
  path?: string,
  keep?: number,
  sameIp?: boolean,
}


app.post('/save', rateLimiter({
  windowMs: 1 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-6",
  keyGenerator: (c) => {
    return c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || c.req.header('cf-connecting-ip') || '127.0.0.1'
  },
  handler: (c) => {
    return c.json({
      success: false,
      details: '请求过于频繁，请稍后再试,一分钟内最多保存5次.'
    }, 429)
  },
  store: new MemoryStore(5) as unknown as Store,
}), bodyLimit({
  maxSize: 100 * 1024, // 10kb
  onError: (c) => {
    return c.json({
      success: false,
      details: '请求体过大'
    }, 413)
  },
}), async (c) => {
  const body = await c.req.json<saveMemoBody>()

  if (!body.content || !body.type) {
    return c.json({
      success: false,
      details: '内容和类型是必填的'
    }, 400)
  }

  let html_content = body.content
  if (body.type === 'markdown') {
    html_content = await marked.parse(body.content, {});
  }

  let path = body.path || ''

  if (path && !/^[a-zA-Z0-9_-]+$/.test(path)) {
    return c.json({
      success: false,
      details: '路径只能包含字母、数字、下划线和连字符'
    }, 400)
  }
  if (path && (path.length < 3 || path.length > 20)) {
    return c.json({
      success: false,
      details: '路径长度必须在3到20个字符之间'
    }, 400)
  }
  if (body.password && body.password.length < 6) {
    return c.json({
      success: false,
      details: '密码长度必须大于等于6个字符'
    }, 400)
  }

  if (body.type !== 'text' && body.type !== 'markdown') {
    return c.json({
      success: false,
      details: '类型必须是"text"或"markdown"'
    }, 400)
  }
  if (body.sameIp === undefined) {
    body.sameIp = false
  }
  if (!body.path) {
    path = generateShortUrl();
  }
  body.keep = Math.min(Math.max(body.keep || 7, 1), 30) // 默认7天，最大30天，最小1天

  let deletedAt = Date.now() + (body.keep * 24 * 60 * 60 * 1000)

  const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || c.req.header('cf-connecting-ip') || '127.0.0.1'


  const exist = await db.select().from(memos).where(eq(memos.path, path))
  if (exist.length > 0) {
    if (!exist[0].password) {
      return c.json({
        success: false,
        details: '没有设置密码,无法更新,它是只读的.'
      }, 400)
    }
    if (!body.password) {
      return c.json({
        success: false,
        details: '更新需要提供密码'
      }, 400)
    }
    const isMatch = await bcrypt.compare(body.password || '', exist[0].password)
    if (!isMatch) {
      return c.json({
        success: false,
        details: '无效的密码'
      }, 401)
    }
  }

  const hashPassword = body.password ? await bcrypt.hash(body.password, 10) : null

  await db.insert(memos).values({
    content: body.content,
    html_content: html_content,
    ip: ip,
    type: body.type,
    password: hashPassword,
    path: path,
    created_at: Date.now(),
    updated_at: Date.now(),
    deleted_at: deletedAt,
    same_ip: body.sameIp ? 1 : 0
  }).onConflictDoUpdate({
    target: [memos.path],
    set: {
      content: body.content,
      html_content: html_content,
      ip: ip,
      type: body.type,
      same_ip: body.sameIp ? 1 : 0,
      password: hashPassword,
      updated_at: Date.now(),
      deleted_at: deletedAt
    }
  });

  cache.del(path) // 清除缓存

  return c.json({
    success: true,
    data: {
      path,
    }
  })
})

app.get('/:path', async (c) => {
  const path = c.req.param('path')
  if (!path) {
    return c.json({
      success: false,
      details: '路径是必填的'
    }, 400)
  }
  const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || c.req.header('cf-connecting-ip') || '127.0.0.1'

  let memo = cache.get<InferSelectModel<typeof memos>>(path)
  if (!memo) {
    const result = await db.select().from(memos).where(and(eq(memos.path, path), gt(memos.deleted_at, Date.now()))).limit(1)
    memo = result != null && result.length > 0 ? result[0] : undefined
  }

  if (!memo) {
    return c.json({
      success: false,
      details: '不存在的便签'
    }, 404)
  }

  if (memo.same_ip && memo.ip !== ip) {
    return c.json({
      success: false,
      details: '只允许同一IP访问'
    }, 401)
  }

  const lessThen7Days = memo.deleted_at - Date.now() < 1000 * 24 * 60 * 60 * 7


  await db.update(memos).set({
    views: sql`${memos.views} + 1`,
    deleted_at: lessThen7Days ? sql`${memos.deleted_at} + 1000 * 24 * 60 * 60 * 7` : sql`${memos.deleted_at}`
  }).where(eq(memos.id, memo.id));


  memo.password = null
  memo.views += 1
  if (lessThen7Days) {
    memo.deleted_at = new Date(memo.deleted_at + 1000 * 24 * 60 * 60 * 7).getTime()
  }


  cache.set(path, memo, 1800) // 缓存30分钟

  return c.json({
    success: true,
    data: memo
  })
})

export default app