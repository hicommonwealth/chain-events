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
const sleep_promise_1 = __importDefault(require("sleep-promise"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const logging_1 = require("../../logging");
const Erc20Factory_1 = require("./contractTypes/Erc20Factory");
const subscriber_1 = require("./subscriber");
const processor_1 = require("./processor");
const log = logging_1.factory.getLogger(logging_1.formatFilename(__filename));
/**
 * Attempts to open an API connection, retrying if it cannot be opened.
 * @returns a promise resolving to an ApiPromise once the connection has been established
 * @param ethNetworkUrl
 * @param tokenAddresses
 * @param retryTimeMs
 * @param retryCount
 */
function createApi(ethNetworkUrl, tokenAddresses, retryTimeMs = 10 * 1000, retryCount = 0) {
    return __awaiter(this, void 0, void 0, function* () {
        // TODO: are if statements here necessary?
        if (ethNetworkUrl.includes('infura')) {
            if (process && process.env) {
                const { INFURA_API_KEY } = process.env;
                if (!INFURA_API_KEY) {
                    throw new Error('no infura key found!');
                }
                ethNetworkUrl = `wss://mainnet.infura.io/ws/v3/${INFURA_API_KEY}`;
                let res, data;
                try {
                    res = yield node_fetch_1.default(`https://mainnet.infura.io/v3/${INFURA_API_KEY}`, {
                        method: 'POST',
                        body: JSON.stringify({
                            jsonrpc: '2.0',
                            method: 'eth_getBalance',
                            params: ['0xBf4eD7b27F1d666546E30D74d50d173d20bca754', 'latest'],
                            id: 1,
                        }),
                        headers: { 'Content-Type': 'application/json' },
                    });
                    data = yield res.json();
                    if (!data ||
                        !Object.keys(data).includes('jsonrpc') ||
                        !Object.keys(data).includes('id') ||
                        !Object.keys(data).includes('result'))
                        throw new Error('A connection to infura could not be established.');
                }
                catch (error) {
                    log.error('Check your INFURA_API_KEY');
                    throw error;
                }
            }
            else
                throw new Error('must use nodejs to connect to infura provider!');
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
            const tokenContracts = tokenAddresses.map((o) => Erc20Factory_1.Erc20Factory.connect(o, provider));
            const deployResults = yield Promise.all(tokenContracts.map((o) => o
                .deployed()
                .then(() => {
                return { token: o, deployed: true };
            })
                .catch((err) => {
                log.error('Failed to deploy', err);
                return { token: o, deployed: false };
            })));
            const result = deployResults.filter((o) => o.deployed).map((o) => o.token);
            log.info('Connection successful!');
            return { tokens: result, provider };
        }
        catch (err) {
            log.error(`Erc20 at ${ethNetworkUrl} failure: ${err.message}`);
            if (retryCount < 3) {
                yield sleep_promise_1.default(retryTimeMs);
                log.error('Retrying connection...');
                return createApi(ethNetworkUrl, tokenAddresses, retryTimeMs, ++retryCount);
            }
            else
                throw new Error(`Failed to start the ERC20 listener for ${tokenAddresses} at ${ethNetworkUrl}`);
        }
    });
}
exports.createApi = createApi;
/**
 * This is the main function for edgeware event handling. It constructs a connection
 * to the chain, connects all event-related modules, and initializes event handling.
 * @param options
 * @returns An active block subscriber.
 */
const subscribeEvents = (options) => __awaiter(void 0, void 0, void 0, function* () {
    const { chain, api, handlers, verbose } = options;
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
    const processor = new processor_1.Processor(api);
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
    try {
        log.info(`Subscribing to ERC20 contracts ${chain}...`);
        yield subscriber.subscribe(processEventFn);
    }
    catch (e) {
        log.error(`Subscription error: ${e.message}`);
    }
    return subscriber;
});
exports.subscribeEvents = subscribeEvents;
//# sourceMappingURL=subscribeFunc.js.map