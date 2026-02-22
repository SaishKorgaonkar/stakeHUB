# StakeHub: The Social Staking Arena 🏟️

**Stake. Watch. Win.**

StakeHub is a production-ready SocialFi protocol built on the Monad ecosystem. It allows users to create decentralized "Arenas" where friends and followers can financially back outcomes or individuals. By combining the speed of Monad with the social graph of Farcaster, StakeHub transforms social belief into verifiable on-chain conviction.

---

## 🚀 The Monad Advantage

StakeHub is engineered to showcase Monad's unique capabilities:

### ⚡ 0.4s Block Times
Live odds update with Web2-like snappiness. No more waiting for "pending" confirmations.

### 🔄 Parallel Execution
Supports thousands of concurrent stakes without network congestion. The Arena stays fast even under viral load.

### 💸 Near-Zero Fees
Enabling micro-stakes (under $1) that are impractical on other L1s. Lower the barrier to entry, expand the social game.

---

## 🛠 Tech Stack

- **Smart Contracts:** Solidity 0.8.24 (UUPS Upgradeable Factory + Minimal Clones)
- **Frontend:** Next.js 15 (App Router), TailwindCSS, Zustand
- **Web3:** Wagmi v3, RainbowKit 2.x, Viem
- **Social:** Farcaster (Warpcast Mini App SDK) for identity and social graph
- **Data Layer:** Prisma ORM + PostgreSQL + 400ms polling indexer

---

## 🏗 System Architecture

StakeHub utilizes a **Backend-for-Frontend (BFF)** pattern. An off-chain indexer tracks Monad events every 400ms to calculate "Live Odds" and serve a high-speed social feed via WebSockets.

### Core Payout Logic

Arenas use a **Parimutuel (Pot-based)** model. Winnings are distributed proportionally to winners from the pool of losers' stakes:

$$
P = a + \left( \frac{a}{W} \times L \right) \times (1 - \text{fee})
$$

Where:
- $P$ = Total payout for winner
- $a$ = Individual stake amount
- $W$ = Total winning pool
- $L$ = Total losing pool
- $\text{fee}$ = Protocol fee (default 2%)

**Example:**
- Alice stakes 100 MON on YES
- Bob stakes 200 MON on NO  
- Charlie stakes 300 MON on NO
- YES wins (Alice wins)

Alice receives: $100 + \left( \frac{100}{100} \times 500 \right) \times 0.98 = 590$ MON

---

## 📂 Project Structure

```
/contracts          Core protocol logic (ArenaFactory.sol, Arena.sol, HUBToken.sol)
/app                Next.js frontend pages and staking interface
/indexer            Real-time event indexing service for Monad
/lib                Shared utilities (math helpers, Farcaster SDK)
```

---

## ⚡ Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Setup Environment**
   ```bash
   cp .env.example .env
   # Add your Monad RPC URL and Postgres DATABASE_URL
   ```

3. **Deploy Contracts**
   ```bash
   cd contracts
   forge script script/Deploy.s.sol --rpc-url monad_testnet --broadcast
   ```

4. **Run Indexer**
   ```bash
   cd indexer
   npm run dev
   ```

5. **Start Frontend**
   ```bash
   cd app
   npm run dev
   ```

---

## 🏟 What You Actually Do Here

**1. Create the Challenge 📝**  
Define an outcome (e.g., "Will I hit 10k steps today?") and set a deadline.

**2. Spread the Word 📢**  
Share your Arena link to Farcaster or X. Your followers stake native MON to back their choice.

**3. The Resolve ✅**  
Once the event ends, the creator (or a trusted judge) resolves the outcome.

**4. Claim Your Alpha 💰**  
Winners "pull" their share of the pot and gain permanent Reputation XP.

---

## 🏎 Key Features

### Ludicrous Speed
Powered by Monad's Parallel EVM. Experience real-time odds that update the instant a stake is placed. No more waiting for "pending" transactions.

### Social-First Staking
Integrate your Farcaster identity. See what your followers are backing and get notified when your favorite creators open a new Private Arena.

### Portable Reputation
Your "Alpha Score" is yours to keep. Win challenges to level up your Soulbound reputation, unlocking lower protocol fees and exclusive high-stakes arenas.

---

## 🛡 Security

### Pull-over-Push Pattern
Users must `claim()` their winnings; the contract never pushes funds to avoid gas limits and reentrancy risks.

### UUPS Upgradeable Pattern
Factory upgrades are managed via a multi-sig to ensure long-term protocol safety while maintaining flexibility.

### Audited Design
Contracts follow OpenZeppelin standards and best practices for upgradeable protocols.

---

## 📚 Documentation

- **[SETUP.md](SETUP.md)** - Development environment setup
- **[CONTRACTS.md](CONTRACTS.md)** - Smart contract documentation
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Production deployment guide

---

## 🎯 Use Cases

- **Creator Challenges:** "I'll stream for 24 hours straight"
- **Community Predictions:** "Will ETH hit $5k this month?"
- **Accountability Markets:** Friends bet on your fitness goals
- **Event Outcomes:** Conference talks, sports, product launches
- **Social Experiments:** "Which meme will trend harder?"

---

## 🌐 Live Activity Feed

Recent activity from the StakeHub community:

```
@Keone just staked 500 MON on "Monad Mainnet by Q4" (75% Likelihood)
@Eunice just claimed 1,200 MON from "ETH Denver Afterparty"
@Anon backed "YES" on "Will Vitalik tweet about ZK today?"
```

---

## 🤝 Contributing

StakeHub is open source. We welcome contributions!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details

---

## 🏆 Built For

**Monad Blitz Hackathon**

StakeHub showcases what's possible when you combine:
- Monad's sub-second finality
- Farcaster's social graph
- Parimutuel market mechanics
- Real-time indexing

The result: A social staking experience that feels instant, transparent, and genuinely fun.

---

## 🔗 Links

- **Website:** [stakehub.xyz](https://stakehub.xyz)
- **Docs:** [docs.stakehub.xyz](https://docs.stakehub.xyz)
- **Warpcast:** [@stakehub](https://warpcast.com/stakehub)
- **Twitter:** [@StakeHub_xyz](https://twitter.com/StakeHub_xyz)

---

**The Social Staking Arena. Built on Monad. 🏟️**
