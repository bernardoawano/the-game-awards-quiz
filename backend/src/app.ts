import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { json } from 'express';
import helmet from 'helmet';

import { env } from './config/env';
import { errorHandler } from './middlewares/error-handler';
import { notFound } from './middlewares/not-found';
import { catalogRoutes } from './routes/catalog.routes';

export const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  }),
);
app.use(json({ limit: '100kb' }));
app.use(cookieParser());

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api', catalogRoutes);

app.use(notFound);
app.use(errorHandler);
