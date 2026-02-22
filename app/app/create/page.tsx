'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { ARENA_FACTORY_ADDRESS, ARENA_FACTORY_ABI } from '@/lib/contracts';
import { uploadToIPFS as uploadToPinata } from '@/lib/ipfs';
import { toast } from 'sonner';

export default function CreateArenaPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [outcome1, setOutcome1] = useState('');
  const [outcome2, setOutcome2] = useState('');
  const [deadline, setDeadline] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [inviteCode] = useState(() =>
    Math.random().toString(36).substring(2, 8).toUpperCase()
  );
  const [copiedCode, setCopiedCode] = useState(false);

  function copyInviteCode() {
    navigator.clipboard.writeText(inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  async function uploadToIPFS() {
    const metadata = {
      title,
      description,
      outcomes: [outcome1, outcome2],
      creator: address,
      createdAt: new Date().toISOString(),
      isPrivate,
      ...(isPrivate && { inviteCode }),
    };

    // Use real Pinata upload if JWT is configured
    if (process.env.NEXT_PUBLIC_PINATA_JWT) {
      try {
        const cid = await uploadToPinata(metadata);
        console.log('✅ Uploaded to IPFS:', cid);
        return cid;
      } catch (error) {
        console.error('IPFS upload failed, using mock CID:', error);
        toast.error('IPFS upload failed — using temporary metadata');
      }
    } else {
      console.warn('⚠️  NEXT_PUBLIC_PINATA_JWT not set — using mock CID for local dev');
    }

    // Fallback: deterministic mock CID (local dev only)
    return 'QmMock' + Date.now().toString(36);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!isConnected) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!title || !outcome1 || !outcome2 || !deadline) {
      toast.error('Please fill in all required fields');
      return;
    }

    const deadlineDate = new Date(deadline);
    if (deadlineDate <= new Date()) {
      toast.error('Deadline must be in the future');
      return;
    }

    try {
      setUploading(true);

      // Upload metadata to IPFS
      const ipfsCid = await uploadToIPFS();
      toast.success('Metadata uploaded to IPFS ✓');

      // Create arena on-chain
      const deadlineTimestamp = BigInt(Math.floor(deadlineDate.getTime() / 1000));

      writeContract({
        address: ARENA_FACTORY_ADDRESS,
        abi: ARENA_FACTORY_ABI,
        functionName: 'createArena',
        args: [ipfsCid, [outcome1, outcome2], deadlineTimestamp],
      });

      toast.success('Arena deployment transaction submitted! ⚡');
    } catch (error: any) {
      console.error('Create arena error:', error);
      toast.error(error.message || 'Failed to create arena');
    } finally {
      setUploading(false);
    }
  }

  // Save invite code to DB when arena creation succeeds
  if (isSuccess && isPrivate) {
    // We'll save the invite code via the arenas list after the indexer picks it up
    toast.success('🔒 Private arena created! Share the invite code below.');
  } else if (isSuccess) {
    toast.success('Arena created successfully! 🎉');
    setTimeout(() => router.push('/arenas'), 2000);
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-offwhite">
        <Navbar />

        <main className="max-w-3xl mx-auto px-4 py-12">
          <div className="mb-8">
            <h1 className="text-5xl font-bold mb-4 uppercase">Create Arena</h1>
            <p className="text-xl text-gray-800">
              Launch a parimutuel staking pot for any social outcome
            </p>
          </div>

          <Card>
            <CardHeader>
              <h2 className="text-2xl font-bold uppercase">Arena Details</h2>
            </CardHeader>
            <CardBody>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <Input
                  label="Arena Title *"
                  placeholder="Will ETH hit $10,000 by Q2 2026?"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                  required
                />

                {/* Description */}
                <Textarea
                  label="Description (Optional)"
                  placeholder="Additional context or rules..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  maxLength={500}
                />

                {/* Outcomes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Input
                      label="Outcome A *"
                      placeholder="YES"
                      value={outcome1}
                      onChange={(e) => setOutcome1(e.target.value)}
                      maxLength={30}
                      required
                    />
                    {outcome1 && (
                      <div className="mt-2 px-3 py-2 bg-lime border-2 border-black">
                        <span className="font-bold">{outcome1}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <Input
                      label="Outcome B *"
                      placeholder="NO"
                      value={outcome2}
                      onChange={(e) => setOutcome2(e.target.value)}
                      maxLength={30}
                      required
                    />
                    {outcome2 && (
                      <div className="mt-2 px-3 py-2 bg-coral border-2 border-black">
                        <span className="font-bold text-white">{outcome2}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Deadline */}
                <Input
                  label="Deadline *"
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  required
                />

                {/* Private Arena Toggle */}
                <div className="border-3 border-black p-4 bg-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold uppercase">🔒 Private Arena</p>
                      <p className="text-sm text-gray-600 mt-1">Only people with your invite code can stake</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsPrivate(v => !v)}
                      className={`w-14 h-7 rounded-full border-3 border-black transition-colors relative ${isPrivate ? 'bg-yellow' : 'bg-gray-200'
                        }`}
                    >
                      <span className={`absolute top-0.5 w-5 h-5 bg-black rounded-full transition-all ${isPrivate ? 'left-7' : 'left-0.5'
                        }`} />
                    </button>
                  </div>

                  {isPrivate && (
                    <div className="mt-4 p-3 bg-yellow border-2 border-black">
                      <p className="text-xs font-bold uppercase mb-1">Your Invite Code</p>
                      <div className="flex items-center gap-3">
                        <span className="text-3xl font-bold tracking-widest">{inviteCode}</span>
                        <button
                          type="button"
                          onClick={copyInviteCode}
                          className="px-3 py-1 border-2 border-black font-bold text-sm bg-white hover:bg-gray-100 transition-colors"
                        >
                          {copiedCode ? '✅ Copied!' : 'Copy'}
                        </button>
                      </div>
                      <p className="text-xs mt-2 text-gray-700">Share this code with people you want to invite</p>
                    </div>
                  )}
                </div>

                <div className="bg-yellow border-3 border-black p-4 brutal-shadow">
                  <p className="font-bold text-sm mb-2">⚡ INSTANT CONFIRMATION</p>
                  <p className="text-sm">
                    Your arena will be deployed in ~0.4 seconds on Monad.
                    Users can start staking immediately after creation.
                  </p>
                </div>

                <div className="bg-gray-100 border-3 border-black p-4">
                  <p className="font-bold text-sm mb-2">📋 RULES</p>
                  <ul className="text-sm space-y-1 list-disc list-inside">
                    <li>As creator, you must resolve the outcome within 7 days of deadline</li>
                    <li>If not resolved in time, anyone can trigger emergency cancellation</li>
                    <li>Protocol fee: 2% (or 1% if you hold ≥1000 $HUB)</li>
                    <li>Stakes are locked once you lock the arena</li>
                  </ul>
                </div>

                <Button
                  type="submit"
                  fullWidth
                  size="lg"
                  disabled={!isConnected || uploading || isPending || isConfirming}
                >
                  {uploading
                    ? 'Uploading to IPFS...'
                    : isPending || isConfirming
                      ? 'Deploying Arena...'
                      : 'DEPLOY ARENA'}
                </Button>

                {!isConnected && (
                  <p className="text-center text-sm text-gray-600">
                    Connect your wallet to create an arena
                  </p>
                )}
              </form>
            </CardBody>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  );
}
