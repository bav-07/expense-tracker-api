import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { rateLimiter } from '../middlewares/rateLimiter';

export default (app: Application) => {
    app.use(helmet());
    app.use(cors());
    app.use(morgan('dev'));
    app.use(rateLimiter);
    app.use(express.json());
};
