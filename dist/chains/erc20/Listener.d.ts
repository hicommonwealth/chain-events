import { ListenerOptions as Erc20ListenerOptions, RawEvent } from './types';
import { EventSupportingChainT } from '../../interfaces';
import { Listener as BaseListener } from '../../Listener';
export declare class Listener extends BaseListener {
    private readonly _options;
    constructor(chain: EventSupportingChainT, tokenAddresses: string[], url?: string, verbose?: boolean, ignoreChainType?: boolean);
    init(): Promise<void>;
    subscribe(): Promise<void>;
    unsubscribe(): Promise<void>;
    updateTokenList(tokenAddresses: string[]): Promise<void>;
    protected processBlock(event: RawEvent): Promise<void>;
    get chain(): string;
    get options(): Erc20ListenerOptions;
    get subscribed(): boolean;
}
