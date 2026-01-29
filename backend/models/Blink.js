const mongoose = require('mongoose');

const BlinkSchema = new mongoose.Schema({
  creatorWallet: {
    type: String,
    required: true,
    index: true, // specific for querying by creator
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
    type: String, // URL to the image
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  label: {
    type: String, // Button label (e.g., "Donate 1 SOL", "Swap Now")
    required: true
  },
  settings: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    // validation logic could be added here based on 'type'
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

// Add a method or pre-save hook if specific validation per type is needed
BlinkSchema.pre('save', function(next) {
  const settings = this.settings;
  
  if (this.type === 'donation') {
    if (!settings.recipient) return next(new Error('Donation requires recipient address'));
    // amounts is optional (user can input), but good to have defaults
  } else if (this.type === 'swap') {
    if (!settings.tokenMint) return next(new Error('Swap requires tokenMint'));
  } else if (this.type === 'reveal') {
    if (!settings.price || !settings.hiddenContent) return next(new Error('Reveal requires price and hiddenContent'));
  } else if (this.type === 'raffle') {
    if (!settings.ticketPrice || !settings.maxEntries) return next(new Error('Raffle requires ticketPrice and maxEntries'));
  }
  next();
});

module.exports = mongoose.model('Blink', BlinkSchema);

