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
const Listener_1 = require("../../Listener");
const types_1 = require("./types");
const subscribeFunc_1 = require("./subscribeFunc");
const interfaces_1 = require("../../interfaces");
const index_1 = require("../../index");
const subscriber_1 = require("./subscriber");
const processor_1 = require("./processor");
const storageFetcher_1 = require("./storageFetcher");
const logging_1 = require("../../logging");
const log = logging_1.factory.getLogger(logging_1.formatFilename(__filename));
class Listener extends Listener_1.Listener {
    constructor(chain, govContractAddress, url, skipCatchup, verbose, ignoreChainType, discoverReconnectRange) {
        super(chain, verbose);
        if (!ignoreChainType && !interfaces_1.chainSupportedBy(this._chain, types_1.EventChains))
            throw new Error(`${this._chain} is not an Aave chain`);
        this._options = {
            url: url || index_1.networkUrls[chain],
            govContractAddress,
            skipCatchup: !!skipCatchup,
        };
        this.discoverReconnectRange = discoverReconnectRange;
        this._subscribed = false;
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this._api = yield subscribeFunc_1.createApi(this._options.url, this._options.govContractAddress);
            }
            catch (error) {
                log.error(`[${this._chain}]: Fatal error occurred while starting the API`);
                throw error;
            }
            try {
                this._processor = new processor_1.Processor(this._api);
                this._subscriber = new subscriber_1.Subscriber(this._api, this._chain, this._verbose);
                this.storageFetcher = new storageFetcher_1.StorageFetcher(this._api);
            }
            catch (error) {
                log.error(`[${this._chain}]: Fatal error occurred while starting the Processor, StorageFetcher and Subscriber`);
                throw error;
            }
        });
    }
    subscribe() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._subscriber) {
                log.info(`Subscriber for ${this._chain} isn't initialized. Please run init() first!`);
                return;
            }
            if (!this.options.skipCatchup)
                yield this.processMissedBlocks();
            else
                log.info(`[${this._chain}]: Skipping event catchup!`);
            try {
                log.info(`[${this._chain}]: Subscribing to Aave contract: ${this._chain}, on url ${this._options.url}`);
                yield this._subscriber.subscribe(this.processBlock.bind(this));
                this._subscribed = true;
            }
            catch (error) {
                log.error(`[${this._chain}]: Subscription error: ${error.message}`);
            }
        });
    }
    updateAddress() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    processMissedBlocks() {
        return __awaiter(this, void 0, void 0, function* () {
            log.info(`[${this._chain}]: Detected offline time, polling missed blocks...`);
            if (!this.discoverReconnectRange) {
                log.info(`[${this._chain}]: Unable to determine offline range - No discoverReconnectRange function given`);
            }
            let offlineRange;
            try {
                offlineRange = yield this.discoverReconnectRange(this._chain);
                if (!offlineRange) {
                    log.warn(`[${this._chain}]: No offline range found, skipping event catchup.`);
                    return;
                }
            }
            catch (error) {
                log.error(`[${this._chain}]: Could not discover offline range: ${error.message}. Skipping event catchup.`);
                return;
            }
            if (!offlineRange || !offlineRange.startBlock) {
                log.warn(`[${this._chain}]: Unable to determine offline time range.`);
                return;
            }
            try {
                const cwEvents = yield this.storageFetcher.fetch(offlineRange);
                for (const event of cwEvents) {
                    yield this.handleEvent(event);
                }
            }
            catch (error) {
                log.error(`[${this._chain}]: Unable to fetch events from storage: ${error.message}`);
            }
        });
    }
    processBlock(event) {
        return __awaiter(this, void 0, void 0, function* () {
            const cwEvents = yield this._processor.process(event);
            for (const event of cwEvents) {
                yield this.handleEvent(event);
            }
        });
    }
    get chain() {
        return this._chain;
    }
    get options() {
        return this._options;
    }
    get subscribed() {
        return this._subscribed;
    }
}
exports.Listener = Listener;
//# sourceMappingURL=Listener.js.map