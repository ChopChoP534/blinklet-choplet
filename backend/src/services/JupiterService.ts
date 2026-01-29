import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import config from '../config';
import logger from '../utils/logger';
import { JupiterQuoteResponse, JupiterSwapResponse } from '../types';
import { validateJupiterResponse } from '../middleware/validation';

const SOL_MINT = 'So11111111111111111111111111111111111111112';

export class JupiterService {
  async getSwapTransaction(
    tokenMint: string,
    tokenSymbol: string,
    userPubkey: PublicKey,
    amountSol: number
  ): Promise<{ transaction: string; message: string }> {
    logger.info('Initiating Jupiter swap', {
      tokenMint,
      tokenSymbol,
      amountSol,
      user: userPubkey.toString(),
    });

    const amountLamports = Math.floor(amountSol * LAMPORTS_PER_SOL);

    const quote = await this.getQuote(SOL_MINT, tokenMint, amountLamports);
    const swap = await this.getSwap(quote, userPubkey);

    logger.info('Jupiter swap transaction generated', {
      tokenSymbol,
      amountSol,
      outAmount: quote.outAmount,
    });

    return {
      transaction: swap.swapTransaction,
      message: `Swapped ${amountSol} SOL for ${tokenSymbol}`,
    };
  }

  private async getQuote(
    inputMint: string,
    outputMint: string,
    amount: number
  ): Promise<JupiterQuoteResponse> {
    logger.debug('Fetching Jupiter quote', { inputMint, outputMint, amount });

    const url = `${config.jupiter.quoteApiUrl}?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${config.jupiter.slippageBps}`;

    const response = await fetch(url);
    const data: unknown = await response.json();

    validateJupiterResponse(data);

    const quoteData = data as JupiterQuoteResponse;

    if (!quoteData.outAmount) {
      throw new Error('Failed to get quote from Jupiter');
    }

    logger.debug('Jupiter quote received', { outAmount: quoteData.outAmount });

    return quoteData;
  }

  private async getSwap(
    quoteResponse: JupiterQuoteResponse,
    userPubkey: PublicKey
  ): Promise<JupiterSwapResponse> {
    logger.debug('Fetching Jupiter swap transaction', { user: userPubkey.toString() });

    const response = await fetch(config.jupiter.swapApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quoteResponse,
        userPublicKey: userPubkey.toString(),
        wrapAndUnwrapSol: true,
        prioritizationFeeLamports: config.fees.priorityFeeMicroLamports,
      }),
    });

    const data: unknown = await response.json();

    validateJupiterResponse(data);

    const swapData = data as JupiterSwapResponse;

    if (!swapData.swapTransaction) {
      throw new Error('Failed to get swap transaction from Jupiter');
    }

    logger.debug('Jupiter swap transaction received');

    return swapData;
  }
}
