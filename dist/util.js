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
exports.createListener = exports.getRabbitMQConfig = void 0;
const fs_1 = __importDefault(require("fs"));
const RabbitMQconfig_json_1 = __importDefault(require("./rabbitmq/RabbitMQconfig.json"));
const interfaces_1 = require("./interfaces");
const types_1 = require("./chains/substrate/types");
const substrate_1 = require("./chains/substrate");
const types_2 = require("./chains/moloch/types");
const Listener_1 = require("./chains/moloch/Listener");
const types_3 = require("./chains/marlin/types");
const Listener_2 = require("./chains/marlin/Listener");
const types_4 = require("./chains/erc20/types");
const Listener_3 = require("./chains/erc20/Listener");
const index_1 = require("./index");
// TODO: generalize this for any config file at any path
// returns either the RabbitMQ config specified by the filepath or the default config
function getRabbitMQConfig(filepath) {
    if (typeof filepath == 'string' && filepath.length == 0)
        return RabbitMQconfig_json_1.default;
    else if (filepath == undefined)
        return RabbitMQconfig_json_1.default;
    else {
        try {
            let raw = fs_1.default.readFileSync(filepath);
            return JSON.parse(raw.toString());
        }
        catch (error) {
            console.error(`Failed to load the configuration file at: ${filepath}`);
            console.warn('Using default RabbitMQ configuration');
            return RabbitMQconfig_json_1.default;
        }
    }
}
exports.getRabbitMQConfig = getRabbitMQConfig;
/**
 * Creates a listener instance and returns it if not error occurs.
 * @param chain The chain the listener is for
 * @param options The listener options for the specified chain
 */
function createListener(chain, options) {
    return __awaiter(this, void 0, void 0, function* () {
        let listener;
        try {
            if (interfaces_1.chainSupportedBy(chain, types_1.EventChains)) {
                // start a substrate listener
                listener = new substrate_1.Listener(chain, options.url || index_1.networkUrls[chain], options.spec || index_1.networkSpecs[chain] || {}, !!options.archival, options.startBlock || 0, !!options.skipCatchup, options.enricherConfig || {}, !!options.verbose);
            }
            else if (interfaces_1.chainSupportedBy(chain, types_2.EventChains)) {
                listener = new Listener_1.Listener(chain, options.MolochContractVersion == 1 || options.MolochContractVersion == 2
                    ? options.MolochContractVersion
                    : 2, options.MolochContractAddress || index_1.molochContracts[chain], options.url || index_1.networkUrls[chain], options.startBlock || 0, !!options.skipCatchup, !!options.verbose);
            }
            else if (interfaces_1.chainSupportedBy(chain, types_3.EventChains)) {
                const contractAddresses = {
                    comp: options.MarlinContractAddress[0] || index_1.marlinContracts.comp,
                    governorAlpha: options.MarlinContractAddress[1] || index_1.marlinContracts.governorAlpha,
                    timelock: options.MarlinContractAddress[2] || index_1.marlinContracts.timelock,
                };
                listener = new Listener_2.Listener(chain, contractAddresses, options.url || index_1.networkUrls[chain], options.startBlock || 0, !!options.skipCatchup, !!options.verbose);
            }
            else if (interfaces_1.chainSupportedBy(chain, types_4.EventChains)) {
                listener = new Listener_3.Listener(chain, options.Erc20TokenAddresses || index_1.Erc20TokenUrls, // addresses of contracts to track
                options.url || index_1.networkUrls[chain], // ethNetowrkUrl aka the access point to ethereum
                !!options.verbose);
            }
        }
        catch (error) {
            return error;
        }
        try {
            yield listener.init();
        }
        catch (error) {
            console.error(`Failed to initialize the listener`);
            return error;
        }
        return listener;
    });
}
exports.createListener = createListener;
//# sourceMappingURL=util.js.map