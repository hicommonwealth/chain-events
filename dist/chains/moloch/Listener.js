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
const interfaces_1 = require("../../interfaces");
const index_1 = require("../../index");
const types_1 = require("../moloch/types");
const moloch_1 = require("../moloch");
const ethereum_block_by_date_1 = __importDefault(require("ethereum-block-by-date"));
const web3_1 = __importDefault(require("web3"));
const Listener_1 = require("../../Listener");
class Listener extends Listener_1.Listener {
    constructor(chain, contractVersion, contractAddress, url, skipCatchup, verbose) {
        super(chain, verbose);
        if (!interfaces_1.chainSupportedBy(this._chain, types_1.EventChains))
            throw new Error(`${this._chain} is not a moloch network`);
        this._options = {
            url: url || index_1.networkUrls[chain],
            skipCatchup: !!skipCatchup,
            contractAddress: contractAddress,
            contractVersion: contractVersion,
        };
        this._subscribed = false;
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this._api = yield moloch_1.createApi(this._options.url, this._options.contractVersion, this._options.contractAddress);
            }
            catch (error) {
                console.error('Fatal error occurred while starting the API');
                throw error;
            }
            try {
                this._processor = new moloch_1.Processor(this._api, this._options.contractVersion);
                this._subscriber = yield new moloch_1.Subscriber(this._api, this._chain, this._verbose);
            }
            catch (error) {
                console.error('Fatal error occurred while starting the Processor, and Subscriber');
                throw error;
            }
            try {
                const web3 = new web3_1.default(this._api.provider._web3Provider);
                const dater = new ethereum_block_by_date_1.default(web3);
                this._storageFetcher = new moloch_1.StorageFetcher(this._api, this._options.contractVersion, dater);
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
                console.info(`Subscribing Moloch contract: ${this._chain}, on url ${this._options.url}`);
                yield this._subscriber.subscribe(this.processBlock.bind(this));
                this._subscribed = true;
            }
            catch (error) {
                console.error(`Subscription error: ${error.message}`);
            }
        });
    }
    processBlock(event) {
        return __awaiter(this, void 0, void 0, function* () {
            const cwEvents = yield this._processor.process(event);
            // process events in sequence
            for (const cwEvent of cwEvents)
                yield this.handleEvent(cwEvent);
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
                // process events in sequence
                for (const event of cwEvents) {
                    yield this.handleEvent(event);
                }
            }
            catch (e) {
                console.error(`Unable to fetch events from storage: ${e.message}`);
            }
        });
    }
    updateContractVersion(version) {
        return __awaiter(this, void 0, void 0, function* () {
            if (version === this._options.contractVersion) {
                console.log(`The contract version is already set to ${version}`);
                return;
            }
            this._options.contractVersion = version;
            yield this.init();
            // only subscribe if the listener was already subscribed before the version change
            if (this._subscribed === true)
                yield this.subscribe();
        });
    }
    updateContractAddress(address) {
        return __awaiter(this, void 0, void 0, function* () {
            if (address === this._options.contractAddress) {
                console.log(`The contract address is already set to ${address}`);
                return;
            }
            this._options.contractAddress = address;
            yield this.init();
            if (this._subscribed === true)
                yield this.subscribe();
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