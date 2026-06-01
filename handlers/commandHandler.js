const logger = require('../utils/logger');
const rateLimiter = require('../utils/rateLimiter');
const facebookService = require('../services/facebookService');
const snapshotService = require('../services/snapshotService');

class CommandHandler {
  constructor() {
    this.commands = new Map();
    this.registerCommands();
  }

  registerCommands() {
    this.commands.set('proposal', this.handleProposal.bind(this));
    this.commands.set('help', this.handleHelp.bind(this));
    this.commands.set('health', this.handleHealth.bind(this));
  }

  /**
   * Handle /proposal command - Get active proposals
   */
  async handleProposal(sender_psid, params) {
    try {
      // Check rate limit
      if (!rateLimiter.isAllowed(`proposal_${sender_psid}`)) {
        await facebookService.sendTextMessage(
          sender_psid,
          '⏱️ Tunggu sebentar ya! Kamu udah nanya proposal terlalu sering. Coba lagi dalam beberapa menit.'
        );
        return;
      }

      // Fetch proposals
      const proposals = await snapshotService.getActiveProposals();
      const message = snapshotService.formatProposalsMessage(proposals);

      await facebookService.sendTextMessage(sender_psid, message);
      logger.info(`/proposal command handled for user ${sender_psid}`);
    } catch (error) {
      logger.error(`Error handling /proposal command: ${error.message}`);

      // Determine error message based on error type
      let errorMessage = '🔧 Server voting lagi error, coba 5 menit lagi ya';
      if (error.code === 'ECONNABORTED') {
        errorMessage = '⏱️ Koneksi timeout. Snapshot.org lagi sibuk, coba lagi ya';
      }

      await facebookService.sendTextMessage(sender_psid, errorMessage);
    }
  }

  /**
   * Handle /help command - Show available commands
   */
  async handleHelp(sender_psid, params) {
    const helpMessage = `📋 *Perintah yang Tersedia:*


/proposal - Lihat proposal aktif DAO UMKM
/cek - Cek status proposal (coming soon)
/gabung - Info cara gabung DAO (coming soon)
/kas - Lihat kas DAO di Gnosis Safe (coming soon)
/help - Tampilkan menu ini

Ketik salah satu perintah di atas untuk memulai!`;

    await facebookService.sendTextMessage(sender_psid, helpMessage);
    logger.info(`/help command handled for user ${sender_psid}`);
  }

  /**
   * Handle /health command - Check bot status
   */
  async handleHealth(sender_psid, params) {
    const healthMessage = `✅ *Bot Status: ONLINE*

Bot DAO UMKM Secretary siap melayani! 🚀`;
    await facebookService.sendTextMessage(sender_psid, healthMessage);
    logger.info(`/health command handled for user ${sender_psid}`);
  }

  /**
   * Execute command
   */
  async execute(sender_psid, command, params) {
    if (this.commands.has(command)) {
      await this.commands.get(command)(sender_psid, params);
    } else {
      const unknownMessage = `❓ Perintah "/${command}" tidak ditemukan.\nKetik /help untuk melihat perintah yang tersedia.`;
      await facebookService.sendTextMessage(sender_psid, unknownMessage);
      logger.warn(`Unknown command: /${command}`);
    }
  }
}

module.exports = new CommandHandler();
