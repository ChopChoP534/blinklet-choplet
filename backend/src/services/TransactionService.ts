import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  ComputeBudgetProgram,
} from '@solana/web3.js';
import { BlinkDocument, NextAction } from '../types';
import config from '../config';
import logger from '../utils/logger';

export class TransactionService {
  private connection: Connection;

  constructor() {
    this.connection = new Connection(config.solana.rpcUrl, 'confirmed');
    logger.info('Solana connection initialized', {
      rpcUrl: config.solana.rpcUrl,
      network: config.solana.network,
    });
  }

  async buildDonationTransaction(
    blink: BlinkDocument,
    userPubkey: PublicKey,
    amount: number
  ): Promise<Transaction> {
    const settings = blink.settings as { recipient: string };
    const recipientPubkey = new PublicKey(settings.recipient);

    logger.debug('Building donation transaction', {
      blinkId: blink._id,
      amount,
      recipient: settings.recipient,
    });

    const transaction = new Transaction();

    transaction.add(
      ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: config.fees.priorityFeeMicroLamports,
      })
    );

    transaction.add(
      SystemProgram.transfer({
        fromPubkey: userPubkey,
        toPubkey: recipientPubkey,
        lamports: Math.floor(amount * LAMPORTS_PER_SOL),
      })
    );

    return transaction;
  }

  async buildRevealTransaction(
    blink: BlinkDocument,
    userPubkey: PublicKey,
    _baseUrl: string
  ): Promise<{ transaction: Transaction; nextAction: NextAction }> {
    const settings = blink.settings as { price: number; hiddenContent: string };
    const creatorPubkey = new PublicKey(blink.creatorWallet);
    const lamports = Math.floor(settings.price * LAMPORTS_PER_SOL);

    logger.debug('Building reveal transaction', {
      blinkId: blink._id,
      price: settings.price,
      lamports,
    });

    const transaction = new Transaction();

    transaction.add(
      ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: config.fees.priorityFeeMicroLamports,
      })
    );

    transaction.add(
      SystemProgram.transfer({
        fromPubkey: userPubkey,
        toPubkey: creatorPubkey,
        lamports,
      })
    );

    const nextAction: NextAction = {
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

  async buildRaffleTransaction(
    blink: BlinkDocument,
    userPubkey: PublicKey,
    ticketCount: number,
    baseUrl: string
  ): Promise<{ transaction: Transaction; nextAction: NextAction }> {
    const settings = blink.settings as { ticketPrice: number };
    const creatorPubkey = new PublicKey(blink.creatorWallet);
    const totalCost = settings.ticketPrice * ticketCount;
    const lamports = Math.floor(totalCost * LAMPORTS_PER_SOL);

    logger.debug('Building raffle transaction', {
      blinkId: blink._id,
      ticketPrice: settings.ticketPrice,
      ticketCount,
      totalCost,
      lamports,
    });

    const transaction = new Transaction();

    transaction.add(
      ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: config.fees.priorityFeeMicroLamports,
      })
    );

    transaction.add(
      SystemProgram.transfer({
        fromPubkey: userPubkey,
        toPubkey: creatorPubkey,
        lamports,
      })
    );

    const nextAction: NextAction = {
      type: 'post',
      href: `${baseUrl}/api/actions/${blink._id}/confirm_raffle`,
    };

    return { transaction, nextAction };
  }

  async finalizeTransaction(transaction: Transaction, userPubkey: PublicKey): Promise<string> {
    const { blockhash } = await this.connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = userPubkey;

    logger.debug('Finalizing transaction', {
      feePayer: userPubkey.toString(),
      blockhash,
    });

    const payload = transaction
      .serialize({ requireAllSignatures: false, verifySignatures: false })
      .toString('base64');

    logger.debug('Transaction serialized', { payloadLength: payload.length });

    return payload;
  }
}
