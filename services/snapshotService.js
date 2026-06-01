const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');

class SnapshotService {
  constructor() {
    this.apiUrl = config.dao.snapshotApiUrl;
    this.spaceName = config.dao.spaceName;
  }

  /**
   * Get active proposals from Snapshot
   * @param {string} spaceName - The Snapshot space ENS name (e.g., 'daoukmmk.eth')
   * @param {number} limit - Number of proposals to fetch (default: 5)
   * @returns {Promise<Array>} Array of active proposals
   */
  async getActiveProposals(spaceName = this.spaceName, limit = 5) {
    try {
      logger.info(`Fetching active proposals for space: ${spaceName}`);

      const query = `
        query {
          proposals(
            first: ${limit}
            skip: 0
            where: {
              space: "${spaceName}"
              state: "active"
            }
            orderBy: "created"
            orderDirection: desc
          ) {
            id
            title
            state
            created
            end
            choices
            scores
            snapshot
          }
        }
      `;

      const response = await axios.post(this.apiUrl, { query }, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 second timeout
      });

      if (response.data.errors) {
        throw new Error(`GraphQL Error: ${response.data.errors[0].message}`);
      }

      const proposals = response.data.data?.proposals || [];

      if (proposals.length === 0) {
        logger.info(`No active proposals found for space: ${spaceName}`);
        return [];
      }

      logger.info(`Found ${proposals.length} active proposals for space: ${spaceName}`);

      return proposals.map(proposal => ({
        id: proposal.id,
        title: proposal.title,
        state: proposal.state,
        created: new Date(proposal.created * 1000),
        end: new Date(proposal.end * 1000),
        choices: proposal.choices,
        link: `https://snapshot.org/#/${spaceName}/proposal/${proposal.id}`,
      }));
    } catch (error) {
      logger.error(`Error fetching proposals from Snapshot: ${error.message}`, { error });
      throw error;
    }
  }

  /**
   * Format proposals for Facebook message
   * @param {Array} proposals - Array of proposal objects
   * @returns {string} Formatted message text
   */
  formatProposalsMessage(proposals, spaceName = this.spaceName) {
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
      message += `   Pilihan: ${choices}\n`;
      message += `   Berakhir: ${endDate}\n`;
      message += `   Vote: ${proposal.link}\n\n`;
    });

    return message;
  }
}

module.exports = new SnapshotService();
