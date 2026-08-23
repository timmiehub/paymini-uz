#!/usr/bin/env node
import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const dir = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(dir, '.env') })

const token = process.env.BOT_TOKEN
const webappUrl = process.argv[2] || process.env.WEBAPP_URL

if (!token || !webappUrl) {
  console.error('Usage: node setupTelegram.js https://your-webapp-url')
  process.exit(1)
}

const base = `https://api.telegram.org/bot${token}`

async function call(method, body) {
  const r = await fetch(`${base}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const j = await r.json()
  if (!j.ok) throw new Error(`${method}: ${j.description}`)
  return j.result
}

const me = await call('getMe', {})
console.log('Bot:', `@${me.username}`)

await call('setChatMenuButton', {
  menu_button: {
    type: 'web_app',
    text: 'Открыть PayMini',
    web_app: { url: webappUrl.replace(/\/$/, '') },
  },
})
console.log('Menu button →', webappUrl)

await call('setMyDescription', {
  description: 'Приём оплаты по QR. Клиент сканирует и платит за полминуты.',
})
await call('setMyShortDescription', {
  short_description: 'Оплата по QR для вашего бизнеса',
})
console.log('Descriptions updated')
