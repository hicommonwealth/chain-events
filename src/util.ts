import { chainSupportedBy, EventSupportingChainT } from './interfaces';
import { EventChains as SubstrateChains } from './chains/substrate/types';
import { Listener as SubstrateListener } from './chains/substrate/Listener';
import { EnricherConfig } from './chains/substrate';
import { EventChains as MolochChains } from './chains/moloch/types';
import { Listener as MolochListener } from './chains/moloch/Listener';
import { EventChains as MarlinChains } from './chains/marlin/types';
import { Listener as MarlinListener } from './chains/marlin/Listener';
import { EventChains as Erc20Chain } from './chains/erc20/types';
import { Listener as Erc20Listener } from './chains/erc20/Listener';
import { Listener } from './Listener';
import {
  molochContracts,
  networkUrls,
  marlinContracts,
  Erc20TokenUrls,
  networkSpecs,
} from './index';

/**
 * Creates a listener instance and returns it if not error occurs.
 * @param chain The chain the listener is for
 * @param options The listener options for the specified chain
 * @param ignoreChainType If set to true the function will create the appropriate listener regardless of whether chain is listed in supported EventChains type.
 * @param customChainBase Used with ignoreChainType to override the base system the chain is from (i.e. substrate/cosmos/etc)
 */
export async function createListener(
  chain: string,
  options: {
    Erc20TokenAddresses?: string[];
    MarlinContractAddress?: {
      comp: string;
      governorAlpha: string;
      timelock: string;
    };
    MolochContractAddress?: string;
    MolochContractVersion?: 1 | 2;
    verbose?: boolean;
    skipCatchup?: boolean;
    startBlock?: number;
    archival?: boolean;
    spec?: {};
    url?: string;
    enricherConfig?: EnricherConfig;
  },
  ignoreChainType?: boolean,
  customChainBase?: string
): Promise<Listener> {
  let listener;

  if (ignoreChainType && !customChainBase) {
    console.log('customChainBase must be set when ignoreChainType is true!');
    return;
  }

  function basePicker(chain: string, base: string): boolean {
    if (ignoreChainType && customChainBase == base) return true;
    else {
      switch (base) {
        case 'substrate':
          return chainSupportedBy(chain, SubstrateChains);
        case 'moloch':
          return chainSupportedBy(chain, MolochChains);
        case 'marlin':
          return chainSupportedBy(chain, MarlinChains);
        case 'erc20':
          return chainSupportedBy(chain, Erc20Chain);
      }
    }
  }

  try {
    if (basePicker(chain, 'substrate')) {
      // start a substrate listener
      listener = new SubstrateListener(
        <EventSupportingChainT>chain,
        options.url || networkUrls[chain],
        options.spec || networkSpecs[chain] || {},
        !!options.archival,
        options.startBlock || 0,
        !!options.skipCatchup,
        options.enricherConfig || {},
        !!options.verbose,
        !!ignoreChainType
      );
    } else if (basePicker(chain, 'moloch')) {
      listener = new MolochListener(
        <EventSupportingChainT>chain,
        options.MolochContractVersion == 1 || options.MolochContractVersion == 2
          ? options.MolochContractVersion
          : 2,
        options.MolochContractAddress || molochContracts[chain],
        options.url || networkUrls[chain],
        !!options.skipCatchup,
        !!options.verbose
      );
    } else if (basePicker(chain, 'marlin')) {
      const contractAddresses = {
        comp: options.MarlinContractAddress[0] || marlinContracts.comp,
        governorAlpha:
          options.MarlinContractAddress[1] || marlinContracts.governorAlpha,
        timelock: options.MarlinContractAddress[2] || marlinContracts.timelock,
      };
      listener = new MarlinListener(
        <EventSupportingChainT>chain,
        contractAddresses,
        options.url || networkUrls[chain],
        !!options.skipCatchup,
        !!options.verbose
      );
    } else if (basePicker(chain, 'erc20')) {
      listener = new Erc20Listener(
        <EventSupportingChainT>chain,
        (options.Erc20TokenAddresses as string[]) || Erc20TokenUrls, // addresses of contracts to track
        options.url || networkUrls[chain], // ethNetowrkUrl aka the access point to ethereum
        !!options.verbose
      );
    } else {
      console.error(`The given chain/token/contract is not supported. The following chains/tokens/contracts are supported:\n
      Substrate Chains: ${SubstrateChains}\nMoloch\nMarlin\nErc20 Tokens`);
      return;
    }
  } catch (error) {
    console.log('A listener could not be started');
    throw error;
  }

  try {
    if (!listener)
      throw new Error('An unknown error occurred while starting the listener');
    await listener.init();
  } catch (error) {
    console.error(`Failed to initialize the listener`);
    throw error;
  }

  return listener;
}
