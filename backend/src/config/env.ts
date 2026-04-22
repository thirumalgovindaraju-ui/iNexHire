// src/config/env.ts
import dotenv from 'dotenv';
dotenv.config();

function required(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env var: ${key}`);
  return value;
}

function optional(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export const env = {
  port: parseInt(optional('PORT', '4000')),
  nodeEnv: optional('NODE_ENV', 'development'),
  isProd: process.env.NODE_ENV === 'production',

  databaseUrl: required('DATABASE_URL'),
  redisUrl: optional('REDIS_URL', 'redis://localhost:6379'),

  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: optional('JWT_EXPIRES_IN', '15m'),
  refreshTokenExpiresIn: optional('REFRESH_TOKEN_EXPIRES_IN', '7d'),

  openaiApiKey: required('OPENAI_API_KEY'),
  openaiModel: optional('OPENAI_MODEL', 'gpt-4o-mini'),

  appUrl: optional('APP_URL', 'http://localhost:5173'),

  sendgridApiKey: optional('SENDGRID_API_KEY', ''),
  emailFrom: optional('EMAIL_FROM', 'noreply@nexhire.com'),

  awsAccessKeyId: optional('AWS_ACCESS_KEY_ID', ''),
  awsSecretAccessKey: optional('AWS_SECRET_ACCESS_KEY', ''),
  awsRegion: optional('AWS_REGION', 'ap-south-1'),
  awsS3Bucket: optional('AWS_S3_BUCKET', ''),

  inviteExpiryDays: parseInt(optional('INVITE_EXPIRY_DAYS', '7')),
};
