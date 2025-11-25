# Инструкция по публикации Mini App в Base App

## Шаг 1: Подготовка изображений

Создайте следующие изображения и разместите их в папке `public/`:

### Обязательные изображения:

1. **icon.png** (1024×1024px, PNG)
   - Иконка приложения
   - Рекомендуется: прозрачный фон не рекомендуется
   - Разместить: `public/icon.png`

2. **splash.png** (рекомендуется 200×200px)
   - Изображение для экрана загрузки
   - Разместить: `public/splash.png`

3. **og.png** (1200×630px, 1.91:1 соотношение)
   - Open Graph изображение для социальных сетей
   - Разместить: `public/og.png`

### Опциональные изображения:

4. **screenshot1.png, screenshot2.png, screenshot3.png** (рекомендуется 1284×2778px, портретная ориентация)
   - Скриншоты приложения (максимум 3)
   - Разместить: `public/screenshot1.png`, и т.д.

### Инструмент для генерации:
Используйте [Mini App Assets Generator](https://www.miniappassets.com/) для создания правильно отформатированных изображений.

## Шаг 2: Обновление манифеста

Манифест находится в `app/.well-known/farcaster.json`. Убедитесь, что все URL указывают на ваш домен:

```json
{
  "miniapp": {
    "homeUrl": "https://basewall.vercel.app",
    "iconUrl": "https://basewall.vercel.app/icon.png",
    "splashImageUrl": "https://basewall.vercel.app/splash.png",
    "heroImageUrl": "https://basewall.vercel.app/og.png",
    "ogImageUrl": "https://basewall.vercel.app/og.png"
  }
}
```

## Шаг 3: Верификация домена и получение accountAssociation

1. Убедитесь, что ваш проект задеплоен на Vercel и доступен по адресу `https://basewall.vercel.app`

2. Перейдите на [Base Build Account Association Tool](https://www.base.dev/preview?tab=account)

3. Вставьте ваш домен в поле "App URL": `basewall.vercel.app`

4. Нажмите "Submit"

5. Нажмите кнопку "Verify" и подпишите манифест своим кошельком

6. Скопируйте сгенерированные поля `accountAssociation`:
   - `header`
   - `payload`
   - `signature`

7. Вставьте их в файл `app/.well-known/farcaster.json`:

```json
{
  "accountAssociation": {
    "header": "ваш_header_здесь",
    "payload": "ваш_payload_здесь",
    "signature": "ваш_signature_здесь"
  }
}
```

## Шаг 4: Заполнение baseBuilder

Если вы используете Base Build для управления приложением:

1. Укажите адрес кошелька, который использовался при импорте Mini App в Base Build
2. Добавьте в `app/.well-known/farcaster.json`:

```json
{
  "baseBuilder": {
    "ownerAddress": "0x..."
  }
}
```

## Шаг 5: Проверка манифеста

1. Убедитесь, что манифест доступен по адресу:
   ```
   https://basewall.vercel.app/.well-known/farcaster.json
   ```

2. Используйте [Base Build Preview Tool](https://www.base.dev/preview) для валидации:
   - Вставьте URL вашего приложения
   - Проверьте, что все поля отмечены зелеными галочками
   - Исправьте любые ошибки (красные индикаторы)

## Шаг 6: Деплой и публикация

1. Закоммитьте все изменения:
   ```bash
   git add .
   git commit -m "Prepare manifest for publication"
   git push
   ```

2. Дождитесь автоматического деплоя на Vercel

3. После деплоя изменения в манифесте вступят в силу

4. Перепубликуйте Mini App в Base App, чтобы платформа переиндексировала обновленную конфигурацию

## Требования к полям манифеста

### Обязательные поля:
- ✅ `version`: "1"
- ✅ `name`: "The Wall Base" (макс 32 символа)
- ✅ `homeUrl`: HTTPS URL
- ✅ `iconUrl`: HTTPS URL, PNG 1024×1024
- ✅ `splashImageUrl`: HTTPS URL
- ✅ `splashBackgroundColor`: hex код (#1e293b)
- ✅ `primaryCategory`: "social"
- ✅ `tags`: массив до 5 тегов

### Опциональные поля (уже заполнены):
- `subtitle`: "NFT Social Feed" (макс 30 символов)
- `description`: описание (макс 170 символов)
- `tagline`: "NFT Social Feed" (макс 30 символов)
- `heroImageUrl`: 1200×630px
- `ogTitle`, `ogDescription`, `ogImageUrl`: для социальных сетей
- `screenshotUrls`: массив URL скриншотов (макс 3)
- `noindex`: false (для индексации в поиске)

## Проверка перед публикацией

- [ ] Все изображения созданы и загружены в `public/`
- [ ] Все URL в манифесте указывают на правильный домен
- [ ] `accountAssociation` заполнен после верификации
- [ ] Манифест доступен по `/.well-known/farcaster.json`
- [ ] Base Build Preview Tool показывает все зеленые галочки
- [ ] Проект задеплоен на Vercel
- [ ] Все изменения закоммичены и запушены

## Полезные ссылки

- [Base Build Preview Tool](https://www.base.dev/preview)
- [Account Association Tool](https://www.base.dev/preview?tab=account)
- [Mini App Assets Generator](https://www.miniappassets.com/)
- [Документация по манифесту](https://docs.base.org/mini-apps/core-concepts/manifest)

