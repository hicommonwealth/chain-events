import {
  CWEvent,
  IStorageFetcher,
  IDisconnectedRange,
  isEntityCompleted,
} from '../interfaces';
import { factory, formatFilename } from '../logging';

import {
  IEventData,
  EventKind,
  Api,
  Proposal,
  ProposalState,
  IVoteCast,
  EventChains,
} from './types';

const log = factory.getLogger(formatFilename(__filename));

export class StorageFetcher extends IStorageFetcher<Api> {
  constructor(protected readonly _api: Api) {
    super(_api);
  }

  private _currentBlock: number;

  // eslint-disable-next-line class-methods-use-this
  private async _eventsFromProposal(
    index: number,
    proposal: Proposal,
    state: ProposalState
  ): Promise<CWEvent<IEventData>[]> {
    // Only GovernorAlpha events are on Proposals
    const events: CWEvent<IEventData>[] = [];

    // All proposals had to have at least been created
    const createdEvent: CWEvent<IEventData> = {
      blockNumber: +proposal.startBlock,
      data: {
        kind: EventKind.ProposalCreated,
        id: index,
        proposer: proposal.proposer,
        startBlock: +proposal.startBlock,
        endBlock: +proposal.endBlock,
      },
    };
    events.push(createdEvent);

    if (state === ProposalState.Canceled) {
      const canceledEvent: CWEvent<IEventData> = {
        blockNumber: Math.min(+proposal.endBlock, this._currentBlock),
        data: {
          kind: EventKind.ProposalCanceled,
          id: +proposal.id,
        },
      };
      events.push(canceledEvent);
    }
    if (proposal.eta?.gt(0)) {
      const queuedEvent: CWEvent<IEventData> = {
        blockNumber: Math.min(+proposal.endBlock, this._currentBlock),
        data: {
          kind: EventKind.ProposalQueued,
          id: +proposal.id,
          eta: +proposal.eta,
        },
      };
      events.push(queuedEvent);
      if (state === ProposalState.Executed) {
        const proposalExecuted: CWEvent<IEventData> = {
          blockNumber: Math.min(+proposal.endBlock, this._currentBlock),
          data: {
            kind: EventKind.ProposalExecuted,
            id: +proposal.id,
          },
        };
        events.push(proposalExecuted);
      }
    }

    // Vote Cast events are unfetchable
    // No events emitted for failed/expired
    return events;
  }

  private async _fetchVotes(
    start: number,
    end: number,
    id?: number
  ): Promise<CWEvent<IVoteCast>[]> {
    const votesEmitted = await this._api.queryFilter(
      this._api.filters.VoteCast(null, null, null, null),
      start,
      end
    );
    const voteEvents: CWEvent<IVoteCast>[] = votesEmitted.map(
      ({ args: [voter, pId, support, votingPower], blockNumber }) => ({
        blockNumber,
        data: {
          kind: EventKind.VoteCast,
          id: +pId,
          voter,
          support,
          votes: votingPower.toString(),
        },
      })
    );
    if (id) {
      return voteEvents.filter(({ data: { id: pId } }) => id === pId);
    }
    return voteEvents;
  }

  public async fetchOne(id: string): Promise<CWEvent<IEventData>[]> {
    this._currentBlock = +(await this._api.provider.getBlockNumber());
    log.info(`Current block: ${this._currentBlock}.`);
    if (!this._currentBlock) {
      log.error('Failed to fetch current block! Aborting fetch.');
      return [];
    }

    // TODO: handle errors
    const proposal: Proposal = await this._api.proposals(id);
    if (+proposal.id === 0) {
      log.error(`Aave proposal ${id} not found.`);
      return [];
    }
    const state = await this._api.state(proposal.id);

    // fetch historical votes
    const voteEvents = await this._fetchVotes(
      +proposal.startBlock,
      Math.min(+proposal.endBlock, this._currentBlock)
    );

    const events = await this._eventsFromProposal(
      +proposal.id,
      proposal,
      state
    );
    const propVoteEvents = voteEvents.filter(
      ({ data: { id: pId } }) => pId === +proposal.id
    );
    return [...events, ...propVoteEvents];
  }

