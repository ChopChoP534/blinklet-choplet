import Blink from '../models/Blink';
import { BlinkDocument, CreateBlinkPayload } from '../types';
import logger from '../utils/logger';
import { AppError } from '../middleware/errorHandler';

export class BlinkService {
  async getBlinkById(id: string): Promise<BlinkDocument | null> {
    logger.debug('Fetching Blink by ID', { id });
    const blink = await Blink.findById(id);

    if (!blink) {
      logger.warn('Blink not found', { id });
    } else {
      logger.info('Blink retrieved', { id, type: blink.type });
    }

    return blink;
  }

  async getBlinksByCreator(creatorWallet: string): Promise<BlinkDocument[]> {
    logger.debug('Fetching Blinks by creator', { creatorWallet });
    const blinks = await Blink.find({ creatorWallet }).sort({ createdAt: -1 });
    logger.info('Creator Blinks retrieved', { creatorWallet, count: blinks.length });
    return blinks;
  }

  async createBlink(payload: CreateBlinkPayload): Promise<BlinkDocument> {
    logger.info('Creating new Blink', { type: payload.type, creator: payload.creatorWallet });
    const blink = await Blink.create(payload);
    logger.info('Blink created successfully', { id: blink._id, type: blink.type });
    return blink;
  }

  async deleteBlink(id: string, creatorWallet: string): Promise<void> {
    logger.debug('Attempting to delete Blink', { id, creator: creatorWallet });

    const blink = await Blink.findById(id);
    if (!blink) {
      throw new AppError('Blink not found', 404);
    }

    if (blink.creatorWallet !== creatorWallet) {
      logger.warn('Unauthorized delete attempt', { id, creator: creatorWallet, owner: blink.creatorWallet });
      throw new AppError('Unauthorized to delete this Blink', 403);
    }

    await Blink.findByIdAndDelete(id);
    logger.info('Blink deleted successfully', { id });
  }

  async addRaffleEntry(blinkId: string, walletAddress: string): Promise<BlinkDocument | null> {
    logger.info('Adding raffle entry', { blinkId, wallet: walletAddress });
    const blink = await Blink.findByIdAndUpdate(
      blinkId,
      { $push: { 'settings.entries': walletAddress } },
      { new: true }
    );

    if (blink) {
      logger.info('Raffle entry added', { blinkId, wallet: walletAddress });
    }

    return blink;
  }
}
