"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseTicketCount = exports.parseAmount = exports.getBaseUrl = exports.getParamString = exports.getQueryString = void 0;
const getQueryString = (value) => {
    if (!value)
        return undefined;
    if (typeof value === 'string')
        return value;
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string')
        return value[0];
    return undefined;
};
exports.getQueryString = getQueryString;
const getParamString = (value) => {
    return Array.isArray(value) ? value[0] : value;
};
exports.getParamString = getParamString;
const getBaseUrl = (req) => {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers['host'];
    return `${protocol}://${host}`;
};
exports.getBaseUrl = getBaseUrl;
const parseAmount = (queryValue, defaultAmount) => {
    if (!queryValue) {
        return defaultAmount;
    }
    const parsed = parseFloat(queryValue);
    if (isNaN(parsed) || parsed <= 0) {
        return defaultAmount;
    }
    return parsed;
};
exports.parseAmount = parseAmount;
const parseTicketCount = (queryValue) => {
    if (!queryValue) {
        return 1;
    }
    const parsed = parseInt(queryValue, 10);
    if (isNaN(parsed) || parsed <= 0) {
        return 1;
    }
    return parsed;
};
exports.parseTicketCount = parseTicketCount;
//# sourceMappingURL=helpers.js.map