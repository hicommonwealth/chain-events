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
}, ignoreChainType?: boolean, customChainBase?: string): Promise<Listener>;
