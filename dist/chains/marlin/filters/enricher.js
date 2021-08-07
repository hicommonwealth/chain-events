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
exports.Enrich = void 0;
const types_1 = require("../types");
function Enrich(api, blockNumber, kind, rawData) {
    return __awaiter(this, void 0, void 0, function* () {
        switch (kind) {
            // MPond events
            case types_1.EventKind.Approval: {
                const { owner, spender, amount } = rawData.args;
                return {
                    blockNumber,
                    excludeAddresses: [owner],
                    data: {
                        kind,
                        owner,
                        spender,
                        amount: amount.toString(),
                    },
                };
            }
            case types_1.EventKind.DelegateChanged: {
                const { delegator, fromDelegate, toDelegate, } = rawData.args;
                return {
                    blockNumber,
                    excludeAddresses: [delegator],
                    data: {
                        kind,
                        delegator,
                        fromDelegate,
                        toDelegate,
                    },
                };
            }
            case types_1.EventKind.DelegateVotesChanged: {
                const { delegate, previousBalance, newBalance, } = rawData.args;
                return {
                    blockNumber,
                    excludeAddresses: [delegate],
                    data: {
                        kind,
                        delegate,
                        previousBalance: previousBalance.toString(),
                        newBalance: newBalance.toString(),
                    },
                };
            }
            case types_1.EventKind.Transfer: {
                const { from, to, amount } = rawData.args;
                return {
                    blockNumber,
                    excludeAddresses: [from],
                    data: {
                        kind,
                        from,
                        to,
                        amount: amount.toString(),
                    },
                };
            }
            // GovernorAlpha Events
            case types_1.EventKind.ProposalCanceled: {
                const { id } = rawData.args;
                return {
                    blockNumber,
                    excludeAddresses: [],
                    data: {
                        kind,
                        id: +id,
                    },
                };
            }
            case types_1.EventKind.ProposalCreated: {
                const { id, proposer, targets, signatures, calldatas, startBlock, endBlock, description, } = rawData.args;
                // values doesn't appear on the object version, hack around it by accessing the
                // argument array instead
                const values = rawData.args[3];
                return {
                    blockNumber,
                    excludeAddresses: [proposer],
                    data: {
                        kind,
                        id: +id,
                        proposer,
                        targets,
                        values: values.map((v) => v.toString()),
                        signatures,
                        calldatas,
                        startBlock: +startBlock,
                        endBlock: +endBlock,
                        description,
                    },
                };
            }
            case types_1.EventKind.ProposalExecuted: {
                const { id } = rawData.args;
                return {
                    blockNumber,
                    excludeAddresses: [],
                    data: {
                        kind,
                        id: +id,
                    },
                };
            }
            case types_1.EventKind.ProposalQueued: {
                const { id, eta } = rawData.args;
                return {
                    blockNumber,
                    excludeAddresses: [],
                    data: {
                        kind,
                        id: +id,
                        eta: +eta,
                    },
                };
            }
            case types_1.EventKind.VoteCast: {
                const { voter, proposalId, support, votes } = rawData.args;
                return {
                    blockNumber,
                    excludeAddresses: [voter],
                    data: {
                        kind,
                        voter,
                        id: +proposalId,
                        support,
                        votes: votes.toString(),
                    },
                };
            }
            // Timelock events
            case types_1.EventKind.CancelTransaction: {
                const { txHash, target, value, signature, data, eta, } = rawData.args;
                return {
                    blockNumber,
                    excludeAddresses: [],
                    data: {
                        kind,
                        txHash,
                        target,
                        value: value.toString(),
                        signature,
                        data,
                        eta: +eta,
                    },
                };
            }
            case types_1.EventKind.ExecuteTransaction: {
                const { txHash, target, value, signature, data, eta, } = rawData.args;
                return {
                    blockNumber,
                    excludeAddresses: [],
                    data: {
                        kind,
                        txHash,
                        target,
                        value: value.toString(),
                        signature,
                        data,
                        eta: +eta,
                    },
                };
            }
            case types_1.EventKind.NewAdmin: {
                const { newAdmin } = rawData.args;
                return {
                    blockNumber,
                    excludeAddresses: [newAdmin],
                    data: {
                        kind,
                        newAdmin,
                    },
                };
            }
            case types_1.EventKind.NewDelay: {
                const { newDelay } = rawData.args;
                return {
                    blockNumber,
                    excludeAddresses: [],
                    data: {
                        kind,
                        newDelay: +newDelay,
                    },
                };
            }
            case types_1.EventKind.NewPendingAdmin: {
                const { newPendingAdmin } = rawData.args;
                return {
                    blockNumber,
                    excludeAddresses: [],
                    data: {
                        kind,
                        newPendingAdmin,
                    },
                };
            }
            case types_1.EventKind.QueueTransaction: {
                const { txHash, target, value, signature, data, eta, } = rawData.args;
                return {
                    blockNumber,
                    excludeAddresses: [],
                    data: {
                        kind,
                        txHash,
                        target,
                        value: value.toString(),
                        signature,
                        data,
                        eta: +eta,
                    },
                };
            }
            default: {
                throw new Error('unknown marlin event kind!');
            }
        }
        return { blockNumber: null, data: null };
    });
}
exports.Enrich = Enrich;
//# sourceMappingURL=enricher.js.map