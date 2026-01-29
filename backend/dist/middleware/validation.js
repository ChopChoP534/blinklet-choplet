"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateJupiterResponse = exports.validateBlinkSettings = exports.validateCreateBlinkMiddleware = exports.validateCreatorMiddleware = exports.validateAccountMiddleware = exports.validateBlinkType = exports.validateSolanaAddress = void 0;
const web3_js_1 = require("@solana/web3.js");
const errorHandler_1 = require("./errorHandler");
const helpers_1 = require("../utils/helpers");
const validateSolanaAddress = (address) => {
    try {
        new web3_js_1.PublicKey(address);
        return true;
    }
    catch {
        return false;
    }
};
exports.validateSolanaAddress = validateSolanaAddress;
const validateBlinkType = (type) => {
    return ['donation', 'swap', 'reveal', 'raffle'].includes(type);
};
exports.validateBlinkType = validateBlinkType;
const validateAccountMiddleware = (req, _res, next) => {
    const { account } = req.body;
    if (!account) {
        throw new errorHandler_1.AppError('Account is required', 400);
    }
    if (!(0, exports.validateSolanaAddress)(account)) {
        throw new errorHandler_1.AppError('Invalid Solana address', 400);
    }
    next();
};
exports.validateAccountMiddleware = validateAccountMiddleware;
const validateCreatorMiddleware = (req, _res, next) => {
    const creator = (0, helpers_1.getQueryString)(req.query.creator) || req.body.creator;
    if (!creator) {
        throw new errorHandler_1.AppError('Creator wallet required', 400);
    }
    if (!(0, exports.validateSolanaAddress)(creator)) {
        throw new errorHandler_1.AppError('Invalid creator Solana address', 400);
    }
    next();
};
exports.validateCreatorMiddleware = validateCreatorMiddleware;
const validateCreateBlinkMiddleware = (req, _res, next) => {
    const payload = req.body;
    if (!payload.creatorWallet) {
        throw new errorHandler_1.AppError('Creator wallet is required', 400);
    }
    if (!(0, exports.validateSolanaAddress)(payload.creatorWallet)) {
        throw new errorHandler_1.AppError('Invalid creator Solana address', 400);
    }
    if (!payload.type || !(0, exports.validateBlinkType)(payload.type)) {
        throw new errorHandler_1.AppError('Invalid Blink type', 400);
    }
    if (!payload.title || !payload.description || !payload.icon || !payload.label) {
        throw new errorHandler_1.AppError('Title, description, icon, and label are required', 400);
    }
    try {
        new URL(payload.icon);
    }
    catch {
        throw new errorHandler_1.AppError('Icon must be a valid URL', 400);
    }
    if (!payload.settings) {
        throw new errorHandler_1.AppError('Settings are required', 400);
    }
    (0, exports.validateBlinkSettings)(payload.type, payload.settings);
    next();
};
exports.validateCreateBlinkMiddleware = validateCreateBlinkMiddleware;
const validateBlinkSettings = (type, settings) => {
    const s = settings;
    switch (type) {
        case 'donation': {
            if (!s.recipient || typeof s.recipient !== 'string') {
                throw new errorHandler_1.AppError('Donation requires recipient address', 400);
            }
            if (!(0, exports.validateSolanaAddress)(s.recipient)) {
                throw new errorHandler_1.AppError('Invalid recipient Solana address', 400);
            }
            break;
        }
        case 'swap': {
            if (!s.tokenMint || typeof s.tokenMint !== 'string') {
                throw new errorHandler_1.AppError('Swap requires tokenMint', 400);
            }
            if (!(0, exports.validateSolanaAddress)(s.tokenMint)) {
                throw new errorHandler_1.AppError('Invalid tokenMint address', 400);
            }
            if (!s.tokenSymbol || typeof s.tokenSymbol !== 'string') {
                throw new errorHandler_1.AppError('Swap requires tokenSymbol', 400);
            }
            break;
        }
        case 'reveal': {
            if (typeof s.price !== 'number' || s.price <= 0) {
                throw new errorHandler_1.AppError('Reveal requires a valid price', 400);
            }
            if (!s.hiddenContent || typeof s.hiddenContent !== 'string') {
                throw new errorHandler_1.AppError('Reveal requires hiddenContent', 400);
            }
            break;
        }
        case 'raffle': {
            if (typeof s.ticketPrice !== 'number' || s.ticketPrice <= 0) {
                throw new errorHandler_1.AppError('Raffle requires a valid ticketPrice', 400);
            }
            if (typeof s.maxEntries !== 'number' || s.maxEntries <= 0) {
                throw new errorHandler_1.AppError('Raffle requires a valid maxEntries', 400);
            }
            break;
        }
    }
};
exports.validateBlinkSettings = validateBlinkSettings;
const validateJupiterResponse = (data) => {
    if (!data || typeof data !== 'object') {
        throw new errorHandler_1.AppError('Invalid Jupiter API response', 500);
    }
    const response = data;
    if ('error' in response) {
        throw new errorHandler_1.AppError('Jupiter API error: ' + String(response.error), 500);
    }
};
exports.validateJupiterResponse = validateJupiterResponse;
//# sourceMappingURL=validation.js.map