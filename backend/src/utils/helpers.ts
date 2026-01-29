import { Request } from 'express';

export const getQueryString = (value: unknown): string | undefined => {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string') return value[0];
  return undefined;
};

export const getParamString = (value: string | string[]): string => {
  return Array.isArray(value) ? value[0] : value;
};

export const getBaseUrl = (req: Request): string => {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers['host'];
  return `${protocol}://${host}`;
};

export const parseAmount = (queryValue: string | undefined, defaultAmount: number): number => {
  if (!queryValue) {
    return defaultAmount;
  }

  const parsed = parseFloat(queryValue);
  if (isNaN(parsed) || parsed <= 0) {
    return defaultAmount;
  }

  return parsed;
};

export const parseTicketCount = (queryValue: string | undefined): number => {
  if (!queryValue) {
    return 1;
  }

  const parsed = parseInt(queryValue, 10);
  if (isNaN(parsed) || parsed <= 0) {
    return 1;
  }

  return parsed;
};
