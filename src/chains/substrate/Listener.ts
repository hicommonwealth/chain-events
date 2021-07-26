import { Block, IEventData, ISubstrateListenerOptions } from './types';
import {
  createApi,
  EnricherConfig,
  Poller,
  Processor,
  StorageFetcher,
  Subscriber,
} from './index';
import { ApiPromise } from '@polkadot/api';
import {
  chainSupportedBy,
  CWEvent,
  EventSupportingChainT,
  IDisconnectedRange,
  IEventPoller,
  IStorageFetcher,
} from '../../interfaces';
import { networkSpecs, networkUrls } from '../../index';
import { Listener as BaseListener } from '../../Listener';

import { EventChains as SubstrateChains } from './types';
import { RegisteredTypes } from '@polkadot/types/types';

export class Listener extends BaseListener {
  private readonly _options: ISubstrateListenerOptions;
  public _storageFetcher: IStorageFetcher<ApiPromise>;
  private _poller: IEventPoller<ApiPromise, Block>;
  public _lastBlockNumber: number;

  constructor(
    chain: EventSupportingChainT,
    url?: string,
    spec?: RegisteredTypes | {},
    archival?: boolean,
    startBlock?: number,
    skipCatchup?: boolean,
    enricherConfig?: EnricherConfig,
    verbose?: boolean,
    ignoreChainType?: boolean
  ) {
    super(chain, verbose);
    // if ignoreChainType = true ignore the hard-coded EventChains type
    if (!ignoreChainType && !chainSupportedBy(this._chain, SubstrateChains))
      throw new Error(`${this._chain} is not a Substrate chain`);

    this._options = {
      archival: !!archival,
      startBlock: startBlock ?? 0,
      url: url || networkUrls[chain],
      spec: spec || networkSpecs[chain] || {},
      skipCatchup: !!skipCatchup,
      enricherConfig: enricherConfig || {},
    };

    this._subscribed = false;
  }

  public async init(): Promise<void> {
    try {
      this._api = await createApi(this._options.url, this._options.spec);

      this._api.on('connected', this.processMissedBlocks);
    } catch (error) {
      console.error('Fatal error occurred while starting the API');
      throw error;
    }

    try {
      this._poller = new Poller(this._api);
      this._processor = new Processor(this._api, this._options.enricherConfig);
      this._storageFetcher = new StorageFetcher(this._api);
      this._subscriber = await new Subscriber(this._api, this._verbose);
    } catch (error) {
      console.error(
        'Fatal error occurred while starting the Poller, Processor, Subscriber, and Fetcher'
      );
      throw error;
    }
  }

  public async subscribe(): Promise<void> {
    if (!this._subscriber) {
      console.log(
        `Subscriber for ${this._chain} isn't initialized. Please run init() first!`
      );
      return;
    }

    // processed blocks missed during downtime
    if (!this.options.skipCatchup) await this.processMissedBlocks();
    else console.log('Skipping event catchup on startup!');

    try {
      console.info(`Subscribing to ${this._chain} on url ${this._options.url}`);
      await this._subscriber.subscribe(this.processBlock.bind(this));
      this._subscribed = true;
    } catch (error) {
      console.error(`Subscription error: ${error.message}`);
    }
  }

  private async processMissedBlocks(
    discoverReconnectRange?: () => Promise<IDisconnectedRange>
  ): Promise<void> {
    console.info('Detected offline time, polling missed blocks...');

    let offlineRange: IDisconnectedRange;

    // first, attempt the provided range finding method if it exists
    // (this should fetch the block of the last server event from database)
    if (discoverReconnectRange) {
      offlineRange = await discoverReconnectRange();
    }

    // compare with default range algorithm: take last cached block in processor
    // if it exists, and is more recent than the provided algorithm
    // (note that on first run, we wont have a cached block/this wont do anything)
    if (
      this._lastBlockNumber &&
      (!offlineRange ||
        !offlineRange.startBlock ||
        offlineRange.startBlock < this._lastBlockNumber)
    ) {
      offlineRange = { startBlock: this._lastBlockNumber };
    }

    // if we can't figure out when the last block we saw was,
    // do nothing
    // (i.e. don't try and fetch all events from block 0 onward)
    if (!offlineRange || !offlineRange.startBlock) {
      console.warn('Unable to determine offline time range.');
      return;
    }

    try {
      const blocks = await this.getBlocks(
        offlineRange.startBlock,
        offlineRange.endBlock
      );
      await Promise.all(blocks.map(this.processBlock));
    } catch (e) {
      console.error(
        `Block polling failed after disconnect at block ${offlineRange.startBlock}`
      );
    }
  }

  public async getBlocks(
    startBlock: number,
    endBlock?: number
  ): Promise<Block[]> {
    return await this._poller.poll({ startBlock, endBlock });
  }

  public async updateSpec(spec: {}): Promise<void> {
    // set the new spec
    this._options.spec = spec;

    // restart api with new spec
    await this.init();
    if (this._subscribed === true) await this.subscribe();
  }

  public async updateUrl(url: string): Promise<void> {
    this._options.url = url;

    // restart api with new url
    await this.init();
    if (this._subscribed === true) await this.subscribe();
  }

  protected async processBlock(block: Block): Promise<void> {
    // cache block number if needed for disconnection purposes
    const blockNumber = +block.header.number;
    if (!this._lastBlockNumber || blockNumber > this._lastBlockNumber) {
      this._lastBlockNumber = blockNumber;
    }

    const events: CWEvent[] = await this._processor.process(block);

    for (const event of events) {
      await this.handleEvent(event as any);
    }
  }

  public get lastBlockNumber(): number {
    return this._lastBlockNumber;
  }

  public get options(): ISubstrateListenerOptions {
    return this._options;
  }

  public get storageFetcher(): IStorageFetcher<ApiPromise> {
    return this._storageFetcher;
  }
}
