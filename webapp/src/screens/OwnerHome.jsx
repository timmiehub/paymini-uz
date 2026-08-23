import { Btn, Screen } from '../components/ui.jsx'

export function OwnerHome({ business, onLive, onPayme, onOrders }) {
  const connected = business.settings?.payme_connected || business.payme_merchant_id
  return (
    <Screen title={business.name}>
      <p className="text-sm text-[var(--muted)]">
        Покажите QR клиенту — он отсканирует и оплатит. Без терминала и сайта.
      </p>
      <div className={`rounded-2xl px-4 py-3 text-sm ${connected ? 'bg-[var(--accent)]/15 text-[var(--accent)]' : 'bg-[var(--warn)]/15 text-[var(--warn)]'}`}>
        {connected ? 'Payme подключен — деньги идут на вашу кассу' : 'Payme ещё не подключен — можно попробовать демо или пройти 3 шага'}
      </div>
      <Btn onClick={onLive}>Принять оплату (QR)</Btn>
      <Btn variant="ghost" onClick={onOrders}>История платежей</Btn>
      <Btn variant="ghost" onClick={onPayme}>Как подключить Payme</Btn>
    </Screen>
  )
}
