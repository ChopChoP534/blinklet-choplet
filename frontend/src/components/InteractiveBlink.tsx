'use client';

import React, { useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { VersionedTransaction } from '@solana/web3.js';
import axios from 'axios';
import { toast } from 'sonner';
import { Loader2, Check } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

interface BlinkAction {
  label: string;
  href: string;
}

interface BlinkView {
  title: string;
  description: string;
  icon: string;
  links?: {
    actions?: BlinkAction[];
    next?: {
      type: 'inline' | 'post';
      href?: string;
      action?: BlinkView;
    };
  };
}

interface BlinkData extends BlinkView {
  _id: string;
  type: string;
}

interface InteractiveBlinkProps {
  blink: BlinkData;
}

export default function InteractiveBlink({ blink }: InteractiveBlinkProps) {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [currentBlink, setCurrentBlink] = useState<BlinkView>(blink);

  const handleAction = async (action: { label: string; href: string }) => {
    if (!publicKey) {
      toast.error('Please connect your wallet first!');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(action.href, {
        account: publicKey.toString(),
      });

      const { transaction, message, links } = response.data;

      if (transaction) {
        const txBuffer = Uint8Array.from(atob(transaction), (c) => c.charCodeAt(0));
        const tx = VersionedTransaction.deserialize(txBuffer);

        const signature = await sendTransaction(tx, connection);

        const confirmation = await connection.confirmTransaction(signature, 'confirmed');

        if (confirmation.value.err) {
          throw new Error('Transaction failed on-chain');
        }

        toast.success(message || 'Transaction successful!');

        if (links?.next) {
          const next = links.next;
          if (next.type === 'post') {
            const nextRes = await axios.post(next.href, {
              account: publicKey.toString(),
              signature: signature,
            });

            if (nextRes.data.type === 'completed' || nextRes.data.title) {
              setCurrentBlink(nextRes.data);
              setSuccess(true);
            }
            toast.success('Action completed successfully!');
          } else if (next.type === 'inline' && next.action) {
            setCurrentBlink(next.action);
            setSuccess(true);
          }
        } else {
          setSuccess(true);
        }
      } else {
        toast.info(message);
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error(err.message || 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border border-slate-800 text-white mb-8 transition-all duration-300">
        <div className="aspect-[1.91/1] bg-slate-800 relative overflow-hidden">
          {currentBlink.icon ? (
            <img
              src={currentBlink.icon}
              alt={currentBlink.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-600 font-medium">
              No Image
            </div>
          )}
        </div>

        <div className="p-6">
          <div className="text-slate-400 text-xs uppercase tracking-wider font-bold mb-2">
            choplet.dev
          </div>
          <h1 className="font-bold text-2xl leading-tight mb-3 text-slate-100">
            {currentBlink.title}
          </h1>
          <p className="text-slate-400 text-sm mb-6">{currentBlink.description}</p>

          {!success ? (
            <div className="flex flex-wrap gap-2">
              {currentBlink.links?.actions?.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAction(action)}
                  disabled={loading}
                  className={twMerge(
                    'bg-white text-black font-bold py-3 px-6 rounded-full text-center text-sm hover:bg-slate-200 transition-all flex-grow active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2',
                    loading && 'opacity-70',
                  )}
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {action.label}
                </button>
              ))}
              {!publicKey && (
                <div className="w-full mt-2">
                  <WalletMultiButton className="!w-full !justify-center !bg-[#9945FF] hover:!bg-[#7c36cc]" />
                </div>
              )}
            </div>
          ) : (
            <div className="bg-green-900/20 border border-green-900/50 rounded-xl p-4 text-center">
              <div className="mx-auto w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mb-3">
                <Check className="w-6 h-6 text-green-500" />
              </div>
              <p className="text-green-400 font-medium">Completed!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
