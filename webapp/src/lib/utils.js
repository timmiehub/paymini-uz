export function getTelegramUser() {
  const tg = window.Telegram?.WebApp
  tg?.ready?.()
  tg?.expand?.()
  const u = tg?.initDataUnsafe?.user
  if (u?.id) {
    return {
      id: u.id,
      name: [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username || `tg_${u.id}`,
    }
  }
  const demoId = Number(localStorage.getItem('paymini_demo_tg') || 900001)
  localStorage.setItem('paymini_demo_tg', String(demoId))
  return { id: demoId, name: 'Demo Owner' }
}

export function formatUzs(n) {
  return `${Number(n).toLocaleString('ru-RU')} сум`
}

export function slugify(name) {
  const map = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
    и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
    с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch',
    ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
    ў: 'o', қ: 'q', ғ: 'g', ҳ: 'h',
  }
  return String(name || 'biz')
    .toLowerCase()
    .split('')
    .map((c) => map[c] || c)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 32) || `biz-${Date.now().toString(36)}`
}

export function botDeepLink(botUsername, slug) {
  if (!botUsername) return `${window.location.origin}/?b=${slug}`
  return `https://t.me/${botUsername}?start=b_${slug}`
}

export function payPageUrl(slug, orderId) {
  const u = new URL(window.location.origin)
  u.searchParams.set('b', slug)
  if (orderId) u.searchParams.set('order', orderId)
  return u.toString()
}
