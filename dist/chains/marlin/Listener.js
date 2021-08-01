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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Listener = void 0;
const types_1 = require("./types");
const subscribeFunc_1 = require("./subscribeFunc");
const interfaces_1 = require("../../interfaces");
const index_1 = require("../../index");
const processor_1 = require("./processor");
const storageFetcher_1 = require("./storageFetcher");
const web3_1 = __importDefault(require("web3"));
const subscriber_1 = require("./subscriber");
const ethereum_block_by_date_1 = __importDefault(require("ethereum-block-by-date"));
const Listener_1 = require("../../Listener");
class Listener extends Listener_1.Listener {
    constructor(chain, contractAddresses, url, skipCatchup, verbose) {
        super(chain, verbose);
        if (!interfaces_1.chainSupportedBy(this._chain, types_1.EventChains))
            throw new Error(`${this._chain} is not a Substrate chain`);
        this._options = {
            url: url || index_1.networkUrls[chain],
            skipCatchup: !!skipCatchup,
            contractAddresses,
        };
        this._subscribed = false;
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this._api = yield subscribeFunc_1.createApi(this._options.url, this._options.contractAddresses);
            }
            catch (error) {
                console.error('Fatal error occurred while starting the API');
                throw error;
            }
            try {
                this._processor = new processor_1.Processor(this._api);
                this._subscriber = yield new subscriber_1.Subscriber(this._api, this._chain, this._verbose);
            }
            catch (error) {
                console.error('Fatal error occurred while starting the Processor, and Subscriber');
                throw error;
            }
            try {
                const web3 = new web3_1.default(this._api.comp.provider
                    ._web3Provider);
                const dater = new ethereum_block_by_date_1.default(web3);
                this._storageFetcher = new storageFetcher_1.StorageFetcher(this._api, dater);
            }
            catch (error) {
                console.error('Fatal error occurred while starting the Ethereum dater and storage fetcher');
                throw error;
            }
        });
    }
    subscribe() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._subscriber) {
                console.log(`Subscriber for ${this._chain} isn't initialized. Please run init() first!`);
                return;
            }
            // processed blocks missed during downtime
            if (!this._options.skipCatchup)
                yield this.processMissedBlocks();
            else
                console.log('Skipping event catchup on startup!');
            try {
                console.info(`Subscribing to Marlin contract: ${this._chain}, on url ${this._options.url}`);
                yield this._subscriber.subscribe(this.processBlock.bind(this));
                this._subscribed = true;
            }
            catch (error) {
                console.error(`Subscription error: ${error.message}`);
            }
        });
    }
    updateContractAddress(contractName, address) {
        return __awaiter(this, void 0, void 0, function* () {
            if (contractName != ('comp' || 'governorAlpha' || 'timelock')) {
                console.log('Contract is not supported');
                return;
            }
            switch (contractName) {
                case 'comp':
                    this._options.contractAddresses.comp = address;
                    break;
                case 'governorAlpha':
                    this._options.contractAddresses.governorAlpha = address;
                    break;
                case 'timelock':
                    this._options.contractAddresses.timelock = address;
                    break;
            }
            yield this.init();
            if (this._subscribed === true)
                yield this.subscribe();
        });
    }
    processBlock(event) {
        return __awaiter(this, void 0, void 0, function* () {
            const cwEvents = yield this._processor.process(event);
            // process events in sequence
            for (const event of cwEvents)
                yield this.handleEvent(event);
        });
    }
    processMissedBlocks(discoverReconnectRange) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!discoverReconnectRange) {
                console.warn('No function to discover offline time found, skipping event catchup.');
                return;
            }
            console.info(`Fetching missed events since last startup of ${this._chain}...`);
            let offlineRange;
            try {
                offlineRange = yield discoverReconnectRange();
                if (!offlineRange) {
                    console.warn('No offline range found, skipping event catchup.');
                    return;
                }
            }
            catch (e) {
                console.error(`Could not discover offline range: ${e.message}. Skipping event catchup.`);
                return;
            }
            try {
                const cwEvents = yield this._storageFetcher.fetch(offlineRange);
                for (const event of cwEvents) {
                    yield this.handleEvent(event);
                }
            }
            catch (error) {
                console.error(`Unable to fetch events from storage: ${error.message}`);
            }
        });
    }
    get lastBlockNumber() {
        return this._lastBlockNumber;
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