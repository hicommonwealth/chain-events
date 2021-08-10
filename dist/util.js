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
exports.createListener = void 0;
const interfaces_1 = require("./interfaces");
const types_1 = require("./chains/substrate/types");
const Listener_1 = require("./chains/substrate/Listener");
const types_2 = require("./chains/moloch/types");
const Listener_2 = require("./chains/moloch/Listener");
const types_3 = require("./chains/marlin/types");
const Listener_3 = require("./chains/marlin/Listener");
const types_4 = require("./chains/erc20/types");
const Listener_4 = require("./chains/erc20/Listener");
const types_5 = require("./chains/aave/types");
const Listener_5 = require("./chains/aave/Listener");
const index_1 = require("./index");
const logging_1 = __importDefault(require("./logging"));
/**
 * Creates a listener instance and returns it if not error occurs. This function throws on error.
 * @param chain The chain the listener is for
 * @param options The listener options for the specified chain
 * @param ignoreChainType If set to true the function will create the appropriate listener regardless of whether chain is listed in supported EventChains type.
 * @param customChainBase Used with ignoreChainType to override the base system the chain is from (i.e. substrate/cosmos/etc)
 */
function createListener(chain, options, ignoreChainType, customChainBase) {
    return __awaiter(this, void 0, void 0, function* () {
        let listener;
        if (ignoreChainType && !customChainBase)
            throw new Error('customChainBase must be set when ignoreChainType is true!');
        function basePicker(chain, base) {
            if (ignoreChainType && customChainBase == base)
                return true;
            else {
                switch (base) {
                    case 'substrate':
                        return interfaces_1.chainSupportedBy(chain, types_1.EventChains);
                    case 'moloch':
                        return interfaces_1.chainSupportedBy(chain, types_2.EventChains);
                    case 'marlin':
                        return interfaces_1.chainSupportedBy(chain, types_3.EventChains);
                    case 'erc20':
                        return interfaces_1.chainSupportedBy(chain, types_4.EventChains);
                    case 'aave':
                        return interfaces_1.chainSupportedBy(chain, types_5.EventChains);
                }
            }
        }
        if (basePicker(chain, 'substrate')) {
            // start a substrate listener
            listener = new Listener_1.Listener(chain, options.url || index_1.networkUrls[chain], options.spec || index_1.networkSpecs[chain] || {}, !!options.archival, options.startBlock || 0, !!options.skipCatchup, options.enricherConfig || {}, !!options.verbose, !!ignoreChainType, options.discoverReconnectRange);
        }
        else if (basePicker(chain, 'moloch')) {
            listener = new Listener_2.Listener(chain, options.MolochContractVersion == 1 || options.MolochContractVersion == 2
                ? options.MolochContractVersion
                : 2, options.address || index_1.molochContracts[chain], options.url || index_1.networkUrls[chain], !!options.skipCatchup, !!options.verbose);
        }
        else if (basePicker(chain, 'marlin')) {
            listener = new Listener_3.Listener(chain, options.address, options.url || index_1.networkUrls[chain], !!options.skipCatchup, !!options.verbose);
        }
        else if (basePicker(chain, 'erc20')) {
            listener = new Listener_4.Listener(chain, options.tokenAddresses || [options.address], options.url || 'wss://mainnet.infura.io/ws/v3/', // ethNetowrkUrl aka the access point to ethereum (usually Infura)
            Array.isArray(options.tokenNames) ? options.tokenNames : undefined, !!options.verbose, !!ignoreChainType);
        }
        else if (basePicker(chain, 'aave')) {
            listener = new Listener_5.Listener(chain, options.address, options.url, !!options.skipCatchup, !!options.verbose, !!ignoreChainType, options.discoverReconnectRange);
        }
        else {
            throw new Error('The chain did not match any known supported chain or the given customBase');
        }
        try {
            if (!listener)
                throw new Error('An unknown error occurred while starting the listener');
            yield listener.init();
        }
        catch (error) {
            logging_1.default.error(`[${chain}]: Failed to initialize the listener`);
            throw error;
        }
        return listener;
    });
}
exports.createListener = createListener;
//# sourceMappingURL=util.js.map