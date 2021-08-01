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
exports.Subscriber = void 0;
const sleep_promise_1 = __importDefault(require("sleep-promise"));
const interfaces_1 = require("../../interfaces");
const logging_1 = require("../../logging");
const Erc20Factory_1 = require("./contractTypes/Erc20Factory");
const log = logging_1.factory.getLogger(logging_1.formatFilename(__filename));
class Subscriber extends interfaces_1.IEventSubscriber {
    constructor(api, name, verbose = false) {
        super(api, verbose);
        this._name = name;
    }
    /**
     * Initializes subscription to chain and starts emitting events.
     */
    subscribe(cb) {
        return __awaiter(this, void 0, void 0, function* () {
            this._listener = (event) => {
                const logStr = `Received ${this._name} event: ${JSON.stringify(event, null, 2)}.`;
                // eslint-disable-next-line no-unused-expressions
                this._verbose ? log.info(logStr) : log.trace(logStr);
                cb(event);
            };
            this._api.tokens.forEach((o) => o.addListener('*', this._listener));
        });
    }
    unsubscribe() {
        if (this._listener) {
            this._api.tokens.forEach((o) => o.removeListener('*', this._listener));
            this._listener = null;
        }
    }
    addNewToken(tokenAddress, retryTimeMs = 10 * 1000, retries = 5) {
        return __awaiter(this, void 0, void 0, function* () {
            const existingToken = this.api.tokens.find((o) => {
                return o.address === tokenAddress;
            });
            if (existingToken) {
                log.info('Token is already being monitored');
                return;
            }
            try {
                const contract = yield Erc20Factory_1.Erc20Factory.connect(tokenAddress, this.api.provider);
                yield contract.deployed();
                contract.addListener('*', this._listener);
                this.api.tokens.push(contract);
            }
            catch (e) {
                yield sleep_promise_1.default(retryTimeMs);
                if (retries > 0) {
                    log.error('Retrying connection...');
                    this.addNewToken(tokenAddress, retryTimeMs, retries - 1);
                }
            }
        });
    }
}
exports.Subscriber = Subscriber;
//# sourceMappingURL=subscriber.js.map