'use strict';
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.createListener = void 0;
const interfaces_1 = require('./interfaces');
const types_1 = require('./chains/substrate/types');
const Listener_1 = require('./chains/substrate/Listener');
const types_2 = require('./chains/moloch/types');
const Listener_2 = require('./chains/moloch/Listener');
const types_3 = require('./chains/marlin/types');
const Listener_3 = require('./chains/marlin/Listener');
const types_4 = require('./chains/erc20/types');
const Listener_4 = require('./chains/erc20/Listener');
const index_1 = require('./index');
/**
 * Creates a listener instance and returns it if not error occurs.
 * @param chain The chain the listener is for
 * @param options The listener options for the specified chain
 * @param ignoreChainType If set to true the function will create the appropriate listener regardless of whether chain is listed in supported EventChains type.
 * @param customChainBase Used with ignoreChainType to override the base system the chain is from (i.e. substrate/cosmos/etc)
 */
function createListener(chain, options, ignoreChainType, customChainBase) {
  return __awaiter(this, void 0, void 0, function* () {
    let listener;
    if (ignoreChainType && !customChainBase) {
      console.log('customChainBase must be set when ignoreChainType is true!');
      return;
    }
    function basePicker(chain, base) {
      if (ignoreChainType && customChainBase === base) return true;
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
        }
      }
    }
    console.log('basePicker:', basePicker(chain, 'substrate'));
    try {
      if (basePicker(chain, 'substrate')) {
        // start a substrate listener
        listener = new Listener_1.Listener(
          chain,
          options.url || index_1.networkUrls[chain],
          options.spec || index_1.networkSpecs[chain] || {},
          !!options.archival,
          options.startBlock || 0,
          !!options.skipCatchup,
          options.enricherConfig || {},
          !!options.verbose,
          !!ignoreChainType
        );
      } else if (basePicker(chain, 'moloch')) {
        listener = new Listener_2.Listener(
          chain,
          options.MolochContractVersion == 1 ||
          options.MolochContractVersion == 2
            ? options.MolochContractVersion
            : 2,
          options.MolochContractAddress || index_1.molochContracts[chain],
          options.url || index_1.networkUrls[chain],
          !!options.skipCatchup,
          !!options.verbose
        );
      } else if (basePicker(chain, 'marlin')) {
        const contractAddresses = {
          comp:
            options.MarlinContractAddress[0] || index_1.marlinContracts.comp,
          governorAlpha:
            options.MarlinContractAddress[1] ||
            index_1.marlinContracts.governorAlpha,
          timelock:
            options.MarlinContractAddress[2] ||
            index_1.marlinContracts.timelock,
        };
        listener = new Listener_3.Listener(
          chain,
          contractAddresses,
          options.url || index_1.networkUrls[chain],
          !!options.skipCatchup,
          !!options.verbose
        );
      } else if (basePicker(chain, 'erc20')) {
        listener = new Listener_4.Listener(
          chain,
          options.Erc20TokenAddresses || index_1.Erc20TokenUrls, // addresses of contracts to track
          options.url || index_1.networkUrls[chain], // ethNetowrkUrl aka the access point to ethereum
          !!options.verbose
        );
      } else {
        console.error(`The given chain/token/contract is not supported. The following chains/tokens/contracts are supported:\n
      Substrate Chains: ${types_1.EventChains}\nMoloch\nMarlin\nErc20 Tokens`);
        return;
      }
    } catch (error) {
      return error;
    }
    try {
      if (!listener) {
        console.error('An unknown error occurred creating the listener');
        return;
      }
      yield listener.init();
    } catch (error) {
      console.error(`Failed to initialize the listener: ${error}`);
      return error;
    }
    return listener;
  });
}
exports.createListener = createListener;
