const Telegraf = require('telegraf');
const config = require('./config');
const logger = require('./utils/logger');
const TelegramCommandHandler = require('./handlers/telegramCommandHandler');

// Initialize bot
const bot = new Telegraf(config.telegram.botToken);

// Middleware for logging
bot.use((ctx, next) => {
  const from = ctx.update.message?.from || ctx.update.callback_query?.from;
  if (from) {
    logger.info(`Message from ${from.first_name} (${from.id}): ${ctx.update.message?.text || 'callback'}`);
  }
  return next();
});

// Error handling
bot.catch((err, ctx) => {
  logger.error(`Telegraf error: ${err.message}`, { error: err });
  ctx.reply('🔧 Ada error di sistem saya. Tim admin sudah diberitahu. Coba lagi nanti ya!');
});

// Commands
bot.command('start', async (ctx) => {
  await TelegramCommandHandler.handleStart(ctx);
});

bot.command('help', async (ctx) => {
  await TelegramCommandHandler.handleHelp(ctx);
});

bot.command('proposal', async (ctx) => {
  await TelegramCommandHandler.handleProposal(ctx);
});

bot.command('status', async (ctx) => {
  await TelegramCommandHandler.handleStatus(ctx);
});

// Handle unknown commands
bot.use(async (ctx) => {
  if (ctx.message?.text?.startsWith('/')) {
    const command = ctx.message.text.split(' ')[0].slice(1);
    logger.warn(`Unknown command: /${command}`);
    await ctx.reply(`❓ Perintah "/${command}" tidak ditemukan.\nKetik /help untuk melihat perintah yang tersedia.`);
  }
});

// Start bot
if (config.bot.polling) {
  logger.info('🚀 Starting bot with polling...');
  bot.launch({
    polling: {
      interval: config.bot.pollingInterval,
    },
  });
  logger.info('🤖 DAO UMKM Secretary Bot is online (polling)');
  logger.info(`🔗 DAO Space: ${config.dao.spaceName}`);
  logger.info(`🤖 AI Model: ${config.groq.model}`);
} else {
  logger.info('🚀 Starting bot with webhook...');
  logger.warn('Webhook mode not configured. Using polling instead.');
  bot.launch();
}

// Enable graceful stop
process.once('SIGINT', () => {
  logger.info('SIGINT received: gracefully stopping bot');
  bot.stop('SIGINT');
});

process.once('SIGTERM', () => {
  logger.info('SIGTERM received: gracefully stopping bot');
  bot.stop('SIGTERM');
});

module.exports = bot;
