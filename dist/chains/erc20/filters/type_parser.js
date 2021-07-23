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
function ParseType(name) {
    switch (name) {
        // ERC20 Events
        case 'Approval':
            return types_1.EventKind.Approval;
        case 'Transfer':
            return types_1.EventKind.Transfer;
        default: {
            log.warn(`Unknown Erc20 event name: ${name}!`);
            return null;
        }
    }
}
exports.ParseType = ParseType;
