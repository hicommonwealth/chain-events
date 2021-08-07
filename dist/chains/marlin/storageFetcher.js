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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageFetcher = void 0;
const interfaces_1 = require("../../interfaces");
const logging_1 = __importDefault(require("../../logging"));
const types_1 = require("./types");
class StorageFetcher extends interfaces_1.IStorageFetcher {
    constructor(_api, _dater) {
        super(_api);
        this._api = _api;
        this._dater = _dater;
    }
    _eventsFromProposal(index, proposal, startBlock) {
        return __awaiter(this, void 0, void 0, function* () {
            // Only GovernorAlpha events are on Proposals
            const events = [];
            // All proposals had to have at least been created
            // TODO: fetch these from events rather than storage
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
                    endBlock: +proposal.endBlock,
                    description: '', // TODO: not on proposal...
                },
            };
            events.push(createdEvent);
            // Some proposals might have been canceled too
            if (proposal.canceled) {
                const canceledEvent = {
                    blockNumber: Math.min(this._currentBlock, +proposal.endBlock),
                    data: {
                        kind: types_1.EventKind.ProposalCanceled,
                        id: +proposal.id,
                    },
                };
                events.push(canceledEvent);
            }
            // ProposalQueued
            if ((yield this._api.governorAlpha.state(proposal.id)) === 5) {
                // state 5 is queued
                const queuedEvent = {
                    blockNumber: Math.min(this._currentBlock, +proposal.endBlock),
                    data: {
                        kind: types_1.EventKind.ProposalQueued,
                        id: +proposal.id,
                        eta: +proposal.eta,
                    },
                };
                events.push(queuedEvent);
            }
            // ProposalExecuted
            if ((yield this._api.governorAlpha.state(proposal.id)) === 7) {
                // state 7 is executed
                const proposalExecuted = {
                    blockNumber: Math.min(this._currentBlock, +proposal.endBlock),
                    data: {
                        kind: types_1.EventKind.ProposalExecuted,
                        id: +proposal.id,
                    },
                };
                events.push(proposalExecuted);
            }
            // Vote Cast events are unfetchable
            return events;
        });
    }
    fetchOne(id) {
        return __awaiter(this, void 0, void 0, function* () {
            this._currentBlock = +(yield this._api.governorAlpha.provider.getBlockNumber());
            logging_1.default.info(`Current block: ${this._currentBlock}.`);
            if (!this._currentBlock) {
                logging_1.default.error('Failed to fetch current block! Aborting fetch.');
                return [];
            }
            const proposal = yield this._api.governorAlpha.proposals(id);
            if (+proposal.id === 0) {
                logging_1.default.error(`Marlin proposal ${id} not found.`);
                return [];
            }
            const events = yield this._eventsFromProposal(proposal.id.toNumber(), proposal, +proposal.startBlock);
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
            this._currentBlock = +(yield this._api.governorAlpha.provider.getBlockNumber());
            logging_1.default.info(`Current block: ${this._currentBlock}.`);
            if (!this._currentBlock) {
                logging_1.default.error('Failed to fetch current block! Aborting fetch.');
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
                logging_1.default.error(`Start block ${range.startBlock} greater than current block ${this._currentBlock}!`);
                return [];
            }
            if (range.endBlock && range.startBlock >= range.endBlock) {
                logging_1.default.error(`Invalid fetch range: ${range.startBlock}-${range.endBlock}.`);
                return [];
            }
            if (!range.endBlock) {
                range.endBlock = this._currentBlock;
            }
            logging_1.default.info(`Fetching Marlin entities for range: ${range.startBlock}-${range.endBlock}.`);
            const queueLength = +(yield this._api.governorAlpha.proposalCount());
            const results = [];
            let nFetched = 0;
            for (let i = 0; i < queueLength; i++) {
                // work backwards through the queue, starting with the most recent
                const queuePosition = queueLength - i;
                const proposal = yield this._api.governorAlpha.proposals(queuePosition);
                // fetch actual proposal
                logging_1.default.debug(`Fetched Marlin proposal ${proposal.id} from storage.`);
                const startBlock = +proposal.startBlock;
                if (startBlock >= range.startBlock && startBlock <= range.endBlock) {
                    const events = yield this._eventsFromProposal(proposal.id.toNumber(), proposal, startBlock);
                    results.push(...events);
                    nFetched += 1;
                    // halt fetch once we find a completed/executed proposal in order to save data
                    // we may want to run once without this, in order to fetch backlog, or else develop a pagination
                    // strategy, but for now our API usage is limited.
                    if (!fetchAllCompleted &&
                        events.find((p) => p.data.kind === types_1.EventKind.ProposalExecuted)) {
                        logging_1.default.debug(`Proposal ${proposal.id} is marked as executed, halting fetch.`);
                        break;
                    }
                    if (range.maxResults && nFetched >= range.maxResults) {
                        logging_1.default.debug(`Fetched ${nFetched} proposals, halting fetch.`);
                        break;
                    }
                }
                else if (startBlock < range.startBlock) {
                    logging_1.default.debug(`Marlin proposal start block (${startBlock}) is before ${range.startBlock}, ending fetch.`);
                    break;
                }
                else if (startBlock > range.endBlock) {
                    // keep walking backwards until within range
                    logging_1.default.debug(`Marlin proposal start block (${startBlock}) is after ${range.endBlock}, ending fetch.`);
                }
            }
            return results;
        });
    }
}
exports.StorageFetcher = StorageFetcher;
//# sourceMappingURL=storageFetcher.js.map