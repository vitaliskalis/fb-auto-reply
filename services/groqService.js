const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');

class GroqService {
  constructor() {
    this.apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
    this.apiKey = config.groq.apiKey;
    this.model = config.groq.model;
    this.maxTokens = config.groq.maxTokens;
  }

  async summarizeProposal(title, body = '') {
    try {
      logger.info('Calling Groq to summarize proposal', {
        title: title.substring(0, 50),
        bodyLength: body.length,
      });

      const bodyPreview = body.substring(0, 800);

      const prompt = `Ringkas proposal DAO berikut jadi 1-2 kalimat bahasa Indonesia sederhana untuk ibu-ibu UMKM. Jangan pake istilah crypto atau teknis:

Judul: ${title}

Deskripsi: ${bodyPreview}

Ringkasan (hanya 1-2 kalimat, sederhana dan mudah dipahami):`;

      const response = await axios.post(
        this.apiUrl,
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'Anda adalah assistant yang menjelaskan proposal DAO untuk UMKM dengan bahasa sederhana dan mudah dipahami.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: this.maxTokens,
          temperature: 0.7,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );

      const summary = response.data.choices?.[0]?.message?.content?.trim() || '';

      if (!summary) {
        throw new Error('Empty response from Groq');
      }

      logger.info('Proposal summarized successfully', {
        summaryLength: summary.length,
      });

      return summary;
    } catch (error) {
      logger.error(`Error summarizing proposal with Groq: ${error.message}`, {
        error: error.message,
        code: error.code,
      });
      throw error;
    }
  }

  async enrichProposalsWithSummaries(proposals) {
    try {
      logger.info(`Enriching ${proposals.length} proposals with Groq summaries`);

      const enrichedProposals = await Promise.all(
        proposals.map(async (proposal) => {
          try {
            const summary = await this.summarizeProposal(proposal.title, proposal.body);

            return {
              ...proposal,
              aiSummary: summary,
            };
          } catch (error) {
            logger.warn(`Failed to summarize proposal ${proposal.id}, using fallback`, {
              error: error.message,
            });

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

module.exports = new GroqService();
