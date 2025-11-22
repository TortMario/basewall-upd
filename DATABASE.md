# Database Setup Guide

## Выбор базы данных

Проект поддерживает два варианта базы данных:

### 1. Supabase (PostgreSQL) - для разработки и продакшена
- Полнофункциональная SQL база данных
- Бесплатный тариф с ограничениями
- Требует отдельной настройки

### 2. Vercel KV (Upstash Redis) - рекомендуется для Vercel
- ✅ Уже настроен в вашем Vercel проекте (`basewall-kv`)
- ✅ Автоматическая интеграция через `@vercel/kv`
- ✅ Не требует дополнительных env переменных
- ✅ Бесплатный тариф Upstash

## Использование Vercel KV (ваш случай)

У вас уже есть `basewall-kv` в Vercel! Это идеально подходит для проекта.

### Шаги для переключения на KV:

1. **Установите пакет** (уже добавлен в package.json):
```bash
npm install @vercel/kv
```

2. **Обновите API routes** - замените импорты:
```typescript
// Было:
import { supabase, getSupabaseAdmin } from '@/lib/supabase'

// Стало:
import * as kv from '@/lib/kv'
```

3. **Обновите функции** в API routes:
   - `app/api/posts/route.ts` - использовать `kv.createPost()` и `kv.getPosts()`
   - `app/api/posts/[id]/route.ts` - использовать `kv.updatePost()` и `kv.deletePost()`
   - `app/api/reactions/route.ts` - использовать `kv.setReaction()` и `kv.getReaction()`

4. **В Vercel** переменные окружения настраиваются автоматически при создании KV базы.

### Преимущества Vercel KV:
- ✅ Уже настроено в вашем проекте
- ✅ Быстрая работа (Redis)
- ✅ Автоматическое масштабирование
- ✅ Бесплатный тариф для старта

### Недостатки:
- ⚠️ Нет SQL запросов (только key-value)
- ⚠️ Нужно переписать API routes

## Использование Supabase

Если хотите использовать Supabase:

1. Создайте проект на [supabase.com](https://supabase.com)
2. Выполните SQL схему из `supabase/schema.sql`
3. Добавьте переменные окружения в Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

## Рекомендация

Для вашего случая **рекомендую использовать Vercel KV**, так как:
- Уже настроено (`basewall-kv`)
- Проще интегрировать
- Быстрее работает
- Не требует дополнительных настроек

Нужна помощь с миграцией API routes на KV? Дайте знать!

