"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Title = void 0;
const types_1 = require("../types");
/**
 * This a titler function, not to be confused with the labeler -- it takes a particular
 * kind of event, and returns a "plain english" description of that type. This is used
 * on the client to present a list of subscriptions that a user might want to subscribe to.
 */
const Title = (kind) => {
    switch (kind) {
        // MPond events
        case types_1.EventKind.Approval: {
            return {
                title: 'MPond Approval',
                description: 'An Approval event occurred on MPond Contract.',
            };
        }
        case types_1.EventKind.DelegateChanged: {
            return {
                title: 'Delegate Changed',
                description: 'A delegated has been changed.',
            };
        }
        case types_1.EventKind.DelegateVotesChanged: {
            return {
                title: 'A Delegate Changed Votes',
                description: 'A delegate changed or added votes.',
            };
        }
        case types_1.EventKind.Transfer: {
            return {
                title: 'Tranfer Occurred',
                description: 'Transfer event occurred.',
            };
        }
        // GovernorAlpha Events
        case types_1.EventKind.ProposalCanceled: {
            return {
                title: 'Proposal cancelled',
                description: 'A proposal has been cancelled.',
            };
        }
        case types_1.EventKind.ProposalCreated: {
            return {
                title: 'Proposal created',
                description: 'A proposal has been created.',
            };
        }
        case types_1.EventKind.ProposalExecuted: {
            return {
                title: 'Proposal executed',
                description: 'A proposal has been executed.',
            };
        }
        case types_1.EventKind.ProposalQueued: {
            return {
                title: 'Proposal queued',
                description: 'A proposal has been added to the queue.',
            };
        }
        case types_1.EventKind.VoteCast: {
            return {
                title: 'Vote cast',
                description: 'A new vote has been cast.',
            };
        }
        // Timelock events
        case types_1.EventKind.CancelTransaction: {
            return {
                title: 'Cancel transaction',
                description: 'A transaction has been cancelled.',
            };
        }
        case types_1.EventKind.ExecuteTransaction: {
            return {
                title: 'Execute transaction',
                description: 'A transaction has been executed.',
            };
        }
        case types_1.EventKind.NewAdmin: {
            return {
                title: 'New admin',
                description: 'A new admin has been confirmed.',
            };
        }
        case types_1.EventKind.NewDelay: {
            return {
                title: 'New delay',
                description: 'A new delay has been set.',
            };
        }
        case types_1.EventKind.NewPendingAdmin: {
            return {
                title: 'New pending admin',
                description: 'A new admin is pending confirmation.',
            };
        }
        case types_1.EventKind.QueueTransaction: {
            return {
                title: 'Queue transaction',
                description: 'A transaction has been added to the queue.',
            };
        }
        default: {
            // ensure exhaustive matching -- gives ts error if missing cases
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const _exhaustiveMatch = kind;
            throw new Error('unknown event type');
        }
    }
};
exports.Title = Title;
//# sourceMappingURL=titler.js.map