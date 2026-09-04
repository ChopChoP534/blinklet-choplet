import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { PublicKey } from '@solana/web3.js';
import config from './config';
import logger from './utils/logger';
import { BlinkService } from './services/BlinkService';
import { TransactionService } from './services/TransactionService';
import { JupiterService } from './services/JupiterService';
import {
  validateAccountMiddleware,
  validateCreatorMiddleware,
  validateCreateBlinkMiddleware,
} from './middleware/validation';
import { errorHandler, AppError } from './middleware/errorHandler';
import {
  getBaseUrl,
  parseAmount,
  parseTicketCount,
  getQueryString,
  getParamString,
} from './utils/helpers';
import { CreateBlinkPayload } from './types';

const app = express();

app.use(express.json());
app.set('trust proxy', true);

const ACTIONS_CORS_HEADERS = {
  'X-Action-Version': '1',
  'X-Blockchain-Ids': config.solana.blockchainId,
};

app.use((_req, res, next) => {
  res.set(ACTIONS_CORS_HEADERS);
  next();
});

app.use(
  cors({
    origin: config.cors.allowedOrigins[0] === '*' ? '*' : config.cors.allowedOrigins,
    methods: ['GET', 'POST', 'OPTIONS', 'DELETE', 'PUT'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Content-Encoding', 'Accept-Encoding'],
  }),
);

app.options('/api/actions/*', (_req, res) => {
  res.set(ACTIONS_CORS_HEADERS);
  res.status(200).end();
});

app.options('/api/actions/:id/confirm_raffle', (_req, res) => {
  res.set(ACTIONS_CORS_HEADERS);
  res.status(200).end();
});

mongoose
  .connect(config.database.mongodb.uri)
  .then(() => {
    logger.info('MongoDB connected');
  })
  .catch((err) => {
    logger.error('MongoDB connection failed', { error: err.message });
    process.exit(1);
  });

const blinkService = new BlinkService();
const transactionService = new TransactionService();
const jupiterService = new JupiterService();

app.get('/api/actions/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const blink = await blinkService.getBlinkById(getParamString(req.params.id));
    if (!blink) {
      throw new AppError('Blink not found', 404);
    }

    const baseUrl = getBaseUrl(req);
    const blinkObj = blink.toObject();
    const settings = (blinkObj.settings || {}) as Record<string, unknown>;

    let actions = [
      {
        label: blink.label,
        href: `${baseUrl}/api/actions/${blink._id}`,
      },
    ];

    if (settings.actions && Array.isArray(settings.actions) && settings.actions.length > 0) {
      logger.debug('Mapping multiple actions', {
        blinkId: blink._id,
        count: settings.actions.length,
      });
      actions = settings.actions.map((action: { label: string; value: string }) => ({
        label: action.label,
        href: `${baseUrl}/api/actions/${blink._id}?value=${encodeURIComponent(action.value)}`,
      }));
    } else {
      logger.debug('Using default action', { blinkId: blink._id });
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
  } catch (error) {
    next(error);
  }
});

