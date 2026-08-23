# Деплой (не localhost)

## 1. GitHub Pages — приложение

Репо: `timmiehub/paymini-uz`  
URL: **https://timmiehub.github.io/paymini-uz/**

После push в `main`/`master` GitHub Actions сам соберёт webapp.

## 2. Render — бот + API

1. Зайди на https://dashboard.render.com → **New → Blueprint** → подключи репо `paymini-uz`.
2. В переменных сервиса `paymini-bot`:
   - `BOT_TOKEN` — токен от BotFather
   - `WEBAPP_URL` — `https://timmiehub.github.io/paymini-uz`
3. Deploy. Скопируй URL вида `https://paymini-bot-xxxx.onrender.com`

## 3. Связать webapp и API

GitHub → репо → **Settings → Secrets and variables → Actions → Variables**  
Добавь: `VITE_API_URL` = URL Render (шаг 2).  
Перезапусти workflow **Deploy webapp**.

## 4. Кнопка в Telegram

```powershell
cd bot
$env:WEBAPP_URL="https://timmiehub.github.io/paymini-uz"
node setupTelegram.js $env:WEBAPP_URL
```

## 5. Проверка

1. @paymini_uz_bot → /start → «Открыть PayMini»
2. Создай бизнес → демо → QR → оплата

Payme callback для прод: `https://ВАШ-RENDER-URL/payme`
