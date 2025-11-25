# ✅ Контракт успешно задеплоен!

## 📍 Информация о контракте

**Адрес контракта:** `0xfADA27f54C48406BdAfc4c6084d7aDA4aafC9220`

**Сеть:** Base Sepolia (Testnet)

**Деплоер:** `0xE2Cc7DE281167Cc5EF8145058BBE065d43E0cB57`

**Параметры контракта:**
- Name: OneStream
- Symbol: OST
- Base URI: `ipfs://QmYourIPFSHash/`

## 🔗 Ссылки

- **BaseScan:** https://sepolia.basescan.org/address/0xfADA27f54C48406BdAfc4c6084d7aDA4aafC9220
- **Контракт в браузере:** https://sepolia.basescan.org/address/0xfADA27f54C48406BdAfc4c6084d7aDA4aafC9220#code

## ✅ Что уже сделано

- [x] Контракт задеплоен на Base Sepolia
- [x] Адрес контракта добавлен в `.env.local`
- [x] Тестовый минт выполнен (транзакция подтверждена)

## 📋 Что нужно сделать сейчас

### 1. Добавить адрес контракта в Vercel

1. Перейдите в [Vercel Dashboard](https://vercel.com/dashboard)
2. Выберите ваш проект
3. Settings → Environment Variables
4. Добавьте или обновите:
   - **Key:** `NEXT_PUBLIC_CONTRACT_ADDRESS`
   - **Value:** `0xfADA27f54C48406BdAfc4c6084d7aDA4aafC9220`
   - **Environment:** Production, Preview, Development
5. Сохраните
6. Передеплойте проект (Deployments → ... → Redeploy)

### 2. Проверить контракт на BaseScan

Откройте: https://sepolia.basescan.org/address/0xfADA27f54C48406BdAfc4c6084d7aDA4aafC9220

Проверьте:
- ✅ Контракт задеплоен
- ✅ Транзакции видны
- ✅ Можно вызвать функции (Read Contract / Write Contract)

### 3. (Опционально) Верифицировать контракт

Если хотите верифицировать контракт на BaseScan:

```bash
npx hardhat verify --network baseSepolia 0xfADA27f54C48406BdAfc4c6084d7aDA4aafC9220 "0xE2Cc7DE281167Cc5EF8145058BBE065d43E0cB57" "ipfs://QmYourIPFSHash/"
```

## 🧪 Тестирование

### Тестовый минт NFT

```bash
HARDHAT_NETWORK=baseSepolia npm run mint:test -- 0xfADA27f54C48406BdAfc4c6084d7aDA4aafC9220
```

## 🌐 Деплой на Base Mainnet

После успешного тестирования на Sepolia:

1. Обновите `.env.local`:
   ```env
   NEXT_PUBLIC_BASE_RPC_URL=https://mainnet.base.org
   ```

2. Убедитесь, что у вас есть реальные ETH на Mainnet

3. Деплой:
   ```bash
   HARDHAT_NETWORK=base npm run deploy:mainnet
   ```

4. Обновите адрес контракта в Vercel

## 🎉 Готово!

Теперь ваше приложение может использовать этот контракт для минтинга NFT постов!

