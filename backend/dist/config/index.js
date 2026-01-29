"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const config = {
    server: {
        port: parseInt(process.env.PORT || '3001', 10),
        nodeEnv: process.env.NODE_ENV || 'development',
    },
    database: {
        mongodb: {
            uri: process.env.MONGO_URI || 'mongodb://localhost:27017/blink-builder',
        },
    },
    solana: {
        rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
        network: process.env.SOLANA_NETWORK || 'mainnet',
        blockchainId: process.env.SOLANA_BLOCKCHAIN_ID || 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
    },
    cors: {
        allowedOrigins: process.env.CORS_ALLOWED_ORIGINS
            ? process.env.CORS_ALLOWED_ORIGINS.split(',')
            : ['*'],
    },
    fees: {
        priorityFeeMicroLamports: parseInt(process.env.PRIORITY_FEE_MICRO_LAMPORTS || '100000', 10),
    },
    jupiter: {
        quoteApiUrl: process.env.JUPITER_QUOTE_API_URL || 'https://lite-api.jup.ag/swap/v1/quote',
        swapApiUrl: process.env.JUPITER_SWAP_API_URL || 'https://lite-api.jup.ag/swap/v1/swap',
        slippageBps: parseInt(process.env.JUPITER_SLIPPAGE_BPS || '50', 10),
    },
    logging: {
        level: process.env.LOG_LEVEL || 'info',
    },
};
exports.default = config;
//# sourceMappingURL=index.js.map