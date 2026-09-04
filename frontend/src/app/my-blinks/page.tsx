'use client';

import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import {
  LayoutGrid,
  Gift,
  Repeat,
  Eye,
  Ticket,
  Calendar,
  Users,
  ChevronDown,
  ChevronUp,
  Copy,
  Trash2,
  Download,
  Check,
} from 'lucide-react';
import axios from 'axios';
import Link from 'next/link';
import { toast } from 'sonner';
import { config } from '../../config';

interface Blink {
  _id: string;
  title: string;
  description: string;
  icon: string;
  label: string;
  type: 'donation' | 'swap' | 'reveal' | 'raffle';
  createdAt: string;
  actionUrl: string;
  settings: {
    entries?: string[];
    [key: string]: unknown;
  };
}

const TYPE_ICONS = {
  donation: Gift,
  swap: Repeat,
  reveal: Eye,
  raffle: Ticket,
};

const TYPE_LABELS = {
  donation: 'Donation',
  swap: 'Swap',
  reveal: 'P2R',
  raffle: 'Raffle',
};

const TYPE_COLORS = {
  donation: 'text-pink-500 bg-pink-50 dark:bg-pink-900/20',
  swap: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
  reveal: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20',
  raffle: 'text-[#9945FF] bg-[#9945FF]/10 dark:bg-[#9945FF]/20',
};

interface FetchResult {
  creator: string;
  blinks: Blink[];
  error: string;
}

