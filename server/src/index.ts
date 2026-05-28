import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { config } from './config/env';
import { errorHandler } from './utils/errors';
import { generalLimiter } from './middleware/rateLimiter';
import { initKeys } from './services/crypto';
import authRoutes from './routes/auth';
import credentialRoutes from './routes/credentials';
import shareRoutes from './routes/share';

const app = express();

app.use(helmet());
app.use(cors({ origin: config.clientUrl, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(generalLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/credentials', credentialRoutes);
app.use('/api/share', shareRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

async function start() {
  initKeys();

  await mongoose.connect(config.mongoUri);
  console.log('connected to mongodb');

  app.listen(config.port, () => {
    console.log(`server running on port ${config.port}`);
  });
}

start().catch(err => {
  console.error('failed to start:', err);
  process.exit(1);
});
