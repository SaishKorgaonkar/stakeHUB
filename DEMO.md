# 🎮 DEMO MODE SETUP

This guide walks you through setting up StakeHub for a demo presentation.

## Quick Start for Demo

### 1. Check Prerequisites
```bash
# Make sure you have Node.js 18+ and npm installed
node --version
npm --version
```

### 2. Install Dependencies
```bash
cd app
npm install
```

### 3. Setup Database
```bash
# Push database schema
npx prisma db push

# Seed demo data (3 users, 3 arenas)
npx tsx prisma/seed-simple.ts
```

### 4. Configure Environment
Create a `.env` file in the `app/` directory:
```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/stakehub"

# Optional for production
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_MONAD_RPC_URL="https://testnet-rpc.monad.xyz"

# Contract addresses (use mock addresses for demo)
NEXT_PUBLIC_ARENA_FACTORY_ADDRESS="0x1234567890123456789012345678901234567890"
NEXT_PUBLIC_HUB_TOKEN_ADDRESS="0x0987654321098765432109876543210987654321"
```

### 5. Start Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🎯 Demo Flow

### Step 1: Connect Wallet
1. Click "CONNECT WALLET" button
2. Select MetaMask (or any wallet)
3. Approve connection
4. **Auto-funding**: New users automatically receive 10 test MON tokens

### Step 2: View Arenas
- Navigate to [Arenas page](http://localhost:3000/arenas)
- See 3 pre-seeded demo arenas:
  - **Monad Mainnet by Q4 2026?** (OPEN)
  - **ETH/BTC Flip by Q4 2026?** (OPEN)
  - **ETH Denver Afterparty** (LOCKED)

### Step 3: Create Arena
1. Go to [Create Arena](http://localhost:3000/create)
2. Fill in:
   - Title: "Your prediction question"
   - Outcomes: YES / NO (or custom)
   - Deadline: Future date
3. Click "DEPLOY ARENA"
4. **MetaMask prompt**: Sign transaction
5. Arena created in ~0.4 seconds!

### Step 4: Stake on Outcome
1. Click any arena
2. Select outcome (YES or NO)
3. Enter stake amount (e.g., "1.0 MON")
4. Click "PLACE STAKE"
5. **MetaMask prompt**: Sign transaction
6. Stake confirmed!

### Step 5: $HUB Token Faucet
1. Go to [HUB page](http://localhost:3000/hub)
2. Click "CLAIM FREE HUB"
3. **MetaMask prompt**: Sign transaction
4. Receive 100 $HUB tokens
5. Use for fee discounts (1% instead of 2%)

## 🎬 Demo Features

### Automatic Wallet Funding
- New users get 10 MON automatically
- Simulated via `/api/faucet` endpoint
- No manual token distribution needed

### MetaMask Integration
- Clear signing prompts for all transactions
- Toast notifications guide users
- Transaction status updates in real-time

### Pre-seeded Data
- 3 demo users: @keone, @eunice, @vitalik
- 3 arenas in different states
- Realistic reputation scores and activity

### User-Friendly Messages
- ✅ Success: "Transaction submitted! Confirming in ~0.4s..."
- 📝 Signing: "Please sign the transaction in MetaMask..."
- ❌ Error: "Transaction cancelled" (if user rejects)
- ⚡ Loading: Progressive status updates

## 🧪 Testing Scenarios

### Scenario 1: New User Journey
1. Fresh wallet connects
2. Auto-funded with 10 MON
3. Views arenas
4. Stakes on prediction
5. Checks profile page

### Scenario 2: Create & Resolve
1. Create new arena
2. Share with others
3. Users stake on outcomes
4. Deadline passes
5. Creator resolves arena
6. Winners claim rewards

### Scenario 3: Social Features
1. Multiple users stake
2. View real-time activity feed
3. Check creator profiles
4. Track reputation scores

## 🚀 Production Notes

For actual production deployment:

1. **Replace Mock Addresses**: Update contract addresses in `.env`
2. **Connect Real Contracts**: Deploy contracts to Monad testnet
3. **Setup Indexer**: Run indexer service for on-chain event tracking
4. **Enable IPFS**: Configure Pinata for metadata storage
5. **Database**: Use production PostgreSQL (Supabase, Railway, etc.)
6. **Remove Auto-Funding**: Disable faucet API or add rate limiting

## 📝 Demo Script

**Opening (30 seconds)**
> "StakeHub is the first Social Staking protocol built for Monad. Let me show you how it works..."

**Connect Wallet (15 seconds)**
> "First, I connect MetaMask. The app automatically funds my wallet with test tokens."

**Browse Arenas (30 seconds)**
> "Here are live prediction markets. Monad Mainnet launch, ETH/BTC flip, conference attendance..."

**Create Arena (45 seconds)**
> "I'll create a new arena. Enter question, outcomes, deadline... Sign in MetaMask... Done in 0.4 seconds!"

**Place Stake (30 seconds)**
> "Click arena, choose outcome, stake 2 MON, sign transaction... Stake confirmed!"

**Show Features (45 seconds)**
> "Check the live activity feed, user profiles with reputation, $HUB token faucet for fee discounts..."

**Closing (15 seconds)**
> "Social staking with instant confirmation, thanks to Monad's 0.4s blocks. Try it yourself!"

**Total: ~3 minutes**

## 🐛 Troubleshooting

### Database connection fails
```bash
# Check PostgreSQL is running
psql -U postgres -d stakehub -c "SELECT 1;"
```

### MetaMask not connecting
1. Clear browser cache
2. Reset MetaMask account
3. Check network is set to Monad Testnet

### Auto-funding not working
- Check `/api/faucet` endpoint is accessible
- Verify wallet address format
- Check browser console for errors

## 📚 Additional Resources

- [Full README](../README.md)
- [Setup Guide](../SETUP.md)
- [Deployment Guide](../DEPLOYMENT.md)
- [Smart Contracts](../../contracts/README.md)
