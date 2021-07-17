import { SubscribeFunc, ISubscribeOptions } from '../../interfaces';
import { RawEvent, Api } from './types';
/**
 * Attempts to open an API connection, retrying if it cannot be opened.
 * @returns a promise resolving to an ApiPromise once the connection has been established
 * @param ethNetworkUrl
 * @param contractAddresses
 * @param retryTimeMs
 */
export declare function createApi(ethNetworkUrl: string, contractAddresses: {
    comp: string;
    governorAlpha: string;
    timelock: string;
}, retryTimeMs?: number): Promise<Api>;
/**
 * This is the main function for edgeware event handling. It constructs a connection
 * to the chain, connects all event-related modules, and initializes event handling.
 *
 * @param url The edgeware chain endpoint to connect to.
 * @param handler An event handler object for processing received events.
 * @param skipCatchup If true, skip all fetching of "historical" chain data that may have been
 *                    emitted during downtime.
 * @param discoverReconnectRange A function to determine how long we were offline upon reconnection.
 * @returns An active block subscriber.
 */
export declare const subscribeEvents: SubscribeFunc<Api, RawEvent, ISubscribeOptions<Api>>;
