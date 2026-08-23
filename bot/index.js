import http from 'node:http'
import { URL } from 'node:url'
import 'dotenv/config'
import { createPaymeMerchantHandler } from './paymeMerchant.js'
import { buildPaymeCheckoutUrl, isPaymeDemo } from './paymeCheckout.js'
import { isLocalMode, localDb } from './localStore.js'
import { db } from './db.js'

const token = process.env.BOT_TOKEN
const port = Number(process.env.PORT || 8787)
const webappUrl = process.env.WEBAPP_URL || 'http://localhost:5173'
const local = isLocalMode()

let bot = null
if (token && token !== 'REPLACE_ME') {
  const { Telegraf } = await import('telegraf')
  bot = new Telegraf(token)
} else {
  console.warn('[bot] BOT_TOKEN нет — только HTTP API + локальный демо-режим')
}

async function readJson(req) {
  let body = ''
  for await (const chunk of req) body += chunk
  return body ? JSON.parse(body) : {}
}

function send(res, code, data) {
  res.writeHead(code, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  })
  res.end(JSON.stringify(data))
}

async function notifyOwnerPaid(orderId) {
  try {
    let ownerId
    let title
    let amount
    if (local) {
      const order = localDb.getOrder(orderId)
      const biz = order ? localDb.getBusiness(order.business_id) : null
      if (!order || !biz) return
      ownerId = biz.owner_telegram_id
      title = order.title
      amount = order.amount_uzs
    } else {
      const { data: order } = await db
        .from('orders')
        .select('*, businesses(name, owner_telegram_id)')
        .eq('id', orderId)
        .maybeSingle()
      if (!order?.businesses?.owner_telegram_id) return
      ownerId = order.businesses.owner_telegram_id
      title = order.title
      amount = order.amount_uzs
    }
    const text = `Оплата получена\n${title}\n${Number(amount).toLocaleString('ru-RU')} сум`
    if (bot) await bot.telegram.sendMessage(ownerId, text)
    else console.log('[notify:local]', ownerId, text)
  } catch (e) {
    console.error('[notify]', e)
  }
}

async function handleLocalApi(req, res, url) {
  const path = url.pathname

  if (path === '/api/health') {
    send(res, 200, { ok: true, local, demo: isPaymeDemo(), bot: !!bot })
    return true
  }

  if (path === '/api/profile' && req.method === 'POST') {
    const body = await readJson(req)
    send(res, 200, localDb.upsertProfile(body))
    return true
  }

  if (path === '/api/business/by-owner' && req.method === 'GET') {
    const tg = Number(url.searchParams.get('telegram_id'))
    send(res, 200, localDb.getBusinessByOwner(tg))
    return true
  }

  if (path === '/api/business/by-slug' && req.method === 'GET') {
    send(res, 200, localDb.getBusinessBySlug(url.searchParams.get('slug')))
    return true
  }

  if (path === '/api/business' && req.method === 'POST') {
    try {
      const body = await readJson(req)
      send(res, 200, localDb.createBusiness(body))
    } catch (e) {
      send(res, e.code === '23505' ? 409 : 400, { error: e.message, code: e.code })
    }
    return true
  }

  if (path === '/api/business/payme' && req.method === 'POST') {
    const body = await readJson(req)
    const biz = localDb.getBusiness(body.businessId)
    if (!biz) {
      send(res, 404, { error: 'not_found' })
      return true
    }
    const settings = { ...(biz.settings || {}), payme_connected: !!body.connected }
    send(res, 200, localDb.updateBusiness(biz.id, {
      payme_merchant_id: body.merchantId || null,
      settings,
    }))
    return true
  }

  if (path === '/api/offers' && req.method === 'GET') {
    send(res, 200, localDb.listOffers(url.searchParams.get('business_id')))
    return true
  }

  if (path === '/api/offers' && req.method === 'POST') {
    const body = await readJson(req)
    send(res, 200, localDb.createOffer(body))
    return true
  }

  if (path === '/api/orders' && req.method === 'GET') {
    const id = url.searchParams.get('id')
    if (id) {
      send(res, 200, localDb.getOrder(id))
      return true
    }
    send(res, 200, localDb.listOrders(url.searchParams.get('business_id')))
    return true
  }

  if (path === '/api/orders' && req.method === 'POST') {
    const body = await readJson(req)
    send(res, 200, localDb.createOrder(body))
    return true
  }

  if (path === '/api/checkout' && req.method === 'POST') {
    const { orderId } = await readJson(req)
    const order = localDb.getOrder(orderId)
    if (!order) {
      send(res, 404, { error: 'order_not_found' })
      return true
    }
    if (isPaymeDemo()) {
      send(res, 200, { demo: true, payUrl: null })
      return true
    }
    const payUrl = buildPaymeCheckoutUrl({
      merchantId: process.env.PAYME_MERCHANT_ID,
      orderId: order.id,
      amountUzs: order.amount_uzs,
      returnUrl: `${webappUrl}/?paid=${order.id}`,
    })
    send(res, 200, { demo: false, payUrl })
    return true
  }

  if (path === '/api/demo-pay' && req.method === 'POST') {
    if (!isPaymeDemo()) {
      send(res, 403, { error: 'demo_disabled' })
      return true
    }
    const { orderId } = await readJson(req)
    const order = localDb.getOrder(orderId)
    if (!order || order.status !== 'pending') {
      send(res, 400, { error: 'invalid_order' })
      return true
    }
    localDb.createPayment({
      order_id: orderId,
      amount_uzs: order.amount_uzs,
      external_id: `demo_${orderId}`,
      state: 2,
      status: 'paid',
      paid_at: new Date().toISOString(),
    })
    localDb.markOrderPaid(orderId, `demo_${orderId}`)
    await notifyOwnerPaid(orderId)
    send(res, 200, { ok: true })
    return true
  }

  return false
}

