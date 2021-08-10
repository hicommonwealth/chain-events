import { ListenerOptions as Erc20ListenerOptions, RawEvent } from './types';
import { CWEvent, EventSupportingChainT } from '../../interfaces';
import { Listener as BaseListener } from '../../Listener';
export declare class Listener extends BaseListener {
    private readonly _options;
    private readonly _tokenNames;
    constructor(chain: EventSupportingChainT, tokenAddresses: string[], url: string, tokenNames?: string[], verbose?: boolean, ignoreChainType?: boolean);
    init(): Promise<void>;
    subscribe(): Promise<void>;
    updateTokenList(tokenAddresses: string[]): Promise<void>;
    protected handleEvent(event: CWEvent): Promise<void>;
    protected processBlock(event: RawEvent, tokenName?: string): Promise<void>;
    get chain(): string;
    get options(): Erc20ListenerOptions;
    get subscribed(): boolean;
}
