"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParseType = void 0;
const types_1 = require("../types");
const logging_1 = __importDefault(require("../../../logging"));
/**
 * This is the Type Parser function, which takes a raw Event
 * and determines which of our local event kinds it belongs to.
 */
function ParseType(name) {
    switch (name) {
        // MPond Events
        case 'Approval':
            return types_1.EventKind.Approval;
        case 'DelegateChanged':
            return types_1.EventKind.DelegateChanged;
        case 'DelegateVotesChanged':
            return types_1.EventKind.DelegateVotesChanged;
        case 'Transfer':
            return types_1.EventKind.Transfer;
        // GovernorAlpha Events
        case 'ProposalExecuted':
            return types_1.EventKind.ProposalExecuted;
        case 'ProposalCreated':
            return types_1.EventKind.ProposalCreated;
        case 'ProposalCanceled':
            return types_1.EventKind.ProposalCanceled;
        case 'ProposalQueued':
            return types_1.EventKind.ProposalQueued;
        case 'VoteCast':
            return types_1.EventKind.VoteCast;
        // Timelock Events
        case 'CancelTransaction':
            return types_1.EventKind.CancelTransaction;
        case 'ExecuteTransaction':
            return types_1.EventKind.ExecuteTransaction;
        case 'NewAdmin':
            return types_1.EventKind.NewAdmin;
        case 'NewDelay':
            return types_1.EventKind.NewDelay;
        case 'NewPendingAdmin':
            return types_1.EventKind.NewPendingAdmin;
        case 'QueueTransaction':
            return types_1.EventKind.QueueTransaction;
        default: {
            logging_1.default.warn(`Unknown Marlin event name: ${name}!`);
            return null;
        }
    }
}
exports.ParseType = ParseType;
//# sourceMappingURL=type_parser.js.map