interface Config {
    server: {
        port: number;
        nodeEnv: string;
    };
    database: {
        mongodb: {
            uri: string;
        };
    };
    solana: {
        rpcUrl: string;
        network: string;
        blockchainId: string;
    };
    cors: {
        allowedOrigins: string[];
    };
    fees: {
        priorityFeeMicroLamports: number;
    };
    jupiter: {
        quoteApiUrl: string;
        swapApiUrl: string;
        slippageBps: number;
    };
    logging: {
        level: string;
    };
}
declare const config: Config;
export default config;
//# sourceMappingURL=index.d.ts.map