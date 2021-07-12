import { Block, IEventData } from '../chains/substrate/types';
import {
  createApi,
  EnricherConfig,
  Poller,
  Processor,
  Subscriber,
} from '../chains/substrate';
import { ApiPromise } from '@polkadot/api';
import {
  chainSupportedBy,
  CWEvent,
  EventSupportingChainT,
  IChainEventKind,
  IDisconnectedRange,
  IEventPoller,
  IEventProcessor,
  IEventSubscriber,
  IListenerOptions,
} from '../interfaces';
import { contracts, networkSpecs, networkUrls } from './createListener';

import { EventChains as SubstrateChains } from '../chains/substrate/types';
import { RegisteredTypes } from '@polkadot/types/types';

export class Listener {
  private _listenerArgs: IListenerOptions;
  public enricherConfig: EnricherConfig;
  public eventHandlers;
  private _poller: IEventPoller<ApiPromise, Block>;
  private _subscriber: IEventSubscriber<ApiPromise, Block>;
  private _processor: IEventProcessor<ApiPromise, Block>;
  private _chain: string;
  private _api: ApiPromise;
  private _lastBlockNumber: number;

  constructor(
    chain: EventSupportingChainT,
    url?: string,
    spec?: RegisteredTypes | {},
    archival?: boolean,
    startBlock?: number,
    contractAddress?: string,
    skipCatchup?: boolean,
    excludedEvents?: IChainEventKind[]
  ) {
    if (!chainSupportedBy(chain, SubstrateChains))
      throw new Error(`${chain} is not a Substrate chain`);

    this._chain = chain;
    this.listenerArgs = {
      archival: !!archival,
      startBlock: startBlock ?? 0,
      url: url || networkUrls[chain],
      spec: spec || networkSpecs[chain] || {},
      contract: contractAddress || contracts[chain],
      skipCatchup: !!skipCatchup,
      excludedEvents: excludedEvents || [],
    }; // TODO add verbose to args
    // TODO add enricherConfig to args and Processor inside of init() below
  }

  public async init(): Promise<void> {
    this._api = await createApi(this.listenerArgs.url, this.listenerArgs.spec);
    this._api.on('connected', this.getMissedBlocks);

    this._poller = new Poller(this._api);
    this._processor = new Processor(this._api, this.enricherConfig);
  }

  public async subscribe(): Promise<void> {
    if (!this._subscriber) {
      console.log(`Subscriber for ${this._chain} is already active`);
      return;
    }

    this._subscriber = await new Subscriber(this._api, false);

    if (this.listenerArgs.archival) {
      const offlineRange: IDisconnectedRange = {
        startBlock: this.listenerArgs.startBlock,
      };
      console.log(
        `Executing in archival mode, polling blocks starting from: ${offlineRange.startBlock}`
      );
    }

    // processed blocks missed during downtime
    if (!this.listenerArgs.skipCatchup) await this.getMissedBlocks();
    else console.log('Skipping event catchup on startup!');

    try {
      console.info(`Subscribing to ${this._chain} endpoint...`);
      await this._subscriber.subscribe(this.processBlock);
    } catch (error) {
      console.error(`Subscription error: ${error.message}`);
    }
  }

  private async getMissedBlocks(): Promise<void> {
    // console.info('Detected offline time, polling missed blocks...');
    //
    // let offlineRange: IDisconnectedRange;
    // if (discoverReconnectRange) {
    //   offlineRange = await discoverReconnectRange();
    // }
    //
    // await Promise.all(blocks.map(this.processBlock));
  }

  public async getBlocks(
    startBlock: number,
    endBlock?: number
  ): Promise<Block[]> {
    return await this._poller.poll({ startBlock, endBlock });
  }

  public async unsubscribe(): Promise<void> {
    this._subscriber.unsubscribe();
  }

  private async handleEvent(event: CWEvent<IEventData>): Promise<void> {
    let prevResult;
    for (const handler of this.eventHandlers) {
      try {
        event.chain = this._chain as EventSupportingChainT;
        event.received = Date.now();

        prevResult = await handler.handle(event, prevResult);
      } catch (err) {
        console.error(`Event handle failure: ${err.message}`);
        break;
      }
    }
  }

  public async updateSpec(event: CWEvent<IEventData>): Promise<void> {
    // stop all services (subscriber/poller/fetcher/processor)
    // restart api with new spec
    // restart all services (subscriber/poller/fetcher/processor)
    // catchup if skipCatchup is false
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
