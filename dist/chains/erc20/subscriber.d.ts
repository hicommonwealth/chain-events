import { IEventSubscriber } from '../../interfaces';
import { RawEvent, Api, Token } from './types';
export declare class Subscriber extends IEventSubscriber<Api, RawEvent> {
    private _name;
    tokens: Token[];
    private _listener;
    constructor(api: Api, name: string, verbose?: boolean);
    /**
     * Initializes subscription to chain and starts emitting events.
     */
    subscribe(cb: (event: RawEvent) => void): Promise<void>;
    unsubscribe(): void;
    addNewToken(tokenAddress: string, retryTimeMs?: number, retries?: number): Promise<void>;
}
