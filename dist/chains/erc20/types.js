"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventKinds = exports.Token = exports.EventKind = exports.EventChains = void 0;
exports.EventChains = ['erc20'];
// eslint-disable-next-line no-shadow
var EventKind;
(function (EventKind) {
    // Erc20 Events
    EventKind["Approval"] = "approval";
    EventKind["Transfer"] = "transfer";
})(EventKind = exports.EventKind || (exports.EventKind = {}));
// eslint-disable-next-line semi-style
class Token {
    constructor(name, symbol, address) {
        this.name = name;
        this.symbol = symbol;
        this.address = address;
    }
}
exports.Token = Token;
exports.EventKinds = Object.values(EventKind);
