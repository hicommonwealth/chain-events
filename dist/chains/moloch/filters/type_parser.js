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
            logging_1.default.warn(`Unknown Moloch event name: ${name}!`);
            return null;
        }
    }
}
exports.ParseType = ParseType;
//# sourceMappingURL=type_parser.js.map