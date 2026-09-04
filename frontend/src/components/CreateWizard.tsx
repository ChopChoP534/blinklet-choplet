'use client';

import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Ticket, Repeat, Eye, Gift, Check, ExternalLink, X, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { config } from '../config';

interface BlinkAction {
  label: string;
  value: string;
}

interface BlinkSettings {
  recipient?: string;
  amounts?: string | number[];
  tokenMint?: string;
  tokenSymbol?: string;
  price?: string | number;
  hiddenContent?: string;
  ticketPrice?: string | number;
  maxEntries?: string | number;
  entries?: string[];
  actions?: BlinkAction[];
}

interface CreatedBlink {
  _id: string;
  actionUrl: string;
}

interface FormData {
  title: string;
  description: string;
  icon: string;
  label: string;
  settings: BlinkSettings;
}

const BLINK_TYPES = [
  {
    id: 'donation',
    label: 'Donation',
    icon: Gift,
    color: 'text-pink-500',
    bg: 'bg-pink-50',
    description: 'Collect SOL donations directly.',
  },
  {
    id: 'swap',
    label: 'Token Swap',
    icon: Repeat,
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    description: 'Swap SOL for any SPL Token.',
  },
  {
    id: 'reveal',
    label: 'Pay-to-Reveal',
    icon: Eye,
    color: 'text-amber-500',
    bg: 'bg-amber-50',
    description: 'Sell hidden content/links.',
  },
  {
    id: 'raffle',
    label: 'Raffle',
    icon: Ticket,
    color: 'text-purple-500',
    bg: 'bg-purple-50',
    description: 'Host a fair on-chain raffle.',
  },
];

const DEFAULT_ACTIONS: Record<string, BlinkAction> = {
  donation: { label: 'Donate 0.1 SOL', value: '0.1' },
  swap: { label: 'Swap 0.1 SOL', value: '0.1' },
  raffle: { label: 'Buy 1 Ticket', value: '1' },
  reveal: { label: 'Reveal Content', value: '0' },
};

const defaultFormData = (type: string): FormData => {
  const action = DEFAULT_ACTIONS[type] ?? { label: 'Action', value: '0' };
  return {
    title: '',
    description: '',
    icon: '',
    label: action.label,
    settings: { actions: [action] },
  };
};

