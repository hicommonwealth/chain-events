import { Listener as BaseListener } from '../../Listener';
import { ListenerOptions as AaveListenerOptions, RawEvent, Api } from './types';
import { EventSupportingChainT, IDisconnectedRange, IStorageFetcher } from '../../interfaces';
export declare class Listener extends BaseListener {
    private readonly _options;
    discoverReconnectRange: (chain: string) => Promise<IDisconnectedRange>;
    storageFetcher: IStorageFetcher<Api>;
    constructor(chain: EventSupportingChainT, govContractAddress: string, url?: string, skipCatchup?: boolean, verbose?: boolean, ignoreChainType?: boolean, discoverReconnectRange?: (chain: string) => Promise<IDisconnectedRange>);
    init(): Promise<void>;
    subscribe(): Promise<void>;
    updateAddress(): Promise<void>;
    private processMissedBlocks;
    protected processBlock(event: RawEvent): Promise<void>;
    get chain(): string;
    get options(): AaveListenerOptions;
    get subscribed(): boolean;
}
