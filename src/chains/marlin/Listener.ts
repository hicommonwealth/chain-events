import {
  ListenerOptions as MarlinListenerOptions,
  EventKind as MarlinEvents,
  RawEvent,
  Api,
  EventChains as MarlinChains,
  IEventData,
} from './types';

import { createApi } from './subscribeFunc';

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
import { Processor } from './processor';
import { StorageFetcher } from './storageFetcher';
import Web3 from 'web3';
import { Web3Provider } from 'ethers/providers';
import { WebsocketProvider } from 'web3-core';
import { Subscriber } from './subscriber';
import EthDater from 'ethereum-block-by-date';

export class Listener {
  private readonly _listenerArgs: MarlinListenerOptions;
  public eventHandlers: {
    [key: string]: {
      handler: IEventHandler;
      excludedEvents: MarlinEvents[];
    };
  };
  // events to be excluded regardless of handler (overrides handler specific excluded events
  public globalExcludedEvents: MarlinEvents[];
  public _storageFetcher: IStorageFetcher<Api>;
  private _subscriber: IEventSubscriber<Api, RawEvent>;
  private _processor: IEventProcessor<Api, RawEvent>;
  private _api: Api;
  private _lastBlockNumber: number;
  private readonly _chain: string;
  private _subscribed: boolean;

  constructor(
    chain: EventSupportingChainT,
    contractAddresses: {
      comp: string;
      governorAlpha: string;
      timelock: string;
    },
    url?: string,
    archival?: boolean,
    startBlock?: number,
    skipCatchup?: boolean,
    excludedEvents?: IChainEventKind[]
  ) {
    if (!chainSupportedBy(chain, MarlinChains))
      throw new Error(`${chain} is not a Substrate chain`);

    this._chain = chain;
    this._listenerArgs = {
      archival: !!archival,
      startBlock: startBlock ?? 0,
      url: url || networkUrls[chain],
      skipCatchup: !!skipCatchup,
      excludedEvents: excludedEvents || [],
      contractAddresses,
    };
  }

  public async init(): Promise<void> {
    try {
      this._api = await createApi(
        this._listenerArgs.url,
        this._listenerArgs.contractAddresses
      );
    } catch (error) {
      console.error('Fatal error occurred while starting the API');
      throw error;
    }

    try {
      this._processor = new Processor(this._api);
      this._subscriber = await new Subscriber(this._api, this._chain, false);
    } catch (error) {
      console.error(
        'Fatal error occurred while starting the Processor, and Subscriber'
      );
      throw error;
    }

    try {
      const web3 = new Web3(
        (this._api.comp.provider as Web3Provider)
          ._web3Provider as WebsocketProvider
      );
      const dater = new EthDater(web3);
      this._storageFetcher = new StorageFetcher(this._api, dater);
    } catch (error) {
      console.error(
        'Fatal error occurred while starting the Ethereum dater and storage fetcher'
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
      this._subscribed = true;
    } catch (error) {
      console.error(`Subscription error: ${error.message}`);
    }
  }

  public async unsubscribe(): Promise<void> {
    if (!this._subscriber) {
      console.log(
        `Subscriber for ${this._chain} isn't initialized. Please run init() first!`
      );
      return;
    }
    try {
      this._subscriber.unsubscribe();
      this._subscribed = false;
    } catch (error) {
      console.error('Fatal error occurred while unsubscribing');
      throw error;
    }
  }

  public async updateContractAddress(
    contractName: string,
    address: string
  ): Promise<void> {
    if (contractName != ('comp' || 'governorAlpha' || 'timelock')) {
      console.log('Contract is not supported');
      return;
    }
    switch (contractName) {
      case 'comp':
        this._listenerArgs.contractAddresses.comp = address;
        break;
      case 'governorAlpha':
        this._listenerArgs.contractAddresses.governorAlpha = address;
        break;
      case 'timelock':
        this._listenerArgs.contractAddresses.timelock = address;
        break;
    }

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

    try {
      const cwEvents = await this._storageFetcher.fetch(offlineRange);
      for (const event of cwEvents) {
        await this.handleEvent(event);
      }
    } catch (error) {
      console.error(`Unable to fetch events from storage: ${error.message}`);
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

  public get subscribed(): boolean {
    return this._subscribed;
  }
}
