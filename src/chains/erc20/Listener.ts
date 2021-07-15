import {
  ListenerOptions as erc20ListenerOptions,
  EventKind as erc20Events,
  RawEvent,
  Api,
  EventChains as erc20Chains,
  IEventData,
} from './types';

import { createApi } from './subscribeFunc';

import {
  chainSupportedBy,
  CWEvent,
  EventSupportingChainT,
  IChainEventKind,
  IEventHandler,
  IEventProcessor,
  IEventSubscriber,
  IListenerOptions,
} from '../../interfaces';
import { networkUrls } from '../../listener/createListener';
import { Processor } from './processor';
import { Subscriber } from './subscriber';

export class Listener {
  private readonly _listenerArgs: erc20ListenerOptions;
  public eventHandlers: {
    [key: string]: {
      handler: IEventHandler;
      excludedEvents: erc20Events[];
    };
  };
  // events to be excluded regardless of handler (overrides handler specific excluded events
  public globalExcludedEvents: erc20Events[];
  private _subscriber: IEventSubscriber<Api, RawEvent>;
  private _processor: IEventProcessor<Api, RawEvent>;
  private _api: Api;
  private _lastBlockNumber: number;
  private readonly _chain: string;
  private _subscribed: boolean;

  constructor(
    chain: EventSupportingChainT,
    tokenAddresses: string[],
    url?: string,
    archival?: boolean,
    startBlock?: number,
    skipCatchup?: boolean,
    excludedEvents?: IChainEventKind[]
  ) {
    if (!chainSupportedBy(chain, erc20Chains))
      throw new Error(`${chain} is not a Substrate chain`);

    this._chain = chain;
    this._listenerArgs = {
      archival: !!archival,
      startBlock: startBlock ?? 0,
      url: url || networkUrls[chain],
      skipCatchup: !!skipCatchup,
      excludedEvents: excludedEvents || [],
      tokenAddresses: tokenAddresses,
    };
  }

  public async init(): Promise<void> {
    try {
      this._api = await createApi(
        this._listenerArgs.url,
        this._listenerArgs.tokenAddresses
      );
    } catch (error) {
      console.error('Fatal error occurred while starting the API');
      throw error;
    }

    try {
      this._processor = new Processor(this._api);
      this._subscriber = new Subscriber(this._api, this._chain, false);
    } catch (error) {
      console.error(
        'Fatal error occurred while starting the Processor, and Subscriber'
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

    try {
      console.info(
        `Subscribing to ERC20 contracts: ${this._chain}, on url ${this._listenerArgs.url}`
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

  public async updateTokenList(tokenAddresses: string[]): Promise<void> {
    this._listenerArgs.tokenAddresses = tokenAddresses;
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
    for (const event of cwEvents)
      await this.handleEvent(event as CWEvent<IEventData>);
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
