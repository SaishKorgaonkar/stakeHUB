# Quick Setup Guide

## Fixed Issues

✅ **Next.js 15 async params** - All API routes now properly await params  
✅ **MetaMask SDK dependency** - React Native async-storage polyfilled in webpack  
✅ **Environment variables** - Created `.env` files in app/ and indexer/

## Setup Steps

### 1. Database Setup

Update `app/.env` and `indexer/.env` with your PostgreSQL connection:
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/stakehub?schema=public"
```

Run Prisma migrations:
```bash
cd app
npx prisma generate
npx prisma db push
```

### 2. Contract Deployment

Deploy contracts to Monad testnet:
```bash
cd ../contracts
forge build
forge script script/Deploy.s.sol:Deploy --rpc-url $MONAD_RPC_URL --private-key $DEPLOYER_PRIVATE_KEY --broadcast
```

Update `.env` files with deployed contract addresses:
- `NEXT_PUBLIC_ARENA_FACTORY_ADDRESS`
- `NEXT_PUBLIC_HUB_TOKEN_ADDRESS`
- `ARENA_FACTORY_ADDRESS` (in indexer/.env)
- `HUB_TOKEN_ADDRESS` (in indexer/.env)

### 3. Optional Services

**IPFS (Pinata):**
```bash
NEXT_PUBLIC_PINATA_JWT="your-jwt-token"
```

**Farcaster (Neynar):**
```bash
NEYNAR_API_KEY="your-api-key"
```

**WalletConnect:**
```bash
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="your-project-id"
```
Get one at: https://cloud.walletconnect.com

### 4. Start Development

**Frontend:**
```bash
cd app
npm run dev
# Opens at http://localhost:3000
```

**Indexer (in separate terminal):**
```bash
cd indexer
npm install
npm run dev
```

## What Works Now

✅ MetaMask automatically detected and supported  
✅ API routes work with Next.js 15  
✅ Database connections ready  
✅ HUB token faucet and swap at `/hub` page  
✅ Real-time arena updates via SSE  

## Next Steps

1. **Setup PostgreSQL** - Install locally or use a hosted service (Supabase, Neon, Railway)
2. **Get test MON** - From Monad testnet faucet
3. **Deploy contracts** - To Monad testnet
4. **Start indexer** - To sync blockchain events to database
5. **Create arenas** - Test the full flow!

## Quick PostgreSQL Setup (Docker)

```bash
docker run -d \
  --name stakehub-postgres \
  -e POSTGRES_DB=stakehub \
  -e POSTGRES_USER=user \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  postgres:15

# Then update your .env files with:
# DATABASE_URL="postgresql://user:password@localhost:5432/stakehub?schema=public"
```
