import mongoose, { Schema, Model } from 'mongoose';
import { BlinkDocument, BlinkSettings } from '../types';

interface BlinkModel extends Model<BlinkDocument> {}

const BlinkSchema = new Schema<BlinkDocument, BlinkModel>({
  creatorWallet: {
    type: String,
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['donation', 'swap', 'reveal', 'raffle'],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
  settings: {
    type: Schema.Types.Mixed,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

BlinkSchema.pre('save', function (next) {
  const settings = this.settings as BlinkSettings;

  if (this.type === 'donation') {
    const donationSettings = settings as { recipient?: string };
    if (!donationSettings.recipient) {
      return next(new Error('Donation requires recipient address'));
    }
  } else if (this.type === 'swap') {
    const swapSettings = settings as { tokenMint?: string };
    if (!swapSettings.tokenMint) {
      return next(new Error('Swap requires tokenMint'));
    }
  } else if (this.type === 'reveal') {
    const revealSettings = settings as { price?: number; hiddenContent?: string };
    if (!revealSettings.price || !revealSettings.hiddenContent) {
      return next(new Error('Reveal requires price and hiddenContent'));
    }
  } else if (this.type === 'raffle') {
    const raffleSettings = settings as { ticketPrice?: number; maxEntries?: number };
    if (!raffleSettings.ticketPrice || !raffleSettings.maxEntries) {
      return next(new Error('Raffle requires ticketPrice and maxEntries'));
    }
  }
  next();
});

export default mongoose.model<BlinkDocument, BlinkModel>('Blink', BlinkSchema);
