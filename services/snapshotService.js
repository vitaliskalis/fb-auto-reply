const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');

class SnapshotService {
  constructor() {
    this.apiUrl = config.dao.snapshotApiUrl;
    this.spaceName = config.dao.spaceName;
  }

  async getActiveProposals(spaceName = this.spaceName, limit = 3) {
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
            body
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
        timeout: 10000,
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
        body: proposal.body || '',
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
}

module.exports = new SnapshotService();
