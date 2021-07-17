/**
 * Fetches historical events from substrate chain.
 */
import { ApiPromise } from '@polkadot/api';
import { IEventPoller, IDisconnectedRange } from '../../interfaces';
import { Block } from './types';
export declare class Poller extends IEventPoller<ApiPromise, Block> {
    /**
     * Connects to chain, fetches specified blocks and passes them
     * along for processing.
     *
     * @param startBlock first block to fetch
     * @param endBlock last block to fetch, omit to fetch to latest
     */
    poll(range: IDisconnectedRange, maxRange?: number): Promise<Block[]>;
    /**
     * Connects to chain, fetches blocks specified in given range in provided batch size,
     * prcoesses the blocks if a handler is provided
     * @param range IDisconnectedRange having startBlock and optional endBlock
     * @param batchSize size of the batch in which blocks are to be fetched from chain
     * @param processBlockFn an optional function to process the blocks
     */
    archive(range: IDisconnectedRange, batchSize?: number, processBlockFn?: (block: Block) => void): Promise<void>;
}
