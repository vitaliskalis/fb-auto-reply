const OpenAI = require('openai');
const config = require('../config');
const logger = require('../utils/logger');

const client = new OpenAI({
  apiKey: config.openai.apiKey,
});

class OpenAIService {
  /**
   * Summarize proposal into simple Indonesian explanation (2 sentences max)
   * @param {string} proposalTitle - Proposal title
   * @param {Array} choices - Voting choices
   * @param {string} description - Optional proposal description
   * @returns {Promise<string>} Summarized explanation
   */
  async summarizeProposal(proposalTitle, choices = [], description = '') {
    try {
      logger.info('Calling OpenAI to summarize proposal', {
        title: proposalTitle,
        choicesCount: choices.length,
      });

      const choicesText = choices.length > 0 ? `Pilihan voting: ${choices.join(', ')}` : '';
      const descriptionText = description ? `Deskripsi: ${description}` : '';

      const prompt = `Jelaskan proposal ini dalam 2 kalimat bahasa Indonesia yang sederhana untuk anggota UMKM:

Judul Proposal: "${proposalTitle}"
${choicesText}
${descriptionText}

Buatlah penjelasan yang:
- Mudah dipahami tanpa background teknis
- Fokus pada dampak untuk UMKM
- Singkat dan jelas (maksimal 2 kalimat)
- Gunakan bahasa casual/santai

Jawaban (hanya penjelasan, tanpa nomor atau format tambahan):`;

      const response = await client.chat.completions.create({
        model: config.openai.model,
        messages: [
          {
            role: 'system',
            content: 'Anda adalah assistant untuk DAO UMKM yang menjelaskan proposal voting dengan bahasa sederhana.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: config.openai.maxTokens,
        temperature: 0.7,
      });

      const summary = response.choices[0]?.message?.content?.trim() || '';

      if (!summary) {
        throw new Error('Empty response from OpenAI');
      }

      logger.info('Proposal summarized successfully', { summary });
      return summary;
    } catch (error) {
      logger.error(`Error summarizing proposal with OpenAI: ${error.message}`, {
        error: error.message,
        code: error.code,
      });
      throw error;
    }
  }

  /**
   * Generate bot response for multiple proposals
   * @param {Array} proposals - Array of proposal objects
   * @returns {Promise<Object>} Formatted proposals with AI summaries
   */
  async enrichProposalsWithSummaries(proposals) {
    try {
      logger.info(`Enriching ${proposals.length} proposals with AI summaries`);

      const enrichedProposals = await Promise.all(
        proposals.map(async (proposal) => {
          try {
            const summary = await this.summarizeProposal(
              proposal.title,
              proposal.choices,
              proposal.description || ''
            );

            return {
              ...proposal,
              aiSummary: summary,
            };
          } catch (error) {
            logger.warn(`Failed to summarize proposal ${proposal.id}, using fallback`, {
              error: error.message,
            });

            // Fallback: return proposal without summary
            return {
              ...proposal,
              aiSummary: null,
            };
          }
        })
      );

      return enrichedProposals;
    } catch (error) {
      logger.error(`Error enriching proposals: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new OpenAIService();
