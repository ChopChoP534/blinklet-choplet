import { Request, Response, NextFunction } from 'express';
import { PublicKey } from '@solana/web3.js';
import { BlinkType, CreateBlinkPayload } from '../types';
import { AppError } from './errorHandler';
import { getQueryString } from '../utils/helpers';

export const validateSolanaAddress = (address: string): boolean => {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
};

export const validateBlinkType = (type: string): type is BlinkType => {
  return ['donation', 'swap', 'reveal', 'raffle'].includes(type);
};

export const validateAccountMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const { account } = req.body;

  if (!account) {
    throw new AppError('Account is required', 400);
  }

  if (!validateSolanaAddress(account)) {
    throw new AppError('Invalid Solana address', 400);
  }

  next();
};

export const validateCreatorMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const creator = getQueryString(req.query.creator) || req.body.creator;

  if (!creator) {
    throw new AppError('Creator wallet required', 400);
  }

  if (!validateSolanaAddress(creator)) {
    throw new AppError('Invalid creator Solana address', 400);
  }

  next();
};

export const validateCreateBlinkMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const payload = req.body as CreateBlinkPayload;

  if (!payload.creatorWallet) {
    throw new AppError('Creator wallet is required', 400);
  }

  if (!validateSolanaAddress(payload.creatorWallet)) {
    throw new AppError('Invalid creator Solana address', 400);
  }

  if (!payload.type || !validateBlinkType(payload.type)) {
    throw new AppError('Invalid Blink type', 400);
  }

  if (!payload.title || !payload.description || !payload.icon || !payload.label) {
    throw new AppError('Title, description, icon, and label are required', 400);
  }

  try {
    new URL(payload.icon);
  } catch {
    throw new AppError('Icon must be a valid URL', 400);
  }

  if (!payload.settings) {
    throw new AppError('Settings are required', 400);
  }

  validateBlinkSettings(payload.type, payload.settings);

  next();
};

export const validateBlinkSettings = (type: BlinkType, settings: unknown): void => {
  const s = settings as Record<string, unknown>;

  switch (type) {
    case 'donation': {
      if (!s.recipient || typeof s.recipient !== 'string') {
        throw new AppError('Donation requires recipient address', 400);
      }
      if (!validateSolanaAddress(s.recipient)) {
        throw new AppError('Invalid recipient Solana address', 400);
      }
      break;
    }
    case 'swap': {
      if (!s.tokenMint || typeof s.tokenMint !== 'string') {
        throw new AppError('Swap requires tokenMint', 400);
      }
      if (!validateSolanaAddress(s.tokenMint)) {
        throw new AppError('Invalid tokenMint address', 400);
      }
      if (!s.tokenSymbol || typeof s.tokenSymbol !== 'string') {
        throw new AppError('Swap requires tokenSymbol', 400);
      }
      break;
    }
    case 'reveal': {
      if (typeof s.price !== 'number' || s.price <= 0) {
        throw new AppError('Reveal requires a valid price', 400);
      }
      if (!s.hiddenContent || typeof s.hiddenContent !== 'string') {
        throw new AppError('Reveal requires hiddenContent', 400);
      }
      break;
    }
    case 'raffle': {
      if (typeof s.ticketPrice !== 'number' || s.ticketPrice <= 0) {
        throw new AppError('Raffle requires a valid ticketPrice', 400);
      }
      if (typeof s.maxEntries !== 'number' || s.maxEntries <= 0) {
        throw new AppError('Raffle requires a valid maxEntries', 400);
      }
      break;
    }
  }
};

export const validateJupiterResponse = (data: unknown): void => {
  if (!data || typeof data !== 'object') {
    throw new AppError('Invalid Jupiter API response', 500);
  }

  const response = data as Record<string, unknown>;

  if ('error' in response) {
    throw new AppError('Jupiter API error: ' + String(response.error), 500);
  }
};
