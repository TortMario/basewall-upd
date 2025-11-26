# The Wall Base - NFT Social Feed Mini App

A hybrid NFT + off-chain social feed built for Base App (Farcaster Mini App). Each post is minted as an ERC-721 NFT on Base, while text content and interactions are stored in Supabase or Vercel KV for fast performance.

## Features

- 🎨 **Pixel Art UI** - Retro 8-bit styling with Tailwind CSS
- 🪙 **NFT Posts** - Every post is minted as an ERC-721 NFT on Base
- ✏️ **On-Chain Ownership** - Only NFT owners can edit/delete posts
- 💬 **Off-Chain Interactions** - Likes/dislikes stored in Supabase for speed
- ♾️ **Infinite Scroll** - Lazy loading with oldest posts at top
- 🔐 **Base Account Integration** - Automatic wallet connection via Farcaster Mini App SDK
- 👤 **Profile Display** - OnchainKit integration for avatars and names

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Blockchain**: Wagmi + Viem + Base Account Connector
- **Database**: Supabase (PostgreSQL) or Vercel KV / Upstash Redis
- **Smart Contract**: ERC-721 (Solidity, OpenZeppelin)
- **Identity**: OnchainKit (Avatar, Name components)
- **Mini App SDK**: @farcaster/miniapp-sdk

## Prerequisites

- Node.js 18+ and npm/yarn
- Database: Supabase account OR Vercel KV (Upstash Redis) - choose one
- Base Sepolia testnet account (for contract deployment)
- Vercel account (for deployment)

## Setup Instructions

### 1. Clone and Install

```bash
npm install
```

### 2. Set Up Database

**Option A: Supabase (PostgreSQL)**
1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the schema from `supabase/schema.sql`
3. Copy your project URL and anon key from Settings > API

**Option B: Vercel KV (Upstash Redis) - Recommended for Vercel**
1. In your Vercel project, go to Storage tab
2. Create a new KV database (Upstash Redis)
3. The connection is automatic via `@vercel/kv` package
4. No schema needed - data is stored as key-value pairs

### 3. Configure Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

```bash
cp .env.local.example .env.local
```

Required variables:

```env
# Database (Vercel KV)
KV_REST_API_URL=your_vercel_kv_rest_api_url
KV_REST_API_TOKEN=your_vercel_kv_rest_api_token

# Base Network
NEXT_PUBLIC_BASE_RPC_URL=https://sepolia.base.org
NEXT_PUBLIC_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000

# Mini App
NEXT_PUBLIC_MINIAPP_URL=https://your-app.vercel.app
NEXT_PUBLIC_MINIAPP_NAME=OneStream

# Admin Configuration (IMPORTANT!)
# Set your Farcaster username and Base wallet address
ADMIN_USERNAME=your_farcaster_username
ADMIN_ADDRESS=0xYourBaseWalletAddress
NEXT_PUBLIC_ADMIN_USERNAME=your_farcaster_username
NEXT_PUBLIC_ADMIN_ADDRESS=0xYourBaseWalletAddress

# Quick Auth (optional for now)
QUICK_AUTH_SECRET=your_quick_auth_secret

# Hardhat (for deployment)
PRIVATE_KEY=your_deployer_private_key
ETHERSCAN_API_KEY=your_etherscan_api_key
```

### 4. Deploy Smart Contract

Deploy the ERC-721 contract to Base Sepolia:

```bash
# Compile contract
npm run compile

# Deploy to Base Sepolia
npm run deploy:contract
```

Copy the deployed contract address and update `NEXT_PUBLIC_CONTRACT_ADDRESS` in `.env.local`.

### 5. Seed Database (Optional)

Create sample posts for testing:

```bash
npx tsx scripts/seed.ts
```

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Deployment to Vercel

### 1. Deploy Application

1. Push your code to GitHub
2. Import project in Vercel
3. Add all environment variables from `.env.local`
4. **IMPORTANT: Configure Admin Variables**
   - Go to your Vercel project Settings → Environment Variables
   - Add the following variables (use the same values for both server and client):
     - `ADMIN_USERNAME` - Your Farcaster username (e.g., `mynameisthe`)
     - `ADMIN_ADDRESS` - Your Base wallet address (e.g., `0xCdBBdba01063a3A82f1D72Fb601fedFCff808183`)
     - `NEXT_PUBLIC_ADMIN_USERNAME` - Same as `ADMIN_USERNAME` (for client-side)
     - `NEXT_PUBLIC_ADMIN_ADDRESS` - Same as `ADMIN_ADDRESS` (for client-side)
   - Make sure to set these for **Production**, **Preview**, and **Development** environments
5. Deploy

### 2. Update Mini App URL

After deployment, update:
- `NEXT_PUBLIC_MINIAPP_URL` in Vercel environment variables
- `homeUrl` in `app/.well-known/farcaster.json`
- `homeUrl` in `minikit.config.ts`

### 3. Create Account Association