  /**
   * Fetches all CW events relating to ChainEntities from chain (or in this case contract),
   *   by quering available chain/contract storage and reconstructing events.
   *
   * NOTE: throws on error! Make sure to wrap in try/catch!
   *
   * @param range Determines the range of blocks to query events within.
   */
  public async fetch(
    range?: IDisconnectedRange,
    fetchAllCompleted = false
  ): Promise<CWEvent<IEventData>[]> {
    this._currentBlock = await this._api.provider.getBlockNumber();
    log.info(`Current block: ${this._currentBlock}.`);
    if (!this._currentBlock) {
      log.error('Failed to fetch current block! Aborting fetch.');
      return [];
    }

    // populate range fully if not given
    if (!range) {
      range = { startBlock: 0, endBlock: this._currentBlock };
    } else if (!range.startBlock) {
      range.startBlock = 0;
    } else if (range.startBlock >= this._currentBlock) {
      log.error(
        `Start block ${range.startBlock} greater than current block ${this._currentBlock}!`
      );
      return [];
    }
    if (range.endBlock && range.startBlock >= range.endBlock) {
      log.error(`Invalid fetch range: ${range.startBlock}-${range.endBlock}.`);
      return [];
    }
    if (!range.endBlock) {
      range.endBlock = this._currentBlock;
    }
    log.info(
      `Fetching Aave entities for range: ${range.startBlock}-${range.endBlock}.`
    );

    const proposalCount = +(await this._api.proposalCount());
    log.info(`Found ${proposalCount} proposals!`);
    const results: CWEvent<IEventData>[] = [];

    // fetch historical votes
    const voteEvents = await this._fetchVotes(range.startBlock, range.endBlock);

    let nFetched = 0;
    for (let i = 0; i < proposalCount; i++) {
      // work backwards through the queue, starting with the most recent
      const proposalNum = proposalCount - i;
      log.debug(`Fetching Aave proposal ${proposalNum} from storage.`);
      const proposal: Proposal = await this._api.proposals(proposalNum);

      const proposalStartBlock = +proposal.startBlock;
      // TODO: if proposal exists but is before start block, we skip.
      //   is this desired behavior?
      if (
        proposalStartBlock >= range.startBlock &&
        proposalStartBlock <= range.endBlock
      ) {
        const state = await this._api.state(proposal.id);
        const events = await this._eventsFromProposal(
          +proposal.id,
          proposal,
          state
        );

        // special cases to handle lack of failed / expired events
        const isCompleted =
          state === ProposalState.Defeated ||
          state === ProposalState.Expired ||
          isEntityCompleted(EventChains[0], events);

        // halt fetch once we find a completed/executed proposal in order to save data
        // we may want to run once without this, in order to fetch backlog, or else develop a pagination
        // strategy, but for now our API usage is limited.
        if (!fetchAllCompleted && isCompleted) {
          log.debug(
            `Proposal ${proposal.id} is marked as completed, halting fetch.`
          );
          break;
        }

        const propVoteEvents = voteEvents.filter(
          ({ data: { id } }) => id === +proposal.id
        );
        results.push(...events, ...propVoteEvents);
        nFetched += 1;

        if (range.maxResults && nFetched >= range.maxResults) {
          log.debug(`Fetched ${nFetched} proposals, halting fetch.`);
          break;
        }
      } else if (proposalStartBlock < range.startBlock) {
        log.debug(
          `Aave proposal start block (${proposalStartBlock}) is before ${range.startBlock}, ending fetch.`
        );
        break;
      } else if (proposalStartBlock > range.endBlock) {
        // keep walking backwards until within range
        log.debug(
          `Aave proposal start block (${proposalStartBlock}) is after ${range.endBlock}, continuing fetch.`
        );
      }
    }
    return results;
  }
}
