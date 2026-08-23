# PayMini UZ

Лёгкая оплата в Telegram для малого бизнеса в Узбекистане.

- **Ядро:** pay-link → Payme → уведомление владельцу
- **Шаблоны позже:** каталог, запись с предоплатой
- **Не форк** telegram.booking — только идеи для модуля записи

## Структура

```
bot/       Telegraf + Payme Merchant API + уведомления
webapp/    Telegram Mini App (онбординг, оплата, заказы)
supabase/  schema v1 (payment-first)
```

## Быстрый старт

1. Скопируй `.env.example` → `bot/.env` и `webapp/.env`
2. Создай проект Supabase, выполни `supabase/schema.sql`
3. BotFather → токен → `BOT_TOKEN`
4. `cd bot && npm i && npm run dev`
5. `cd webapp && npm i && npm run dev`
6. В BotFather: Menu Button → URL webapp (или ngrok)

С `PAYME_DEMO=1` оплата работает без ключей Payme.

## Проверка

1. Открой Mini App → «Я принимаю оплату» → создай ссылку
2. Открой deeplink клиента → «Оплатить»
3. Владелец получает сообщение в Telegram
