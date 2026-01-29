import { Request, Response, NextFunction } from 'express';
import { BlinkType } from '../types';
export declare const validateSolanaAddress: (address: string) => boolean;
export declare const validateBlinkType: (type: string) => type is BlinkType;
export declare const validateAccountMiddleware: (req: Request, _res: Response, next: NextFunction) => void;
export declare const validateCreatorMiddleware: (req: Request, _res: Response, next: NextFunction) => void;
export declare const validateCreateBlinkMiddleware: (req: Request, _res: Response, next: NextFunction) => void;
export declare const validateBlinkSettings: (type: BlinkType, settings: unknown) => void;
export declare const validateJupiterResponse: (data: unknown) => void;
//# sourceMappingURL=validation.d.ts.map