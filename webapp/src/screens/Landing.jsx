import { Btn } from '../components/ui.jsx'

const BOT = import.meta.env.VITE_BOT_USERNAME || 'paymini_uz_bot'

export function Landing() {
  return (
    <div className="mx-auto min-h-dvh max-w-lg px-4 py-10">
      <p className="mb-2 text-sm font-medium text-[var(--accent)]">PayMini</p>
      <h1 className="text-3xl font-bold leading-tight tracking-tight">
        Оплата по QR без терминала
      </h1>
      <p className="mt-4 text-[var(--muted)]">
        Клиент сканирует код и платит картой. Работает на сайте и в Telegram.
      </p>

      <div className="mt-8 flex flex-col gap-3">
        <Btn onClick={() => { window.location.href = '/app' }}>Начать — на сайте</Btn>
        <Btn variant="ghost" onClick={() => { window.open(`https://t.me/${BOT}`, '_blank') }}>
          Открыть в Telegram
        </Btn>
      </div>

      <ol className="mt-10 flex flex-col gap-4">
        {[
          ['1', 'Подключите Payme по простой инструкции'],
          ['2', 'Введите сумму — покажите QR клиенту'],
          ['3', 'Деньги на вашу кассу, уведомление в Telegram'],
        ].map(([n, t]) => (
          <li key={n} className="flex gap-3 rounded-2xl bg-[var(--card)] p-4">
            <span className="text-[var(--accent)]">{n}.</span>
            <span>{t}</span>
          </li>
        ))}
      </ol>

      <p className="mt-8 text-center text-xs text-[var(--muted)]">
        Для кафе, мастеров, репетиторов, ИП — любой микробизнес в UZ
      </p>
    </div>
  )
}
