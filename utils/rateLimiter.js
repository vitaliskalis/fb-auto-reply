const config = require('../config');
const logger = require('./logger');

class RateLimiter {
  constructor() {
    this.requests = new Map(); // { userId: [timestamps] }
  }

  isAllowed(userId) {
    const now = Date.now();
    const windowStart = now - config.rateLimit.windowMs;

    // Get or create user's request history
    if (!this.requests.has(userId)) {
      this.requests.set(userId, []);
    }

    let timestamps = this.requests.get(userId);

    // Remove old timestamps outside the window
    timestamps = timestamps.filter(timestamp => timestamp > windowStart);

    // Check if user has exceeded rate limit
    if (timestamps.length >= config.rateLimit.maxRequests) {
      logger.warn(`Rate limit exceeded for user ${userId}`);
      return false;
    }

    // Add current timestamp
    timestamps.push(now);
    this.requests.set(userId, timestamps);

    // Cleanup old entries every 10 minutes
    if (this.requests.size > 10000) {
      this.cleanup();
    }

    return true;
  }

  cleanup() {
    const now = Date.now();
    const windowStart = now - config.rateLimit.windowMs;

    for (const [userId, timestamps] of this.requests.entries()) {
      const validTimestamps = timestamps.filter(ts => ts > windowStart);
      if (validTimestamps.length === 0) {
        this.requests.delete(userId);
      } else {
        this.requests.set(userId, validTimestamps);
      }
    }

    logger.info(`RateLimiter cleanup: ${this.requests.size} users remaining`);
  }
}

module.exports = new RateLimiter();
