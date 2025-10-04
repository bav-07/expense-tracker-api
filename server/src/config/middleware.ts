import express, { Application } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { rateLimiter } from '../middlewares/rateLimiter';
import requestLogger from '../middlewares/logger';
import { httpsEnforcement, additionalSecurityHeaders, getCSPConfig } from '../middlewares/securityHeaders';
import { inputSanitization } from '../middlewares/inputSanitization';
import { secureCookies, csrfToken } from '../middlewares/csrfProtection';

export default (app: Application) => {

    const corsOptions = {
        origin: (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
            const allowedOrigins = process.env.ALLOWED_ORIGIN?.split(',') || [];
            
            // In production, strictly enforce allowed origins
            if (process.env.NODE_ENV === 'production') {
                if (!origin) {
                    // Allow requests with no origin (mobile apps, etc.)
                    callback(null, true);
                } else if (allowedOrigins.includes(origin)) {
                    callback(null, true);
                } else {
                    callback(new Error('Not allowed by CORS'));
                }
            } 
            // In development and test, be more permissive but still check allowed origins
            else if (['development', 'test'].includes(process.env.NODE_ENV as string)) {
                if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost')) {
                    callback(null, true);
                } else {
                    callback(new Error('Not allowed by CORS'));
                }
            } 
            // Fallback: allow only if in allowed origins
            else {
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

    // Security middleware
    app.use(httpsEnforcement);
    app.use(compression());
    
    app.use(helmet(
        {
            frameguard: { action: 'deny' },
            contentSecurityPolicy: getCSPConfig(),
            crossOriginEmbedderPolicy: false,
        },
    ));
    
    app.use(additionalSecurityHeaders);
    app.use(cors(corsOptions));
    
    // Request size limits for security
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Input sanitization
    app.use(inputSanitization);
    
    app.use(cookieParser());
    app.use(secureCookies);
    app.use(csrfToken);
    app.use(morgan('dev'));
    app.use(rateLimiter);
    app.use(requestLogger);
    app.disable('x-powered-by');
};
