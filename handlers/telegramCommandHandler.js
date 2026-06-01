const logger = require('../utils/logger');
const rateLimiter = require('../utils/rateLimiter');
const snapshotService = require('../services/snapshotService');
const groqService = require('../services/groqService');

class TelegramCommandHandler {
  static async handleProposal(ctx) {
    const userId = ctx.from.id;
    const chatId = ctx.chat.id;

    try {
      if (!rateLimiter.isAllowed(`proposal_${userId}`)) {
        await ctx.reply('⏱️ Tunggu sebentar guruku! Kamu udah tanya proposal terlalu sering. Coba lagi dalam beberapa menit.');
        logger.warn(`Rate limit exceeded for user ${userId}`);
        return;
      }

      logger.info(`Fetching proposals for user ${userId}`);

      const msg = await ctx.reply('⏳ Sebentar guruku, lagi tanya ke DAO UMKM...');

      try {
        const proposals = await snapshotService.getActiveProposals();

        if (proposals.length === 0) {
          await ctx.telegram.editMessageText(
            chatId,
            msg.message_id,
            null,
            '🗳️ Belum ada proposal aktif di DAO UMKM guruku. Pantau terus untuk update terbaru!'
          );
          logger.info(`No active proposals found for user ${userId}`);
          return;
        }

        logger.info(`Enriching ${proposals.length} proposals with AI summaries for user ${userId}`);
        const enrichedProposals = await groqService.enrichProposalsWithSummaries(proposals);

        const message = this.formatProposalsWithSummaries(enrichedProposals);
        await ctx.telegram.editMessageText(
          chatId,
          msg.message_id,
          null,
          message,
          { parse_mode: 'Markdown' }
        );

        logger.info(`/proposal command completed for user ${userId}`, {
          proposalsCount: proposals.length,
        });
      } catch (error) {
        logger.error(`Error processing proposals: ${error.message}`);

        let errorMessage = '🔧 Waduh error guruku. Coba /proposal lagi 1 menit ya.';
        if (error.code === 'ECONNABORTED') {
          errorMessage = '⏱️ Koneksi timeout. Snapshot.org lagi sibuk, coba lagi ya';
        } else if (error.message?.includes('Groq') || error.message?.includes('401')) {
          errorMessage = '🤖 AI Groq lagi maintenance. Tapi proposal tetap bisa dilihat di Snapshot langsung ya!';
        }

        await ctx.telegram.editMessageText(chatId, msg.message_id, null, errorMessage);
      }
    } catch (error) {
      logger.error(`Error handling /proposal command: ${error.message}`);
      await ctx.reply('🔧 Waduh error guruku. Coba /proposal lagi 1 menit ya.');
    }
  }

  static formatProposalsWithSummaries(proposals) {
    if (proposals.length === 0) {
      return '🗳️ Belum ada proposal aktif di DAO UMKM. Pantau terus untuk update terbaru!';
    }

    let message = `📋 *Proposal Aktif DAO UMKM* (${proposals.length}):\n\n`;

    proposals.forEach((proposal, index) => {
      const endDate = proposal.end.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });

      message += `*${index + 1}. ${proposal.title}*\n`;

      if (proposal.aiSummary) {
        message += `📝 ${proposal.aiSummary}\n`;
      }

      message += `⏰ Berakhir: ${endDate}\n`;
      message += `🔗 [Vote di Snapshot](${proposal.link})\n\n`;
    });

    return message;
  }

  static async handleStart(ctx) {
    const userId = ctx.from.id;
    logger.info(`User ${userId} started bot`);

    const message = `👋 Selamat datang di DAO UMKM Bot!

Bot ini bantu kamu pantau proposal DAO UMKM secara real-time. 
AI Groq bakal nyederhanain proposal yang ribet jadi bahasa sederhana.

Ketik /proposal untuk lihat proposal aktif.
Ketik /help untuk daftar perintah lengkap.`;

    await ctx.reply(message);
  }

  static async handleHelp(ctx) {
    const userId = ctx.from.id;
    logger.info(`User ${userId} requested help`);

    const message = `📚 *Perintah yang Tersedia:*\n\n/proposal - Lihat proposal aktif DAO UMKM (dengan penjelasan AI)\n/cek - Cek status proposal (coming soon)\n/gabung - Info cara gabung DAO (coming soon)\n/kas - Lihat kas DAO (coming soon)\n/status - Status bot\n/help - Tampilkan bantuan ini\n\nKetik salah satu perintah untuk memulai!`;

    await ctx.reply(message, { parse_mode: 'Markdown' });
  }

  static async handleStatus(ctx) {
    const userId = ctx.from.id;
    logger.info(`User ${userId} checked status`);

    const uptime = process.uptime();
    const uptimeStr = this.formatUptime(uptime);

    const message = `✅ *Bot Status: ONLINE*\n\n🚀 Bot DAO UMKM Secretary siap melayani!\n⏱️ Uptime: ${uptimeStr}\n🔗 DAO Space: ${require('../config').dao.spaceName}`;

    await ctx.reply(message, { parse_mode: 'Markdown' });
  }

  static formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    return `${days}d ${hours}h ${minutes}m ${secs}s`;
  }
}

module.exports = TelegramCommandHandler;
