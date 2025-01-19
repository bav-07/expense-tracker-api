import express, { Application, NextFunction, Request, Response } from 'express';
import dotenv from 'dotenv';
import configureMiddleware from './config/middleware';
import authRoutes from './routes/auth';
import healthRoutes from './routes/health';
import incomeRoutes from './routes/income';
import expenseRoutes from './routes/expense';
import savingsRoutes from './routes/savings';
import connectDB from './config/db';

connectDB();

dotenv.config();

const app: Application = express();

// Middleware
configureMiddleware(app)

// Routes
app.use('/api', healthRoutes);
app.use('/api/users', authRoutes);
app.use('/api/income', incomeRoutes);
app.use('/api/expense', expenseRoutes);
app.use('/api/savings', savingsRoutes);

// Catch-all route for undefined requests
app.use((req: Request, res: Response, _next: NextFunction) => {
  res.status(404).json({ error: 'Route not Found' });
})

// Global error handler
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message ?? 'Internal Server Error' });
});

// Export app for testing
export default app;

// Start server (only if not in testing mode)
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT ?? 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}