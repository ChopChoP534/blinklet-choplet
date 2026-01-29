import { PublicKey, Transaction } from '@solana/web3.js';
import { BlinkDocument, NextAction } from '../types';
export declare class TransactionService {
    private connection;
    constructor();
    buildDonationTransaction(blink: BlinkDocument, userPubkey: PublicKey, amount: number): Promise<Transaction>;
    buildRevealTransaction(blink: BlinkDocument, userPubkey: PublicKey, _baseUrl: string): Promise<{
        transaction: Transaction;
        nextAction: NextAction;
    }>;
    buildRaffleTransaction(blink: BlinkDocument, userPubkey: PublicKey, ticketCount: number, baseUrl: string): Promise<{
        transaction: Transaction;
        nextAction: NextAction;
    }>;
    finalizeTransaction(transaction: Transaction, userPubkey: PublicKey): Promise<string>;
}
//# sourceMappingURL=TransactionService.d.ts.map