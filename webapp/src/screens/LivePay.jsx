import { useMemo, useState } from 'react'
import { createOrder } from '../lib/api.js'
import { payPageUrl } from '../lib/utils.js'
import { Amount, Btn, Field, QrBlock, Screen, inputCls } from '../components/ui.jsx'

export function LivePay({ business, onBack }) {
  const [amount, setAmount] = useState('')
  const [title, setTitle] = useState('Оплата')
  const [order, setOrder] = useState(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const payUrl = useMemo(() => {
    if (!order) return ''
    return payPageUrl(business.slug, order.id)
  }, [order, business.slug])

  async function create() {
    setErr('')
    const n = Number(String(amount).replace(/\s/g, ''))
    if (!n || n < 1000) {
      setErr('Минимум 1 000 сум')
      return
    }
    setBusy(true)
    try {
      const o = await createOrder({
        businessId: business.id,
        title: title.trim() || 'Оплата',
        amountUzs: n,
        meta: { source: 'live_qr' },
      })
      setOrder(o)
    } catch (e) {
      setErr(e.message || 'Не удалось создать счёт')
    } finally {
      setBusy(false)
    }
  }

  if (order && payUrl) {
    return (
      <Screen title="Покажите клиенту" onBack={() => setOrder(null)}>
        <div className="flex flex-col items-center gap-4 rounded-3xl bg-[var(--card)] px-4 py-8">
          <QrBlock url={payUrl} size={240} />
          <div className="text-center">
            <div className="text-sm text-[var(--muted)]">{order.title}</div>
            <div className="mt-1 text-2xl"><Amount value={order.amount_uzs} /></div>
          </div>
          <p className="max-w-xs text-center text-sm text-[var(--muted)]">
            Клиент сканирует QR → открывает ссылку → платит в Payme. Деньги приходят на ваш мерчант.
          </p>
        </div>
        <Btn variant="ghost" onClick={() => { navigator.clipboard?.writeText(payUrl) }}>
          Скопировать ссылку
        </Btn>
        <Btn onClick={() => { setOrder(null); setAmount('') }}>Новая сумма</Btn>
      </Screen>
    )
  }

  return (
    <Screen title="Принять оплату" onBack={onBack}>
      <p className="text-sm text-[var(--muted)]">
        Введите сумму — появится QR. Клиент сканирует телефоном и платит.
      </p>
      <Field label="Сумма (сум)">
        <input
          className={inputCls()}
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="50000"
        />
      </Field>
      <Field label="За что (необязательно)">
        <input className={inputCls()} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Кофе, услуга, заказ" />
      </Field>
      {err ? <p className="text-sm text-red-300">{err}</p> : null}
      <Btn disabled={busy} onClick={create}>{busy ? 'Создаём…' : 'Показать QR'}</Btn>
    </Screen>
  )
}
