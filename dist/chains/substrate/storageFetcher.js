"use strict";
/**
 * The purpose of this file is to synthesize "events" from currently-present
 * chain data, such that we don't need to "start fresh". We can "recover" the
 * originating event of any present entity and use that to seed our database
 * when converting from a client-based chain listener setup to a server-based one.
 */
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
const underscore_1 = __importDefault(require("underscore"));
const util_1 = require("@polkadot/util");
const interfaces_1 = require("../../interfaces");
const logging_1 = require("../../logging");
const types_1 = require("./types");
const log = logging_1.factory.getLogger(logging_1.formatFilename(__filename));
class StorageFetcher extends interfaces_1.IStorageFetcher {
    fetchIdentities(addresses) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._api.query.identity) {
                log.info('Identities module not detected.');
                return [];
            }
            const blockNumber = +(yield this._api.rpc.chain.getHeader()).number;
            // fetch all identities and registrars from chain
            const identities = yield this._api.query.identity.identityOf.multi(addresses);
            const registrars = yield this._api.query.identity.registrars();
            // construct events
            const cwEvents = underscore_1.default.zip(addresses, identities)
                .map(([address, id]) => {
                // if no identity found, do nothing
                if (!id.isSome)
                    return null;
                const { info, judgements } = id.unwrap();
                if (!info.display || !info.display.isRaw)
                    return null;
                // parse out judgements from identity info
                const parsedJudgements = judgements
                    .map(([judgmentId, judgement]) => {
                    const registrarOpt = registrars[+judgmentId];
                    // skip invalid registrars
                    if (!registrarOpt || !registrarOpt.isSome)
                        return null;
                    return [
                        registrarOpt.unwrap().account.toString(),
                        types_1.parseJudgement(judgement),
                    ];
                })
                    .filter((j) => !!j);
                return {
                    // use current block as "fake" set date
                    blockNumber,
                    data: {
                        kind: types_1.EventKind.IdentitySet,
                        who: address,
                        displayName: info.display.asRaw.toUtf8(),
                        judgements: parsedJudgements,
                    },
                };
            })
                // remove null values
                .filter((v) => !!v);
            return cwEvents;
        });
    }
    fetch() {
        return __awaiter(this, void 0, void 0, function* () {
            // get current blockNumber for synthesizing events
            const blockNumber = +(yield this._api.rpc.chain.getHeader()).number;
            /** democracy proposals */
            const democracyProposalEvents = yield this.fetchDemocracyProposals(blockNumber);
            /** democracy referenda */
            const democracyReferendaEvents = yield this.fetchDemocracyReferenda(blockNumber);
            /** democracy preimages */
            const proposalHashes = democracyProposalEvents.map((d) => d.data.proposalHash);
            const referendaHashes = democracyReferendaEvents
                .filter((d) => d.data.kind === types_1.EventKind.DemocracyStarted)
                .map((d) => d.data.proposalHash);
            const democracyPreimageEvents = yield this.fetchDemocracyPreimages([
                ...proposalHashes,
                ...referendaHashes,
            ]);
            /** treasury proposals */
            const treasuryProposalEvents = yield this.fetchTreasuryProposals(blockNumber);
            const bountyEvents = yield this.fetchBounties(blockNumber);
            /** collective proposals */
            let technicalCommitteeProposalEvents = [];
            if (this._api.query.technicalCommittee) {
                technicalCommitteeProposalEvents = yield this.fetchCollectiveProposals('technicalCommittee', blockNumber);
            }
            const councilProposalEvents = yield this.fetchCollectiveProposals('council', blockNumber);
            /** tips */
            const tipsEvents = yield this.fetchTips(blockNumber);
            /** signaling proposals */
            const signalingProposalEvents = yield this.fetchSignalingProposals(blockNumber);
            log.info('Fetch complete.');
            return [
                ...democracyProposalEvents,
                ...democracyReferendaEvents,
                ...democracyPreimageEvents,
                ...treasuryProposalEvents,
                ...bountyEvents,
                ...technicalCommitteeProposalEvents,
                ...councilProposalEvents,
                ...signalingProposalEvents,
                ...tipsEvents,
            ];
        });
    }
    fetchDemocracyProposals(blockNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._api.query.democracy) {
                return [];
            }
            log.info('Fetching democracy proposals...');
            const publicProps = yield this._api.query.democracy.publicProps();
            const deposits = yield this._api.queryMulti(publicProps.map(([idx]) => [this._api.query.democracy.depositOf, idx]));
            const proposedEvents = underscore_1.default.zip(publicProps, deposits)
                .map(([[idx, hash, proposer], depositOpt]) => {
                if (!depositOpt.isSome)
                    return null;
                // handle kusama vs edgeware depositOpt order
                const depositors = depositOpt.unwrap();
                let deposit;
                if (util_1.isFunction(depositors[1].mul)) {
                    [, deposit] = depositors;
                }
                else {
                    [deposit] = depositors;
                }
                return {
                    kind: types_1.EventKind.DemocracyProposed,
                    proposalIndex: +idx,
                    proposalHash: hash.toString(),
                    proposer: proposer.toString(),
                    deposit: deposit.toString(),
                };
            })
                .filter((e) => !!e);
            log.info(`Found ${proposedEvents.length} democracy proposals!`);
            return proposedEvents.map((data) => ({ blockNumber, data }));
        });
    }
    fetchDemocracyReferenda(blockNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._api.query.democracy) {
                log.info('Democracy module not detected.');
                return [];
            }
            log.info('Migrating democracy referenda...');
            const activeReferenda = yield this._api.derive.democracy.referendumsActive();
            const startEvents = activeReferenda.map((r) => {
                return {
                    kind: types_1.EventKind.DemocracyStarted,
                    referendumIndex: +r.index,
                    proposalHash: r.imageHash.toString(),
                    voteThreshold: r.status.threshold.toString(),
                    endBlock: +r.status.end,
                };
            });
            const dispatchQueue = yield this._api.derive.democracy.dispatchQueue();
            const passedEvents = underscore_1.default.flatten(dispatchQueue.map(({ index, at, imageHash }) => {
                return [
                    {
                        kind: types_1.EventKind.DemocracyStarted,
                        referendumIndex: +index,
                        proposalHash: imageHash.toString(),
                        // fake unknown values for started event
                        voteThreshold: '',
                        endBlock: 0,
                    },
                    {
                        kind: types_1.EventKind.DemocracyPassed,
                        referendumIndex: +index,
                        dispatchBlock: +at,
                    },
                ];
            }));
            log.info(`Found ${startEvents.length} democracy referenda!`);
            return [...startEvents, ...passedEvents].map((data) => ({
                blockNumber,
                data,
            }));
        });
    }
    // must pass proposal hashes found in prior events
    fetchDemocracyPreimages(hashes) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._api.query.democracy) {
                return [];
            }
            log.info('Migrating preimages...');
            const hashCodecs = hashes.map((hash) => this._api.createType('Hash', hash));
            const preimages = yield this._api.derive.democracy.preimages(hashCodecs);
            const notedEvents = underscore_1.default.zip(hashes, preimages).map(([hash, preimage]) => {
                if (!preimage || !preimage.proposal)
                    return [0, null];
                return [
                    +preimage.at,
                    {
                        kind: types_1.EventKind.PreimageNoted,
                        proposalHash: hash,
                        noter: preimage.proposer.toString(),
                        preimage: {
                            method: preimage.proposal.method,
                            section: preimage.proposal.section,
                            args: preimage.proposal.args.map((arg) => arg.toString()),
                        },
                    },
                ];
            });
            const cwEvents = notedEvents
                .filter(([, data]) => !!data)
                .map(([blockNumber, data]) => ({ blockNumber, data }));
            log.info(`Found ${cwEvents.length} preimages!`);
            return cwEvents;
        });
    }
    fetchTreasuryProposals(blockNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._api.query.treasury) {
                log.info('Treasury module not detected.');
                return [];
            }
            log.info('Migrating treasury proposals...');
            const approvals = yield this._api.query.treasury.approvals();
            const nProposals = yield this._api.query.treasury.proposalCount();
            const proposalIds = [];
            for (let i = 0; i < +nProposals; i++) {
                if (!approvals.some((id) => +id === i)) {
                    proposalIds.push(i);
                }
            }
            const proposals = yield this._api.query.treasury.proposals.multi(proposalIds);
            const proposedEvents = proposalIds
                .map((id, index) => {
                if (!proposals[index] || !proposals[index].isSome)
                    return null;
                const { proposer, value, beneficiary, bond } = proposals[index].unwrap();
                return {
                    kind: types_1.EventKind.TreasuryProposed,
                    proposalIndex: +id,
                    proposer: proposer.toString(),
                    value: value.toString(),
                    beneficiary: beneficiary.toString(),
                    bond: bond.toString(),
                };
            })
                .filter((e) => !!e);
            log.info(`Found ${proposedEvents.length} treasury proposals!`);
            return proposedEvents.map((data) => ({ blockNumber, data }));
        });
    }
    fetchBounties(blockNumber) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            // TODO: List all relevant events explicitly?
            if (!((_a = this._api.query.treasury) === null || _a === void 0 ? void 0 : _a.bountyCount) &&
                !((_b = this._api.query.bounties) === null || _b === void 0 ? void 0 : _b.bountyCount)) {
                log.info('Bounties module not detected.');
                return [];
            }
            log.info('Migrating treasury bounties...');
            const bounties = yield this._api.derive.bounties.bounties();
            const events = [];
            for (const b of bounties) {
                events.push({
                    kind: types_1.EventKind.TreasuryBountyProposed,
                    bountyIndex: +b.index,
                    proposer: b.bounty.proposer.toString(),
                    value: b.bounty.value.toString(),
                    fee: b.bounty.fee.toString(),
                    curatorDeposit: b.bounty.curatorDeposit.toString(),
                    bond: b.bounty.bond.toString(),
                    description: b.description,
                });
                if (b.bounty.status.isActive) {
                    events.push({
                        kind: types_1.EventKind.TreasuryBountyBecameActive,
                        bountyIndex: +b.index,
                        curator: b.bounty.status.asActive.curator.toString(),
                        updateDue: +b.bounty.status.asActive.updateDue,
                    });
                }
                if (b.bounty.status.isPendingPayout) {
                    events.push({
                        kind: types_1.EventKind.TreasuryBountyBecameActive,
                        bountyIndex: +b.index,
                        curator: b.bounty.status.asPendingPayout.curator.toString(),
                        updateDue: blockNumber, // fake this unavailable field
                    });
                    events.push({
                        kind: types_1.EventKind.TreasuryBountyAwarded,
                        bountyIndex: +b.index,
                        value: b.bounty.value.toString(),
                        beneficiary: b.bounty.status.asPendingPayout.beneficiary.toString(),
                        curator: b.bounty.status.asPendingPayout.curator.toString(),
                        unlockAt: +b.bounty.status.asPendingPayout.unlockAt,
                    });
                }
            }
            log.info(`Found ${bounties.length} bounties!`);
            return events.map((data) => ({ blockNumber, data }));
        });
    }
    fetchCollectiveProposals(moduleName, blockNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._api.query[moduleName]) {
                log.info(`${moduleName} module not detected.`);
                return [];
            }
            log.info(`Migrating ${moduleName} proposals...`);
            const proposalHashes = yield this._api.query[moduleName].proposals();
            const proposals = yield Promise.all(proposalHashes.map((h) => __awaiter(this, void 0, void 0, function* () {
                try {
                    // awaiting inside the map here to force the individual call to throw, rather than the Promise.all
                    return yield this._api.query[moduleName].proposalOf(h);
                }
                catch (e) {
                    log.error(`Failed to fetch council motion hash ${h.toString()}`);
                    return Promise.resolve(null);
                }
            })));
            const proposalVotes = yield this._api.query[moduleName].voting.multi(proposalHashes);
            const proposedEvents = underscore_1.default.flatten(proposalHashes
                .map((hash, index) => {
                const proposalOpt = proposals[index];
                const votesOpt = proposalVotes[index];
                if (!hash ||
                    !proposalOpt ||
                    !votesOpt ||
                    !proposalOpt.isSome ||
                    !votesOpt.isSome)
                    return null;
                const proposal = proposalOpt.unwrap();
                const votes = votesOpt.unwrap();
                return [
                    {
                        kind: types_1.EventKind.CollectiveProposed,
                        collectiveName: moduleName,
                        proposalIndex: +votes.index,
                        proposalHash: hash.toString(),
                        threshold: +votes.threshold,
                        call: {
                            method: proposal.method,
                            section: proposal.section,
                            args: proposal.args.map((arg) => arg.toString()),
                        },
                        // unknown
                        proposer: '',
                    },
                    ...votes.ayes.map((who) => ({
                        kind: types_1.EventKind.CollectiveVoted,
                        collectiveName: moduleName,
                        proposalHash: hash.toString(),
                        voter: who.toString(),
                        vote: true,
                    })),
                    ...votes.nays.map((who) => ({
                        kind: types_1.EventKind.CollectiveVoted,
                        collectiveName: moduleName,
                        proposalHash: hash.toString(),
                        voter: who.toString(),
                        vote: false,
                    })),
                ];
            })
                .filter((es) => !!es));
            const nProposalEvents = proposedEvents.filter((e) => e.kind === types_1.EventKind.CollectiveProposed).length;
            log.info(`Found ${nProposalEvents} ${moduleName} proposals and ${proposedEvents.length - nProposalEvents} votes!`);
            return proposedEvents.map((data) => ({ blockNumber, data }));
        });
    }
    fetchTips(blockNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._api.query.tips) {
                log.info('Tips module not detected.');
                return [];
            }
            log.info('Migrating tips...');
            const openTipKeys = yield this._api.query.tips.tips.keys();
            const results = [];
            for (const key of openTipKeys) {
                const hash = key.args[0].toString();
                try {
                    const tip = yield this._api.rpc.state.getStorage(key);
                    if (tip.isSome) {
                        const { reason: reasonHash, who, finder, deposit, closes, tips: tipVotes, findersFee, } = tip.unwrap();
                        const reason = yield this._api.query.tips.reasons(reasonHash);
                        if (reason.isSome) {
                            // newtip events
                            results.push({
                                blockNumber,
                                data: {
                                    kind: types_1.EventKind.NewTip,
                                    proposalHash: hash,
                                    who: who.toString(),
                                    reason: util_1.hexToString(reason.unwrap().toString()),
                                    finder: finder.toString(),
                                    deposit: deposit.toString(),
                                    findersFee: findersFee.valueOf(),
                                },
                            });
                            // n tipvoted events
                            for (const [voter, amount] of tipVotes) {
                                results.push({
                                    blockNumber,
                                    data: {
                                        kind: types_1.EventKind.TipVoted,
                                        proposalHash: hash,
                                        who: voter.toString(),
                                        value: amount.toString(),
                                    },
                                });
                            }
                            // tipclosing event
                            if (closes.isSome) {
                                const closesAt = +closes.unwrap();
                                results.push({
                                    blockNumber,
                                    data: {
                                        kind: types_1.EventKind.TipClosing,
                                        proposalHash: hash,
                                        closing: closesAt,
                                    },
                                });
                            }
                        }
                    }
                }
                catch (e) {
                    log.error(`Unable to fetch tip "${key.args[0]}"!`);
                }
            }
            const newTips = results.filter((v) => v.data.kind === types_1.EventKind.NewTip);
            log.info(`Found ${newTips.length} open tips!`);
            return results;
        });
    }
    fetchSignalingProposals(blockNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._api.query.signaling || !this._api.query.voting) {
                log.info('Signaling module not detected.');
                return [];
            }
            log.info('Migrating signaling proposals...');
            if (!this._api.query.voting || !this._api.query.signaling) {
                log.info('Found no signaling proposals (wrong chain)!');
                return [];
            }
            // in "prevoting" phase
            const inactiveProposals = yield this._api.query.signaling.inactiveProposals();
            // in "commit" or "voting" phase
            const activeProposals = yield this._api.query.signaling.activeProposals();
            // in "completed" phase
            const completedProposals = yield this._api.query.signaling.completedProposals();
            const proposalHashes = [
                ...inactiveProposals,
                ...activeProposals,
                ...completedProposals,
            ].map(([hash]) => hash);
            // fetch records
            const proposalRecordOpts = yield this._api.queryMulti(proposalHashes.map((hash) => [this._api.query.signaling.proposalOf, hash]));
            const proposalRecords = underscore_1.default.zip(proposalRecordOpts, proposalHashes)
                .filter(([p]) => p.isSome)
                .map(([p, hash]) => [p.unwrap(), hash]);
            const voteRecordOpts = yield this._api.queryMulti(proposalRecords.map(([p]) => [
                this._api.query.voting.voteRecords,
                p.vote_id,
            ]));
            const allRecords = underscore_1.default.zip(proposalRecords, voteRecordOpts)
                .filter(([, voteOpt]) => voteOpt.isSome)
                .map(([[record, hash], vote]) => [hash, record, vote.unwrap()]);
            // generate events
            const newProposalEvents = allRecords.map(([hash, proposal, voting]) => {
                return {
                    kind: types_1.EventKind.SignalingNewProposal,
                    proposer: proposal.author.toString(),
                    proposalHash: hash.toString(),
                    voteId: voting.id.toString(),
                    title: proposal.title.toString(),
                    description: proposal.contents.toString(),
                    tallyType: voting.data.tally_type.toString(),
                    voteType: voting.data.vote_type.toString(),
                    choices: voting.outcomes.map((outcome) => outcome.toString()),
                };
            });
            // we're not using commit in production, but check anyway
            const commitStartedEvents = allRecords
                .filter(([, proposal]) => proposal.stage.isCommit)
                .map(([hash, proposal, voting]) => {
                return {
                    kind: types_1.EventKind.SignalingCommitStarted,
                    proposalHash: hash.toString(),
                    voteId: voting.id.toString(),
                    endBlock: +proposal.transition_time,
                };
            });
            // assume all voting/completed proposals skipped straight there without commit
            const votingStartedEvents = allRecords
                .filter(([, proposal]) => proposal.stage.isVoting || proposal.stage.isCompleted)
                .map(([hash, proposal, voting]) => {
                return {
                    kind: types_1.EventKind.SignalingVotingStarted,
                    proposalHash: hash.toString(),
                    voteId: voting.id.toString(),
                    endBlock: +proposal.transition_time,
                };
            });
            const completedEvents = allRecords
                .filter(([, proposal]) => proposal.stage.isCompleted)
                .map(([hash, , voting]) => {
                return {
                    kind: types_1.EventKind.SignalingVotingCompleted,
                    proposalHash: hash.toString(),
                    voteId: voting.id.toString(),
                };
            });
            const events = [
                ...newProposalEvents,
                ...commitStartedEvents,
                ...votingStartedEvents,
                ...completedEvents,
            ];
            // we could plausibly populate the completed events with block numbers, but not necessary
            log.info(`Found ${newProposalEvents.length} signaling proposals!`);
            return events.map((data) => ({ blockNumber, data }));
        });
    }
}
exports.StorageFetcher = StorageFetcher;
//# sourceMappingURL=storageFetcher.js.map