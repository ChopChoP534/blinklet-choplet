"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.AppError = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
class AppError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
const errorHandler = (err, req, res, _next) => {
    if (err instanceof AppError) {
        logger_1.default.error('Operational error', {
            message: err.message,
            statusCode: err.statusCode,
            path: req.path,
            method: req.method,
        });
        res.status(err.statusCode).json({
            error: err.message,
        });
    }
    else {
        logger_1.default.error('Unexpected error', {
            message: err.message,
            stack: err.stack,
            path: req.path,
            method: req.method,
        });
        res.status(500).json({
            error: 'Internal Server Error',
        });
    }
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map