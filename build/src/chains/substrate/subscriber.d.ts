/**
 * Fetches events from substrate chain in real time.
 */
import { ApiPromise } from '@polkadot/api';
import { IEventSubscriber } from '../../interfaces';
import { Block } from './types';
export declare class Subscriber extends IEventSubscriber<ApiPromise, Block> {
    private _subscription;
    private _versionName;
    private _versionNumber;
    /**
     * Initializes subscription to chain and starts emitting events.
     */
    subscribe(cb: (block: Block) => void): Promise<void>;
    unsubscribe(): void;
}
