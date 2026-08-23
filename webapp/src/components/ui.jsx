import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { formatUzs } from '../lib/utils.js'

export function QrBlock({ url, size = 220 }) {
  const [src, setSrc] = useState('')
  useEffect(() => {
    if (!url) return
    QRCode.toDataURL(url, { width: size, margin: 1, color: { dark: '#0f1419', light: '#ffffff' } })
      .then(setSrc)
      .catch(console.error)
  }, [url, size])
  if (!src) return <div className="h-56 w-56 animate-pulse rounded-2xl bg-[var(--card)]" />
  return <img src={src} alt="QR" width={size} height={size} className="rounded-2xl bg-white p-2" />
}

export function Amount({ value }) {
  return <span className="tabular-nums font-semibold">{formatUzs(value)}</span>
}

export function Screen({ title, children, onBack }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-4 pb-8 pt-4">
      <header className="mb-5 flex items-center gap-3">
        {onBack ? (
          <button type="button" onClick={onBack} className="rounded-lg px-2 py-1 text-[var(--muted)] hover:bg-[var(--card)]">
            ←
          </button>
        ) : null}
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      </header>
      <div className="flex flex-1 flex-col gap-4">{children}</div>
    </div>
  )
}

export function Btn({ children, onClick, variant = 'primary', disabled, type = 'button', className = '' }) {
  const base = 'w-full rounded-xl px-4 py-3.5 font-medium transition disabled:opacity-40'
  const styles = {
    primary: 'bg-[var(--accent)] text-[#06261c] hover:brightness-105',
    ghost: 'bg-[var(--card)] text-[var(--text)] hover:brightness-110',
    warn: 'bg-[var(--warn)] text-[#1a1200]',
  }
  return (
    <button type={type} disabled={disabled} onClick={onClick} className={`${base} ${styles[variant]} ${className}`}>
      {children}
    </button>
  )
}

export function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="text-[var(--muted)]">{label}</span>
      {children}
    </label>
  )
}

export function inputCls() {
  return 'rounded-xl border border-white/10 bg-[var(--card)] px-3 py-3 text-[var(--text)] outline-none focus:border-[var(--accent)]'
}
