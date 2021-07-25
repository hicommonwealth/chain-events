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
exports.subscribeEvents = exports.createApi = void 0;
const ethers_1 = require("ethers");
const web3_1 = __importDefault(require("web3"));
const ethereum_block_by_date_1 = __importDefault(require("ethereum-block-by-date"));
const sleep_promise_1 = __importDefault(require("sleep-promise"));
const logging_1 = require("../../logging");
const Moloch1Factory_1 = require("./contractTypes/Moloch1Factory");
const Moloch2Factory_1 = require("./contractTypes/Moloch2Factory");
const subscriber_1 = require("./subscriber");
const processor_1 = require("./processor");
const storageFetcher_1 = require("./storageFetcher");
const log = logging_1.factory.getLogger(logging_1.formatFilename(__filename));
/**
 * Attempts to open an API connection, retrying if it cannot be opened.
 * @returns a promise resolving to an ApiPromise once the connection has been established
 * @param ethNetworkUrl
 * @param contractVersion
 * @param contractAddress
 * @param retryTimeMs
 */
function createApi(ethNetworkUrl, contractVersion, contractAddress, retryTimeMs = 10 * 1000) {
    return __awaiter(this, void 0, void 0, function* () {
        if (ethNetworkUrl.includes('infura')) {
            if (process && process.env) {
                const { INFURA_API_KEY } = process.env;
                if (!INFURA_API_KEY) {
                    throw new Error('no infura key found!');
                }
                ethNetworkUrl = `wss://mainnet.infura.io/ws/v3/${INFURA_API_KEY}`;
            }
            else {
                throw new Error('must use nodejs to connect to infura provider!');
            }
        }
        try {
            const web3Provider = new web3_1.default.providers.WebsocketProvider(ethNetworkUrl, {
                reconnect: {
                    auto: true,
                    delay: retryTimeMs,
                    onTimeout: true,
                },
            });
            const provider = new ethers_1.providers.Web3Provider(web3Provider);
            const contract = contractVersion === 1
                ? Moloch1Factory_1.Moloch1Factory.connect(contractAddress, provider)
                : Moloch2Factory_1.Moloch2Factory.connect(contractAddress, provider);
            yield contract.deployed();
            // fetch summoning time to guarantee connected
            yield contract.summoningTime();
            log.info('Connection successful!');
            return contract;
        }
        catch (err) {
            log.error(`Moloch ${contractAddress} at ${ethNetworkUrl} failure: ${err.message}`);
            yield sleep_promise_1.default(retryTimeMs);
            log.error('Retrying connection...');
            return createApi(ethNetworkUrl, contractVersion, contractAddress, retryTimeMs);
        }
    });
}
exports.createApi = createApi;
/**
 * This is the main function for edgeware event handling. It constructs a connection
 * to the chain, connects all event-related modules, and initializes event handling.
 *
 *                    emitted during downtime.
 * @returns An active block subscriber.
 * @param options
 */
const subscribeEvents = (options) => __awaiter(void 0, void 0, void 0, function* () {
    const { chain, api, handlers, skipCatchup, discoverReconnectRange, contractVersion, verbose, } = options;
    // helper function that sends an event through event handlers
    const handleEventFn = (event) => __awaiter(void 0, void 0, void 0, function* () {
        let prevResult = null;
        for (const handler of handlers) {
            try {
                event.chain = chain;
                event.received = Date.now();
                // pass result of last handler into next one (chaining db events)
                prevResult = yield handler.handle(event, prevResult);
            }
            catch (err) {
                log.error(`Event handle failure: ${err.message}`);
                break;
            }
        }
    });
    // helper function that sends a block through the event processor and
    // into the event handlers
    const processor = new processor_1.Processor(api, contractVersion);
    const processEventFn = (event) => __awaiter(void 0, void 0, void 0, function* () {
        // retrieve events from block
        const cwEvents = yield processor.process(event);
        // process events in sequence
        for (const cwEvent of cwEvents) {
            yield handleEventFn(cwEvent);
        }
    });
    const subscriber = new subscriber_1.Subscriber(api, chain, verbose);
    // helper function that runs after we've been offline/the server's been down,
    // and attempts to fetch skipped events
    const pollMissedEventsFn = () => __awaiter(void 0, void 0, void 0, function* () {
        if (!discoverReconnectRange) {
            log.warn('No function to discover offline time found, skipping event catchup.');
            return;
        }
        log.info(`Fetching missed events since last startup of ${chain}...`);
        let offlineRange;
        try {
            offlineRange = yield discoverReconnectRange();
            if (!offlineRange) {
                log.warn('No offline range found, skipping event catchup.');
                return;
            }
        }
        catch (e) {
            log.error(`Could not discover offline range: ${e.message}. Skipping event catchup.`);
            return;
        }
        // reuse provider interface for dater function
        const web3 = new web3_1.default(api.provider._web3Provider);
        const dater = new ethereum_block_by_date_1.default(web3);
        const fetcher = new storageFetcher_1.StorageFetcher(api, contractVersion, dater);
        try {
            const cwEvents = yield fetcher.fetch(offlineRange);
            // process events in sequence
            for (const cwEvent of cwEvents) {
                yield handleEventFn(cwEvent);
            }
        }
        catch (e) {
            log.error(`Unable to fetch events from storage: ${e.message}`);
        }
    });
    if (!skipCatchup) {
        yield pollMissedEventsFn();
    }
    else {
        log.info('Skipping event catchup on startup!');
    }
    try {
        log.info(`Subscribing to Moloch contract ${chain}...`);
        yield subscriber.subscribe(processEventFn);
    }
    catch (e) {
        log.error(`Subscription error: ${e.message}`);
    }
    return subscriber;
});
exports.subscribeEvents = subscribeEvents;
