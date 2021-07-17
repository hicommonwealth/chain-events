"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageFetcher = void 0;
const interfaces_1 = require("../../interfaces");
const logging_1 = require("../../logging");
const types_1 = require("./types");
const log = logging_1.factory.getLogger(logging_1.formatFilename(__filename));
class StorageFetcher extends interfaces_1.IStorageFetcher {
    constructor(_api, _dater) {
        super(_api);
        this._api = _api;
        this._dater = _dater;
    }
    _eventsFromProposal(index, proposal, startTime, startBlock) {
        return __awaiter(this, void 0, void 0, function* () {
            // Only GovernorAlpha events are on Proposals
            const events = [];
            // All proposals had to have at least been created
            const createdEvent = {
                blockNumber: startBlock,
                data: {
                    kind: types_1.EventKind.ProposalCreated,
                    id: index,
                    proposer: proposal.proposer,
                    targets: [],
                    values: [],
                    signatures: [],
                    calldatas: [],
                    startBlock,
                    endBlock: proposal.endBlock.toNumber(),
                    description: '', // TODO: not on proposal...
                },
            };
            events.push(createdEvent);
            // Some proposals might have been canceled too
            if (proposal.canceled) {
                const canceledEvent = {
                    blockNumber: proposal.endBlock.toNumber(),
                    data: {
                        kind: types_1.EventKind.ProposalCanceled,
                        id: proposal.id.toNumber(),
                    },
                };
                events.push(canceledEvent);
            }
            // ProposalQueued
            if ((yield this._api.governorAlpha.state(proposal.id)) === 5) {
                // state 5 is queued
                const queuedEvent = {
                    blockNumber: proposal.endBlock.toNumber(),
                    data: {
                        kind: types_1.EventKind.ProposalQueued,
                        id: proposal.id.toNumber(),
                        eta: proposal.eta.toNumber(),
                    },
                };
                events.push(queuedEvent);
            }
            // ProposalExecuted
            if ((yield this._api.governorAlpha.state(proposal.id)) === 7) {
                // state 7 is executed
                const proposalExecuted = {
                    blockNumber: proposal.endBlock.toNumber(),
                    data: {
                        kind: types_1.EventKind.ProposalExecuted,
                        id: proposal.id.toNumber(),
                    },
                };
                events.push(proposalExecuted);
            }
            // Vote Cast events are unfetchable
            return events;
        });
    }
    /**
     * Fetches all CW events relating to ChainEntities from chain (or in this case contract),
     *   by quering available chain/contract storage and reconstructing events.
     *
     * NOTE: throws on error! Make sure to wrap in try/catch!
     *
     * @param range Determines the range of blocks to query events within.
     * @param fetchAllCompleted
     */
    fetch(range, fetchAllCompleted = false) {
        return __awaiter(this, void 0, void 0, function* () {
            // we need to fetch a few constants to convert voting periods into blocks
            this._votingDelay = +(yield this._api.governorAlpha.votingDelay());
            this._votingPeriod = +(yield this._api.governorAlpha.votingPeriod());
            this._currentBlock = +(yield this._api.governorAlpha.provider.getBlockNumber());
            log.info(`Current block: ${this._currentBlock}.`);
            this._currentTimestamp = (yield this._api.governorAlpha.provider.getBlock(this._currentBlock)).timestamp;
            log.info(`Current timestamp: ${this._currentTimestamp}.`);
            if (!this._currentBlock) {
                log.error('Failed to fetch current block! Aborting fetch.');
                return [];
            }
            // populate range fully if not given
            if (!range) {
                range = { startBlock: 0, endBlock: this._currentBlock };
            }
            else if (!range.startBlock) {
                range.startBlock = 0;
            }
            else if (range.startBlock >= this._currentBlock) {
                log.error(`Start block ${range.startBlock} greater than current block ${this._currentBlock}!`);
                return [];
            }
            if (range.endBlock && range.startBlock >= range.endBlock) {
                log.error(`Invalid fetch range: ${range.startBlock}-${range.endBlock}.`);
                return [];
            }
            if (!range.endBlock) {
                range.endBlock = this._currentBlock;
            }
            log.info(`Fetching Marlin entities for range: ${range.startBlock}-${range.endBlock}.`);
            const queueLength = +(yield this._api.governorAlpha.proposalCount());
            const results = [];
            for (let i = 0; i < queueLength; i++) {
                // work backwards through the queue, starting with the most recent
                const queuePosition = queueLength - i - 1;
                const proposal = yield this._api.governorAlpha.proposals(queuePosition);
                // fetch actual proposal
                // const proposal: Proposal = await this._api.governorAlpha.proposalQueue(proposalIndex);
                log.debug(`Fetched Marlin proposal ${proposal.id} from storage.`);
                // compute starting time and derive closest block number
                const startingPeriod = +proposal.startBlock;
                const proposalStartingTime = startingPeriod * this._votingPeriod + this._currentBlock;
                log.debug(`Fetching block for timestamp ${proposalStartingTime}.`);
                let proposalStartBlock;
                try {
                    const block = yield this._dater.getDate(proposalStartingTime * 1000);
                    proposalStartBlock = block.block;
                    log.debug(`For timestamp ${block.date}, fetched ETH block #${block.block}.`);
                }
                catch (e) {
                    log.error(`Unable to fetch closest block to timestamp ${proposalStartingTime}: ${e.message}`);
                    log.error('Skipping proposal event fetch.');
                    // eslint-disable-next-line no-continue
                    continue;
                }
                if (proposalStartBlock >= range.startBlock &&
                    proposalStartBlock <= range.endBlock) {
                    const events = yield this._eventsFromProposal(proposal.id.toNumber(), proposal, proposalStartingTime, proposalStartBlock);
                    results.push(...events);
                    // halt fetch once we find a completed/executed proposal in order to save data
                    // we may want to run once without this, in order to fetch backlog, or else develop a pagination
                    // strategy, but for now our API usage is limited.
                    if (!fetchAllCompleted &&
                        events.find((p) => p.data.kind === types_1.EventKind.ProposalExecuted)) {
                        log.debug(`Proposal ${proposal.id} is marked as executed, halting fetch.`);
                        break;
                    }
                }
                else if (proposalStartBlock < range.startBlock) {
                    log.debug(`Marlin proposal start block (${proposalStartBlock}) is before ${range.startBlock}, ending fetch.`);
                    break;
                }
                else if (proposalStartBlock > range.endBlock) {
                    // keep walking backwards until within range
                    log.debug(`Marlin proposal start block (${proposalStartBlock}) is after ${range.endBlock}, ending fetch.`);
                }
            }
            return results;
        });
    }
}
exports.StorageFetcher = StorageFetcher;
//# sourceMappingURL=storageFetcher.js.map