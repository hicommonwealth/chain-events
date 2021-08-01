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
function Enrich(api, blockNumber, kind, rawData, config = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        switch (kind) {
            case types_1.EventKind.Approval: {
                const { owner, spender, value } = rawData.args;
                const contractAddress = rawData.address;
                return {
                    blockNumber,
                    data: {
                        kind,
                        owner,
                        spender,
                        value,
                        contractAddress,
                    },
                };
            }
            case types_1.EventKind.Transfer: {
                const { from, to, value } = rawData.args;
                const contractAddress = rawData.address;
                // only emit to everyone if transfer is 0 or above the configuration threshold
                const shouldEmitToAll = config.balanceTransferThreshold
                    ? value.gte(config.balanceTransferThreshold)
                    : false;
                const includeAddresses = shouldEmitToAll
                    ? []
                    : [from.toString(), to.toString()];
                return {
                    // should not notify sender or recipient
                    blockNumber,
                    includeAddresses,
                    data: {
                        kind,
                        from,
                        to,
                        value,
                        contractAddress,
                    },
                };
            }
            default: {
                throw new Error('unknown erc20 event kind!');
            }
        }
    });
}
exports.Enrich = Enrich;
//# sourceMappingURL=enricher.js.map