"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionService = void 0;
const web3_js_1 = require("@solana/web3.js");
const config_1 = __importDefault(require("../config"));
const logger_1 = __importDefault(require("../utils/logger"));
class TransactionService {
    constructor() {
        this.connection = new web3_js_1.Connection(config_1.default.solana.rpcUrl, 'confirmed');
        logger_1.default.info('Solana connection initialized', {
            rpcUrl: config_1.default.solana.rpcUrl,
            network: config_1.default.solana.network,
        });
    }
    async buildDonationTransaction(blink, userPubkey, amount) {
        const settings = blink.settings;
        const recipientPubkey = new web3_js_1.PublicKey(settings.recipient);
        logger_1.default.debug('Building donation transaction', {
            blinkId: blink._id,
            amount,
            recipient: settings.recipient,
        });
        const transaction = new web3_js_1.Transaction();
        transaction.add(web3_js_1.ComputeBudgetProgram.setComputeUnitPrice({
            microLamports: config_1.default.fees.priorityFeeMicroLamports,
        }));
        transaction.add(web3_js_1.SystemProgram.transfer({
            fromPubkey: userPubkey,
            toPubkey: recipientPubkey,
            lamports: Math.floor(amount * web3_js_1.LAMPORTS_PER_SOL),
        }));
        return transaction;
    }
    async buildRevealTransaction(blink, userPubkey, _baseUrl) {
        const settings = blink.settings;
        const creatorPubkey = new web3_js_1.PublicKey(blink.creatorWallet);
        const lamports = Math.floor(settings.price * web3_js_1.LAMPORTS_PER_SOL);
        logger_1.default.debug('Building reveal transaction', {
            blinkId: blink._id,
            price: settings.price,
            lamports,
        });
        const transaction = new web3_js_1.Transaction();
        transaction.add(web3_js_1.ComputeBudgetProgram.setComputeUnitPrice({
            microLamports: config_1.default.fees.priorityFeeMicroLamports,
        }));
        transaction.add(web3_js_1.SystemProgram.transfer({
            fromPubkey: userPubkey,
            toPubkey: creatorPubkey,
            lamports,
        }));
        const nextAction = {
            type: 'inline',
            action: {
                description: `Here is your hidden content: ${settings.hiddenContent}`,
                icon: blink.icon,
                label: 'Content Revealed',
                title: 'Reveal Successful',
                disabled: true,
            },
        };
        return { transaction, nextAction };
    }
    async buildRaffleTransaction(blink, userPubkey, ticketCount, baseUrl) {
        const settings = blink.settings;
        const creatorPubkey = new web3_js_1.PublicKey(blink.creatorWallet);
        const totalCost = settings.ticketPrice * ticketCount;
        const lamports = Math.floor(totalCost * web3_js_1.LAMPORTS_PER_SOL);
        logger_1.default.debug('Building raffle transaction', {
            blinkId: blink._id,
            ticketPrice: settings.ticketPrice,
            ticketCount,
            totalCost,
            lamports,
        });
        const transaction = new web3_js_1.Transaction();
        transaction.add(web3_js_1.ComputeBudgetProgram.setComputeUnitPrice({
            microLamports: config_1.default.fees.priorityFeeMicroLamports,
        }));
        transaction.add(web3_js_1.SystemProgram.transfer({
            fromPubkey: userPubkey,
            toPubkey: creatorPubkey,
            lamports,
        }));
        const nextAction = {
            type: 'post',
            href: `${baseUrl}/api/actions/${blink._id}/confirm_raffle`,
        };
        return { transaction, nextAction };
    }
    async finalizeTransaction(transaction, userPubkey) {
        const { blockhash } = await this.connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = userPubkey;
        logger_1.default.debug('Finalizing transaction', {
            feePayer: userPubkey.toString(),
            blockhash,
        });
        const payload = transaction
            .serialize({ requireAllSignatures: false, verifySignatures: false })
            .toString('base64');
        logger_1.default.debug('Transaction serialized', { payloadLength: payload.length });
        return payload;
    }
}
exports.TransactionService = TransactionService;
//# sourceMappingURL=TransactionService.js.map