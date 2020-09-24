import EthDater from 'ethereum-block-by-date';

import { CWEvent, IStorageFetcher, IDisconnectedRange } from '../interfaces';
import { IEventData, EventKind, Api, Proposal } from './types';
import { Comp } from './contractTypes/Comp';
import { GovernorAlpha } from './contractTypes/GovernorAlpha';
import { Timelock } from './contractTypes/Timelock';

import { factory, formatFilename } from '../logging';
const log = factory.getLogger(formatFilename(__filename));

export class StorageFetcher extends IStorageFetcher<Api> {
  constructor(protected readonly _api: Api, private readonly _dater: EthDater) {
    super(_api);
  }

  private _timelock: number; // TODO: Necessary? Type number or string?!?!?
  private _votingPeriod: number; // The duration of voting on a proposal, in blocks
  private _votingDelay: number; // The delay before voting on a proposal may take place, once proposed
  private _currentBlock: number;
  private _currentTimestamp: number;

  private async _eventsFromProposal(
    index: number,
    proposal: Proposal,
    startTime: number,
    startBlock: number,
  ): Promise<CWEvent<IEventData>[]> {
    // Only GovernorAlpha events are on Proposals
    const events: CWEvent<IEventData>[] = [ ];
    // const createdEvent: CWEvent<IEventData> = {
    //   blockNumber: startBlock,
    //   data: {
    //     kind: EventKind.ProposalCreated,
    //     id: index,
    //     proposer: proposal.proposer,
    //     targets: [], // TODO: not on proposal...
    //     values: [], // TODO: not on proposal...
    //     signatures: [], //  TODO: not on proposal...
    //     calldatas: [], //  TODO: not on proposal...
    //     startBlock: startBlock,
    //     endBlock: proposal.endBlock.toNumber(),
    //     description: '', // TODO: not on proposal...
    //   }
    // };
    // events.push(createdEvent);
    // if (proposal.canceled) {
    //   // derive block # from abort time
    //   const maximalAbortTime = Math.min(
    //     this._currentTimestamp,
    //     (startTime + (this._abortPeriod * this._periodDuration)) * 1000
    //   );
    //   let blockNumber;
    //   if (maximalAbortTime === this._currentTimestamp) {
    //     log.info('Still in abort window, using current timestamp.');
    //     blockNumber = this._currentBlock;
    //   } else {
    //     log.info(`Passed abort window, fetching timestamp ${maximalAbortTime}`);
    //     try {
    //       const abortBlock = await this._dater.getDate(maximalAbortTime);
    //       blockNumber = abortBlock.block;
    //     } catch (e) {
    //       // fake it if we can't fetch it
    //       log.error(`Unable to fetch abort block from timestamp ${maximalAbortTime}: ${e.message}.`);
    //       blockNumber = startBlock + 1;
    //     }
    //   }

    //   const abortedEvent: CWEvent<IEventData> = {
    //     blockNumber,
    //     data: {
    //       kind: EventKind.Abort,
    //       proposalIndex: index,
    //       applicant: proposal.applicant,
    //     }
    //   };
    //   events.push(abortedEvent);
    // } 
      // else if (proposal.processed) {
    //     // derive block # from process time
    //     const minimalProcessTime = startTime + ((this._votingPeriod + this._gracePeriod) * this._periodDuration);
    //     log.info(`Fetching minimum processed block at time ${minimalProcessTime}.`);
    //     let blockNumber;
    //     try {
    //       const processedBlock = await this._dater.getDate(minimalProcessTime * 1000);
    //       blockNumber = processedBlock.block;
    //     } catch (e) {
    //       // fake it if we can't fetch it
    //       log.error(`Unable to fetch processed block from timestamp ${minimalProcessTime}: ${e.message}.`);
    //       blockNumber = startBlock + 2;
    //     }

    //     const processedEvent: CWEvent<IEventData> = {
    //       blockNumber,
    //       data: {
    //         kind: EventKind.ProcessProposal,
    //         proposalIndex: index,
    //         applicant: proposal.applicant,
    //         member: proposal.proposer,
    //         tokenTribute: proposal.tokenTribute.toString(),
    //         sharesRequested: proposal.sharesRequested.toString(),
    //         didPass: proposal.didPass,
    //         yesVotes: proposal.yesVotes.toString(),
    //         noVotes: proposal.noVotes.toString(),
    //       }
    //     };
    //     events.push(processedEvent);
    //   }
    return events;
  }

