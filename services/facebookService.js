const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');

class FacebookService {
  constructor() {
    this.pageAccessToken = config.facebook.pageAccessToken;
    this.apiVersion = 'v18.0';
    this.baseUrl = 'https://graph.facebook.com';
  }

  /**
   * Send message via Facebook Graph API
   * @param {string} sender_psid - Recipient Facebook ID
   * @param {Object} message - Message object
   * @returns {Promise<Object>} API response
   */
  async sendMessage(sender_psid, message) {
    try {
      logger.info(`Sending message to user ${sender_psid}`);

      const response = await axios.post(
        `${this.baseUrl}/${this.apiVersion}/me/messages?access_token=${this.pageAccessToken}`,
        {
          recipient: { id: sender_psid },
          message: message,
        },
        { timeout: 10000 }
      );

      logger.info(`Message sent successfully to user ${sender_psid}`, {
        messageId: response.data.message_id,
      });

      return response.data;
    } catch (error) {
      logger.error(`Error sending message to user ${sender_psid}: ${error.message}`, {
        error: error.response?.data || error.message,
      });
      throw error;
    }
  }

  /**
   * Send text message
   * @param {string} sender_psid - Recipient Facebook ID
   * @param {string} text - Message text
   * @returns {Promise<Object>} API response
   */
  async sendTextMessage(sender_psid, text) {
    return this.sendMessage(sender_psid, { text });
  }

  /**
   * Extract command and parameters from message
   * @param {string} text - Message text
   * @returns {Object} { command, params }
   */
  parseCommand(text) {
    const match = text.trim().match(/^\/(\w+)\s*(.*)$/);
    if (!match) {
      return { command: null, params: null };
    }
    return {
      command: match[1].toLowerCase(),
      params: match[2].trim(),
    };
  }
}

module.exports = new FacebookService();
