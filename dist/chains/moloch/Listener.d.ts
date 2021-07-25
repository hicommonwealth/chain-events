import { EventSupportingChainT, IStorageFetcher } from '../../interfaces';
import { EventKind as MolochEventKinds, Api, RawEvent, ListenerOptions as MolochListenerOptions } from '../moloch/types';
import { Listener as BaseListener } from '../../Listener';
export declare class Listener extends BaseListener {
    private readonly _options;
    globalExcludedEvents: MolochEventKinds[];
    _storageFetcher: IStorageFetcher<Api>;
    private _lastBlockNumber;
    constructor(chain: EventSupportingChainT, contractVersion: 1 | 2, contractAddress: string, url: string, skipCatchup?: boolean, verbose?: boolean);
    init(): Promise<void>;
    subscribe(): Promise<void>;
    protected processBlock(event: RawEvent): Promise<void>;
    private processMissedBlocks;
    updateContractVersion(version: 1 | 2): Promise<void>;
    updateContractAddress(address: string): Promise<void>;
    get lastBlockNumber(): number;
    get chain(): string;
    get options(): MolochListenerOptions;
    get subscribed(): boolean;
}
