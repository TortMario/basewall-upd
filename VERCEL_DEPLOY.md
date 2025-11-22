# Деплой на Vercel - Инструкция

## Быстрый старт

1. **Подключите репозиторий к Vercel:**
   - Зайдите на [vercel.com](https://vercel.com)
   - Нажмите "Add New Project"
   - Импортируйте ваш GitHub/GitLab репозиторий
   - Vercel автоматически определит Next.js

2. **Настройте Environment Variables:**
   
   В настройках проекта Vercel добавьте:
   
   ```
   NEXT_PUBLIC_BASE_RPC_URL=https://sepolia.base.org
   NEXT_PUBLIC_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
   NEXT_PUBLIC_MINIAPP_URL=https://your-project.vercel.app
   NEXT_PUBLIC_MINIAPP_NAME=The Wall Base
   ```
   
   **Важно:** После первого деплоя обновите `NEXT_PUBLIC_MINIAPP_URL` на реальный URL вашего проекта.

3. **Подключите Vercel KV (если используете):**
   - В Vercel Dashboard → Storage → KV
   - Убедитесь что `basewall-kv` подключен к проекту
   - Переменные окружения для KV настраиваются автоматически

4. **Деплой:**
   - Vercel автоматически задеплоит при push в main ветку
   - Или нажмите "Deploy" вручную

## Проверка билда

После деплоя проверьте:
- ✅ Сайт открывается
- ✅ Шрифт пиксельный (Press Start 2P)
- ✅ Кнопка "Connect Wallet" работает
- ✅ Нет ошибок в консоли браузера

## Troubleshooting

**Ошибка билда:**
- Проверьте что все зависимости в `package.json`
- Убедитесь что нет синтаксических ошибок
- Проверьте логи билда в Vercel Dashboard

**Ошибка подключения кошелька:**
- В Base App кошелек подключается автоматически
- Локально нужен MetaMask или другой wallet

**Ошибка базы данных:**
- Если используете Supabase - добавьте переменные окружения
- Если используете KV - убедитесь что база подключена в Vercel

## После успешного деплоя

1. Обновите `NEXT_PUBLIC_MINIAPP_URL` на реальный URL
2. Обновите `app/.well-known/farcaster.json` с правильным URL
3. Создайте account association в Base Build
4. Задеплойте контракт и обновите `NEXT_PUBLIC_CONTRACT_ADDRESS`

