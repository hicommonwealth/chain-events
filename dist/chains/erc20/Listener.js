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
const subscriber_1 = require("./subscriber");
const Listener_1 = require("../../Listener");
const logging_1 = __importDefault(require("../../logging"));
class Listener extends Listener_1.Listener {
    constructor(chain, tokenAddresses, url, verbose, ignoreChainType) {
        super(chain, verbose);
        if (!ignoreChainType && !interfaces_1.chainSupportedBy(this._chain, types_1.EventChains))
            throw new Error(`${chain} is not an ERC20 token`);
        this._options = {
            url: url || index_1.networkUrls[chain],
            tokenAddresses: tokenAddresses,
        };
        this._subscribed = false;
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this._api = yield subscribeFunc_1.createApi(this._options.url, this._options.tokenAddresses);
            }
            catch (error) {
                logging_1.default.error('Fatal error occurred while starting the API');
                throw error;
            }
            try {
                this._processor = new processor_1.Processor(this._api);
                this._subscriber = new subscriber_1.Subscriber(this._api, this._chain, this._verbose);
            }
            catch (error) {
                logging_1.default.error('Fatal error occurred while starting the Processor and Subscriber');
                throw error;
            }
        });
    }
    subscribe() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._subscriber) {
                logging_1.default.info(`Subscriber for ${this._chain} isn't initialized. Please run init() first!`);
                return;
            }
            try {
                logging_1.default.info(`Subscribing to ERC20 contracts: ${this._chain}, on url ${this._options.url}`);
                yield this._subscriber.subscribe(this.processBlock.bind(this));
                this._subscribed = true;
            }
            catch (error) {
                logging_1.default.error(`Subscription error: ${error.message}`);
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
    processBlock(event) {
        return __awaiter(this, void 0, void 0, function* () {
            const cwEvents = yield this._processor.process(event);
            // process events in sequence
            for (const event of cwEvents)
                yield this.handleEvent(event);
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