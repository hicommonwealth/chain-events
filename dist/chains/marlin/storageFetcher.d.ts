import EthDater from 'ethereum-block-by-date';
import { CWEvent, IStorageFetcher, IDisconnectedRange } from '../../interfaces';
import { IEventData, Api } from './types';
export declare class StorageFetcher extends IStorageFetcher<Api> {
    protected readonly _api: Api;
    private readonly _dater;
    constructor(_api: Api, _dater: EthDater);
    private _currentBlock;
    private _eventsFromProposal;
    fetchOne(id: string): Promise<CWEvent<IEventData>[]>;
    /**
     * Fetches all CW events relating to ChainEntities from chain (or in this case contract),
     *   by quering available chain/contract storage and reconstructing events.
     *
     * NOTE: throws on error! Make sure to wrap in try/catch!
     *
     * @param range Determines the range of blocks to query events within.
     * @param fetchAllCompleted
     */
    fetch(range?: IDisconnectedRange, fetchAllCompleted?: boolean): Promise<CWEvent<IEventData>[]>;
}
