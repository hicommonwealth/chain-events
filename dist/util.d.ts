import { EnricherConfig } from './chains/substrate';
import { Listener } from './Listener';
/**
 * Creates a listener instance and returns it if not error occurs.
 * @param chain The chain the listener is for
 * @param options The listener options for the specified chain
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
}): Promise<Listener>;
