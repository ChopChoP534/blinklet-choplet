import { PublicKey } from '@solana/web3.js';
export declare class JupiterService {
    getSwapTransaction(tokenMint: string, tokenSymbol: string, userPubkey: PublicKey, amountSol: number): Promise<{
        transaction: string;
        message: string;
    }>;
    private getQuote;
    private getSwap;
}
//# sourceMappingURL=JupiterService.d.ts.map