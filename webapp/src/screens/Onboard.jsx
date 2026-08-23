import { useState } from 'react'
import { createBusiness, upsertProfile } from '../lib/api.js'
import { slugify } from '../lib/utils.js'
import { Btn, Field, Screen, inputCls } from '../components/ui.jsx'

const CITIES = ['Tashkent', 'Samarkand', 'Bukhara', 'Namangan', 'Andijan', 'Fergana', 'Nukus']

export function Onboard({ user, onDone }) {
  const [name, setName] = useState('')
  const [city, setCity] = useState('Tashkent')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function submit(e) {
    e.preventDefault()
    setErr('')
    setBusy(true)
    try {
      await upsertProfile(user)
      let slug = slugify(name)
      try {
        const biz = await createBusiness({ ownerId: user.id, name: name.trim(), city, slug })
        onDone(biz)
      } catch (e1) {
        if (String(e1.message || '').includes('duplicate') || e1.code === '23505') {
          slug = `${slug}-${Date.now().toString(36).slice(-4)}`
          const biz = await createBusiness({ ownerId: user.id, name: name.trim(), city, slug })
          onDone(biz)
        } else throw e1
      }
    } catch (e2) {
      setErr(e2.message || 'Не удалось создать')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Screen title="Ваш бизнес">
      <p className="text-sm text-[var(--muted)]">
        Дальше подключите Payme по инструкции и принимайте оплату по QR у стойки.
      </p>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Название">
          <input className={inputCls()} value={name} onChange={(e) => setName(e.target.value)} required placeholder="Кафе Утреннее" />
        </Field>
        <Field label="Город">
          <select className={inputCls()} value={city} onChange={(e) => setCity(e.target.value)}>
            {CITIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </Field>
        {err ? <p className="text-sm text-red-300">{err}</p> : null}
        <Btn type="submit" disabled={busy || !name.trim()}>{busy ? 'Создаём…' : 'Продолжить'}</Btn>
      </form>
    </Screen>
  )
}
