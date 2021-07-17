import { SubscribeFunc, ISubscribeOptions } from '../../interfaces';
import { RawEvent, Api } from './types';
import { EnricherConfig } from './filters/enricher';
export interface IErc20SubscribeOptions extends ISubscribeOptions<Api> {
    enricherConfig?: EnricherConfig;
}
/**
 * Attempts to open an API connection, retrying if it cannot be opened.
 * @returns a promise resolving to an ApiPromise once the connection has been established
 * @param ethNetworkUrl
 * @param tokenAddresses
 * @param retryTimeMs
 */
export declare function createApi(ethNetworkUrl: string, tokenAddresses: string[], retryTimeMs?: number): Promise<Api>;
/**
 * This is the main function for edgeware event handling. It constructs a connection
 * to the chain, connects all event-related modules, and initializes event handling.
 * @param options
 * @returns An active block subscriber.
 */
export declare const subscribeEvents: SubscribeFunc<Api, RawEvent, IErc20SubscribeOptions>;
