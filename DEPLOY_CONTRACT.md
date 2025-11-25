# Как развернуть контракт и получить адрес

## Вариант 1: Деплой через Hardhat (рекомендуется)

### Шаг 1: Подготовка

1. Убедитесь, что у вас установлены зависимости:
```bash
npm install
```

2. Создайте файл `.env.local` в корне проекта (если его еще нет)

3. Добавьте в `.env.local`:
```env
# Приватный ключ кошелька с тестовыми ETH на Base Sepolia
PRIVATE_KEY=your_private_key_here

# RPC URL для Base Sepolia (или Base Mainnet)
NEXT_PUBLIC_BASE_RPC_URL=https://sepolia.base.org

# API ключ для BaseScan (опционально, для верификации контракта)
ETHERSCAN_API_KEY=your_basescan_api_key
```

### Шаг 2: Получите тестовые ETH

Для Base Sepolia (тестовая сеть):
- Перейдите на https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
- Введите адрес вашего кошелька
- Получите тестовые ETH

### Шаг 3: Деплой контракта

Для Base Sepolia (тестовая сеть):
```bash
npm run deploy:contract
```

Для Base Mainnet (основная сеть):
```bash
npx hardhat run scripts/deploy.ts --network base
```

### Шаг 4: Скопируйте адрес контракта

После успешного деплоя вы увидите в консоли:
```
OneStreamNFT deployed to: 0x...
```

Скопируйте этот адрес.

### Шаг 5: Добавьте адрес в Vercel

1. Перейдите в Vercel Dashboard → Ваш проект → Settings → Environment Variables
2. Добавьте переменную:
   - Key: `NEXT_PUBLIC_CONTRACT_ADDRESS`
   - Value: `0x...` (адрес вашего контракта)
3. Нажмите Save
4. Передеплойте проект (Deployments → ... → Redeploy)

## Вариант 2: Использовать готовый контракт

Если у вас уже есть развернутый контракт ERC-721 на Base, просто добавьте его адрес в переменные окружения Vercel.

## Проверка контракта

После деплоя вы можете проверить контракт на:
- Base Sepolia: https://sepolia.basescan.org/address/YOUR_CONTRACT_ADDRESS
- Base Mainnet: https://basescan.org/address/YOUR_CONTRACT_ADDRESS

## Важно

- Для Base Sepolia используйте тестовые ETH
- Для Base Mainnet используйте реальные ETH (будет стоить денег)
- Приватный ключ НИКОГДА не коммитьте в Git
- Храните приватный ключ в безопасности

