import { randomUUID } from 'node:crypto'

const store = {
  profiles: new Map(),
  businesses: new Map(),
  offers: new Map(),
  orders: new Map(),
  payments: new Map(),
}

function now() {
  return new Date().toISOString()
}

export const localDb = {
  upsertProfile({ telegram_id, display_name, role = 'owner' }) {
    const existing = [...store.profiles.values()].find((p) => p.telegram_id === telegram_id)
    if (existing) {
      existing.display_name = display_name
      existing.role = role
      return existing
    }
    const row = { id: randomUUID(), telegram_id, display_name, role, created_at: now() }
    store.profiles.set(row.id, row)
    return row
  },

  getBusinessByOwner(telegramId) {
    return [...store.businesses.values()]
      .filter((b) => b.owner_telegram_id === telegramId)
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))[0] || null
  },

  getBusinessBySlug(slug) {
    return [...store.businesses.values()].find((b) => b.slug === slug) || null
  },

  getBusiness(id) {
    return store.businesses.get(id) || null
  },

  createBusiness({ owner_telegram_id, name, city, slug, timezone = 'Asia/Tashkent' }) {
    if ([...store.businesses.values()].some((b) => b.slug === slug)) {
      const err = new Error('duplicate slug')
      err.code = '23505'
      throw err
    }
    const row = {
      id: randomUUID(),
      owner_telegram_id,
      name,
      city: city || 'Tashkent',
      slug,
      timezone,
      payme_merchant_id: null,
      settings: { payme_connected: false },
      created_at: now(),
    }
    store.businesses.set(row.id, row)
    return row
  },

  updateBusiness(id, patch) {
    const row = store.businesses.get(id)
    if (!row) return null
    Object.assign(row, patch)
    return row
  },

  listOffers(businessId) {
    return [...store.offers.values()]
      .filter((o) => o.business_id === businessId && o.is_active)
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
  },

  createOffer(data) {
    const row = {
      id: randomUUID(),
      is_active: true,
      type: 'pay_link',
      description: null,
      duration_min: null,
      created_at: now(),
      ...data,
    }
    store.offers.set(row.id, row)
    return row
  },

  createOrder(data) {
    const row = {
      id: randomUUID(),
      status: 'pending',
      offer_id: null,
      client_telegram_id: null,
      meta: {},
      paid_at: null,
      created_at: now(),
      ...data,
    }
    store.orders.set(row.id, row)
    return row
  },

  getOrder(id) {
    return store.orders.get(id) || null
  },

  updateOrder(id, patch) {
    const row = store.orders.get(id)
    if (!row) return null
    Object.assign(row, patch)
    return row
  },

  listOrders(businessId, limit = 20) {
    return [...store.orders.values()]
      .filter((o) => o.business_id === businessId)
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
      .slice(0, limit)
  },

  createPayment(data) {
    const row = {
      id: randomUUID(),
      provider: 'payme',
      state: 0,
      status: 'created',
      raw: {},
      paid_at: null,
      created_at: now(),
      ...data,
    }
    store.payments.set(row.id, row)
    return row
  },

  getPaymentByExternal(externalId) {
    return [...store.payments.values()].find(
      (p) => p.provider === 'payme' && p.external_id === String(externalId),
    ) || null
  },

  updatePayment(id, patch) {
    const row = store.payments.get(id)
    if (!row) return null
    Object.assign(row, patch)
    return row
  },

  markOrderPaid(orderId, externalId) {
    const ts = now()
    this.updateOrder(orderId, { status: 'paid', paid_at: ts })
    const pay = this.getPaymentByExternal(externalId)
    if (pay) this.updatePayment(pay.id, { status: 'paid', state: 2, paid_at: ts })
  },
}

export function isLocalMode() {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) return false
  return process.env.LOCAL_STORE !== '0'
}
