const express = require('express');
const bodyParser = require('body-parser');
const config = require('./config');
const logger = require('./utils/logger');
const facebookService = require('./services/facebookService');
const commandHandler = require('./handlers/commandHandler');

const app = express();
app.use(bodyParser.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Webhook verification endpoint (GET)
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === config.facebook.verifyToken) {
      logger.info('Webhook verified successfully');
      res.status(200).send(challenge);
    } else {
      logger.warn('Webhook verification failed: invalid token');
      res.sendStatus(403);
    }
  } else {
    logger.warn('Webhook verification failed: missing parameters');
    res.sendStatus(400);
  }
});

// Webhook events endpoint (POST)
app.post('/webhook', async (req, res) => {
  const body = req.body;

  // Acknowledge receipt immediately
  res.status(200).send('EVENT_RECEIVED');

  if (body.object === 'page') {
    try {
      for (const entry of body.entry) {
        if (!entry.messaging) continue;

        for (const webhook_event of entry.messaging) {
          const sender_psid = webhook_event.sender.id;

          logger.info(`Received event from user ${sender_psid}`, {
            eventType: Object.keys(webhook_event).filter(k => k !== 'sender' && k !== 'recipient'),
          });

          // Handle messages
          if (webhook_event.message) {
            await handleMessage(sender_psid, webhook_event.message);
          }
          // Handle postbacks (button clicks)
          else if (webhook_event.postback) {
            logger.info(`Postback received from user ${sender_psid}`);
          }
        }
      }
    } catch (error) {
      logger.error(`Error processing webhook: ${error.message}`, { error });
    }
  } else {
    logger.warn(`Received webhook for unknown object type: ${body.object}`);
  }
});

/**
 * Handle incoming message
 */
async function handleMessage(sender_psid, received_message) {
  try {
    // Skip if no text
    if (!received_message.text) {
      logger.debug(`Received non-text message from user ${sender_psid}`);
      return;
    }

    const text = received_message.text;
    logger.info(`Message from user ${sender_psid}: ${text}`);

    // Parse command
    const { command, params } = facebookService.parseCommand(text);

    if (command) {
      // Execute command
      await commandHandler.execute(sender_psid, command, params);
    } else {
      // Default response for non-command messages
      const response = `👋 Halo! Pesan kamu: "${text}" sudah masuk.\n\nKetik /help untuk melihat perintah yang bisa saya jalankan!`;
      await facebookService.sendTextMessage(sender_psid, response);
    }
  } catch (error) {
    logger.error(`Error handling message from user ${sender_psid}: ${error.message}`, { error });

    try {
      await facebookService.sendTextMessage(
        sender_psid,
        '😅 Ada error di sistem saya. Tim admin sudah diberitahu. Coba lagi nanti ya!'
      );
    } catch (sendError) {
      logger.error(`Failed to send error message: ${sendError.message}`);
    }
  }
}

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`Express error: ${err.message}`, { error: err });
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = config.server.port;
app.listen(PORT, () => {
  logger.info(`🚀 DAO UMKM Secretary Bot is running on port ${PORT}`);
  logger.info(`📍 Environment: ${config.server.nodeEnv}`);
  logger.info(`🔗 DAO Space: ${config.dao.spaceName}`);
  logger.info(`📊 Snapshot API: ${config.dao.snapshotApiUrl}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

module.exports = app;
