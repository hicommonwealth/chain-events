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
exports.Listener = void 0;
const index_1 = require("./index");
const interfaces_1 = require("../../interfaces");
const index_2 = require("../../index");
const Listener_1 = require("../../Listener");
const types_1 = require("./types");
const logging_1 = require("../../logging");
const log = logging_1.factory.getLogger(logging_1.formatFilename(__filename));
class Listener extends Listener_1.Listener {
    constructor(chain, url, spec, archival, startBlock, skipCatchup, enricherConfig, verbose, ignoreChainType, discoverReconnectRange) {
        super(chain, verbose);
        // if ignoreChainType = true ignore the hard-coded EventChains type
        if (!ignoreChainType && !interfaces_1.chainSupportedBy(this._chain, types_1.EventChains))
            throw new Error(`${this._chain} is not a Substrate chain`);
        this._options = {
            archival: !!archival,
            startBlock: startBlock !== null && startBlock !== void 0 ? startBlock : 0,
            url: url || index_2.networkUrls[chain],
            spec: spec || index_2.networkSpecs[chain] || {},
            skipCatchup: !!skipCatchup,
            enricherConfig: enricherConfig || {},
        };
        this.discoverReconnectRange = discoverReconnectRange;
        this._subscribed = false;
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this._api = yield index_1.createApi(this._options.url, this._options.spec);
                this._api.on('connected', this.processMissedBlocks);
            }
            catch (error) {
                log.error('Fatal error occurred while starting the API');
                throw error;
            }
            try {
                this._poller = new index_1.Poller(this._api);
                this._processor = new index_1.Processor(this._api, this._options.enricherConfig);
                this._storageFetcher = new index_1.StorageFetcher(this._api);
                this._subscriber = yield new index_1.Subscriber(this._api, this._verbose);
            }
            catch (error) {
                log.error('Fatal error occurred while starting the Poller, Processor, Subscriber, and Fetcher');
                throw error;
            }
        });
    }
    subscribe() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._subscriber) {
                log.warn(`Subscriber for ${this._chain} isn't initialized. Please run init() first!`);
                return;
            }
            // processed blocks missed during downtime
            if (!this.options.skipCatchup)
                yield this.processMissedBlocks();
            else
                log.info('Skipping event catchup on startup!');
            try {
                log.info(`Subscribing to ${this._chain} on url ${this._options.url}`);
                yield this._subscriber.subscribe(this.processBlock.bind(this));
                this._subscribed = true;
            }
            catch (error) {
                log.error('Subscription error', error.message);
            }
        });
    }
    processMissedBlocks() {
        return __awaiter(this, void 0, void 0, function* () {
            log.info('Detected offline time, polling missed blocks...');
            let offlineRange;
            // first, attempt the provided range finding method if it exists
            // (this should fetch the block of the last server event from database)
            if (this.discoverReconnectRange) {
                offlineRange = yield this.discoverReconnectRange(this._chain);
            }
            // compare with default range algorithm: take last cached block in processor
            // if it exists, and is more recent than the provided algorithm
            // (note that on first run, we wont have a cached block/this wont do anything)
            if (this._lastBlockNumber &&
                (!offlineRange ||
                    !offlineRange.startBlock ||
                    offlineRange.startBlock < this._lastBlockNumber)) {
                offlineRange = { startBlock: this._lastBlockNumber };
            }
            // if we can't figure out when the last block we saw was,
            // do nothing
            // (i.e. don't try and fetch all events from block 0 onward)
            if (!offlineRange || !offlineRange.startBlock) {
                log.warn('Unable to determine offline time range.');
                return;
            }
            try {
                const blocks = yield this.getBlocks(offlineRange.startBlock, offlineRange.endBlock);
                yield Promise.all(blocks.map(this.processBlock, this));
            }
            catch (error) {
                log.error(`Block polling failed after disconnect at block ${offlineRange.startBlock}`, error);
            }
        });
    }
    getBlocks(startBlock, endBlock) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._poller.poll({ startBlock, endBlock });
        });
    }
    updateSpec(spec) {
        return __awaiter(this, void 0, void 0, function* () {
            // set the new spec
            this._options.spec = spec;
            // restart api with new spec
            yield this.init();
            if (this._subscribed === true)
                yield this.subscribe();
        });
    }
    updateUrl(url) {
        return __awaiter(this, void 0, void 0, function* () {
            this._options.url = url;
            // restart api with new url
            yield this.init();
            if (this._subscribed === true)
                yield this.subscribe();
        });
    }
    processBlock(block) {
        return __awaiter(this, void 0, void 0, function* () {
            // cache block number if needed for disconnection purposes
            const blockNumber = +block.header.number;
            if (!this._lastBlockNumber || blockNumber > this._lastBlockNumber) {
                this._lastBlockNumber = blockNumber;
            }
            const events = yield this._processor.process(block);
            for (const event of events) {
                yield this.handleEvent(event);
            }
        });
    }
    get lastBlockNumber() {
        return this._lastBlockNumber;
    }
    get options() {
        return this._options;
    }
    get storageFetcher() {
        return this._storageFetcher;
    }
}
exports.Listener = Listener;
//# sourceMappingURL=Listener.js.map