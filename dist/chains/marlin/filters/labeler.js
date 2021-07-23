"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Label = void 0;
const types_1 = require("../types");
/**
 * This a labeler function, which takes event data and describes it in "plain english",
 * such that we can display a notification regarding its contents.
 */
const Label = (blockNumber, chainId, data) => {
    switch (data.kind) {
        // MPond events
        case types_1.EventKind.Approval: {
            return {
                heading: 'Approval',
                label: `${data.spender} approved ${data.amount} to ${data.owner}.`,
            };
        }
        case types_1.EventKind.DelegateChanged: {
            return {
                heading: 'Delegate Changed',
                label: `Delegate (${data.fromDelegate}) has changed to delegate (${data.toDelegate}).`,
            };
        }
        case types_1.EventKind.DelegateVotesChanged: {
            return {
                heading: 'Delegate Votes Changed',
                label: `Delegate (${data.delegate}) changed votes from ${data.previousBalance} to ${data.newBalance}.`,
            };
        }
        case types_1.EventKind.Transfer: {
            return {
                heading: 'Transfer Occurred',
                label: `Transfer of ${data.amount}LIN from ${data.from} to ${data.to}.`,
            };
        }
        // GovernorAlpha Events
        case types_1.EventKind.ProposalCanceled: {
            return {
                heading: 'Proposal Canceled',
                label: `Proposal ${data.id} was cancelled.`,
                linkUrl: chainId
                    ? `/${chainId}/proposal/marlinproposal/${data.id}`
                    : null,
            };
        }
        case types_1.EventKind.ProposalCreated: {
            return {
                heading: 'Proposal Created',
                label: `Proposal ${data.id} was created.`,
                linkUrl: chainId
                    ? `/${chainId}/proposal/marlinproposal/${data.id}`
                    : null,
            };
        }
        case types_1.EventKind.ProposalExecuted: {
            return {
                heading: 'Proposal Executed',
                label: `Proposal ${data.id} was executed.`,
                linkUrl: chainId
                    ? `/${chainId}/proposal/marlinproposal/${data.id}`
                    : null,
            };
        }
        case types_1.EventKind.ProposalQueued: {
            return {
                heading: 'Proposal Queued',
                label: `Proposal ${data.id} queued up. ETA: Block ${data.eta}.`,
                linkUrl: chainId
                    ? `/${chainId}/proposal/marlinproposal/${data.id}`
                    : null,
            };
        }
        case types_1.EventKind.VoteCast: {
            return {
                heading: 'Vote Cast',
                label: `Voter (${data.voter}) cast ${data.votes} votes ${data.support ? 'not' : null} in support of proposal ${data.id}.`,
                linkUrl: chainId
                    ? `/${chainId}/proposal/marlinproposal/${data.id}`
                    : null,
            };
        }
        // Timelock events
        case types_1.EventKind.CancelTransaction: {
            return {
                heading: 'Transaction Cancelled',
                label: `Transaction ${data.txHash} was cancelled.`,
            };
        }
        case types_1.EventKind.ExecuteTransaction: {
            return {
                heading: 'Transaction Executed',
                label: `Transaction ${data.txHash} was executed. ${data.value}LIN was transfered to ${data.target}.`,
            };
        }
        case types_1.EventKind.NewAdmin: {
            return {
                heading: 'New Admin',
                label: `New admin: ${data.newAdmin}.`,
            };
        }
        case types_1.EventKind.NewDelay: {
            return {
                heading: 'New Delay',
                label: `New delay of ${data.newDelay} length.`,
            };
        }
        case types_1.EventKind.NewPendingAdmin: {
            return {
                heading: 'New Pending Admin',
                label: `New pending admin (${data.newPendingAdmin}).`,
            };
        }
        case types_1.EventKind.QueueTransaction: {
            return {
                heading: 'Transaction Queued',
                label: `Transaction ${data.txHash} was queued. ETA: Block #${data.eta}.`,
            };
        }
        default: {
            // ensure exhaustive matching -- gives ts error if missing cases
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const _exhaustiveMatch = data;
            throw new Error('unknown event type');
        }
    }
};
exports.Label = Label;
