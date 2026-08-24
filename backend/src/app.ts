import express from 'express';
import cors from 'cors';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';

export const createApp = () => {
  const app = express();

  app.use(cors({
    origin: '*',
    credentials: true,
  }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // API Routes
  app.use('/api', routes);

  // Global Error Handler
  app.use(errorHandler);

  return app;
};