1. Go to [Base Build](https://build.base.org)
2. Create a new Mini App
3. Sign the manifest using your Farcaster account
4. Copy the `accountAssociation` credentials
5. Update `app/.well-known/farcaster.json` with the account association

### 4. Add Meta Tags

Ensure your deployed app has the `fc:miniapp` meta tag in the HTML head (already included in `app/layout.tsx`).

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── posts/          # Post CRUD endpoints
│   │   ├── reactions/      # Like/dislike endpoints
│   │   └── metadata/       # NFT metadata JSON
│   ├── .well-known/
│   │   └── farcaster.json  # Mini app manifest
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Main feed page
│   └── globals.css         # Pixel art styles
├── components/
│   ├── AvatarName.tsx      # Profile display component
│   ├── Composer.tsx        # Post creation form
│   ├── Post.tsx            # Individual post component
│   ├── PostList.tsx        # Infinite scroll feed
│   └── ScrollButtons.tsx   # Scroll to top/bottom buttons
├── contracts/
│   └── OneStreamNFT.sol    # ERC-721 smart contract
├── lib/
│   ├── auth.ts             # Quick Auth JWT verification
│   ├── onchain.ts          # Contract ABI and utilities
│   ├── supabase.ts         # Supabase client
│   └── wagmi.ts            # Wagmi configuration
├── scripts/
│   ├── deploy.ts           # Contract deployment script
│   └── seed.ts             # Database seeding script
└── supabase/
    └── schema.sql          # Database schema
```

## API Endpoints

### Posts

- `POST /api/posts` - Create a new post
- `GET /api/posts?limit=20&offset=0` - Get posts (paginated)
- `PATCH /api/posts/:id` - Update post (owner only)
- `DELETE /api/posts/:id` - Delete post (owner only)
- `GET /api/posts/:id/owner` - Get on-chain NFT owner

### Reactions

- `POST /api/reactions` - Add/update reaction
- `GET /api/reactions?postId=...&userAddress=...` - Get user's reaction

### Metadata

- `GET /api/metadata/:id` - Get NFT metadata JSON (ERC-721 standard)

## Smart Contract

The `OneStreamNFT` contract is a simple ERC-721 with:

- `mintTo(address to, string tokenURI)` - Public minting function
- `ownerOf(uint256 tokenId)` - Get NFT owner
- `tokenURI(uint256 tokenId)` - Get metadata URI

### Contract Deployment

```bash
# Deploy to Base Sepolia
npm run deploy:contract

# Or deploy to Base Mainnet (update hardhat.config.ts network)
```

## Authentication

The app uses Farcaster Quick Auth for backend verification:

1. Client calls `sdk.quickAuth.getToken()` to get JWT
2. JWT is sent in `Authorization: Bearer <token>` header
3. Backend verifies JWT using `@farcaster/quick-auth`

**Note**: Quick Auth setup requires additional configuration. For now, the API accepts requests without JWT verification (development mode). Update `lib/auth.ts` to enable full verification.

## Minting Flow

1. User creates post → `POST /api/posts` creates DB record with `mintStatus: 'pending'`
2. Client receives `metadataUri` from API
3. Client calls `mintTo(userAddress, metadataUri)` via Wagmi
4. Transaction is signed by user's Base Account
5. After confirmation, client calls `PATCH /api/posts/:id` to update `tokenId` and `mintStatus: 'success'`

## Ownership Verification

- When editing/deleting, backend checks `ownerOf(tokenId)` on-chain
- If NFT was transferred, new owner gets edit/delete rights
- UI displays current owner's profile (via OnchainKit)

## Development Notes

### Local Testing

- Contract deployment requires Base Sepolia testnet ETH
- Use [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet) to get test ETH
- Update `NEXT_PUBLIC_BASE_RPC_URL` for different networks
- For local development without Base App, you may need to manually connect a wallet

### Wagmi Connector

The current setup uses the `injected` connector which works with Base App's injected wallet. In production with the full Farcaster Mini App SDK, you should use the official Farcaster connector when available:

```typescript
// Future: Use Farcaster Mini App connector
import { getFarcasterMiniAppConnector } from '@farcaster/miniapp-sdk'
```

### Known Limitations

- TokenId extraction from mint transaction uses event parsing with fallback to `nextTokenId - 1`
- Quick Auth JWT verification needs proper secret configuration (currently optional)
- Metadata images are placeholders (add OG image generation if needed)
- The contract's `mintTo` function returns the tokenId, but we extract it from events for reliability

## Troubleshooting

### "Missing Supabase environment variables"
- Ensure `.env.local` is created and variables are set
- Restart dev server after adding env vars

### "Contract not deployed"
- Deploy contract first: `npm run deploy:contract`
- Update `NEXT_PUBLIC_CONTRACT_ADDRESS` in `.env.local`

### "Failed to verify ownership"
- Ensure contract is deployed and address is correct
- Check RPC URL is accessible
- Verify tokenId exists on-chain

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.

