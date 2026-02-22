'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Navbar } from '@/components/Navbar';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { ARENA_FACTORY_ADDRESS, ARENA_FACTORY_ABI } from '@/lib/contracts';
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

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  async function uploadToIPFS() {
    // Mock IPFS upload - in production, use Pinata or similar
    const metadata = {
      title,
      description,
      outcomes: [outcome1, outcome2],
      createdAt: new Date().toISOString(),
    };

    try {
      // In production: upload to IPFS via Pinata
      // const response = await uploadToPinata(metadata);
      // return response.IpfsHash;
      
      // Mock CID for now
      return 'QmMock' + Date.now().toString(36);
    } catch (error) {
      console.error('IPFS upload error:', error);
      throw error;
    }
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

  // Redirect on success
  if (isSuccess) {
    toast.success('Arena created successfully! 🎉');
    setTimeout(() => router.push('/'), 2000);
  }

  return (
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
  );
}
