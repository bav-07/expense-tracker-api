import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { rateLimiter } from '../middlewares/rateLimiter';

export default (app: Application) => {

    const corsOptions = {
        origin: (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
            if (['development', 'test'].includes(process.env.NODE_ENV as string)) {
                callback(null, true);
            } else {
                if (origin === process.env.ALLOWED_ORIGIN) {
                    callback(null, true);
                } else {
                    callback(new Error('Not allowed by CORS'));
                }
            }
        },
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    };

    app.use(helmet());
    app.use(cors(corsOptions));
    app.use(morgan('dev'));
    app.use(rateLimiter);
    app.use(express.json());
};
