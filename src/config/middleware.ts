import express, { Application } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import csurf from 'csurf';
import helmet from 'helmet';
import morgan from 'morgan';
import { rateLimiter } from '../middlewares/rateLimiter';
import requestLogger from '../middlewares/logger';

export default (app: Application) => {

    const corsOptions = {
        origin: (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
            const allowedOrigins = process.env.ALLOWED_ORIGIN?.split(',') || [];
            if (['development', 'test', 'production'].includes(process.env.NODE_ENV as string)) {
                callback(null, true);
            } else {
                if (origin && allowedOrigins.includes(origin)) {
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

    app.use(helmet(
        {
            frameguard: { action: 'deny' },
            contentSecurityPolicy: false,
            crossOriginEmbedderPolicy: false,
        },
    ));
    app.use(cors(corsOptions));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(cookieParser());
    app.use(csurf({ cookie: true }));
    app.use(morgan('dev'));
    app.use(rateLimiter);
    app.use(requestLogger);
    app.disable('x-powered-by');
};
