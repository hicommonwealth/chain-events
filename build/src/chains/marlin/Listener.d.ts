import { ListenerOptions as MarlinListenerOptions, RawEvent, Api } from './types';
import { EventSupportingChainT, IStorageFetcher } from '../../interfaces';
import { Listener as BaseListener } from '../../Listener';
export declare class Listener extends BaseListener {
    private readonly _options;
    _storageFetcher: IStorageFetcher<Api>;
    private _lastBlockNumber;
    constructor(chain: EventSupportingChainT, contractAddresses: {
        comp: string;
        governorAlpha: string;
        timelock: string;
    }, url?: string, startBlock?: number, skipCatchup?: boolean, verbose?: boolean);
    init(): Promise<void>;
    subscribe(): Promise<void>;
    updateContractAddress(contractName: string, address: string): Promise<void>;
    protected processBlock(event: RawEvent): Promise<void>;
    private processMissedBlocks;
    get lastBlockNumber(): number;
    get chain(): string;
    get listenerArgs(): MarlinListenerOptions;
    get subscribed(): boolean;
}
