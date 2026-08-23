import { requireDb } from './db.js'

const ORDER_NOT_FOUND = -31050
const ORDER_NOT_AVAILABLE = -31051
const INCORRECT_AMOUNT = -31001
const TRANSACTION_NOT_FOUND = -31003
const COULD_NOT_PERFORM = -31008
const AUTH_ERROR = -32504

function err(id, code, message, data) {
  return {
    jsonrpc: '2.0',
    id,
    error: { code, message, data },
  }
}

function ok(id, result) {
  return { jsonrpc: '2.0', id, result }
}

function authOk(req) {
  const key = process.env.PAYME_MERCHANT_KEY || ''
  if (!key) return false
  const h = req.headers.authorization || ''
  if (!h.startsWith('Basic ')) return false
  const decoded = Buffer.from(h.slice(6), 'base64').toString('utf8')
  const expected = `Paycom:${key}`
  return decoded === expected
}

async function getOrder(orderId) {
  const db = requireDb()
  const { data, error } = await db.from('orders').select('*').eq('id', orderId).maybeSingle()
  if (error) throw error
  return data
}

async function getPaymentByExternal(externalId) {
  const db = requireDb()
  const { data, error } = await db
    .from('payments')
    .select('*')
    .eq('provider', 'payme')
    .eq('external_id', String(externalId))
    .maybeSingle()
  if (error) throw error
  return data
}

async function markOrderPaid(orderId, externalId) {
  const db = requireDb()
  const now = new Date().toISOString()
  await db.from('orders').update({ status: 'paid', paid_at: now }).eq('id', orderId)
  await db
    .from('payments')
    .update({ status: 'paid', state: 2, paid_at: now })
    .eq('provider', 'payme')
    .eq('external_id', String(externalId))
}

export function createPaymeMerchantHandler({ onPaid } = {}) {
  return async function handlePayme(req, res) {
    if (req.method !== 'POST') {
      res.writeHead(405)
      res.end('Method Not Allowed')
      return
    }

    let body = ''
    for await (const chunk of req) body += chunk

    let rpc
    try {
      rpc = JSON.parse(body || '{}')
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(err(null, -32700, 'Parse error')))
      return
    }

    if (!authOk(req)) {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(err(rpc.id, AUTH_ERROR, 'Unauthorized')))
      return
    }

    const { method, params, id } = rpc
    let response

    try {
      switch (method) {
        case 'CheckPerformTransaction': {
          const orderId = params?.account?.order_id
          const amount = Number(params?.amount)
          const order = await getOrder(orderId)
          if (!order) {
            response = err(id, ORDER_NOT_FOUND, 'Order not found', { order_id: orderId })
            break
          }
          if (order.status !== 'pending') {
            response = err(id, ORDER_NOT_AVAILABLE, 'Order not available')
            break
          }
          if (amount !== order.amount_uzs * 100) {
            response = err(id, INCORRECT_AMOUNT, 'Incorrect amount')
            break
          }
          response = ok(id, { allow: true })
          break
        }
        case 'CreateTransaction': {
          const orderId = params?.account?.order_id
          const amount = Number(params?.amount)
          const tid = String(params?.id)
          const order = await getOrder(orderId)
          if (!order) {
            response = err(id, ORDER_NOT_FOUND, 'Order not found')
            break
          }
          if (order.status !== 'pending') {
            response = err(id, ORDER_NOT_AVAILABLE, 'Order not available')
            break
          }
          if (amount !== order.amount_uzs * 100) {
            response = err(id, INCORRECT_AMOUNT, 'Incorrect amount')
            break
          }
          const existing = await getPaymentByExternal(tid)
          const db = requireDb()
          if (existing) {
            response = ok(id, {
              create_time: new Date(existing.created_at).getTime(),
              transaction: existing.id,
              state: existing.state,
            })
            break
          }
          const { data: payment, error } = await db
            .from('payments')
            .insert({
              order_id: order.id,
              provider: 'payme',
              amount_uzs: order.amount_uzs,
              external_id: tid,
              state: 1,
              status: 'pending',
              raw: params || {},
            })
            .select('*')
            .single()
          if (error) throw error
          response = ok(id, {
            create_time: new Date(payment.created_at).getTime(),
            transaction: payment.id,
            state: 1,
          })
          break
        }
        case 'PerformTransaction': {
          const tid = String(params?.id)
          const payment = await getPaymentByExternal(tid)
          if (!payment) {
            response = err(id, TRANSACTION_NOT_FOUND, 'Transaction not found')
            break
          }
          if (payment.state === 2) {
            response = ok(id, {
              transaction: payment.id,
              perform_time: new Date(payment.paid_at || payment.created_at).getTime(),
              state: 2,
            })
            break
          }
          if (payment.state !== 1) {
            response = err(id, COULD_NOT_PERFORM, 'Cannot perform')
            break
          }
          await markOrderPaid(payment.order_id, tid)
          if (onPaid) await onPaid(payment.order_id)
          response = ok(id, {
            transaction: payment.id,
            perform_time: Date.now(),
            state: 2,
          })
          break
        }
        case 'CancelTransaction': {
          const tid = String(params?.id)
          const payment = await getPaymentByExternal(tid)
          if (!payment) {
            response = err(id, TRANSACTION_NOT_FOUND, 'Transaction not found')
            break
          }
          const db = requireDb()
          const reason = params?.reason
          const newState = payment.state === 2 ? -2 : -1
          await db
            .from('payments')
            .update({ state: newState, status: 'cancelled', raw: { ...(payment.raw || {}), cancel_reason: reason } })
            .eq('id', payment.id)
          if (payment.state !== 2) {
            await db.from('orders').update({ status: 'cancelled' }).eq('id', payment.order_id)
          }
          response = ok(id, {
            transaction: payment.id,
            cancel_time: Date.now(),
            state: newState,
          })
          break
        }
        case 'CheckTransaction': {
          const tid = String(params?.id)
          const payment = await getPaymentByExternal(tid)
          if (!payment) {
            response = err(id, TRANSACTION_NOT_FOUND, 'Transaction not found')
            break
          }
          response = ok(id, {
            create_time: new Date(payment.created_at).getTime(),
            perform_time: payment.paid_at ? new Date(payment.paid_at).getTime() : 0,
            cancel_time: payment.status === 'cancelled' ? Date.now() : 0,
            transaction: payment.id,
            state: payment.state,
            reason: payment.raw?.cancel_reason ?? null,
          })
          break
        }
        case 'GetStatement': {
          response = ok(id, { transactions: [] })
          break
        }
        default:
          response = err(id, -32601, 'Method not found')
      }
    } catch (e) {
      console.error('[payme]', e)
      response = err(id, -32400, 'Internal error')
    }

    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(response))
  }
}