const CreateWizard = () => {
  const { publicKey } = useWallet();
  const router = useRouter();
  const [type, setType] = useState(BLINK_TYPES[0].id);
  const [formData, setFormData] = useState<FormData>(() => defaultFormData(BLINK_TYPES[0].id));
  const [loading, setLoading] = useState(false);
  const [createdBlink, setCreatedBlink] = useState<CreatedBlink | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const handleTypeChange = (nextType: string) => {
    setType(nextType);
    setFormData((prev) => ({ ...defaultFormData(nextType), title: prev.title, icon: prev.icon }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      settings: { ...prev.settings, [name]: value },
    }));
  };

  const addAction = () => {
    setFormData((prev) => {
      const currentActions = prev.settings.actions || [];
      if (currentActions.length >= 3) return prev;
      return {
        ...prev,
        settings: {
          ...prev.settings,
          actions: [...currentActions, { label: '', value: '' }],
        },
      };
    });
  };

  const removeAction = (index: number) => {
    setFormData((prev) => {
      const currentActions = prev.settings.actions || [];
      if (currentActions.length <= 1) return prev;

      return {
        ...prev,
        settings: {
          ...prev.settings,
          actions: currentActions.filter((_, i) => i !== index),
        },
      };
    });
  };

  const updateAction = (index: number, field: 'label' | 'value', value: string) => {
    setFormData((prev) => {
      const currentActions = [...(prev.settings.actions || [])];
      currentActions[index] = { ...currentActions[index], [field]: value };
      return {
        ...prev,
        settings: {
          ...prev.settings,
          actions: currentActions,
        },
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey) {
      toast.error('Please connect your wallet first!');
      return;
    }

    setLoading(true);
    try {
      const formattedSettings = { ...formData.settings };

      let mainLabel = formData.label;
      if (formattedSettings.actions && formattedSettings.actions.length > 0) {
        mainLabel = formattedSettings.actions[0].label;
      }

      if (type === 'donation') {
        if (formattedSettings.amounts && typeof formattedSettings.amounts === 'string') {
          formattedSettings.amounts = formattedSettings.amounts
            .split(',')
            .map((n: string) => parseFloat(n.trim()));
        }
      } else if (type === 'reveal') {
        if (formattedSettings.price) {
          formattedSettings.price = parseFloat(formattedSettings.price.toString());
          mainLabel = `Pay ${formattedSettings.price} SOL to Reveal`;
        }
      } else if (type === 'raffle') {
        if (formattedSettings.ticketPrice) {
          formattedSettings.ticketPrice = parseFloat(formattedSettings.ticketPrice.toString());
        }
        if (formattedSettings.maxEntries) {
          formattedSettings.maxEntries = parseInt(formattedSettings.maxEntries.toString());
        }
        formattedSettings.entries = [];
      }

      const payload = {
        creatorWallet: publicKey.toString(),
        type,
        title: formData.title,
        description:
          type === 'raffle'
            ? `${formData.description} (Winner is selected off-chain by the creator. Only enter if you trust the creator.)`
            : formData.description,
        icon: formData.icon,
        label: mainLabel,
        settings: formattedSettings,
      };

      const response = await axios.post(`${config.apiUrl}/api/create`, payload);
      setCreatedBlink(response.data);
      toast.success('Blink created successfully!');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { details?: string } }; message?: string };
      toast.error('Failed to create Blink: ' + (err.response?.data?.details || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (createdBlink) {
    const blinkId = createdBlink._id;
    const shareUrl = `${config.shareBaseUrl}/blink/${blinkId}`;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 max-w-md w-full shadow-2xl text-center relative border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => router.push('/')}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="mx-auto w-16 h-16 bg-[#14F195]/10 dark:bg-[#14F195]/20 rounded-full flex items-center justify-center mb-6">
            <Check className="w-8 h-8 text-[#14F195]" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Blink Created!</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Your Action is live. Copy the URL below to test it on Dialect or share on X.
          </p>

          <a
            href={`${config.dialectBaseUrl}${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-slate-100 dark:bg-slate-950 p-3 rounded-lg break-all text-sm font-mono text-slate-700 dark:text-slate-300 mb-6 border border-slate-200 dark:border-slate-800 hover:border-[#9945FF] dark:hover:border-[#14F195] transition-colors"
            title="Click to preview on Dialect"
          >
            {shareUrl}
          </a>

          <div className="flex gap-3">
            <button
              onClick={() => handleCopy(shareUrl)}
              className={`btn btn-secondary flex-1 flex items-center justify-center gap-2 dark:bg-slate-800 dark:text-white dark:border-slate-700 dark:hover:bg-slate-700 ${isCopied ? 'text-[#14F195] border-[#14F195] dark:border-[#14F195]' : ''}`}
            >
              {isCopied ? <Check className="w-4 h-4" /> : null}
              {isCopied ? 'Copied!' : 'Copy URL'}
            </button>
            <a
              href={`${config.dialectBaseUrl}${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary flex-1"
            >
              Test on Dialect <ExternalLink className="w-4 h-4 ml-2" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Create New Blink</h2>
            <p className="text-slate-500 dark:text-slate-400">Configure your blockchain action.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {BLINK_TYPES.map((t) => {
              const Icon = t.icon;
              const isSelected = type === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    handleTypeChange(t.id);
                  }}
                  className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                    isSelected
                      ? `border-[#9945FF] bg-[#9945FF]/5 ring-1 ring-[#9945FF] dark:bg-[#9945FF]/10 dark:border-[#14F195] dark:ring-[#14F195]`
                      : 'border-slate-200 hover:border-[#9945FF]/30 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900 dark:hover:border-[#14F195]/30'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${t.bg} dark:bg-opacity-20`}
                  >
                    <Icon className={`w-6 h-6 ${t.color}`} />
                  </div>
                  <h3
                    className={`font-bold ${isSelected ? 'text-[#9945FF] dark:text-[#14F195]' : 'text-slate-600 dark:text-slate-400'}`}
                  >
                    {t.label}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t.description}</p>
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-3 h-3 bg-[#14F195] rounded-full shadow-[0_0_8px_#14F195]" />
                  )}
                </button>
              );
            })}
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-6 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm"
          >
            <div className="grid gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Title
                </label>
                <input
                  required
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="input-field dark:bg-slate-950 dark:border-slate-700 dark:text-white"
                  placeholder="e.g., Support My Project"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  required
                  rows={2}
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="input-field dark:bg-slate-950 dark:border-slate-700 dark:text-white"
                  placeholder="Short description of what this action does..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Icon URL
                </label>
                <input
                  required
                  type="url"
                  name="icon"
                  value={formData.icon}
                  onChange={handleInputChange}
                  className="input-field dark:bg-slate-950 dark:border-slate-700 dark:text-white"
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
                {type} Configuration
              </h3>
              <div className="grid gap-4">
                {type === 'donation' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Recipient Address
                      </label>
                      <input
                        required
                        type="text"
                        name="recipient"
                        onChange={handleSettingsChange}
                        className="input-field font-mono text-xs"
                        placeholder="Solana Wallet Address"
                      />
                    </div>
                  </>
                )}
                {type === 'swap' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Token Mint Address
                      </label>
                      <input
                        required
                        type="text"
                        name="tokenMint"
                        onChange={handleSettingsChange}
                        className="input-field font-mono text-xs"
                        placeholder="e.g. EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Token Symbol
                      </label>
                      <input
                        required
                        type="text"
                        name="tokenSymbol"
                        onChange={handleSettingsChange}
                        className="input-field"
                        placeholder="USDC"
                      />
                    </div>
                  </>
                )}
                {type === 'reveal' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Price (SOL)
                      </label>
                      <input
                        required
                        type="number"
                        step="0.001"
                        name="price"
                        onChange={handleSettingsChange}
                        className="input-field"
                        placeholder="0.05"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Hidden Content
                      </label>
                      <textarea
                        required
                        name="hiddenContent"
                        onChange={handleSettingsChange}
                        className="input-field"
                        placeholder="Secret link or message..."
                      />
                    </div>
                  </>
                )}
                {type === 'raffle' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Ticket Price (SOL)
                        </label>
                        <input
                          required
                          type="number"
                          step="0.001"
                          name="ticketPrice"
                          onChange={handleSettingsChange}
                          className="input-field"
                          placeholder="0.1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Max Entries
                        </label>
                        <input
                          required
                          type="number"
                          name="maxEntries"
                          onChange={handleSettingsChange}
                          className="input-field"
                          placeholder="100"
                        />
                      </div>
                    </div>
                  </>
                )}

                {(type === 'donation' || type === 'swap' || type === 'raffle') && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Action Buttons
                      </label>
                      <button
                        type="button"
                        onClick={addAction}
                        disabled={(formData.settings.actions?.length || 0) >= 3}
                        className="text-xs flex items-center gap-1 text-[#9945FF] hover:text-[#14F195] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-3 h-3" /> Add Button{' '}
                        {formData.settings.actions?.length || 0}/3
                      </button>
                    </div>
                    <div className="space-y-2">
                      {formData.settings.actions?.map((action, idx) => (
                        <div key={idx} className="flex gap-2 items-start">
                          <input
                            required
                            type="text"
                            placeholder="Label (e.g. 1 SOL)"
                            value={action.label}
                            onChange={(e) => updateAction(idx, 'label', e.target.value)}
                            className="input-field flex-1 text-xs"
                          />
                          <input
                            required
                            type="number"
                            step="any"
                            placeholder={type === 'raffle' ? 'Tickets' : 'Amount'}
                            value={action.value}
                            onChange={(e) => updateAction(idx, 'value', e.target.value)}
                            className="input-field w-24 text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => removeAction(idx)}
                            disabled={formData.settings.actions!.length <= 1}
                            className="p-2 text-slate-400 hover:text-red-500 disabled:opacity-30 disabled:hover:text-slate-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary py-3 text-base shadow-lg shadow-[#9945FF]/10 dark:shadow-none border border-transparent hover:border-[#14F195]/50"
            >
              {loading ? 'Creating Blink...' : 'Create Blink'}
            </button>
          </form>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-8">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Preview</h3>
            <div className="bg-slate-950 rounded-2xl overflow-hidden shadow-xl border border-slate-800 text-white max-w-sm mx-auto lg:mx-0">
              <div className="aspect-[1.91/1] bg-slate-800 relative overflow-hidden">
                {formData.icon ? (
                  <img
                    src={formData.icon}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) =>
                      ((e.target as HTMLImageElement).src =
                        'https://via.placeholder.com/400x200?text=Icon')
                    }
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-600 font-medium">
                    Image
                  </div>
                )}
              </div>

              <div className="p-4">
                <div className="text-slate-400 text-xs uppercase tracking-wider font-bold mb-1">
                  choplet.dev
                </div>
                <h4 className="font-bold text-lg leading-tight mb-2 text-slate-100">
                  {formData.title || 'Your Title Here'}
                </h4>
                <p className="text-slate-400 text-sm mb-4 line-clamp-2">
                  {formData.description || 'Description of your action will appear here...'}
                  {type === 'raffle' && (
                    <span className="text-xs text-slate-500 block mt-1">
                      (Winner is selected off-chain by the creator. Only enter if you trust the
                      creator.)
                    </span>
                  )}
                </p>

                <div className="flex flex-wrap gap-2">
                  {formData.settings.actions && formData.settings.actions.length > 0 ? (
                    formData.settings.actions.map((action, idx) => (
                      <div
                        key={idx}
                        className="bg-white text-black font-bold py-2 px-4 rounded-full text-center text-sm hover:bg-slate-200 cursor-default transition-colors flex-grow"
                      >
                        {action.label || 'Label'}
                      </div>
                    ))
                  ) : (
                    <div className="bg-white text-black font-bold py-2.5 px-4 rounded-full text-center text-sm hover:bg-slate-200 cursor-default transition-colors w-full">
                      {formData.label || 'Action Button'}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 text-center lg:text-left">
              * This is a preview of how it might look on X.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateWizard;
