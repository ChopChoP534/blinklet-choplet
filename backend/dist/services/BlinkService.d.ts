import { BlinkDocument, CreateBlinkPayload } from '../types';
export declare class BlinkService {
    getBlinkById(id: string): Promise<BlinkDocument | null>;
    getBlinksByCreator(creatorWallet: string): Promise<BlinkDocument[]>;
    createBlink(payload: CreateBlinkPayload): Promise<BlinkDocument>;
    deleteBlink(id: string, creatorWallet: string): Promise<void>;
    addRaffleEntry(blinkId: string, walletAddress: string): Promise<BlinkDocument | null>;
}
//# sourceMappingURL=BlinkService.d.ts.map