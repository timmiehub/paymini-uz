let API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
if (API_BASE && !/^https?:\/\//i.test(API_BASE)) API_BASE = `https://${API_BASE}`
const useLocal = !import.meta.env.VITE_SUPABASE_URL

async function api(path, { method = 'GET', body } = {}) {
  const url = `${API_BASE}${path}`
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(json.error || json.message || `HTTP ${res.status}`)
    err.code = json.code
    throw err
  }
  return json
}

export async function upsertProfile(user) {
  if (!useLocal) {
    const { requireSb } = await import('./supabase.js')
    const sb = requireSb()
    const { data, error } = await sb
      .from('profiles')
      .upsert(
        { telegram_id: user.id, display_name: user.name, role: 'owner' },
        { onConflict: 'telegram_id' },
      )
      .select('*')
      .single()
    if (error) throw error
    return data
  }
  return api('/api/profile', {
    method: 'POST',
    body: { telegram_id: user.id, display_name: user.name, role: 'owner' },
  })
}

export async function getBusinessByOwner(telegramId) {
  if (!useLocal) {
    const { requireSb } = await import('./supabase.js')
    const sb = requireSb()
    const { data, error } = await sb
      .from('businesses')
      .select('*')
      .eq('owner_telegram_id', telegramId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error) throw error
    return data
  }
  return api(`/api/business/by-owner?telegram_id=${telegramId}`)
}

export async function getBusinessBySlug(slug) {
  if (!useLocal) {
    const { requireSb } = await import('./supabase.js')
    const sb = requireSb()
    const { data, error } = await sb.from('businesses').select('*').eq('slug', slug).maybeSingle()
    if (error) throw error
    return data
  }
  return api(`/api/business/by-slug?slug=${encodeURIComponent(slug)}`)
}

export async function createBusiness({ ownerId, name, city, slug }) {
  if (!useLocal) {
    const { requireSb } = await import('./supabase.js')
    const sb = requireSb()
    const { data, error } = await sb
      .from('businesses')
      .insert({
        owner_telegram_id: ownerId,
        name,
        city: city || 'Tashkent',
        slug,
        timezone: 'Asia/Tashkent',
        settings: { payme_connected: false },
      })
      .select('*')
      .single()
    if (error) throw error
    return data
  }
  return api('/api/business', {
    method: 'POST',
    body: {
      owner_telegram_id: ownerId,
      name,
      city: city || 'Tashkent',
      slug,
    },
  })
}

export async function savePaymeSettings(businessId, { merchantId, connected }) {
  if (!useLocal) {
    const { requireSb } = await import('./supabase.js')
    const sb = requireSb()
    const { data: biz } = await sb.from('businesses').select('settings').eq('id', businessId).single()
    const settings = { ...(biz?.settings || {}), payme_connected: !!connected }
    const { data, error } = await sb
      .from('businesses')
      .update({ payme_merchant_id: merchantId || null, settings })
      .eq('id', businessId)
      .select('*')
      .single()
    if (error) throw error
    return data
  }
  return api('/api/business/payme', {
    method: 'POST',
    body: { businessId, merchantId, connected },
  })
}

export async function listOffers(businessId) {
  if (!useLocal) {
    const { requireSb } = await import('./supabase.js')
    const sb = requireSb()
    const { data, error } = await sb
      .from('offers')
      .select('*')
      .eq('business_id', businessId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  }
  return api(`/api/offers?business_id=${businessId}`)
}

export async function createOffer({ businessId, title, priceUzs, description }) {
  if (!useLocal) {
    const { requireSb } = await import('./supabase.js')
    const sb = requireSb()
    const { data, error } = await sb
      .from('offers')
      .insert({
        business_id: businessId,
        title,
        description: description || null,
        price_uzs: Number(priceUzs),
        type: 'pay_link',
      })
      .select('*')
      .single()
    if (error) throw error
    return data
  }
  return api('/api/offers', {
    method: 'POST',
    body: {
      business_id: businessId,
      title,
      description: description || null,
      price_uzs: Number(priceUzs),
      type: 'pay_link',
    },
  })
}

export async function createOrder({ businessId, offerId, title, amountUzs, clientTelegramId, meta }) {
  if (!useLocal) {
    const { requireSb } = await import('./supabase.js')
    const sb = requireSb()
    const { data, error } = await sb
      .from('orders')
      .insert({
        business_id: businessId,
        offer_id: offerId || null,
        title,
        amount_uzs: Number(amountUzs),
        client_telegram_id: clientTelegramId || null,
        status: 'pending',
        meta: meta || {},
      })
      .select('*')
      .single()
    if (error) throw error
    return data
  }
  return api('/api/orders', {
    method: 'POST',
    body: {
      business_id: businessId,
      offer_id: offerId || null,
      title,
      amount_uzs: Number(amountUzs),
      client_telegram_id: clientTelegramId || null,
      status: 'pending',
      meta: meta || {},
    },
  })
}

export async function getOrder(orderId) {
  if (!useLocal) {
    const { requireSb } = await import('./supabase.js')
    const sb = requireSb()
    const { data, error } = await sb.from('orders').select('*').eq('id', orderId).maybeSingle()
    if (error) throw error
    return data
  }
  return api(`/api/orders?id=${orderId}`)
}

export async function listOrders(businessId, limit = 20) {
  if (!useLocal) {
    const { requireSb } = await import('./supabase.js')
    const sb = requireSb()
    const { data, error } = await sb
      .from('orders')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    return data || []
  }
  return api(`/api/orders?business_id=${businessId}`)
}

export async function demoPay(orderId) {
  return api('/api/demo-pay', { method: 'POST', body: { orderId } })
}

export async function getCheckout(orderId) {
  return api('/api/checkout', { method: 'POST', body: { orderId } })
}
