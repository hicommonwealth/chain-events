import { chainSupportedBy, EventSupportingChainT } from '../interfaces';
import { listeners } from './index';
import { EventChains as SubstrateChains } from '../chains/substrate/types';

import { getSubstrateSpecs } from './util';
import { setupListener } from './setupListener';
import { RegisteredTypes } from '@polkadot/types/types';
import { CloverSpec } from '../../scripts/specs/clover';
import { HydraDXSpec } from '../../scripts/specs/hydraDX';
import { KulupuSpec } from '../../scripts/specs/kulupu';
import { spec as EdgewareSpec } from '@edgeware/node-types';
import { StafiSpec } from '../../scripts/specs/stafi';

export const networkUrls = {
  clover: 'wss://api.clover.finance',
  hydradx: 'wss://rpc-01.snakenet.hydradx.io',
  edgeware: 'ws://mainnet1.edgewa.re:9944',
  'edgeware-local': 'ws://localhost:9944',
  'edgeware-testnet': 'wss://beresheet1.edgewa.re',
  kusama: 'wss://kusama-rpc.polkadot.io',
  polkadot: 'wss://rpc.polkadot.io',
  kulupu: 'ws://rpc.kulupu.corepaper.org/ws',
  stafi: 'wss://scan-rpc.stafi.io/ws',
  moloch: 'wss://mainnet.infura.io/ws',
  'moloch-local': 'ws://127.0.0.1:9545',
  marlin: 'wss://mainnet.infura.io/ws',
  'marlin-local': 'ws://127.0.0.1:9545',
} as const;
export const networkSpecs: { [chain: string]: RegisteredTypes } = {
  clover: CloverSpec,
  hydradx: HydraDXSpec,
  kulupu: KulupuSpec,
  edgeware: EdgewareSpec,
  'edgeware-local': EdgewareSpec,
  'edgeware-testnet': EdgewareSpec,
  stafi: StafiSpec,
};
export const contracts = {
  moloch: '0x1fd169A4f5c59ACf79d0Fd5d91D1201EF1Bce9f1',
  'moloch-local': '0x9561C133DD8580860B6b7E504bC5Aa500f0f06a7',
};

/**
 * Creates a listener instance for any chain. NOTE: this function has 2 main side effects.
 * 1. It processes the options parameter to populate the listenerArgs object.
 * 2. It saves the subscriber returned by setupListener in the subscribers object.
 * This function is useful to start a listener from scratch when given unprocessed options
 * @param chain The name of the chain to listen to
 * @param options An object containing the desired settings for the listener (see ReadMe.md)
 */
export async function createListener(
  chain: EventSupportingChainT,
  options: { [key: string]: any }
) {
  listeners[chain] = {
    args: {
      archival: !!options.archival,
      startBlock: options.startBlock ?? 0,
      url: options.url || networkUrls[chain],
      spec: options.spec || networkSpecs[chain] || {},
      contract: options.contractAddress || contracts[chain],
      skipCatchup: !!options.skipCatchup,
      excludedEvents: options.excludedEvents || [],
    },
  };

  if (chainSupportedBy(chain, SubstrateChains)) {
    try {
      const newSpec = await getSubstrateSpecs(chain);
      if (newSpec?.types != undefined) listeners[chain].args.spec = newSpec;
    } catch (error) {
      console.log(error);
    }
  }

  try {
    listeners[chain].subscriber = await setupListener(
      chain,
      listeners[chain].args
    );
  } catch (error) {
    console.log(error);
  }
}
