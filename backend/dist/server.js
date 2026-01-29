"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const web3_js_1 = require("@solana/web3.js");
const config_1 = __importDefault(require("./config"));
const logger_1 = __importDefault(require("./utils/logger"));
const BlinkService_1 = require("./services/BlinkService");
const TransactionService_1 = require("./services/TransactionService");
const JupiterService_1 = require("./services/JupiterService");
const validation_1 = require("./middleware/validation");
const errorHandler_1 = require("./middleware/errorHandler");
const helpers_1 = require("./utils/helpers");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.set('trust proxy', true);
const ACTIONS_CORS_HEADERS = {
    'X-Action-Version': '1',
    'X-Blockchain-Ids': config_1.default.solana.blockchainId,
};
app.use((_req, res, next) => {
    res.set(ACTIONS_CORS_HEADERS);
    next();
});
app.use((0, cors_1.default)({
    origin: config_1.default.cors.allowedOrigins[0] === '*' ? '*' : config_1.default.cors.allowedOrigins,
    methods: ['GET', 'POST', 'OPTIONS', 'DELETE', 'PUT'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Content-Encoding', 'Accept-Encoding'],
}));
app.options('/api/actions/*', (_req, res) => {
    res.set(ACTIONS_CORS_HEADERS);
    res.status(200).end();
});
app.options('/api/actions/:id/confirm_raffle', (_req, res) => {
    res.set(ACTIONS_CORS_HEADERS);
    res.status(200).end();
});
mongoose_1.default
    .connect(config_1.default.database.mongodb.uri)
    .then(() => {
    logger_1.default.info('MongoDB connected', { uri: config_1.default.database.mongodb.uri });
})
    .catch((err) => {
    logger_1.default.error('MongoDB connection failed', { error: err.message });
    process.exit(1);
});
const blinkService = new BlinkService_1.BlinkService();
const transactionService = new TransactionService_1.TransactionService();
const jupiterService = new JupiterService_1.JupiterService();
app.get('/api/actions/:id', async (req, res, next) => {
    try {
        const blink = await blinkService.getBlinkById((0, helpers_1.getParamString)(req.params.id));
        if (!blink) {
            throw new errorHandler_1.AppError('Blink not found', 404);
        }
        const baseUrl = (0, helpers_1.getBaseUrl)(req);
        const blinkObj = blink.toObject();
        const settings = (blinkObj.settings || {});
        let actions = [
            {
                label: blink.label,
                href: `${baseUrl}/api/actions/${blink._id}`,
            },
        ];
        if (settings.actions && Array.isArray(settings.actions) && settings.actions.length > 0) {
            logger_1.default.debug('Mapping multiple actions', { blinkId: blink._id, count: settings.actions.length });
            actions = settings.actions.map((action) => ({
                label: action.label,
                href: `${baseUrl}/api/actions/${blink._id}?value=${encodeURIComponent(action.value)}`,
            }));
        }
        else {
            logger_1.default.debug('Using default action', { blinkId: blink._id });
        }
        const response = {
            icon: blink.icon,
            title: blink.title,
            description: blink.description,
            label: blink.label,
            links: {
                actions,
            },
        };
        res.json(response);
    }
    catch (error) {
        next(error);
    }
});
app.post('/api/actions/:id', validation_1.validateAccountMiddleware, async (req, res, next) => {
    try {
        const { account } = req.body;
        const queryValue = (0, helpers_1.getQueryString)(req.query.value);
        const blink = await blinkService.getBlinkById((0, helpers_1.getParamString)(req.params.id));
        if (!blink) {
            throw new errorHandler_1.AppError('Blink not found', 404);
        }
        const userPubkey = new web3_js_1.PublicKey(account);
        const baseUrl = (0, helpers_1.getBaseUrl)(req);
        logger_1.default.info('Processing action', {
            blinkId: blink._id,
            type: blink.type,
            user: account,
        });
        let transaction = null;
        let message = 'Transaction Successful!';
        let nextAction = null;
        switch (blink.type) {
            case 'donation': {
                const settings = blink.settings;
                let amount = 0.1;
                if (queryValue) {
                    amount = parseFloat(queryValue);
                }
                else if (settings.amounts && settings.amounts.length > 0) {
                    amount = settings.amounts[0];
                }
                transaction = await transactionService.buildDonationTransaction(blink, userPubkey, amount);
                message = `Donated ${amount} SOL`;
                break;
            }
            case 'swap': {
                const settings = blink.settings;
                const amountSol = (0, helpers_1.parseAmount)(queryValue, 0.01);
                const swapResult = await jupiterService.getSwapTransaction(settings.tokenMint, settings.tokenSymbol, userPubkey, amountSol);
                return res.json({
                    transaction: swapResult.transaction,
                    message: swapResult.message,
                });
            }
            case 'reveal': {
                const result = await transactionService.buildRevealTransaction(blink, userPubkey, baseUrl);
                transaction = result.transaction;
                nextAction = result.nextAction;
                const settings = blink.settings;
                message = `Paid ${settings.price} SOL! Revealing content...`;
                break;
            }
            case 'raffle': {
                const ticketCount = (0, helpers_1.parseTicketCount)(queryValue);
                const result = await transactionService.buildRaffleTransaction(blink, userPubkey, ticketCount, baseUrl);
                transaction = result.transaction;
                nextAction = result.nextAction;
                message = `Transaction Confirmed! Buying ${ticketCount} ticket(s)...`;
                break;
            }
            default:
                throw new errorHandler_1.AppError('Invalid Blink Type', 400);
        }
        if (!transaction) {
            throw new errorHandler_1.AppError('Failed to build transaction', 500);
        }
        const payload = await transactionService.finalizeTransaction(transaction, userPubkey);
        const responsePayload = {
            transaction: payload,
            message,
        };
        if (nextAction) {
            responsePayload.links = { next: nextAction };
        }
        res.json(responsePayload);
    }
    catch (error) {
        next(error);
    }
});
app.post('/api/actions/:id/confirm_raffle', async (req, res, next) => {
    try {
        const { account } = req.body;
        if (!account) {
            throw new errorHandler_1.AppError('Account required', 400);
        }
        const blinkId = (0, helpers_1.getParamString)(req.params.id);
        logger_1.default.info('Confirming raffle entry', { blinkId, account });
        const blink = await blinkService.addRaffleEntry(blinkId, account);
        if (!blink) {
            throw new errorHandler_1.AppError('Blink not found', 404);
        }
        res.json({
            type: 'completed',
            title: 'Raffle Entry Confirmed!',
            icon: blink.icon,
            label: 'Done',
            description: `Your wallet ${account.slice(0, 4)}...${account.slice(-4)} has been entered into the raffle.`,
        });
    }
    catch (error) {
        next(error);
    }
});
app.get('/api/blinks', validation_1.validateCreatorMiddleware, async (req, res, next) => {
    try {
        const creator = (0, helpers_1.getQueryString)(req.query.creator);
        const blinks = await blinkService.getBlinksByCreator(creator);
        const baseUrl = (0, helpers_1.getBaseUrl)(req);
        const enrichedBlinks = blinks.map((blink) => ({
            ...blink.toObject(),
            actionUrl: `${baseUrl}/api/actions/${blink._id}`,
        }));
        res.json(enrichedBlinks);
    }
    catch (error) {
        next(error);
    }
});
app.delete('/api/blinks/:id', async (req, res, next) => {
    try {
        const id = (0, helpers_1.getParamString)(req.params.id);
        const { creator } = req.body;
        if (!creator) {
            throw new errorHandler_1.AppError('Creator wallet required for verification', 400);
        }
        await blinkService.deleteBlink(id, creator);
        res.json({ message: 'Blink deleted successfully' });
    }
    catch (error) {
        next(error);
    }
});
app.post('/api/create', validation_1.validateCreateBlinkMiddleware, async (req, res, next) => {
    try {
        const payload = req.body;
        const newBlink = await blinkService.createBlink(payload);
        const baseUrl = (0, helpers_1.getBaseUrl)(req);
        res.status(201).json({
            ...newBlink.toObject(),
            actionUrl: `${baseUrl}/api/actions/${newBlink._id}`,
        });
    }
    catch (error) {
        next(error);
    }
});
app.use(errorHandler_1.errorHandler);
app.listen(config_1.default.server.port, () => {
    logger_1.default.info('Server started', {
        port: config_1.default.server.port,
        nodeEnv: config_1.default.server.nodeEnv,
        solanaNetwork: config_1.default.solana.network,
    });
});
//# sourceMappingURL=server.js.map