app.post(
  '/api/actions/:id',
  validateAccountMiddleware,
  async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const { account } = req.body;
      const queryValue = getQueryString(req.query.value);

      const blink = await blinkService.getBlinkById(getParamString(req.params.id));
      if (!blink) {
        throw new AppError('Blink not found', 404);
      }

      const userPubkey = new PublicKey(account);
      const baseUrl = getBaseUrl(req);

      logger.info('Processing action', {
        blinkId: blink._id,
        type: blink.type,
        user: account,
      });

      let transaction = null;
      let message = 'Transaction Successful!';
      let nextAction = null;

      switch (blink.type) {
        case 'donation': {
          const settings = blink.settings as { amounts?: number[] };
          let amount = 0.1;

          if (queryValue) {
            amount = parseFloat(queryValue);
          } else if (settings.amounts && settings.amounts.length > 0) {
            amount = settings.amounts[0];
          }

          transaction = await transactionService.buildDonationTransaction(
            blink,
            userPubkey,
            amount,
          );
          message = `Donated ${amount} SOL`;
          break;
        }

        case 'swap': {
          const settings = blink.settings as { tokenMint: string; tokenSymbol: string };
          const amountSol = parseAmount(queryValue, 0.01);

          const swapResult = await jupiterService.getSwapTransaction(
            settings.tokenMint,
            settings.tokenSymbol,
            userPubkey,
            amountSol,
          );

          return res.json({
            transaction: swapResult.transaction,
            message: swapResult.message,
          });
        }

        case 'reveal': {
          const result = await transactionService.buildRevealTransaction(
            blink,
            userPubkey,
            baseUrl,
          );
          transaction = result.transaction;
          nextAction = result.nextAction;
          const settings = blink.settings as { price: number };
          message = `Paid ${settings.price} SOL! Revealing content...`;
          break;
        }

        case 'raffle': {
          const ticketCount = parseTicketCount(queryValue);
          const result = await transactionService.buildRaffleTransaction(
            blink,
            userPubkey,
            ticketCount,
            baseUrl,
          );
          transaction = result.transaction;
          nextAction = result.nextAction;
          message = `Transaction Confirmed! Buying ${ticketCount} ticket(s)...`;
          break;
        }

        default:
          throw new AppError('Invalid Blink Type', 400);
      }

      if (!transaction) {
        throw new AppError('Failed to build transaction', 500);
      }

      const payload = await transactionService.finalizeTransaction(transaction, userPubkey);

      const responsePayload: Record<string, unknown> = {
        transaction: payload,
        message,
      };

      if (nextAction) {
        responsePayload.links = { next: nextAction };
      }

      res.json(responsePayload);
    } catch (error) {
      next(error);
    }
  },
);

app.post(
  '/api/actions/:id/confirm_raffle',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { account } = req.body;
      if (!account) {
        throw new AppError('Account required', 400);
      }

      const blinkId = getParamString(req.params.id);
      logger.info('Confirming raffle entry', { blinkId, account });

      const blink = await blinkService.addRaffleEntry(blinkId, account);

      if (!blink) {
        throw new AppError('Blink not found', 404);
      }

      res.json({
        type: 'completed',
        title: 'Raffle Entry Confirmed!',
        icon: blink.icon,
        label: 'Done',
        description: `Your wallet ${account.slice(0, 4)}...${account.slice(-4)} has been entered into the raffle.`,
      });
    } catch (error) {
      next(error);
    }
  },
);

app.get(
  '/api/blinks',
  validateCreatorMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const creator = getQueryString(req.query.creator)!;
      const blinks = await blinkService.getBlinksByCreator(creator);

      const baseUrl = getBaseUrl(req);

      const enrichedBlinks = blinks.map((blink) => ({
        ...blink.toObject(),
        actionUrl: `${baseUrl}/api/actions/${blink._id}`,
      }));

      res.json(enrichedBlinks);
    } catch (error) {
      next(error);
    }
  },
);

app.delete('/api/blinks/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = getParamString(req.params.id);
    const { creator } = req.body;

    if (!creator) {
      throw new AppError('Creator wallet required for verification', 400);
    }

    await blinkService.deleteBlink(id, creator);
    res.json({ message: 'Blink deleted successfully' });
  } catch (error) {
    next(error);
  }
});

app.post(
  '/api/create',
  validateCreateBlinkMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payload = req.body as CreateBlinkPayload;
      const newBlink = await blinkService.createBlink(payload);

      const baseUrl = getBaseUrl(req);

      res.status(201).json({
        ...newBlink.toObject(),
        actionUrl: `${baseUrl}/api/actions/${newBlink._id}`,
      });
    } catch (error) {
      next(error);
    }
  },
);

app.use(errorHandler);

app.listen(config.server.port, () => {
  logger.info('Server started', {
    port: config.server.port,
    nodeEnv: config.server.nodeEnv,
    solanaNetwork: config.solana.network,
  });
});
