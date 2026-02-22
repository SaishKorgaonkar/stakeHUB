# StakeHub

> Prediction Markets, Native to Farcaster. Built on Monad.

## What is StakeHub?

StakeHub is a social prediction platform where you can stake MON on outcomes you believe in. With 0.4-second finality on Monad and deep Farcaster integration, every prediction market is fast, transparent, and social.

## Key Features

### ⚡ Real-Time Experience
- **0.4s confirmation** on Monad blockchain
- Instant odds updates as stakes come in
- Live animated pool bars

### 🎭 Three Visibility Modes
- **Public Arenas** - Open to everyone
- **Followers Only** - Exclusive to your verified followers
- **Invite Only** - Private markets for your inner circle

### 💰 Pure Parimutuel Markets
- No oracle manipulation
- Odds derived from real stakes
- Transparent payout math
- Winners split the pool proportionally

### 🔗 Farcaster Native
- Sign in with Farcaster (no passwords)
- See who you follow in each arena
- Social graph-aware feed
- Push notifications to Warpcast

### 🎯 Product Features
- **State Machine**: OPEN → LOCKED → RESOLVED (fully on-chain)
- **Optimistic UI**: Instant feedback before block confirmation
- **Real-Time Updates**: Server-sent events for live changes
- **Social Ranking**: Feed prioritizes arenas from people you follow
- **Secure Claims**: Pull-based withdrawals, emergency cancel option

## How It Works

1. **Create Arena** - Set outcomes and deadline
2. **Community Stakes** - Followers back their preferred outcomes
3. **Auto-Lock** - Arena locks at deadline
4. **Winners Claim** - Proportional rewards based on pool size

## $HUB Token

StakeHub's native token provides:
- **1% fees** instead of 2% (≥1000 HUB required)
- Future governance rights
- Reputation multipliers
- Creator boosts

### Get $HUB
- Claim 100 HUB every 24 hours (free faucet)
- Swap MON → HUB directly
- Earn through platform activity

## Technology

- **Blockchain**: Monad Testnet (Chain ID: 10143)
- **Smart Contracts**: Solidity 0.8.24 (UUPS upgradeable)
- **Frontend**: Next.js 15, React 19
- **Database**: PostgreSQL with Prisma
- **Social**: Farcaster Mini App integration

## Getting Started

### For Users
1. Visit StakeHub
2. Connect your wallet
3. Sign in with Farcaster
4. Start staking on outcomes!

### For Developers
See [SETUP.md](SETUP.md) for local development instructions.

## Links

- **Setup Guide**: [SETUP.md](SETUP.md)
- **Contract Details**: [CONTRACTS.md](CONTRACTS.md)

## License

MIT License

---

Built with ⚡ on Monad | Powered by Farcaster