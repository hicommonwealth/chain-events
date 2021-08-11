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
const types_1 = require("./types");
const subscribeFunc_1 = require("./subscribeFunc");
const interfaces_1 = require("../../interfaces");
const index_1 = require("../../index");
const processor_1 = require("./processor");
const subscriber_1 = require("./subscriber");
const Listener_1 = require("../../Listener");
const logging_1 = require("../../logging");
const log = logging_1.factory.getLogger(logging_1.formatFilename(__filename));
class Listener extends Listener_1.Listener {
    constructor(chain, tokenAddresses, url, tokenNames, verbose, ignoreChainType) {
        super(chain, verbose);
        if (!ignoreChainType && !interfaces_1.chainSupportedBy(this._chain, types_1.EventChains))
            throw new Error(`${chain} is not an ERC20 token`);
        this._options = {
            url: url || index_1.networkUrls[chain],
            tokenAddresses: tokenAddresses,
        };
        this._tokenNames = tokenNames;
        this._subscribed = false;
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this._api = yield subscribeFunc_1.createApi(this._options.url, this._options.tokenAddresses, 10000, this._tokenNames);
            }
            catch (error) {
                log.error(`[${this._chain}]: Fatal error occurred while starting the API`);
                throw error;
            }
            try {
                this._processor = new processor_1.Processor(this._api);
                this._subscriber = new subscriber_1.Subscriber(this._api, this._chain, this._verbose);
            }
            catch (error) {
                log.error(`[${this._chain}]: Fatal error occurred while starting the Processor and Subscriber`);
                throw error;
            }
        });
    }
    subscribe() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._subscriber) {
                log.info(`[${this._chain}]: Subscriber isn't initialized. Please run init() first!`);
                return;
            }
            try {
                log.info(`[${this._chain}]: Subscribing to the following token(s): ${this._tokenNames || '[token names not given!]'}, on url ${this._options.url}`);
                yield this._subscriber.subscribe(this.processBlock.bind(this));
                this._subscribed = true;
            }
            catch (error) {
                log.error(`[${this._chain}]: Subscription error: ${error.message}`);
            }
        });
    }
    updateTokenList(tokenAddresses) {
        return __awaiter(this, void 0, void 0, function* () {
            this._options.tokenAddresses = tokenAddresses;
            yield this.init();
            if (this._subscribed === true)
                yield this.subscribe();
        });
    }
    // override handleEvent to stop the chain from being added to event data
    // since the chain/token name is added to event data in the subscriber.ts
    // (since there are multiple tokens)
    handleEvent(event) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let prevResult;
            for (const key in this.eventHandlers) {
                const eventHandler = this.eventHandlers[key];
                if (this.globalExcludedEvents.includes(event.data.kind) ||
                    ((_a = eventHandler.excludedEvents) === null || _a === void 0 ? void 0 : _a.includes(event.data.kind)))
                    continue;
                try {
                    prevResult = yield eventHandler.handler.handle(event, prevResult);
                }
                catch (err) {
                    log.error(`Event handle failure: ${err.message}`);
                    break;
                }
            }
        });
    }
    processBlock(event, tokenName) {
        return __awaiter(this, void 0, void 0, function* () {
            const cwEvents = yield this._processor.process(event);
            // process events in sequence
            for (const event of cwEvents) {
                event.chain = tokenName;
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