export default function MyBlinksPage() {
  const { publicKey, connected } = useWallet();
  const [result, setResult] = useState<FetchResult | null>(null);
  const [expandedRaffleId, setExpandedRaffleId] = useState<string | null>(null);
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const creator = connected && publicKey ? publicKey.toString() : null;
  const current = result && result.creator === creator ? result : null;
  const loading = creator !== null && current === null;
  const blinks = current?.blinks ?? [];
  const error = current?.error ?? '';

  useEffect(() => {
    if (!creator) return;
    let cancelled = false;

    axios
      .get(`${config.apiUrl}/api/blinks?creator=${creator}`)
      .then((response) => {
        if (!cancelled) setResult({ creator, blinks: response.data, error: '' });
      })
      .catch(() => {
        if (!cancelled) setResult({ creator, blinks: [], error: 'Failed to load your Blinks.' });
      });

    return () => {
      cancelled = true;
    };
  }, [creator]);

  const toggleEntries = (id: string) => {
    if (expandedRaffleId === id) {
      setExpandedRaffleId(null);
    } else {
      setExpandedRaffleId(id);
    }
  };

  const copyToClipboard = (text: string, id?: string) => {
    navigator.clipboard.writeText(text);
    if (id) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } else {
      toast.success('Copied to clipboard');
    }
  };

  const requestDelete = (id: string) => {
    if (deleteConfirmationId === id) {
      setDeleteConfirmationId(null);
    } else {
      setDeleteConfirmationId(id);
    }
  };

  const executeDelete = async (id: string) => {
    if (!publicKey) return;

    try {
      await axios.delete(`${config.apiUrl}/api/blinks/${id}`, {
        data: { creator: publicKey.toString() },
      });
      setResult((prev) =>
        prev ? { ...prev, blinks: prev.blinks.filter((b) => b._id !== id) } : prev,
      );
      setDeleteConfirmationId(null);
      toast.success('Blink deleted successfully');
    } catch {
      toast.error('Failed to delete Blink');
    }
  };

  const downloadEntries = (blink: Blink) => {
    if (!blink.settings.entries || blink.settings.entries.length === 0) return;

    const content = blink.settings.entries.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${blink.title.replace(/\s+/g, '_')}_entries.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
        <div className="bg-[#9945FF]/10 dark:bg-[#9945FF]/20 p-6 rounded-full mb-6">
          <LayoutGrid className="w-12 h-12 text-[#9945FF]" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
          Connect Your Wallet
        </h1>
        <p className="text-slate-600 dark:text-slate-400 max-w-md mb-8">
          Connect your wallet to view your created Blinks and check raffle entries.
        </p>
        <div className="wallet-adapter-dropdown">
          <WalletMultiButton className="!bg-slate-900 dark:!bg-white dark:!text-black hover:!bg-slate-800 dark:hover:!bg-slate-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
      <div className="flex justify-between items-center mb-8 pt-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">My Blinks</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage your actions and view entries.
          </p>
        </div>
        <Link
          href="/create"
          className="btn btn-primary flex items-center gap-2 shadow-lg shadow-[#9945FF]/10 dark:shadow-none border border-transparent hover:border-[#14F195]/50"
        >
          Create New
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400">
          {error}
        </div>
      ) : blinks.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <p className="text-slate-500 dark:text-slate-400 text-lg mb-6">
            You haven&apos;t created any Blinks yet.
          </p>
          <Link href="/create" className="btn btn-primary">
            Create Your First Blink
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blinks.map((blink) => {
            const Icon = TYPE_ICONS[blink.type] || Gift;
            const typeColorClass = TYPE_COLORS[blink.type] || 'text-gray-500 bg-gray-50';
            const isRaffle = blink.type === 'raffle';
            const entriesCount = blink.settings.entries?.length || 0;
            const isExpanded = expandedRaffleId === blink._id;
            const isDeleting = deleteConfirmationId === blink._id;
            const isCopied = copiedId === blink._id;
            const shareUrl = `${config.shareBaseUrl}/blink/${blink._id}`;

            return (
              <div
                key={blink._id}
                className="card flex flex-col h-full relative group hover:border-[#9945FF]/30 dark:hover:border-[#14F195]/30 transition-colors"
              >
                <div className="p-5 flex-grow">
                  <div className="flex justify-between items-start mb-4">
                    <div
                      className={`px-3 py-1.5 rounded-full flex items-center gap-2 ${typeColorClass}`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase">
                        {TYPE_LABELS[blink.type] || blink.type}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
                      <Calendar className="w-3 h-3" />
                      {new Date(blink.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 mb-3 relative">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0 border border-slate-200 dark:border-slate-700">
                        <img src={blink.icon} alt="" className="w-full h-full object-cover" />
                      </div>
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white line-clamp-1">
                        {blink.title}
                      </h3>
                    </div>

                    <div className="relative">
                      <button
                        onClick={() => requestDelete(blink._id)}
                        className={`p-2 rounded-lg transition-colors flex-shrink-0 ${isDeleting ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'}`}
                        title="Delete Blink"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      {isDeleting && (
                        <div className="absolute right-0 top-full mt-2 z-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl rounded-lg p-3 w-48 animate-in fade-in zoom-in duration-200">
                          <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2 text-center">
                            Confirm Delete?
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setDeleteConfirmationId(null)}
                              className="flex-1 px-2 py-1 text-xs font-medium rounded bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors"
                            >
                              No
                            </button>
                            <button
                              onClick={() => executeDelete(blink._id)}
                              className="flex-1 px-2 py-1 text-xs font-medium rounded bg-red-600 text-white hover:bg-red-700 transition-colors"
                            >
                              Yes
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-2 mb-4">
                    {blink.description}
                  </p>

                  <div className="bg-slate-50 dark:bg-slate-950 p-2 rounded border border-slate-200 dark:border-slate-800 flex items-center gap-2 mb-4 group-hover:border-slate-300 dark:group-hover:border-slate-700 transition-colors">
                    <a
                      href={`https://dial.to/?action=solana-action:${encodeURIComponent(shareUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-grow text-xs font-mono text-slate-500 truncate hover:text-[#9945FF] dark:hover:text-[#14F195] transition-colors"
                      title="Click to preview on Dialect"
                    >
                      {shareUrl}
                    </a>
                    <button
                      onClick={() => copyToClipboard(shareUrl, blink._id)}
                      className={`transition-colors ${isCopied ? 'text-[#14F195]' : 'text-slate-400 hover:text-[#9945FF] dark:hover:text-[#14F195]'}`}
                      title={isCopied ? 'Copied!' : 'Copy URL'}
                    >
                      {isCopied ? (
                        <Check className="w-3.5 h-3.5 animate-in zoom-in" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {isRaffle && (
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                          <Users className="w-4 h-4 text-[#9945FF]" />
                          <span>{entriesCount} Entries</span>
                        </div>
                        <button
                          onClick={() => toggleEntries(blink._id)}
                          className="text-xs text-slate-600 dark:text-slate-400 hover:underline flex items-center gap-1 hover:text-[#9945FF] dark:hover:text-[#14F195]"
                        >
                          {isExpanded ? 'Hide' : 'Show'}
                          {isExpanded ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          )}
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="mt-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
                          <div className="p-2 border-b border-slate-200 dark:border-slate-800 flex justify-end">
                            <button
                              onClick={() => downloadEntries(blink)}
                              disabled={entriesCount === 0}
                              className="text-xs flex items-center gap-1 text-slate-500 hover:text-[#9945FF] dark:hover:text-[#14F195] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Download className="w-3 h-3" />
                              Download .txt
                            </button>
                          </div>
                          <div className="max-h-40 overflow-y-auto">
                            {entriesCount === 0 ? (
                              <p className="text-xs text-slate-500 p-3 text-center">
                                No entries yet.
                              </p>
                            ) : (
                              <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                                {blink.settings.entries?.map((entry, idx) => (
                                  <li
                                    key={idx}
                                    className="px-3 py-2 flex justify-between items-center hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                                  >
                                    <span className="text-xs font-mono text-slate-600 dark:text-slate-400 truncate max-w-[180px]">
                                      {entry}
                                    </span>
                                    <button
                                      onClick={() => copyToClipboard(entry)}
                                      className="text-slate-400 hover:text-[#9945FF] dark:hover:text-[#14F195]"
                                      title="Copy Address"
                                    >
                                      <Copy className="w-3 h-3" />
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
