"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const BlinkSchema = new mongoose_1.Schema({
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
        type: mongoose_1.Schema.Types.Mixed,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});
BlinkSchema.pre('save', function (next) {
    const settings = this.settings;
    if (this.type === 'donation') {
        const donationSettings = settings;
        if (!donationSettings.recipient) {
            return next(new Error('Donation requires recipient address'));
        }
    }
    else if (this.type === 'swap') {
        const swapSettings = settings;
        if (!swapSettings.tokenMint) {
            return next(new Error('Swap requires tokenMint'));
        }
    }
    else if (this.type === 'reveal') {
        const revealSettings = settings;
        if (!revealSettings.price || !revealSettings.hiddenContent) {
            return next(new Error('Reveal requires price and hiddenContent'));
        }
    }
    else if (this.type === 'raffle') {
        const raffleSettings = settings;
        if (!raffleSettings.ticketPrice || !raffleSettings.maxEntries) {
            return next(new Error('Raffle requires ticketPrice and maxEntries'));
        }
    }
    next();
});
exports.default = mongoose_1.default.model('Blink', BlinkSchema);
//# sourceMappingURL=Blink.js.map