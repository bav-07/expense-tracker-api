import morgan from "morgan";
import fs from "fs";
import path from "path";

// Create a write stream (in append mode) for logging requests to file
const logStream = fs.createWriteStream(path.join(__dirname, '../../logs/access.log'), { flags: 'a' });

// Morgan middleware for logging HTTP requests
const requestLogger = morgan('combined', { stream: logStream });

export default requestLogger;