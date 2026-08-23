# Supabase — пошагово

Данные перестанут пропадать при перезапуске Render.

## 1. Создай проект

1. Зайди на https://supabase.com → **Start your project** → войди через GitHub.
2. **New project** → имя `paymini` → пароль БД (сохрани) → регион ближе к EU → **Create**.

Подожди 1–2 минуты, пока проект создаётся.

## 2. Таблицы

1. Слева **SQL Editor** → **New query**.
2. Открой файл `supabase/schema.sql` из репо (или скопируй с GitHub).
3. Вставь весь текст → **Run** → должно быть **Success**.

## 3. Скопируй ключи

**Project Settings** (шестерёнка) → **API**:

| Что | Куда |
|-----|------|
| **Project URL** | `SUPABASE_URL` и `VITE_SUPABASE_URL` |
| **anon public** | `VITE_SUPABASE_ANON_KEY` |
| **service_role** (секрет!) | `SUPABASE_SERVICE_ROLE_KEY` |

## 4. Вставь в Render

1. https://dashboard.render.com → сервис **paymini** → **Environment**.
2. Добавь 4 переменные (имена точь-в-точь):

```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

3. **Save Changes** → Render сам пересоберёт (3–5 мин).

## 5. Проверка

Открой в браузере:

`https://paymini.onrender.com/health`

Должно быть: `"db":"supabase"` (не `"memory"`).

Потом в боте создай бизнес заново — он сохранится в базе.

## Если что-то не так

- `db: memory` — ключи не те или деплой ещё не доехал. Подожди и проверь имена переменных.
- Ошибка при создании бизнеса — в Supabase → **Table Editor** → есть таблица `businesses`?

Ключи **service_role** никому не отправляй — только в Render.
