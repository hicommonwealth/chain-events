import {
  chainSupportedBy,
  CWEvent,
  EventSupportingChainT,
  IChainEventKind,
  IDisconnectedRange,
  IEventHandler,
  IEventProcessor,
  IEventSubscriber,
  IListenerOptions,
  IStorageFetcher,
} from '../../interfaces';
import { networkSpecs, networkUrls } from '../../listener/createListener';
import {
  EventKind as MolochEventKinds,
  Api,
  RawEvent,
  EventChains as molochChains,
  ListenerOptions as MolochListenerOptions,
  IEventData,
} from '../moloch/types';
import { createApi, Processor, StorageFetcher, Subscriber } from '../moloch';
import EthDater from 'ethereum-block-by-date';
import Web3 from 'web3';
import { Web3Provider } from 'ethers/providers';
import { WebsocketProvider } from 'web3-core';

export class Listener {
  private readonly _listenerArgs: MolochListenerOptions;
  public eventHandlers: {
    [key: string]: {
      handler: IEventHandler;
      excludedEvents: MolochEventKinds[];
    };
  };
  public globalExcludedEvents: MolochEventKinds[];
  public _storageFetcher: IStorageFetcher<Api>;
  private _subscriber: IEventSubscriber<Api, RawEvent>;
  private _processor: IEventProcessor<Api, RawEvent>;
  private _api: Api;
  private _lastBlockNumber: number;
  private readonly _chain: string;

  constructor(
    chain: EventSupportingChainT,
    contractVersion: 1 | 2,
    contractAddress: string,
    url: string,
    archival?: boolean,
    startBlock?: number,
    skipCatchup?: boolean,
    excludedEvents?: IChainEventKind[]
  ) {
    if (!chainSupportedBy(chain, molochChains))
      throw new Error(`${chain} is not a moloch network`);

    this._chain = chain;
    this._listenerArgs = {
      archival: !!archival,
      startBlock: startBlock ?? 0,
      url: url || networkUrls[chain],
      skipCatchup: !!skipCatchup,
      excludedEvents: excludedEvents || [],
      contractAddress: contractAddress,
      contractVersion: contractVersion,
    };
  }

  public async init(): Promise<void> {
    try {
      this._api = await createApi(
        this._listenerArgs.url,
        this._listenerArgs.contractVersion,
        this._listenerArgs.contractAddress
      );
    } catch (error) {
      console.error('Fatal error occurred while starting the API');
      throw error;
    }

    try {
      this._processor = new Processor(
        this._api,
        this._listenerArgs.contractVersion
      );
      this._storageFetcher = new StorageFetcher(
        this._api,
        this._listenerArgs.contractVersion,
        EthDater
      );
      this._subscriber = await new Subscriber(this._api, this._chain, false);
    } catch (error) {
      console.error(
        'Fatal error occurred while starting the Processor, and Fetcher'
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
        `Subscribing Moloch contract: ${this._chain}, on url ${this._listenerArgs.url}`
      );
      await this._subscriber.subscribe(this.processBlock);
    } catch (error) {
      console.error(`Subscription error: ${error.message}`);
    }
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

  private async processBlock(event: RawEvent): Promise<void> {
    const cwEvents: CWEvent[] = await this._processor.process(event);

    // process events in sequence
    for (const cwEvent of cwEvents) await this.handleEvent(cwEvent);
  }

  private async processMissedBlocks(
    discoverReconnectRange?: () => Promise<IDisconnectedRange>
  ): Promise<void> {
    if (!discoverReconnectRange) {
      console.warn(
        'No function to discover offline time found, skipping event catchup.'
      );
      return;
    }
    console.info(
      `Fetching missed events since last startup of ${this._chain}...`
    );
    let offlineRange: IDisconnectedRange;
    try {
      offlineRange = await discoverReconnectRange();
      if (!offlineRange) {
        console.warn('No offline range found, skipping event catchup.');
        return;
      }
    } catch (e) {
      console.error(
        `Could not discover offline range: ${e.message}. Skipping event catchup.`
      );
      return;
    }

    // reuse provider interface for dater function
    const web3 = new Web3(
      (this._api.provider as Web3Provider)._web3Provider as WebsocketProvider
    );
    const dater = new EthDater(web3);

    try {
      const cwEvents = await this._storageFetcher.fetch(offlineRange);

      // process events in sequence
      for (const cwEvent of cwEvents) {
        await this.handleEvent(cwEvent);
      }
    } catch (e) {
      console.error(`Unable to fetch events from storage: ${e.message}`);
    }
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
