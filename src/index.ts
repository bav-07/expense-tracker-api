import express, { Application, NextFunction, Request, Response } from 'express';
import dotenv from 'dotenv';
import configureMiddleware from './config/middleware';
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT ?? 3000;

// Middleware
configureMiddleware(app)

// Routes
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({ message: 'Expense Tracker API is running' });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message ?? 'Internal Server Error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});