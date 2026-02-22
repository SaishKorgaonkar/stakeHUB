export const ARENA_FACTORY_ADDRESS = process.env.NEXT_PUBLIC_ARENA_FACTORY_ADDRESS as `0x${string}` || '0x';
export const HUB_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_HUB_TOKEN_ADDRESS as `0x${string}` || '0x';

export const ARENA_FACTORY_ABI = [
  {
    type: 'function',
    name: 'createArena',
    inputs: [
      { name: 'ipfsCid', type: 'string' },
      { name: 'outcomeLabels', type: 'string[]' },
      { name: 'deadline', type: 'uint256' }
    ],
    outputs: [{ name: 'arenaAddress', type: 'address' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getArenaCount',
    inputs: [],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getArenas',
    inputs: [
      { name: 'startIndex', type: 'uint256' },
      { name: 'count', type: 'uint256' }
    ],
    outputs: [{ type: 'address[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'isArena',
    inputs: [{ name: 'arena', type: 'address' }],
    outputs: [{ type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'ArenaCreated',
    inputs: [
      { name: 'arenaAddress', type: 'address', indexed: true },
      { name: 'creator', type: 'address', indexed: true },
      { name: 'ipfsCid', type: 'string', indexed: false },
      { name: 'deadline', type: 'uint256', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false }
    ],
  },
] as const;

export const ARENA_ABI = [
  {
    type: 'function',
    name: 'stake',
    inputs: [{ name: 'outcomeIndex', type: 'uint8' }],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'lockArena',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'resolve',
    inputs: [{ name: 'winningOutcome', type: 'uint8' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'claim',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'refund',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'emergencyCancel',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'calculateWinnings',
    inputs: [{ name: 'staker', type: 'address' }],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getOdds',
    inputs: [{ name: 'outcomeIndex', type: 'uint8' }],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'state',
    inputs: [],
    outputs: [{ type: 'uint8' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'totalPool',
    inputs: [],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'stakes',
    inputs: [
      { name: 'staker', type: 'address' },
      { name: 'outcomeIndex', type: 'uint8' }
    ],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'winnings',
    inputs: [{ name: 'winner', type: 'address' }],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'StakePlaced',
    inputs: [
      { name: 'staker', type: 'address', indexed: true },
      { name: 'outcomeIndex', type: 'uint8', indexed: false },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false }
    ],
  },
  {
    type: 'event',
    name: 'ArenaResolved',
    inputs: [
      { name: 'winningOutcome', type: 'uint8', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false }
    ],
  },
  {
    type: 'event',
    name: 'WinningsClaimed',
    inputs: [
      { name: 'winner', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false }
    ],
  },
] as const;

export const HUB_TOKEN_ABI = [
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'hasFeeDiscount',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'claimFaucet',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'swapMONForHUB',
    inputs: [],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'getFaucetCooldown',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'hubPerMON',
    inputs: [],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'FAUCET_AMOUNT',
    inputs: [],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'FaucetClaimed',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false }
    ],
  },
  {
    type: 'event',
    name: 'TokensSwapped',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'monAmount', type: 'uint256', indexed: false },
      { name: 'hubAmount', type: 'uint256', indexed: false }
    ],
  },
] as const;
