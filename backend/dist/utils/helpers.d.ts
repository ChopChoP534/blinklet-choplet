import { Request } from 'express';
export declare const getQueryString: (value: unknown) => string | undefined;
export declare const getParamString: (value: string | string[]) => string;
export declare const getBaseUrl: (req: Request) => string;
export declare const parseAmount: (queryValue: string | undefined, defaultAmount: number) => number;
export declare const parseTicketCount: (queryValue: string | undefined) => number;
//# sourceMappingURL=helpers.d.ts.map