  /**
   * Fetches all CW events relating to ChainEntities from chain (or in this case contract),
   *   by quering available chain/contract storage and reconstructing events.
   *
   * NOTE: throws on error! Make sure to wrap in try/catch!
   *
   * @param range Determines the range of blocks to query events within.
   */
  public async fetch(range?: IDisconnectedRange, fetchAllCompleted = false): Promise<CWEvent<IEventData>[]> {
    // we need to fetch a few constants to convert voting periods into blocks
    this._timelock = +(await this._api.governorAlpha.timelock()); // Necessary?
    this._votingDelay = +(await this._api.governorAlpha.votingDelay());
    this._votingPeriod = +(await this._api.governorAlpha.votingPeriod())
    this._currentBlock = +(await this._api.governorAlpha.provider.getBlockNumber());
    log.info(`Current block: ${this._currentBlock}.`);
    this._currentTimestamp = (await this._api.governorAlpha.provider.getBlock(this._currentBlock)).timestamp;
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
      log.error(`Start block ${range.startBlock} greater than current block ${this._currentBlock}!`);
      return [];
    }
    if (range.endBlock && range.startBlock >= range.endBlock) {
      log.error(`Invalid fetch range: ${range.startBlock}-${range.endBlock}.`);
      return [];
    } else if (!range.endBlock) {
      range.endBlock = this._currentBlock;
    }
    log.info(`Fetching Marlin entities for range: ${range.startBlock}-${range.endBlock}.`);

    // const queueLength = +(await this._api.getProposalQueueLength());
    // maybe use: +(await this._api.governorAlpha.latestProposalIds(args0), but what arg?
    const queueLength = +(await this._api.governorAlpha.proposalCount()); // TODO: Correct function?
    const results: CWEvent<IEventData>[] = [];

    /* eslint-disable no-await-in-loop */
    for (let i = 0; i < queueLength; i++) {
      // work backwards through the queue, starting with the most recent
      const queuePosition = queueLength - i - 1;
      const proposalIndex = this._version === 1
        ? queuePosition
        : +(await (this._api as Marlin2).proposalQueue(queuePosition));

      // fetch actual proposal
      const proposal: ProposalV1 | ProposalV2 = this._version === 1
        ? await this._api.proposalQueue(proposalIndex)
        : await this._api.proposals(proposalIndex);
      log.debug(`Fetched Marlin proposal ${proposalIndex} from storage.`);

      // compute starting time and derive closest block number
      const startingPeriod = +proposal.startingPeriod;
      const proposalStartingTime = (startingPeriod * this._periodDuration) + this._summoningTime;
      log.debug(`Fetching block for timestamp ${proposalStartingTime}.`);
      let proposalStartBlock: number;
      try {
        const block = await this._dater.getDate(proposalStartingTime * 1000);
        proposalStartBlock = block.block;
        log.debug(`For timestamp ${block.date}, fetched ETH block #${block.block}.`);
      } catch (e) {
        log.error(`Unable to fetch closest block to timestamp ${proposalStartingTime}: ${e.message}`);
        log.error('Skipping proposal event fetch.');
        // eslint-disable-next-line no-continue
        continue;
      }

      if (proposalStartBlock >= range.startBlock && proposalStartBlock <= range.endBlock) {
        const events = await this._eventsFromProposal(
          proposalIndex,
          proposal,
          proposalStartingTime,
          proposalStartBlock
        );
        results.push(...events);

        // halt fetch once we find a completed proposal in order to save data
        // we may want to run once without this, in order to fetch backlog, or else develop a pagination
        // strategy, but for now our API usage is limited.
        if (!fetchAllCompleted && events.find((p) => p.data.kind === EventKind.ProcessProposal)) {
          log.debug(`Proposal ${proposalIndex} is marked processed, halting fetch.`);
          break;
        }
      } else if (proposalStartBlock < range.startBlock) {
        log.debug(`Marlin proposal start block (${proposalStartBlock}) is before ${range.startBlock}, ending fetch.`);
        break;
      } else if (proposalStartBlock > range.endBlock) {
        // keep walking backwards until within range
        log.debug(`Marlin proposal start block (${proposalStartBlock}) is after ${range.endBlock}, ending fetch.`);
      }
    }
    return results;
  }
}
