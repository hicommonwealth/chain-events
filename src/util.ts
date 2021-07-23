import { chainSupportedBy } from './interfaces';
import { EventChains as SubstrateChains } from './chains/substrate/types';
import {
  EnricherConfig,
  Listener as SubstrateListener,
} from './chains/substrate';
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
  }
): Promise<Listener> {
  let listener;

  try {
    if (chainSupportedBy(chain, SubstrateChains)) {
      // start a substrate listener
      listener = new SubstrateListener(
        chain,
        options.url || networkUrls[chain],
        options.spec || networkSpecs[chain] || {},
        !!options.archival,
        options.startBlock || 0,
        !!options.skipCatchup,
        options.enricherConfig || {},
        !!options.verbose
      );
    } else if (chainSupportedBy(chain, MolochChains)) {
      listener = new MolochListener(
        chain,
        options.MolochContractVersion == 1 || options.MolochContractVersion == 2
          ? options.MolochContractVersion
          : 2,
        options.MolochContractAddress || molochContracts[chain],
        options.url || networkUrls[chain],
        options.startBlock || 0,
        !!options.skipCatchup,
        !!options.verbose
      );
    } else if (chainSupportedBy(chain, MarlinChains)) {
      const contractAddresses = {
        comp: options.MarlinContractAddress[0] || marlinContracts.comp,
        governorAlpha:
          options.MarlinContractAddress[1] || marlinContracts.governorAlpha,
        timelock: options.MarlinContractAddress[2] || marlinContracts.timelock,
      };
      listener = new MarlinListener(
        chain,
        contractAddresses,
        options.url || networkUrls[chain],
        options.startBlock || 0,
        !!options.skipCatchup,
        !!options.verbose
      );
    } else if (chainSupportedBy(chain, Erc20Chain)) {
      listener = new Erc20Listener(
        chain,
        (options.Erc20TokenAddresses as string[]) || Erc20TokenUrls, // addresses of contracts to track
        options.url || networkUrls[chain], // ethNetowrkUrl aka the access point to ethereum
        !!options.verbose
      );
    }
  } catch (error) {
    return error;
  }

  try {
    await listener.init();
  } catch (error) {
    console.error(`Failed to initialize the listener`);
    return error;
  }

  return listener;
}