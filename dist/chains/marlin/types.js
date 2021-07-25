"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventKinds = exports.EventKind = exports.EntityKind = exports.EventChains = void 0;
exports.EventChains = ['marlin', 'marlin-local'];
// eslint-disable-next-line no-shadow
var EntityKind;
(function (EntityKind) {
    // eslint-disable-next-line no-shadow
    EntityKind["Proposal"] = "proposal";
})(EntityKind = exports.EntityKind || (exports.EntityKind = {}));
// eslint-disable-next-line no-shadow
var EventKind;
(function (EventKind) {
    // MPond Events
    EventKind["Approval"] = "approval";
    EventKind["DelegateChanged"] = "delegate-changed";
    EventKind["DelegateVotesChanged"] = "delegate-votes-changed";
    EventKind["Transfer"] = "transfer";
    // GovernorAlpha Events
    EventKind["ProposalExecuted"] = "proposal-executed";
    EventKind["ProposalCreated"] = "proposal-created";
    EventKind["ProposalCanceled"] = "proposal-canceled";
    EventKind["ProposalQueued"] = "proposal-queued";
    EventKind["VoteCast"] = "vote-cast";
    // Timelock Events
    EventKind["CancelTransaction"] = "cancel-transaction";
    EventKind["ExecuteTransaction"] = "execute-transactions";
    EventKind["NewAdmin"] = "new-admin";
    EventKind["NewDelay"] = "new-delay";
    EventKind["NewPendingAdmin"] = "new-pending-admin";
    EventKind["QueueTransaction"] = "queue-transaction";
})(EventKind = exports.EventKind || (exports.EventKind = {}));
// eslint-disable-next-line semi-style
exports.EventKinds = Object.values(EventKind);
