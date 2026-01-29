import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const isDevelopment = process.env.NODE_ENV !== 'production';

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = '';
    if (Object.keys(meta).length > 0) {
      metaStr = ' ' + JSON.stringify(meta);
    }
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);

const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const transports: winston.transport[] = [];

if (isDevelopment) {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
} else {
  transports.push(
    new winston.transports.Console({
      format: jsonFormat,
    })
  );
}

transports.push(
  new DailyRotateFile({
    filename: 'logs/error-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    format: jsonFormat,
    maxFiles: '14d',
  })
);

transports.push(
  new DailyRotateFile({
    filename: 'logs/combined-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    format: jsonFormat,
    maxFiles: '14d',
  })
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  transports,
});

export default logger;
