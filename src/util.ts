import fs from 'fs';
import config from './rabbitmq/RabbitMQconfig.json';
import { chainSupportedBy } from './interfaces';
import { EventChains as SubstrateChains } from './chains/substrate/types';
import { Listener as SubstrateListener } from './chains/substrate';
import { EventChains as MolochChains } from './chains/moloch/types';
import { Listener as MolochListener } from './chains/moloch/Listener';
import { EventChains as MarlinChains } from './chains/marlin/types';
import { Listener as MarlinListener } from './chains/marlin/Listener';
import { EventChains as Erc20Chain } from './chains/erc20/types';
import { Listener as Erc20Listener } from './chains/erc20/Listener';
import { Listener } from './Listener';

// TODO: generalize this for any config file at any path
// returns either the RabbitMQ config specified by the filepath or the default config
export function getRabbitMQConfig(filepath?: string) {
  if (typeof filepath == 'string' && filepath.length == 0) return config;
  else if (filepath == undefined) return config;
  else {
    try {
      let raw = fs.readFileSync(filepath);
      return JSON.parse(raw.toString());
    } catch (error) {
      console.error(`Failed to load the configuration file at: ${filepath}`);
      console.warn('Using default RabbitMQ configuration');
      return config;
    }
  }
}

/**
 * Creates a listener instance and returns it if not error occurs.
 * @param chain The chain the listener is for
 * @param options The listener options for the specified chain
 */
export async function createListener(
  chain: string,
  options: {
    Erc20TokenAddresses: string[];
    MarlinContractAddress: {
      comp: string;
      governorAlpha: string;
      timelock: string;
    };
    MolochContractAddress: string;
    MolochContractVersion: 1 | 2;
    verbose?: boolean;
    skipCatchup?: boolean;
    startBlock?: number;
    archival?: boolean;
    spec?: {};
    url: string;
  }
): Promise<Listener> {
  let listener;

  try {
    if (chainSupportedBy(chain, SubstrateChains)) {
      // start a substrate listener
      listener = new SubstrateListener(
        chain,
        options.url,
        options.spec,
        options.archival,
        options.startBlock,
        options.skipCatchup,
        {},
        options.verbose
      );
    } else if (chainSupportedBy(chain, MolochChains)) {
      listener = new MolochListener(
        chain,
        options.MolochContractVersion as 1 | 2,
        options.MolochContractAddress,
        options.url,
        options.startBlock,
        options.skipCatchup,
        options.verbose
      );
    } else if (chainSupportedBy(chain, MarlinChains)) {
      const contractAddresses = {
        comp: options.MarlinContractAddress[0],
        governorAlpha: options.MarlinContractAddress[1],
        timelock: options.MarlinContractAddress[2],
      };
      listener = new MarlinListener(
        chain,
        contractAddresses,
        options.url,
        options.startBlock,
        options.skipCatchup,
        options.verbose
      );
    } else if (chainSupportedBy(chain, Erc20Chain)) {
      listener = new Erc20Listener(
        chain,
        options.Erc20TokenAddresses as string[], // addresses of contracts to track
        options.url, // ethNetowrkUrl aka the access point to ethereum
        options.verbose
      );
    }
  } catch (error) {
    return error;
  }

  try {
    listener.init();
  } catch (error) {
    console.error(`Failed to initialize the listener`);
    return error;
  }

  return listener;
}
