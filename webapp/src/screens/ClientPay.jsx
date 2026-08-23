import { useEffect, useState } from 'react'
import { demoPay, getCheckout, getOrder } from '../lib/api.js'
import { getTelegramUser } from '../lib/utils.js'
import { Amount, Btn, Screen } from '../components/ui.jsx'

const useLocal = !import.meta.env.VITE_SUPABASE_URL

export function ClientPay({ business, orderId, onHome }) {
  const [order, setOrder] = useState(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    let stop = false
    async function load() {
      try {
        const o = await getOrder(orderId)
        if (!stop) setOrder(o)
      } catch (e) {
        if (!stop) setErr(e.message)
      }
    }
    load()
    const t = setInterval(load, 2500)
    let ch
    if (!useLocal) {
      import('../lib/supabase.js').then(({ requireSb }) => {
        try {
          const sb = requireSb()
          ch = sb
            .channel(`order-${orderId}`)
            .on(
              'postgres_changes',
              { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
              (payload) => setOrder(payload.new),
            )
            .subscribe()
        } catch {
          /* ignore */
        }
      })
    }
    return () => {
      stop = true
      clearInterval(t)
      if (ch) {
        import('../lib/supabase.js').then(({ requireSb }) => {
          try { requireSb().removeChannel(ch) } catch { /* ignore */ }
        })
      }
    }
  }, [orderId])

  async function pay() {
    setBusy(true)
    setErr('')
    try {
      const checkout = await getCheckout(orderId)
      if (checkout.demo) {
        await demoPay(orderId)
        setOrder(await getOrder(orderId))
      } else if (checkout.payUrl) {
        window.Telegram?.WebApp?.openLink?.(checkout.payUrl) || window.open(checkout.payUrl, '_blank')
      }
    } catch (e) {
      setErr(e.message || 'Ошибка оплаты')
    } finally {
      setBusy(false)
    }
  }

  if (!order && !err) {
    return (
      <Screen title={business.name}>
        <p className="text-[var(--muted)]">Загружаем счёт…</p>
      </Screen>
    )
  }

  if (err && !order) {
    return (
      <Screen title="Ошибка" onBack={onHome}>
        <p className="text-red-300">{err}</p>
      </Screen>
    )
  }

  if (order.status === 'paid') {
    return (
      <Screen title="Готово">
        <div className="rounded-3xl bg-[var(--card)] p-6 text-center">
          <div className="text-3xl text-[var(--accent)]">✓</div>
          <p className="mt-3 text-lg font-medium">Оплачено</p>
          <p className="mt-1 text-[var(--muted)]">
            <Amount value={order.amount_uzs} />
          </p>
        </div>
        <Btn variant="ghost" onClick={onHome}>
          Закрыть
        </Btn>
      </Screen>
    )
  }

  const user = getTelegramUser()

  return (
    <Screen title={business.name}>
      <div className="rounded-3xl bg-[var(--card)] p-6">
        <div className="text-sm text-[var(--muted)]">{order.title}</div>
        <div className="mt-2 text-3xl font-semibold">
          <Amount value={order.amount_uzs} />
        </div>
        <p className="mt-4 text-sm text-[var(--muted)]">
          Оплата займёт меньше минуты. Можно картой через Payme.
        </p>
      </div>
      {err ? <p className="text-sm text-red-300">{err}</p> : null}
      <Btn disabled={busy} onClick={pay}>
        {busy ? 'Открываем…' : 'Оплатить'}
      </Btn>
      <p className="text-center text-xs text-[var(--muted)]">Вы: {user.name}</p>
    </Screen>
  )
}
