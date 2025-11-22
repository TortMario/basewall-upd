# OneStream - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment
```bash
npm run setup
# Or manually: cp .env.local.example .env.local
```

Edit `.env.local` and add:
- Supabase URL and keys
- Base RPC URL
- Contract address (after deployment)

### 3. Set Up Database
1. Go to [supabase.com](https://supabase.com) and create a project
2. Open SQL Editor
3. Copy and paste contents of `supabase/schema.sql`
4. Run the query

### 4. Deploy Contract
```bash
# Get testnet ETH from: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
npm run deploy:contract
# Copy the contract address to .env.local
```

### 5. Seed Database (Optional)
```bash
npm run seed
```

### 6. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

## 📝 Next Steps

1. **Deploy to Vercel**
   - Push to GitHub
   - Import in Vercel
   - Add environment variables
   - Deploy

2. **Configure Mini App**
   - Update `NEXT_PUBLIC_MINIAPP_URL` in Vercel
   - Update `app/.well-known/farcaster.json`
   - Create account association in Base Build
   - Sign manifest

3. **Test in Base App**
   - Open Base App
   - Navigate to your mini app
   - Create a post and mint NFT!

## 🎯 Key Features

✅ NFT minting for each post  
✅ On-chain ownership verification  
✅ Edit/delete only for NFT owners  
✅ Off-chain likes/dislikes  
✅ Infinite scroll feed  
✅ Pixel art UI  
✅ Base Account integration  

## 📚 Documentation

- Full setup: See `README.md`
- Development notes: See `NOTES.md`
- Contributing: See `CONTRIBUTING.md`

## 🐛 Troubleshooting

**"Missing Supabase variables"**
→ Check `.env.local` has all required variables

**"Contract not deployed"**
→ Run `npm run deploy:contract` and update address

**"Failed to connect wallet"**
→ In Base App, wallet connects automatically. For local dev, you may need MetaMask.

## 💡 Tips

- Use Base Sepolia for testing
- Check contract on [BaseScan](https://sepolia.basescan.org)
- Monitor Supabase logs for API errors
- Use browser dev tools to debug transactions

Happy building! 🎨

