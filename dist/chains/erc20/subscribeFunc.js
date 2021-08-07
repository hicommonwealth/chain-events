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
const sleep_promise_1 = __importDefault(require("sleep-promise"));
const eth_1 = require("../../eth");
const logging_1 = __importDefault(require("../../logging"));
const contractTypes_1 = require("../../contractTypes");
const subscriber_1 = require("./subscriber");
const processor_1 = require("./processor");
/**
 * Attempts to open an API connection, retrying if it cannot be opened.
 * @param ethNetworkUrl
 * @param tokenAddresses
 * @param retryTimeMs
 * @returns a promise resolving to an ApiPromise once the connection has been established

 */
function createApi(ethNetworkUrl, tokenAddresses, retryTimeMs = 10 * 1000) {
    return __awaiter(this, void 0, void 0, function* () {
        for (let i = 0; i < 3; ++i) {
            try {
                const provider = yield eth_1.createProvider(ethNetworkUrl);
                const tokenContracts = tokenAddresses.map((o) => contractTypes_1.ERC20__factory.connect(o, provider));
                const deployResults = yield Promise.all(tokenContracts.map((o) => o
                    .deployed()
                    .then(() => {
                    return { token: o, deployed: true };
                })
                    .catch((err) => {
                    logging_1.default.error('Failed to deploy', err);
                    return { token: o, deployed: false };
                })));
                const result = deployResults
                    .filter((o) => o.deployed)
                    .map((o) => o.token);
                logging_1.default.info('Connection successful!');
                return { tokens: result, provider };
            }
            catch (err) {
                logging_1.default.error(`Erc20 at ${ethNetworkUrl} failure: ${err.message}`);
                yield sleep_promise_1.default(retryTimeMs);
                logging_1.default.error('Retrying connection...');
            }
        }
        throw new Error(`Failed to start the ERC20 listener for ${tokenAddresses} at ${ethNetworkUrl}`);
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
                logging_1.default.error(`Event handle failure: ${err.message}`);
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
        logging_1.default.info(`Subscribing to ERC20 contracts ${chain}...`);
        yield subscriber.subscribe(processEventFn);
    }
    catch (e) {
        logging_1.default.error(`Subscription error: ${e.message}`);
    }
    return subscriber;
});
exports.subscribeEvents = subscribeEvents;
//# sourceMappingURL=subscribeFunc.js.map