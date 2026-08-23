# Деплой на Render (не localhost)

## Один раз

1. Открой: https://dashboard.render.com/blueprint/new  
2. Подключи репо **timmiehub/paymini-uz**  
3. В переменных у сервиса **paymini-bot** вставь **BOT_TOKEN** (от BotFather)  
4. Нажми **Apply** — Render поднимет API и webapp с HTTPS  

После деплоя:

5. Скопируй URL webapp (например `https://paymini-web.onrender.com`)  
6. В терминале:
   ```powershell
   cd C:\Users\user\paymini-uz\bot
   $env:BOT_TOKEN="твой_токен"
   node setupTelegram.js https://paymini-web.onrender.com
   ```

## Проверка

@paymini_uz_bot → /start → «Открыть PayMini» → бизнес → QR → оплата (демо).

Payme callback: `https://paymini-bot.onrender.com/payme`
