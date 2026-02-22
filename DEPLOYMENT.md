# StakeHub Production Deployment Checklist

## Pre-Deployment: Code Quality ✅

- ✅ BigInt serialization fixed in all API routes
- ✅ TypeScript compilation errors resolved
- ✅ Landing page messaging updated
- ✅ Repository cleaned (no backup files)
- ✅ Environment variables documented

## 1. Database Setup 🗄️

### Option A: Neon (Recommended for Serverless)
1. Sign up at [neon.tech](https://neon.tech)
2. Create new project
3. Copy connection string
4. Update production `.env`:
   ```bash
   DATABASE_URL="postgresql://[user]:[password]@[host]/[db]?sslmode=require"
   ```

### Option B: Railway / Supabase / Other
- Follow their PostgreSQL setup guides
- Ensure connection string includes `?sslmode=require` for security

### Run Migrations
```bash
cd app
npx prisma generate
npx prisma db push
```

### Seed Demo Data (Optional but Recommended)
For demos and testing, populate the database with sample arenas and users:
```bash
npm run db:seed
```

This creates:
- 5 demo users (keone, eunice, vitalik, anon_trader, alice)
- 6 arenas in various states (OPEN, LOCKED, RESOLVED)
- 19 stakes across all arenas
- Realistic reputation data

**Verification:**
```bash
npx prisma studio
# Should open database viewer at localhost:5555
# Check Users and Arena tables for seeded data
```

---

## 2. Smart Contract Deployment 🔗

### Prerequisites
- [ ] Get test MON from [Monad faucet](https://testnet.monad.xyz/faucet)
- [ ] Set `DEPLOYER_PRIVATE_KEY` in `contracts/.env`

### Deploy Contracts
```bash
cd contracts
forge build

# Deploy to Monad testnet
forge script script/Deploy.s.sol:Deploy \
  --rpc-url https://testnet-rpc.monad.xyz \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast \
  --verify
```

### Save Contract Addresses
After deployment, copy addresses and update:

**In `app/.env.production`:**
```bash
NEXT_PUBLIC_ARENA_FACTORY_ADDRESS="0x..."
NEXT_PUBLIC_HUB_TOKEN_ADDRESS="0x..."
```

**In `indexer/.env`:**
```bash
ARENA_FACTORY_ADDRESS="0x..."
HUB_TOKEN_ADDRESS="0x..."
```

**Verification:**
- ArenaFactory proxy deployed
- HUBToken deployed
- Factory can create new arenas
- Test with `forge test`

---

## 3. External Services Setup 🔌

### Pinata (IPFS Storage) - Required
1. Sign up at [pinata.cloud](https://pinata.cloud)
2. Create API key (Admin permissions)
3. Copy JWT token
4. Add to `app/.env.production`:
   ```bash
   NEXT_PUBLIC_PINATA_JWT="eyJhbGc..."
   NEXT_PUBLIC_IPFS_GATEWAY="https://gateway.pinata.cloud/ipfs/"
   ```

**Test:** Upload arena metadata creates new arenas successfully

### Neynar (Farcaster Integration) - Required
1. Sign up at [neynar.com](https://neynar.com)
2. Create new app
3. Get API key
4. Add to `app/.env.production`:
   ```bash
   NEYNAR_API_KEY="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
   FARCASTER_APP_FID="your-app-fid"
   ```

**Test:** User profiles load with Farcaster data

### WalletConnect - Required
1. Sign up at [cloud.walletconnect.com](https://cloud.walletconnect.com)
2. Create new project
3. Copy Project ID
4. Add to `app/.env.production`:
   ```bash
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="abc123def456..."
   ```

**Note:** Already initialized in the app, just needs your project ID

---

## 4. Environment Variables Summary 📝

### `app/.env.production`
```bash
# Database
DATABASE_URL="postgresql://user:password@host/db?sslmode=require"

# Monad Network
NEXT_PUBLIC_MONAD_RPC_URL="https://testnet-rpc.monad.xyz"
NEXT_PUBLIC_MONAD_CHAIN_ID="10143"

# Deployed Contracts
NEXT_PUBLIC_ARENA_FACTORY_ADDRESS="0x..."
NEXT_PUBLIC_HUB_TOKEN_ADDRESS="0x..."

# IPFS (Pinata)
NEXT_PUBLIC_PINATA_JWT="your-jwt-token"
NEXT_PUBLIC_IPFS_GATEWAY="https://gateway.pinata.cloud/ipfs/"

# Farcaster (Neynar)
NEYNAR_API_KEY="your-api-key"
FARCASTER_APP_FID="your-app-fid"

# WalletConnect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="your-project-id"

# App URL (update after deployment)
NEXT_PUBLIC_APP_URL="https://your-domain.vercel.app"
```

### `indexer/.env`
```bash
# Database (same as app)
DATABASE_URL="postgresql://user:password@host/db?sslmode=require"

# Monad Network
MONAD_RPC_URL="https://testnet-rpc.monad.xyz"
MONAD_CHAIN_ID="10143"

# Deployed Contracts
ARENA_FACTORY_ADDRESS="0x..."
HUB_TOKEN_ADDRESS="0x..."
```

---

## 5. Frontend Deployment (Vercel) 🚀

### Option A: Vercel CLI
```bash
cd app
npm install -g vercel
vercel login
vercel --prod
```

### Option B: GitHub Integration
1. Push code to GitHub
2. Import to [vercel.com](https://vercel.com)
3. Select `app` folder as root directory
4. Add environment variables from `.env.production`
5. Deploy

### Vercel Settings
- **Framework Preset:** Next.js
- **Root Directory:** `app`
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Node Version:** 18.x or 20.x

### Add Environment Variables in Vercel Dashboard
Copy all values from `app/.env.production` → Vercel Settings → Environment Variables

---

## 6. Indexer Deployment 📡

### Option A: Railway
1. Connect GitHub repo
2. Create new project
3. Select `indexer` folder
4. Add environment variables
5. Deploy

### Option B: VPS/Cloud (PM2)
```bash
# On server
git clone your-repo
cd indexer
npm install
npm run build

# Start with PM2
npm install -g pm2
pm2 start npm --name stakehub-indexer -- start
pm2 save
pm2 startup
```

### Option C: Docker
```bash
cd indexer
docker build -t stakehub-indexer .
docker run -d --env-file .env stakehub-indexer
```

**Verification:**
- Indexer connects to Monad RPC
- Database receives blockchain events
- Logs show "Listening for events..."

---

## 7. Post-Deployment Verification ✅

### Critical Path Testing
1. **Landing Page**
   - [ ] Loads at your domain
   - [ ] All sections render correctly
   - [ ] Connect wallet button works

2. **Wallet Connection**
   - [ ] MetaMask connects
   - [ ] Monad testnet auto-adds
   - [ ] Profile created in database

3. **Arena Creation**
   - [ ] Navigate to create page
   - [ ] Fill out form
   - [ ] Metadata uploads to IPFS
   - [ ] Transaction confirms
   - [ ] Arena appears in list

4. **Staking**
   - [ ] Select arena
   - [ ] Choose outcome
   - [ ] Transaction confirms
   - [ ] Balance updates in real-time

5. **Profile**
   - [ ] View profile at `/profile/[address]`
   - [ ] Stakes history loads
   - [ ] Created arenas display
   - [ ] No BigInt serialization errors

### Monitor for Issues
```bash
# Vercel logs
vercel logs --follow

# Indexer logs
pm2 logs stakehub-indexer
```

### Common Issues
- **"TypeError: Do not know how to serialize a BigInt"** → Already fixed ✅
- **WalletConnect initialization warning** → Harmless (multiple renders in dev)
- **Missing icon.png 404** → Add `app/public/icon.png` and `favicon.ico`
- **Farcaster auth fails** → Check Neynar API key and APP_FID

---

## 8. Performance & Monitoring 📊

### Add Favicon and Icons
```bash
cd app/public
# Add these files:
# - favicon.ico (16x16, 32x32)
# - icon.png (192x192 or 512x512)
# - apple-touch-icon.png (180x180)
```

### Vercel Analytics
Enable in dashboard:
- Web Analytics
- Speed Insights

### Database Performance
```bash
# Add indexes for common queries
npx prisma studio
# Check slow query logs in Neon dashboard
```

### Uptime Monitoring
- [ ] Set up [UptimeRobot](https://uptimerobot.com) or similar
- [ ] Monitor: `/`, `/api/arenas`, indexer status

---

## 9. Custom Domain (Optional) 🌐

### Vercel Domain Setup
1. Go to Vercel project settings
2. Domains → Add Domain
3. Update DNS records:
   ```
   Type: A
   Name: @
   Value: 76.76.21.21
   
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

### Update Environment Variable
```bash
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
```

Redeploy after updating.

---

## 10. Security Checklist 🔒

- [ ] Never commit private keys or API secrets
- [ ] Database connections use SSL (`?sslmode=require`)
- [ ] Environment variables set in hosting dashboard (not in code)
- [ ] RPC endpoints are public (testnet is fine)
- [ ] Smart contracts are verified on explorer
- [ ] Test with small amounts first
- [ ] Monitor for unusual activity

---

## 11. Launch Checklist Summary ✨

**Must Complete:**
- ✅ Database deployed and migrated
- ✅ Smart contracts deployed to Monad testnet
- ✅ Contract addresses in environment variables
- ✅ Pinata JWT configured
- ✅ Neynar API key configured
- ✅ WalletConnect project ID configured
- ✅ Frontend deployed to Vercel
- ✅ Indexer deployed and running
- ✅ Test arena creation end-to-end
- ✅ Test staking flow
- ✅ Profile page loads without errors

**Nice to Have:**
- [ ] Custom domain configured
- [ ] Favicon and icons added
- [ ] Uptime monitoring setup
- [ ] Analytics enabled
- [ ] Error tracking (Sentry)

---

## 12. Going Live Announcement 🎉

Once everything is verified:

1. **Test with Real Users**
   - Share with 5-10 beta testers
   - Monitor for issues
   - Gather feedback

2. **Farcaster Launch**
   - Post to Farcaster with StakeHub frame
   - Share arena creation guide
   - Engage with community

3. **Documentation**
   - Update README with live URL
   - Create user guide
   - FAQ page

4. **Iterate**
   - Monitor analytics
   - Fix issues
   - Add features based on feedback

---

## Need Help?

**Common Commands:**
```bash
# Check Next.js build
cd app && npm run build

# Test contracts
cd contracts && forge test

# Check indexer
cd indexer && npm run dev

# View database
cd app && npx prisma studio

# Vercel logs
vercel logs --follow
```

**Resources:**
- Monad Docs: https://docs.monad.xyz
- Neynar Docs: https://docs.neynar.com
- Pinata Docs: https://docs.pinata.cloud
- Vercel Docs: https://vercel.com/docs

You're ready to deploy! 🚀
