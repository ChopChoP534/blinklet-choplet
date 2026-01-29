export type BlinkType = 'donation' | 'swap' | 'reveal' | 'raffle';

export interface BlinkAction {
  label: string;
  value: string;
}

export interface DonationSettings {
  recipient: string;
  amounts?: number[];
  actions?: BlinkAction[];
}

export interface SwapSettings {
  tokenMint: string;
  tokenSymbol: string;
  actions?: BlinkAction[];
}

export interface RevealSettings {
  price: number;
  hiddenContent: string;
}

export interface RaffleSettings {
  ticketPrice: number;
  maxEntries: number;
  entries: string[];
  actions?: BlinkAction[];
}

export type BlinkSettings = DonationSettings | SwapSettings | RevealSettings | RaffleSettings;

export interface BlinkDocument {
  _id: string;
  creatorWallet: string;
  type: BlinkType;
  title: string;
  icon: string;
  description: string;
  label: string;
  settings: BlinkSettings;
  createdAt: Date;
  toObject: () => Record<string, unknown>;
}

export interface ActionMetadataResponse {
  icon: string;
  title: string;
  description: string;
  label: string;
  links: {
    actions: Array<{
      label: string;
      href: string;
    }>;
  };
}

export interface NextAction {
  type: 'inline' | 'post';
  href?: string;
  action?: {
    description: string;
    icon: string;
    label: string;
    title: string;
    disabled: boolean;
  };
}

export interface TransactionResponse {
  transaction: string;
  message: string;
  links?: {
    next: NextAction;
  };
}

export interface CreateBlinkPayload {
  creatorWallet: string;
  type: BlinkType;
  title: string;
  description: string;
  icon: string;
  label: string;
  settings: BlinkSettings;
}

export interface JupiterQuoteResponse {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  platformFee?: {
    amount: string;
    feeBps: number;
  };
  priceImpactPct: string;
  routePlan: unknown[];
  contextSlot?: number;
  timeTaken?: number;
}

export interface JupiterSwapResponse {
  swapTransaction: string;
  lastValidBlockHeight?: number;
  prioritizationFeeLamports?: number;
}
