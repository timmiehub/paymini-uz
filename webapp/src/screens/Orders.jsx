import { useEffect, useState } from 'react'
import { listOrders } from '../lib/api.js'
import { Amount, Btn, Screen } from '../components/ui.jsx'

export function Orders({ business, onBack }) {
  const [rows, setRows] = useState([])
  const [err, setErr] = useState('')

  useEffect(() => {
    listOrders(business.id)
      .then(setRows)
      .catch((e) => setErr(e.message))
  }, [business.id])

  return (
    <Screen title="Платежи" onBack={onBack}>
      {err ? <p className="text-sm text-red-300">{err}</p> : null}
      {!rows.length && !err ? <p className="text-sm text-[var(--muted)]">Пока пусто — примите первую оплату по QR.</p> : null}
      <ul className="flex flex-col gap-2">
        {rows.map((o) => (
          <li key={o.id} className="flex items-center justify-between rounded-2xl bg-[var(--card)] px-4 py-3">
            <div>
              <div className="font-medium">{o.title}</div>
              <div className="text-xs text-[var(--muted)]">{new Date(o.created_at).toLocaleString('ru-RU')}</div>
            </div>
            <div className="text-right">
              <Amount value={o.amount_uzs} />
              <div className={`text-xs ${o.status === 'paid' ? 'text-[var(--accent)]' : 'text-[var(--warn)]'}`}>
                {o.status === 'paid' ? 'оплачено' : o.status}
              </div>
            </div>
          </li>
        ))}
      </ul>
      <Btn variant="ghost" onClick={() => listOrders(business.id).then(setRows)}>Обновить</Btn>
    </Screen>
  )
}
