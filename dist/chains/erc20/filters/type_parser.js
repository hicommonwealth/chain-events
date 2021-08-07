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
        // ERC20 Events
        case 'Approval':
            return types_1.EventKind.Approval;
        case 'Transfer':
            return types_1.EventKind.Transfer;
        default: {
            logging_1.default.warn(`Unknown Erc20 event name: ${name}!`);
            return null;
        }
    }
}
exports.ParseType = ParseType;
//# sourceMappingURL=type_parser.js.map