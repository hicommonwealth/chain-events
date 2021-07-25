"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParseType = void 0;
const types_1 = require("../types");
const logging_1 = require("../../../logging");
const log = logging_1.factory.getLogger(logging_1.formatFilename(__filename));
/**
 * This is the Type Parser function, which takes a raw Event
 * and determines which of our local event kinds it belongs to.
 */
function ParseType(version, name) {
    switch (name) {
        case 'SubmitProposal':
            return types_1.EventKind.SubmitProposal;
        case 'SubmitVote':
            return types_1.EventKind.SubmitVote;
        case 'ProcessProposal':
            return types_1.EventKind.ProcessProposal;
        case 'Ragequit':
            return types_1.EventKind.Ragequit;
        case 'Abort':
            return types_1.EventKind.Abort;
        case 'UpdateDelegateKey':
            return types_1.EventKind.UpdateDelegateKey;
        case 'SummonComplete':
            return types_1.EventKind.SummonComplete;
        default: {
            log.warn(`Unknown Moloch event name: ${name}!`);
            return null;
        }
    }
}
exports.ParseType = ParseType;
