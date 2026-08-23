import { useState } from 'react'
import { savePaymeSettings } from '../lib/api.js'
import { Btn, Field, Screen, inputCls } from '../components/ui.jsx'

const STEPS = [
  {
    t: 'Зарегистрируйтесь в Payme Business',
    d: 'Если ещё нет — откройте business.payme.uz или приложение Payme и создайте кабинет для бизнеса. Это бесплатно.',
  },
  {
    t: 'Найдите номер кассы',
    d: 'В кабинете Payme откройте раздел «Касса» или «Мой магазин». Там будет номер — длинная строка из цифр и букв. Скопируйте её.',
  },
  {
    t: 'Вставьте номер сюда',
    d: 'Вставьте скопированный номер в поле ниже и нажмите «Готово». Техническую часть мы донастроим сами — вам не нужно разбираться.',
  },
]

export function PaymeSetup({ business, onDone, onSkip }) {
  const [merchantId, setMerchantId] = useState(business.payme_merchant_id || '')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function save(connected) {
    setBusy(true)
    setErr('')
    try {
      const biz = await savePaymeSettings(business.id, {
        merchantId: merchantId.trim() || null,
        connected,
      })
      onDone(biz)
    } catch (e) {
      setErr(e.message || 'Не сохранилось. Попробуйте ещё раз.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Screen title="Подключить Payme" onBack={onSkip}>
      <p className="text-sm text-[var(--muted)]">
        Три шага. Без сайта, без программиста. Если застрянете — напишите нам, подключим удалённо.
      </p>
      <ol className="flex flex-col gap-3">
        {STEPS.map((s, i) => (
          <li key={s.t} className="rounded-2xl bg-[var(--card)] p-4">
            <div className="mb-1 text-xs font-medium text-[var(--accent)]">{i + 1}.</div>
            <div className="font-medium">{s.t}</div>
            <p className="mt-1 text-sm text-[var(--muted)]">{s.d}</p>
          </li>
        ))}
      </ol>
      <Field label="Номер кассы Payme">
        <input
          className={inputCls()}
          value={merchantId}
          onChange={(e) => setMerchantId(e.target.value)}
          placeholder="вставьте номер из кабинета Payme"
        />
      </Field>
      <p className="text-xs text-[var(--muted)]">
        Не нашли номер? Напишите в поддержку — подключим за вас при Setup.
      </p>
      {err ? <p className="text-sm text-red-300">{err}</p> : null}
      <Btn disabled={busy || !merchantId.trim()} onClick={() => save(true)}>
        {busy ? 'Сохраняем…' : 'Готово'}
      </Btn>
      <Btn variant="ghost" disabled={busy} onClick={() => save(false)}>
        Пока без Payme — попробовать демо
      </Btn>
    </Screen>
  )
}
