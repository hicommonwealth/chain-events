import { IDisconnectedRange } from './interfaces';
import { EnricherConfig } from './chains/substrate';
import { Listener } from './Listener';
/**
 * Creates a listener instance and returns it if not error occurs. This function throws on error.
 * @param chain The chain the listener is for
 * @param options The listener options for the specified chain
 * @param ignoreChainType If set to true the function will create the appropriate listener regardless of whether chain is listed in supported EventChains type.
 * @param customChainBase Used with ignoreChainType to override the base system the chain is from (i.e. substrate/cosmos/etc)
 */
export declare function createListener(chain: string, options: {
    address?: string;
    tokenAddresses?: string[];
    tokenNames?: string[];
    MolochContractVersion?: 1 | 2;
    verbose?: boolean;
    skipCatchup?: boolean;
    startBlock?: number;
    archival?: boolean;
    spec?: {};
    url?: string;
    enricherConfig?: EnricherConfig;
    discoverReconnectRange?: (chain: string) => Promise<IDisconnectedRange>;
}, ignoreChainType?: boolean, customChainBase?: string): Promise<Listener>;
