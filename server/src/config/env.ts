import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const required = (key: string): string => {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env: ${key}`);
  return val;
};

export const config = {
  port: parseInt(process.env.PORT || '5000'),
  mongoUri: required('MONGO_URI'),
  jwtSecret: required('JWT_SECRET'),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  signingKeyPrivate: process.env.SIGNING_KEY_PRIVATE || '',
  signingKeyPublic: process.env.SIGNING_KEY_PUBLIC || '',
  nodeEnv: process.env.NODE_ENV || 'development',
};
