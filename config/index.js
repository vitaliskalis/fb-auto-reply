require('dotenv').config();

const config = {
  facebook: {
    pageAccessToken: process.env.PAGE_ACCESS_TOKEN,
    verifyToken: process.env.VERIFY_TOKEN,
  },
  server: {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  dao: {
    spaceName: process.env.DAO_SPACE_NAME || 'daoukmmk.eth',
    snapshotApiUrl: process.env.SNAPSHOT_API_URL || 'https://hub.snapshot.org/graphql',
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 600000, // 10 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1,
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};

// Validation
const requiredEnvVars = ['PAGE_ACCESS_TOKEN', 'VERIFY_TOKEN'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

module.exports = config;
