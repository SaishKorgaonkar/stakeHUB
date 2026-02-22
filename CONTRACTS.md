# StakeHub - Smart Contract Documentation

## Overview

StakeHub uses three main contracts deployed on Monad testnet:

1. **ArenaFactory** - UUPS upgradeable factory for creating arenas
2. **Arena** - Individual parimutuel market contract
3. **HUBToken** - ERC20 governance token for fee discounts

## Contract Addresses (Monad Testnet)

```
HUBToken:       TBD (deploy first)
ArenaFactory:   TBD (deploys via proxy)
```

## ArenaFactory

UUPS upgradeable factory that manages arena creation and registry.

### Key Functions

#### `createArena(string ipfsCid, string[] outcomeLabels, uint256 deadline) returns (address)`

Creates a new Arena contract.

**Parameters:**
- `ipfsCid`: IPFS content identifier containing metadata (title, description, rules)
- `outcomeLabels`: Array of outcome options (e.g., ["YES", "NO"])
- `deadline`: Unix timestamp when arena locks for new stakes

**Returns:** Address of newly deployed Arena

**Events:** `ArenaCreated(address arenaAddress, address creator, string ipfsCid, uint256 deadline, uint256 timestamp)`

**Requirements:**
- `outcomeLabels.length` >= 2 and <= 10
- `deadline > block.timestamp + 1 hour`
- `deadline < block.timestamp + 365 days`

#### `getArenas(uint256 startIndex, uint256 count) view returns (address[])`

Pagination helper for fetching arena addresses.

#### `isArena(address) view returns (bool)`

Check if address is a valid arena created by this factory.

---

## Arena

State machine contract implementing parimutuel betting logic.

### States

```solidity
enum State { OPEN, LOCKED, RESOLVED, CANCELLED }
```

- **OPEN**: Accepting stakes
- **LOCKED**: Deadline passed, no new stakes
- **RESOLVED**: Winner declared, payouts available
- **CANCELLED**: Emergency refund (if not resolved within 7 days)

### Key Functions

#### `stake(uint8 outcomeIndex) payable`

Place a stake on an outcome.

**Parameters:**
- `outcomeIndex`: Index of outcome (0 for first, 1 for second, etc.)

**Requirements:**
- `state == OPEN`
- `block.timestamp < deadline`
- `msg.value > 0`

**Events:** `StakePlaced(address staker, uint8 outcomeIndex, uint256 amount, uint256 timestamp)`

#### `lockArena()`

Manually lock arena before deadline (creator only).

**Requirements:**
- `msg.sender == creator`
- `state == OPEN`

**Events:** `ArenaLocked(uint256 timestamp)`

#### `resolve(uint8 winningOutcome)`

Declare winning outcome and calculate payouts (creator only).

**Parameters:**
- `winningOutcome`: Index of the winning outcome

**Requirements:**
- `msg.sender == creator`
- `state == LOCKED` or auto-locked if deadline passed
- `block.timestamp < emergencyDeadline` (deadline + 7 days)

**Events:** `ArenaResolved(uint8 winningOutcome, uint256 timestamp)`

**Logic:**
1. Calculates total losing pool
2. Deducts protocol fee (1% or 2%)
3. Distributes remaining to winners proportionally
4. Stores winnings in mapping

#### `claim()`

Claim winnings after resolution (winners only).

**Requirements:**
- `state == RESOLVED`
- `winnings[msg.sender] > 0`

**Events:** `WinningsClaimed(address winner, uint256 amount)`

#### `emergencyCancel()`

Trigger refund if creator fails to resolve (callable by anyone).

**Requirements:**
- `state == LOCKED`
- `block.timestamp >= emergencyDeadline`

**Events:** `ArenaCancelled(uint256 timestamp)`

#### `refund()`

Claim full refund if arena cancelled.

**Requirements:**
- `state == CANCELLED`
- User has unclaimed stakes

**Events:** `RefundClaimed(address staker, uint256 amount)`

### View Functions

#### `calculateWinnings(address) view returns (uint256)`

Calculate unclaimed winnings for an address.

#### `getOdds(uint8 outcomeIndex) view returns (uint256)`

Get implied multiplier for an outcome (scaled by 100).

**Example:** Returns `158` for 1.58x odds

---

## HUBToken

Standard ERC20 with fee discount functionality.

### Key Functions

#### `hasFeeDiscount(address) view returns (bool)`

Check if address holds >= 1000 HUB tokens.

**Used by Arena contracts to determine protocol fee:**
- No discount: 2% fee
- With discount: 1% fee

#### `mint(address to, uint256 amount)`

Mint new tokens (owner only). Used for initial distribution and rewards.

---

## Protocol Fees

On each arena resolution:

```
totalPool = winningPool + losingPool
feeRate = creator.hasFeeDiscount() ? 1% : 2%
protocolFee = losingPool * feeRate
prizePool = losingPool - protocolFee
```

Protocol fee sent to `treasury` address in ArenaFactory.

Winner payout formula:
```
userWinnings = userStake + (userStake / winningPool) * prizePool
```

---

## Security Considerations

1. **Reentrancy Protection**: All external calls (claim, refund) use checks-effects-interactions
2. **Integer Overflow**: Solidity 0.8+ built-in overflow checks
3. **Access Control**: Creator-only functions guarded by `require(msg.sender == creator)`
4. **Emergency Exit**: 7-day deadline for creator to resolve, or public cancellation
5. **Upgradeability**: ArenaFactory uses UUPS pattern (admin can upgrade logic, not storage)

---

## Events Reference

### ArenaFactory Events

```solidity
event ArenaCreated(
    address indexed arenaAddress,
    address indexed creator,
    string ipfsCid,
    uint256 deadline,
    uint256 timestamp
);

event TreasuryUpdated(
    address indexed oldTreasury,
    address indexed newTreasury
);
```

### Arena Events

```solidity
event StakePlaced(
    address indexed staker,
    uint8 outcomeIndex,
    uint256 amount,
    uint256 timestamp
);

event ArenaLocked(uint256 timestamp);

event ArenaResolved(
    uint8 winningOutcome,
    uint256 timestamp
);

event ArenaCancelled(uint256 timestamp);

event WinningsClaimed(
    address indexed winner,
    uint256 amount
);

event RefundClaimed(
    address indexed staker,
    uint256 amount
);
```

---

## Indexer Integration

The Node.js indexer listens for these events:

1. **ArenaCreated** → Create Arena record in DB
2. **StakePlaced** → Create Stake record, update totals
3. **ArenaResolved** → Update state, send notifications
4. **WinningsClaimed** → Update reputation, mark claimed

Polling interval: **400ms** (matches Monad's block time)

---

## Gas Optimization Tips

1. **Batch stakes**: Stake once with larger amount vs multiple small stakes
2. **Claim timing**: No rush to claim (winnings locked to your address)
3. **Creator strategy**: Lock arenas early if confident (saves gas on stake checks)

---

## Testing

Run Foundry tests:

```bash
cd contracts
forge test -vvv
```

Coverage:

```bash
forge coverage
```

---

## Deployment Checklist

- [ ] Deploy HUBToken with initial supply
- [ ] Deploy ArenaFactory implementation
- [ ] Deploy ERC1967Proxy pointing to factory + initialize
- [ ] Transfer HUB tokens to treasury/team
- [ ] Verify contracts on Monad block explorer
- [ ] Update .env with deployed addresses
- [ ] Fund indexer wallet with MON for gas (if needed)
- [ ] Test create → stake → resolve → claim flow

---

For frontend integration examples, see `app/lib/contracts.ts`
