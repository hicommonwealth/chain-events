import {
  IDisconnectedRange,
  IEventProcessor,
  IEventSubscriber,
  IStorageFetcher,
  SupportedNetwork,
} from './interfaces';
import { Listener as SubstrateListener } from './chains/substrate';
import { Listener as MolochListener } from './chains/moloch/Listener';
import { Listener as CompoundListener } from './chains/compound/Listener';
import { Listener as Erc20Listener } from './chains/erc20';
import { Listener as AaveListener } from './chains/aave';
import { Listener } from './Listener';
import { factory, formatFilename } from './logging';

const log = factory.getLogger(formatFilename(__filename));

/**
 * Creates a listener instance and returns it if no error occurs. This function throws on error.
 * @param chain The chain to create a listener for
 * @param options The listener options for the specified chain
 * @param network the listener network to use
 */
export async function createListener(
  chain: string,
  network: SupportedNetwork,
  options: {
    address?: string;
    tokenAddresses?: string[];
    tokenNames?: string[];
    MolochContractVersion?: 1 | 2;
    verbose?: boolean;
    skipCatchup?: boolean;
    startBlock?: number;
    archival?: boolean;
    spec?: Record<string, unknown>;
    url?: string;
    enricherConfig?: any;
    discoverReconnectRange?: (c: string) => Promise<IDisconnectedRange>;
  }
): Promise<
  Listener<
    any,
    IStorageFetcher<any>,
    IEventProcessor<any, any>,
    IEventSubscriber<any, any>,
    any
  >
> {
  let listener: Listener<
    any,
    IStorageFetcher<any>,
    IEventProcessor<any, any>,
    IEventSubscriber<any, any>,
    any
  >;

  if (network === SupportedNetwork.Substrate) {
    // start a substrate listener
    listener = new SubstrateListener(
      chain,
      options.url,
      options.spec,
      !!options.archival,
      options.startBlock || 0,
      !!options.skipCatchup,
      options.enricherConfig,
      !!options.verbose,
      options.discoverReconnectRange
    );
  } else if (network === SupportedNetwork.Moloch) {
    listener = new MolochListener(
      chain,
      options.MolochContractVersion ? options.MolochContractVersion : 2,
      options.address,
      options.url,
      !!options.skipCatchup,
      !!options.verbose,
      options.discoverReconnectRange
    );
  } else if (network === SupportedNetwork.Compound) {
    listener = new CompoundListener(
      chain,
      options.address,
      options.url,
      !!options.skipCatchup,
      !!options.verbose,
      options.discoverReconnectRange
    );
  } else if (network === SupportedNetwork.ERC20) {
    listener = new Erc20Listener(
      chain,
      options.tokenAddresses || [options.address],
      options.url,
      Array.isArray(options.tokenNames) ? options.tokenNames : undefined,
      options.enricherConfig,
      !!options.verbose
    );
  } else if (network === SupportedNetwork.Aave) {
    listener = new AaveListener(
      chain,
      options.address,
      options.url,
      !!options.skipCatchup,
      !!options.verbose,
      options.discoverReconnectRange
    );
  } else {
    throw new Error(`Invalid network: ${network}`);
  }

  try {
    if (!listener) throw new Error('Listener is still null');
    await listener.init();
  } catch (error) {
    log.error(`[${chain}]: Failed to initialize the listener`);
    throw error;
  }

  return listener;
}
