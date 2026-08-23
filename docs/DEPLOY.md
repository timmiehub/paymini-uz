# Деплой на Render (HTTPS, не localhost)

## 2 минуты

1. Открой: **https://render.com/deploy?repo=https://github.com/timmiehub/paymini-uz**
2. Войди в Render (Google/GitHub).
3. В поле **BOT_TOKEN** вставь токен от @BotFather.
4. Нажми **Apply** — подождите 3–5 минут.

Render даст URL вида `https://paymini-xxxx.onrender.com` — это и приложение, и API.

Бот сам поставит кнопку «Открыть PayMini» в Telegram.

## Проверка

1. @paymini_uz_bot → /start
2. «Открыть PayMini» → создай бизнес → демо → QR → оплата

Payme callback (позже): `https://ВАШ-URL.onrender.com/payme`