const paymeHandler = createPaymeMerchantHandler({ onPaid: notifyOwnerPaid })

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host}`)

  if (req.method === 'OPTIONS') {
    send(res, 204, {})
    return
  }

  try {
    if (url.pathname === '/health') {
      send(res, 200, { ok: true, local, demo: isPaymeDemo(), bot: !!bot })
      return
    }

    if (local && url.pathname.startsWith('/api/')) {
      const handled = await handleLocalApi(req, res, url)
      if (handled) return
    }

    if (!local && url.pathname === '/api/checkout' && req.method === 'POST') {
      const body = await readJson(req)
      const { data: order } = await db.from('orders').select('*').eq('id', body.orderId).maybeSingle()
      if (!order) {
        send(res, 404, { error: 'order_not_found' })
        return
      }
      if (isPaymeDemo()) {
        send(res, 200, { demo: true, payUrl: null })
        return
      }
      send(res, 200, {
        demo: false,
        payUrl: buildPaymeCheckoutUrl({
          merchantId: process.env.PAYME_MERCHANT_ID,
          orderId: order.id,
          amountUzs: order.amount_uzs,
          returnUrl: `${webappUrl}/?paid=${order.id}`,
        }),
      })
      return
    }

    if (!local && url.pathname === '/api/demo-pay' && req.method === 'POST') {
      if (!isPaymeDemo()) {
        send(res, 403, { error: 'demo_disabled' })
        return
      }
      const { orderId } = await readJson(req)
      const now = new Date().toISOString()
      const { data: order } = await db.from('orders').select('*').eq('id', orderId).maybeSingle()
      if (!order || order.status !== 'pending') {
        send(res, 400, { error: 'invalid_order' })
        return
      }
      await db.from('payments').insert({
        order_id: orderId,
        provider: 'payme',
        amount_uzs: order.amount_uzs,
        external_id: `demo_${orderId}`,
        state: 2,
        status: 'paid',
        paid_at: now,
      })
      await db.from('orders').update({ status: 'paid', paid_at: now }).eq('id', orderId)
      await notifyOwnerPaid(orderId)
      send(res, 200, { ok: true })
      return
    }

    if (url.pathname === '/payme') {
      await paymeHandler(req, res)
      return
    }

    send(res, 404, { error: 'not_found' })
  } catch (e) {
    console.error(e)
    send(res, 500, { error: 'server_error', message: e.message })
  }
})

if (bot) {
  bot.start(async (ctx) => {
    const payload = ctx.startPayload || ''
    if (payload.startsWith('b_')) {
      const slug = payload.slice(2)
      const biz = local
        ? localDb.getBusinessBySlug(slug)
        : (await db.from('businesses').select('name, slug').eq('slug', slug).maybeSingle()).data
      if (!biz) {
        await ctx.reply('Бизнес не найден.')
        return
      }
      const openUrl = `${webappUrl}/?b=${encodeURIComponent(slug)}`
      await ctx.reply(`Оплата: ${biz.name}`, {
        reply_markup: { inline_keyboard: [[{ text: 'Открыть оплату', web_app: { url: openUrl } }]] },
      })
      return
    }
    await ctx.reply('PayMini — приём оплаты в Telegram.', {
      reply_markup: { inline_keyboard: [[{ text: 'Открыть PayMini', web_app: { url: webappUrl } }]] },
    })
  })

  bot.launch().then(() => console.log('[bot] Telegram started')).catch((e) => {
    console.error('[bot] launch failed', e.message)
  })
  process.once('SIGINT', () => bot.stop('SIGINT'))
  process.once('SIGTERM', () => bot.stop('SIGTERM'))
}

server.listen(port, process.env.HOST || '0.0.0.0', () => {
  console.log(`[http] :${port} local=${local} demo=${isPaymeDemo()} bot=${!!bot}`)
})
