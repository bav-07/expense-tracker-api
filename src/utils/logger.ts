import { createLogger, format, transports } from 'winston';

const isTestEnv = process.env.NODE_ENV === 'test';

const logger = createLogger({
  level: isTestEnv ? 'silent' : 'error', // Log only errors
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: isTestEnv 
    ? [new transports.Console({ silent: true })] 
    : [
      new transports.File({ filename: 'logs/error.log' }), // Save errors to a file
      new transports.Console({ level: 'error' }) // Also log errors to the console
    ],
});

export default logger;