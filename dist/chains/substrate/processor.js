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
exports.Processor = void 0;
const interfaces_1 = require("../../interfaces");
const logging_1 = require("../../logging");
const types_1 = require("./types");
const type_parser_1 = require("./filters/type_parser");
const enricher_1 = require("./filters/enricher");
const log = logging_1.factory.getLogger(logging_1.formatFilename(__filename));
class Processor extends interfaces_1.IEventProcessor {
    constructor(_api, _enricherConfig = {}) {
        super(_api);
        this._api = _api;
        this._enricherConfig = _enricherConfig;
    }
    get lastBlockNumber() {
        return this._lastBlockNumber;
    }
    /**
     * Parse events out of an substrate block and standardizes their format
     * for processing.
     *
     * @param block the block received for processing
     * @returns an array of processed events
     */
    process(block) {
        return __awaiter(this, void 0, void 0, function* () {
            // cache block number if needed for disconnection purposes
            const blockNumber = +block.header.number;
            if (!this._lastBlockNumber || blockNumber > this._lastBlockNumber) {
                this._lastBlockNumber = blockNumber;
            }
            const applyFilters = (data) => __awaiter(this, void 0, void 0, function* () {
                const kind = types_1.isEvent(data)
                    ? type_parser_1.ParseType(block.versionName, block.versionNumber, data.section, data.method)
                    : type_parser_1.ParseType(block.versionName, block.versionNumber, data.method.section, data.method.method);
                if (kind !== null) {
                    try {
                        const result = yield enricher_1.Enrich(this._api, blockNumber, kind, data, this._enricherConfig);
                        return result;
                    }
                    catch (e) {
                        log.error(`Event enriching failed for ${kind}`);
                        log.error(`Error: ${e}`);
                        return null;
                    }
                }
                else {
                    return null;
                }
            });
            const events = yield Promise.all(block.events.map(({ event }) => applyFilters(event)));
            // remove unsuccessful extrinsics, only keep extrinsics that map to ExtrinsicSuccess events
            // cf: https://polkadot.js.org/docs/api/cookbook/blocks#how-do-i-map-extrinsics-to-their-events
            const successfulExtrinsics = block.extrinsics.filter((_extrinsic, index) => {
                const extrinsicEvents = block.events.filter((event) => event.phase &&
                    event.phase.isApplyExtrinsic &&
                    +event.phase.asApplyExtrinsic === index);
                // if the extrinsic involves any "success" events, then we keep it -- it may involve more than
                // that, though, as the result will list *all* events generated as a result of the extrinsic
                return (extrinsicEvents.findIndex((e) => e.event.method === 'ExtrinsicSuccess') !== -1);
            });
            const processedExtrinsics = yield Promise.all(successfulExtrinsics.map((extrinsic) => applyFilters(extrinsic)));
            return [...events, ...processedExtrinsics].filter((e) => !!e); // remove null / unwanted events
        });
    }
}
exports.Processor = Processor;
