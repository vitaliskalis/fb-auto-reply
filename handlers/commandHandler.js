const logger = require('../utils/logger');
const rateLimiter = require('../utils/rateLimiter');
const facebookService = require('../services/facebookService');
const snapshotService = require('../services/snapshotService');
const openaiService = require('../services/openaiService');

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
   * Handle /proposal command - Get active proposals with AI summaries
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

      logger.info(`Fetching proposals for user ${sender_psid}`);

      // Show loading message
      await facebookService.sendTextMessage(
        sender_psid,
        '⏳ Ngambil data proposal dari Snapshot... Sebentar ya!'
      );

      // Fetch proposals from Snapshot
      const proposals = await snapshotService.getActiveProposals();

      if (proposals.length === 0) {
        await facebookService.sendTextMessage(
          sender_psid,
          '🗳️ Belum ada proposal yang jalan saat ini di DAO UMKM. Pantau terus untuk update terbaru!'
        );
        logger.info(`No active proposals found for user ${sender_psid}`);
        return;
      }

      // Enrich proposals with AI summaries
      logger.info(`Enriching ${proposals.length} proposals with AI summaries for user ${sender_psid}`);
      const enrichedProposals = await openaiService.enrichProposalsWithSummaries(proposals);

      // Format and send message
      const message = this.formatProposalsWithSummaries(enrichedProposals);
      await facebookService.sendTextMessage(sender_psid, message);

      logger.info(`/proposal command completed for user ${sender_psid}`, {
        proposalsCount: proposals.length,
      });
    } catch (error) {
      logger.error(`Error handling /proposal command: ${error.message}`);

      // Determine error message based on error type
      let errorMessage = '🔧 Server voting lagi error, coba 5 menit lagi ya';
      if (error.code === 'ECONNABORTED') {
        errorMessage = '⏱️ Koneksi timeout. Snapshot.org lagi sibuk, coba lagi ya';
      } else if (error.message?.includes('OpenAI') || error.code === 'ERR_OPENAI') {
        errorMessage = '🤖 AI sedang maintenance. Tapi proposal tetap bisa dilihat di Snapshot langsung ya!';
      }

      try {
        await facebookService.sendTextMessage(sender_psid, errorMessage);
      } catch (sendError) {
        logger.error(`Failed to send error message: ${sendError.message}`);
      }
    }
  }

  /**
   * Format proposals with AI summaries for display
   */
  formatProposalsWithSummaries(proposals) {
    if (proposals.length === 0) {
      return '🗳️ Belum ada proposal yang jalan saat ini di DAO UMKM. Pantau terus untuk update terbaru!';
    }

    let message = `🗳️ *Proposal Aktif DAO UMKM* (${proposals.length}):\n\n`;

    proposals.forEach((proposal, index) => {
      const endDate = proposal.end.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });

      const choices = proposal.choices.join(', ');

      message += `${index + 1}. ${proposal.title}\n`;

      // Include AI summary if available
      if (proposal.aiSummary) {
        message += `   📝 ${proposal.aiSummary}\n`;
      } else {
        message += `   Pilihan: ${choices}\n`;
      }

      message += `   ⏰ Berakhir: ${endDate}\n`;
      message += `   🔗 Vote: ${proposal.link}\n\n`;
    });

    return message;
  }

  /**
   * Handle /help command - Show available commands
   */
  async handleHelp(sender_psid, params) {
    const helpMessage = `📋 *Perintah yang Tersedia:*

/proposal - Lihat proposal aktif DAO UMKM (dengan penjelasan AI)
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
    const healthMessage = `✅ *Bot Status: ONLINE*\n\nBot DAO UMKM Secretary siap melayani! 🚀`;
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
