import { createLogger, format, transports } from 'winston';

const logger = createLogger({
  level: 'error', // Log only errors
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.File({ filename: 'logs/error.log' }), // Save errors to a file
    new transports.Console() // Also log errors to the console
  ],
});

export default logger;