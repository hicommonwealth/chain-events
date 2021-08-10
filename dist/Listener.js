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
const logging_1 = __importDefault(require("./logging"));
// TODO: processBlock + processMissedBlocks can both be generalized and override in edge case listeners
// TODO: subscribe method can be implemented here and override in edge case (or even use super.subscribe())
class Listener {
    constructor(chain, verbose) {
        this._chain = chain;
        this.eventHandlers = {};
        this._verbose = !!verbose;
        this.globalExcludedEvents = [];
    }
    unsubscribe() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._subscriber) {
                logging_1.default.warn(`Subscriber for ${this._chain} isn't initialized. Please run init() first!`);
                return;
            }
            if (!this._subscribed) {
                logging_1.default.warn(`The listener for ${this._chain} is not subscribed`);
                return;
            }
            this._subscriber.unsubscribe();
            this._subscribed = false;
        });
    }
    handleEvent(event) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let prevResult;
            event.chain = this._chain;
            event.received = Date.now();
            for (const key in this.eventHandlers) {
                const eventHandler = this.eventHandlers[key];
                if (this.globalExcludedEvents.includes(event.data.kind) ||
                    ((_a = eventHandler.excludedEvents) === null || _a === void 0 ? void 0 : _a.includes(event.data.kind)))
                    continue;
                try {
                    prevResult = yield eventHandler.handler.handle(event, prevResult);
                }
                catch (err) {
                    logging_1.default.error(`Event handle failure: ${err.message}`);
                    break;
                }
            }
        });
    }
    get chain() {
        return this._chain;
    }
    get subscribed() {
        return this._subscribed;
    }
}
exports.Listener = Listener;
//# sourceMappingURL=Listener.js.map