import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const getEnvVar = (name: string, defaultValue?: string): string => {
  const value = process.env[name] || defaultValue;
  if (value === undefined) {
    throw new Error(`Environment variable ${name} is required`);
  }
  return value;
};

export const config = {
  nodeEnv: getEnvVar('NODE_ENV', 'development'),
  port: parseInt(getEnvVar('PORT', '5000')),
  frontendUrl: getEnvVar('FRONTEND_URL', 'http://localhost:5173'),
  
  database: {
    url: getEnvVar('DATABASE_URL', 'postgresql://postgres:password@localhost:5432/nexusflow?schema=public'),
  },
  
  jwt: {
    secret: getEnvVar('JWT_SECRET', 'super_secret_jwt_key_change_in_production_minimum_32_chars'),
    expiresIn: getEnvVar('JWT_EXPIRES_IN', '15m'),
    refreshSecret: getEnvVar('REFRESH_TOKEN_SECRET', 'refresh_token_secret_change_in_production_minimum_32_chars'),
    refreshExpiresIn: getEnvVar('REFRESH_TOKEN_EXPIRES_IN', '7d'),
  },
  
  openai: {
    apiKey: getEnvVar('OPENAI_API_KEY', ''),
  },
  
  upload: {
    dir: getEnvVar('UPLOAD_DIR', 'uploads'),
    maxFileSize: parseInt(getEnvVar('MAX_FILE_SIZE', '10485760')),
  },
  
  rateLimitWindowMs: parseInt(getEnvVar('RATE_LIMIT_WINDOW_MS', '900000')),
  rateLimitMax: parseInt(getEnvVar('RATE_LIMIT_MAX', '100')),
};
