require('dotenv').config();

const config = {
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
  },
  server: {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  dao: {
    spaceName: process.env.DAO_SPACE_NAME || 'daomumkm.eth',
    snapshotApiUrl: process.env.SNAPSHOT_API_URL || 'https://hub.snapshot.org/graphql',
  },
  groq: {
    apiKey: process.env.GROQ_API_KEY,
    model: process.env.GROQ_MODEL || 'llama-3.1-70b-versatile',
    maxTokens: parseInt(process.env.GROQ_MAX_TOKENS) || 200,
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 600000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1,
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
  bot: {
    polling: process.env.BOT_POLLING === 'true' || true,
    pollingInterval: parseInt(process.env.BOT_POLLING_INTERVAL) || 3000,
  },
};

const requiredEnvVars = ['TELEGRAM_BOT_TOKEN', 'GROQ_API_KEY'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

module.exports = config;
