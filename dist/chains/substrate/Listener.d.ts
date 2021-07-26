import { Block, ISubstrateListenerOptions } from './types';
import { EnricherConfig } from './index';
import { ApiPromise } from '@polkadot/api';
import { EventSupportingChainT, IStorageFetcher } from '../../interfaces';
import { Listener as BaseListener } from '../../Listener';
import { RegisteredTypes } from '@polkadot/types/types';
export declare class Listener extends BaseListener {
    private readonly _options;
    _storageFetcher: IStorageFetcher<ApiPromise>;
    private _poller;
    _lastBlockNumber: number;
    constructor(chain: EventSupportingChainT, url?: string, spec?: RegisteredTypes | {}, archival?: boolean, startBlock?: number, skipCatchup?: boolean, enricherConfig?: EnricherConfig, verbose?: boolean, ignoreChainType?: boolean);
    init(): Promise<void>;
    subscribe(): Promise<void>;
    private processMissedBlocks;
    getBlocks(startBlock: number, endBlock?: number): Promise<Block[]>;
    updateSpec(spec: {}): Promise<void>;
    updateUrl(url: string): Promise<void>;
    protected processBlock(block: Block): Promise<void>;
    get lastBlockNumber(): number;
    get options(): ISubstrateListenerOptions;
    get storageFetcher(): IStorageFetcher<ApiPromise>;
}
