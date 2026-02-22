# Database Seeding

This directory contains the seed script to populate the database with demo data for StakeHub.

## What Gets Seeded

The seed script creates:

### 👥 Users (5)
- **keone** - High reputation (850), 3 arenas created
- **eunice** - Mid reputation (720), 2 arenas created  
- **vitalik** - Highest reputation (950), 1 arena created
- **anon_trader** - Lower reputation (420), active participant
- **alice** - Mid reputation (580), 1 arena created

### 🏟️ Arenas (6)

1. **Monad Mainnet by Q4 2026?** (OPEN)
   - 3.5 MON pool, 3 stakers
   - 75% likelihood for YES

2. **ETH/BTC Flip by Q4 2026?** (OPEN)
   - 5.2 MON pool, 4 stakers
   - 62% likelihood for YES

3. **ETH Denver Afterparty Attendance** (LOCKED)
   - 2.8 MON pool, 3 stakers
   - Deadline passed, awaiting resolution

4. **Will Vitalik Tweet About ZK Today?** (RESOLVED)
   - 4 MON pool, 3 stakers
   - YES won, some winnings claimed

5. **I will stream for 24 hours straight** (OPEN)
   - 1.8 MON pool, 2 stakers
   - Creator challenge format

6. **Pudgy Penguins Floor > 10 ETH by March?** (OPEN)
   - 6.5 MON pool, 4 stakers
   - Most active arena

### 💰 Stakes (19 total)
- Distributed across all arenas
- Mix of claimed and unclaimed winnings
- Realistic stake amounts (0.5 - 2.5 MON)

### 📊 Reputation Logs (4)
- Win bonuses
- Arena creation rewards
- Activity bonuses

## Running the Seed

### First Time Setup

1. Install dependencies (if not already done):
   ```bash
   npm install
   ```

2. Run the seed:
   ```bash
   npm run db:seed
   ```

### Resetting the Database

The seed script automatically clears existing data before seeding. To reset and reseed:

```bash
npm run db:seed
```

### Using Prisma's Built-in Seed

You can also use Prisma's built-in seed command:

```bash
npx prisma db seed
```

## Expected Output

```
🌱 Starting database seed...
🧹 Cleaning up existing data...
👥 Creating demo users...
🏟️ Creating demo arenas...
📊 Adding reputation logs...
✅ Database seeded successfully!

📈 Summary:
  - 5 users created
  - 6 arenas created
  - 19 stakes placed
  - 4 reputation logs added
```

## Testing After Seed

1. **View in Prisma Studio:**
   ```bash
   npx prisma studio
   ```

2. **Check the landing page:**
   - Visit `http://localhost:3000`
   - The live activity feed should show the seeded arenas

3. **Browse arenas:**
   - Visit `http://localhost:3000/arenas`
   - Should see all 6 arenas with different states

4. **Check profiles:**
   - Visit `/profile/0x1234567890123456789012345678901234567890` (keone)
   - Should show stakes and created arenas

## Demo Wallet Addresses

Use these addresses to test the profile pages:

- Keone: `0x1234567890123456789012345678901234567890`
- Eunice: `0x2234567890123456789012345678901234567890`
- Vitalik: `0x3234567890123456789012345678901234567890`
- Anon: `0x4234567890123456789012345678901234567890`
- Alice: `0x5234567890123456789012345678901234567890`

## Customizing the Seed

To modify the seed data, edit `seed.ts` and change:

- User details (username, reputation, etc.)
- Arena titles and descriptions
- Stake amounts and outcomes
- Deadlines and states

Then re-run the seed command.

## Troubleshooting

**Error: Cannot find module 'tsx'**
```bash
npm install --save-dev tsx
```

**Error: Database connection failed**
- Check your `DATABASE_URL` in `.env`
- Ensure PostgreSQL is running
- Run `npx prisma generate` first

**Error: Table does not exist**
```bash
npx prisma db push
npx prisma generate
npm run db:seed
```
