import { useEffect, useMemo, useState } from 'react'
import { getTelegramUser } from './lib/utils.js'
import { getBusinessByOwner, getBusinessBySlug } from './lib/api.js'
import { Onboard } from './screens/Onboard.jsx'
import { PaymeSetup } from './screens/PaymeSetup.jsx'
import { OwnerHome } from './screens/OwnerHome.jsx'
import { LivePay } from './screens/LivePay.jsx'
import { ClientPay } from './screens/ClientPay.jsx'
import { Orders } from './screens/Orders.jsx'
import { Btn, Screen } from './components/ui.jsx'

function parseQuery() {
  const q = new URLSearchParams(window.location.search)
  return { b: q.get('b'), order: q.get('order') }
}

export default function App() {
  const user = useMemo(() => getTelegramUser(), [])
  const q = useMemo(() => parseQuery(), [])
  const [mode, setMode] = useState(q.b ? 'client' : 'boot')
  const [business, setBusiness] = useState(null)
  const [screen, setScreen] = useState('home')
  const [err, setErr] = useState('')

  useEffect(() => {
    let cancelled = false
    async function boot() {
      try {
        if (q.b) {
          const biz = await getBusinessBySlug(q.b)
          if (!biz) throw new Error('Бизнес не найден')
          if (!cancelled) {
            setBusiness(biz)
            setMode('client')
            setScreen(q.order ? 'pay' : 'wait')
          }
          return
        }
        const biz = await getBusinessByOwner(user.id)
        if (!cancelled) {
          setBusiness(biz)
          setMode('owner')
          setScreen(biz ? 'home' : 'onboard')
        }
      } catch (e) {
        if (!cancelled) setErr(e.message || 'Ошибка загрузки')
      }
    }
    boot()
    return () => { cancelled = true }
  }, [user.id, q.b, q.order])

  if (err) {
    return (
      <Screen title="PayMini">
        <p className="text-red-300">{err}</p>
      </Screen>
    )
  }

  if (mode === 'boot' || (mode === 'client' && !business)) {
    return (
      <Screen title="PayMini">
        <p className="text-[var(--muted)]">Загрузка…</p>
      </Screen>
    )
  }

  if (mode === 'owner') {
    if (screen === 'onboard') {
      return <Onboard user={user} onDone={(biz) => { setBusiness(biz); setScreen('payme') }} />
    }
    if (screen === 'payme') {
      return (
        <PaymeSetup
          business={business}
          onDone={(biz) => { setBusiness(biz); setScreen('home') }}
          onSkip={() => setScreen('home')}
        />
      )
    }
    if (screen === 'live') {
      return <LivePay business={business} onBack={() => setScreen('home')} />
    }
    if (screen === 'orders') {
      return <Orders business={business} onBack={() => setScreen('home')} />
    }
    return (
      <OwnerHome
        business={business}
        onLive={() => setScreen('live')}
        onPayme={() => setScreen('payme')}
        onOrders={() => setScreen('orders')}
      />
    )
  }

  if (screen === 'pay' && q.order) {
    return (
      <ClientPay
        business={business}
        orderId={q.order}
        onHome={() => {
          window.location.href = `/?b=${encodeURIComponent(business.slug)}`
        }}
      />
    )
  }

  return (
    <Screen title={business.name}>
      <p className="text-sm text-[var(--muted)]">
        Попросите продавца показать QR с суммой на своём телефоне — отсканируйте и оплатите.
      </p>
      <Btn variant="ghost" onClick={() => window.Telegram?.WebApp?.close?.()}>
        Закрыть
      </Btn>
    </Screen>
  )
}
