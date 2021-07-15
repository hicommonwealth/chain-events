import {
  Block,
  IEventData,
  EventKind as SubstrateEvents,
  ISubstrateListenerOptions,
} from './types';
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
  IChainEventKind,
  IDisconnectedRange,
  IEventHandler,
  IEventPoller,
  IEventProcessor,
  IEventSubscriber,
  IListenerOptions,
  IStorageFetcher,
} from '../../interfaces';
import {
  contracts,
  networkSpecs,
  networkUrls,
} from '../../listener/createListener';

import { EventChains as SubstrateChains } from './types';
import { RegisteredTypes } from '@polkadot/types/types';

export class Listener {
  private readonly _listenerArgs: ISubstrateListenerOptions;
  public enricherConfig: EnricherConfig; // TODO add to ISubstrateListenerOptions?
  public eventHandlers: {
    [key: string]: {
      handler: IEventHandler;
      excludedEvents: SubstrateEvents[];
    };
  };
  // events to be excluded regardless of handler (overrides handler specific excluded events
  public globalExcludedEvents: SubstrateEvents[];
  public _storageFetcher: IStorageFetcher<ApiPromise>;
  private _poller: IEventPoller<ApiPromise, Block>;
  private _subscriber: IEventSubscriber<ApiPromise, Block>;
  private _processor: IEventProcessor<ApiPromise, Block>;
  private _api: ApiPromise;
  private _lastBlockNumber: number;
  private readonly _chain: string;
  private _subscribed: boolean;

  constructor(
    chain: EventSupportingChainT,
    url?: string,
    spec?: RegisteredTypes | {},
    archival?: boolean,
    startBlock?: number,
    skipCatchup?: boolean,
    excludedEvents?: IChainEventKind[]
  ) {
    if (!chainSupportedBy(chain, SubstrateChains))
      throw new Error(`${chain} is not a Substrate chain`);

    this._chain = chain;
    this._listenerArgs = {
      archival: !!archival,
      startBlock: startBlock ?? 0,
      url: url || networkUrls[chain],
      spec: spec || networkSpecs[chain] || {},
      skipCatchup: !!skipCatchup,
      excludedEvents: excludedEvents || [],
    }; // TODO add verbose to args
    // TODO add enricherConfig to args and Processor inside of init() below
  }

  public async init(): Promise<void> {
    try {
      this._api = await createApi(
        this._listenerArgs.url,
        this._listenerArgs.spec
      );

      this._api.on('connected', this.processMissedBlocks);
    } catch (error) {
      console.error('Fatal error occurred while starting the API');
      throw error;
    }

    try {
      this._poller = new Poller(this._api);
      this._processor = new Processor(this._api, this.enricherConfig);
      this._storageFetcher = new StorageFetcher(this._api);
      this._subscriber = await new Subscriber(this._api, false);
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
    if (!this.listenerArgs.skipCatchup) await this.processMissedBlocks();
    else console.log('Skipping event catchup on startup!');

    try {
      console.info(
        `Subscribing to ${this._chain} on url ${this._listenerArgs.url}`
      );
      await this._subscriber.subscribe(this.processBlock);
      this._subscribed = true;
    } catch (error) {
      console.error(`Subscription error: ${error.message}`);
    }
  }

  public async unsubscribe(): Promise<void> {
    this._subscriber.unsubscribe();
    this._subscribed = false;
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
    this._listenerArgs.spec = spec;

    // restart api with new spec
    await this.init();
    if (this._subscribed === true) await this.subscribe();
  }

  public async updateUrl(url: string): Promise<void> {
    this._listenerArgs.url = url;

    // restart api with new url
    await this.init();
    if (this._subscribed === true) await this.subscribe();
  }

  private async handleEvent(event: CWEvent<IEventData>): Promise<void> {
    let prevResult;

    event.chain = this._chain as EventSupportingChainT;
    event.received = Date.now();

    for (const key in this.eventHandlers) {
      const eventHandler = this.eventHandlers[key];
      if (
        this.globalExcludedEvents.includes(event.data.kind) ||
        eventHandler.excludedEvents.includes(event.data.kind)
      )
        continue;

      try {
        prevResult = await eventHandler.handler.handle(event, prevResult);
      } catch (err) {
        console.error(`Event handle failure: ${err.message}`);
        break;
      }
    }
  }

  private async processBlock(block: Block): Promise<void> {
    // cache block number if needed for disconnection purposes
    const blockNumber = +block.header.number;
    if (!this._lastBlockNumber || blockNumber > this._lastBlockNumber) {
      this._lastBlockNumber = blockNumber;
    }

    const events: CWEvent[] = await this._processor.process(block);

    for (const event of events) await this.handleEvent(event);
  }

  private cleanup(): void {
    // stop all services (subscriber/poller/fetcher/processor)
    this._subscriber.unsubscribe();
    this._poller = null;
    this._processor = null;
    this._api = null;
  }

  public get lastBlockNumber(): number {
    return this._lastBlockNumber;
  }

  public get chain(): string {
    return this._chain;
  }

  public get listenerArgs(): IListenerOptions {
    return this._listenerArgs;
  }
}
