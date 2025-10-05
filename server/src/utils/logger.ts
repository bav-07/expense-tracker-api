import { createLogger, format, transports } from 'winston';

const isTestEnv = process.env.NODE_ENV === 'test';

const logger = createLogger({
  level: isTestEnv ? 'silent' : 'warn', // Log warnings and errors for monitoring
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: isTestEnv 
    ? [new transports.Console({ silent: true })] 
    : [
      new transports.File({ filename: 'logs/error.log', level: 'error' }), // Errors to error.log
      new transports.File({ filename: 'logs/access.log', level: 'warn' }), // Warnings and errors to access.log
      new transports.Console({ level: 'warn' }) // Warnings and errors to console
    ],
});

export default logger;