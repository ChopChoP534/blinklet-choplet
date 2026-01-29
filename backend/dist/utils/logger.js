"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = __importDefault(require("winston"));
const winston_daily_rotate_file_1 = __importDefault(require("winston-daily-rotate-file"));
const isDevelopment = process.env.NODE_ENV !== 'production';
const consoleFormat = winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = '';
    if (Object.keys(meta).length > 0) {
        metaStr = ' ' + JSON.stringify(meta);
    }
    return `${timestamp} [${level}]: ${message}${metaStr}`;
}));
const jsonFormat = winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json());
const transports = [];
if (isDevelopment) {
    transports.push(new winston_1.default.transports.Console({
        format: consoleFormat,
    }));
}
else {
    transports.push(new winston_1.default.transports.Console({
        format: jsonFormat,
    }));
}
transports.push(new winston_daily_rotate_file_1.default({
    filename: 'logs/error-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    format: jsonFormat,
    maxFiles: '14d',
}));
transports.push(new winston_daily_rotate_file_1.default({
    filename: 'logs/combined-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    format: jsonFormat,
    maxFiles: '14d',
}));
const logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    transports,
});
exports.default = logger;
//# sourceMappingURL=logger.js.map