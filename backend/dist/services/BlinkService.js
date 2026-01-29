"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlinkService = void 0;
const Blink_1 = __importDefault(require("../models/Blink"));
const logger_1 = __importDefault(require("../utils/logger"));
const errorHandler_1 = require("../middleware/errorHandler");
class BlinkService {
    async getBlinkById(id) {
        logger_1.default.debug('Fetching Blink by ID', { id });
        const blink = await Blink_1.default.findById(id);
        if (!blink) {
            logger_1.default.warn('Blink not found', { id });
        }
        else {
            logger_1.default.info('Blink retrieved', { id, type: blink.type });
        }
        return blink;
    }
    async getBlinksByCreator(creatorWallet) {
        logger_1.default.debug('Fetching Blinks by creator', { creatorWallet });
        const blinks = await Blink_1.default.find({ creatorWallet }).sort({ createdAt: -1 });
        logger_1.default.info('Creator Blinks retrieved', { creatorWallet, count: blinks.length });
        return blinks;
    }
    async createBlink(payload) {
        logger_1.default.info('Creating new Blink', { type: payload.type, creator: payload.creatorWallet });
        const blink = await Blink_1.default.create(payload);
        logger_1.default.info('Blink created successfully', { id: blink._id, type: blink.type });
        return blink;
    }
    async deleteBlink(id, creatorWallet) {
        logger_1.default.debug('Attempting to delete Blink', { id, creator: creatorWallet });
        const blink = await Blink_1.default.findById(id);
        if (!blink) {
            throw new errorHandler_1.AppError('Blink not found', 404);
        }
        if (blink.creatorWallet !== creatorWallet) {
            logger_1.default.warn('Unauthorized delete attempt', { id, creator: creatorWallet, owner: blink.creatorWallet });
            throw new errorHandler_1.AppError('Unauthorized to delete this Blink', 403);
        }
        await Blink_1.default.findByIdAndDelete(id);
        logger_1.default.info('Blink deleted successfully', { id });
    }
    async addRaffleEntry(blinkId, walletAddress) {
        logger_1.default.info('Adding raffle entry', { blinkId, wallet: walletAddress });
        const blink = await Blink_1.default.findByIdAndUpdate(blinkId, { $push: { 'settings.entries': walletAddress } }, { new: true });
        if (blink) {
            logger_1.default.info('Raffle entry added', { blinkId, wallet: walletAddress });
        }
        return blink;
    }
}
exports.BlinkService = BlinkService;
//# sourceMappingURL=BlinkService.js.map