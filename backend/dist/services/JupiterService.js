"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JupiterService = void 0;
const web3_js_1 = require("@solana/web3.js");
const config_1 = __importDefault(require("../config"));
const logger_1 = __importDefault(require("../utils/logger"));
const validation_1 = require("../middleware/validation");
const SOL_MINT = 'So11111111111111111111111111111111111111112';
class JupiterService {
    async getSwapTransaction(tokenMint, tokenSymbol, userPubkey, amountSol) {
        logger_1.default.info('Initiating Jupiter swap', {
            tokenMint,
            tokenSymbol,
            amountSol,
            user: userPubkey.toString(),
        });
        const amountLamports = Math.floor(amountSol * web3_js_1.LAMPORTS_PER_SOL);
        const quote = await this.getQuote(SOL_MINT, tokenMint, amountLamports);
        const swap = await this.getSwap(quote, userPubkey);
        logger_1.default.info('Jupiter swap transaction generated', {
            tokenSymbol,
            amountSol,
            outAmount: quote.outAmount,
        });
        return {
            transaction: swap.swapTransaction,
            message: `Swapped ${amountSol} SOL for ${tokenSymbol}`,
        };
    }
    async getQuote(inputMint, outputMint, amount) {
        logger_1.default.debug('Fetching Jupiter quote', { inputMint, outputMint, amount });
        const url = `${config_1.default.jupiter.quoteApiUrl}?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${config_1.default.jupiter.slippageBps}`;
        const response = await fetch(url);
        const data = await response.json();
        (0, validation_1.validateJupiterResponse)(data);
        const quoteData = data;
        if (!quoteData.outAmount) {
            throw new Error('Failed to get quote from Jupiter');
        }
        logger_1.default.debug('Jupiter quote received', { outAmount: quoteData.outAmount });
        return quoteData;
    }
    async getSwap(quoteResponse, userPubkey) {
        logger_1.default.debug('Fetching Jupiter swap transaction', { user: userPubkey.toString() });
        const response = await fetch(config_1.default.jupiter.swapApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                quoteResponse,
                userPublicKey: userPubkey.toString(),
                wrapAndUnwrapSol: true,
                prioritizationFeeLamports: config_1.default.fees.priorityFeeMicroLamports,
            }),
        });
        const data = await response.json();
        (0, validation_1.validateJupiterResponse)(data);
        const swapData = data;
        if (!swapData.swapTransaction) {
            throw new Error('Failed to get swap transaction from Jupiter');
        }
        logger_1.default.debug('Jupiter swap transaction received');
        return swapData;
    }
}
exports.JupiterService = JupiterService;
//# sourceMappingURL=JupiterService.js.map