import EthDater from 'ethereum-block-by-date';

import { CWEvent, IStorageFetcher, IDisconnectedRange } from '../interfaces';
import { factory, formatFilename } from '../logging';

import { IEventData, EventKind, Api } from './types';

const log = factory.getLogger(formatFilename(__filename));

export class StorageFetcher extends IStorageFetcher<Api> {
  constructor(protected readonly _api: Api, private readonly _dater: EthDater) {
    super(_api);
  }

  private _currentBlock: number;

  private _currentTimestamp: number;

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
    // we need to fetch a few constants to convert voting periods into blocks
    this._currentBlock = +(await this._api.tokens[0].provider.getBlockNumber());
    log.info(`Current block: ${this._currentBlock}.`);
    this._currentTimestamp = (
      await this._api.tokens[0].provider.getBlock(this._currentBlock)
    ).timestamp;
    log.info(`Current timestamp: ${this._currentTimestamp}.`);
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
      `Fetching Marlin entities for range: ${range.startBlock}-${range.endBlock}.`
    );

    const queueLength = +(await this._api.tokens[0].proposalCount());
    const results: CWEvent<IEventData>[] = [];

    // TODO
      /*
    for (let i = 0; i < queueLength; i++) {
      // work backwards through the queue, starting with the most recent
      const queuePosition = queueLength - i - 1;
      const proposal: Proposal = await this._api.governorAlpha.proposals(
        queuePosition
      );
      // fetch actual proposal
      // const proposal: Proposal = await this._api.governorAlpha.proposalQueue(proposalIndex);
      log.debug(`Fetched Marlin proposal ${proposal.id} from storage.`);

      // compute starting time and derive closest block number
      const startingPeriod = +proposal.startBlock;
      const proposalStartingTime =
        startingPeriod * this._votingPeriod + this._currentBlock;
      log.debug(`Fetching block for timestamp ${proposalStartingTime}.`);
      let proposalStartBlock: number;
      try {
        const block = await this._dater.getDate(proposalStartingTime * 1000);
        proposalStartBlock = block.block;
        log.debug(
          `For timestamp ${block.date}, fetched ETH block #${block.block}.`
        );
      } catch (e) {
        log.error(
          `Unable to fetch closest block to timestamp ${proposalStartingTime}: ${e.message}`
        );
        log.error('Skipping proposal event fetch.');
        // eslint-disable-next-line no-continue
        continue;
      }
      if (
        proposalStartBlock >= range.startBlock &&
        proposalStartBlock <= range.endBlock
      ) {
        const events = await this._eventsFromProposal(
          proposal.id.toNumber(),
          proposal,
          proposalStartingTime,
          proposalStartBlock
        );
        results.push(...events);

        // halt fetch once we find a completed/executed proposal in order to save data
        // we may want to run once without this, in order to fetch backlog, or else develop a pagination
        // strategy, but for now our API usage is limited.
        if (
          !fetchAllCompleted &&
          events.find((p) => p.data.kind === EventKind.ProposalExecuted)
        ) {
          log.debug(
            `Proposal ${proposal.id} is marked as executed, halting fetch.`
          );
          break;
        }
      } else if (proposalStartBlock < range.startBlock) {
        log.debug(
          `Marlin proposal start block (${proposalStartBlock}) is before ${range.startBlock}, ending fetch.`
        );
        break;
      } else if (proposalStartBlock > range.endBlock) {
        // keep walking backwards until within range
        log.debug(
          `Marlin proposal start block (${proposalStartBlock}) is after ${range.endBlock}, ending fetch.`
        );
      }
    }*/
    return results;
  }
}
