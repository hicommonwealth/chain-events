import {
  ListenerOptions as Erc20ListenerOptions,
  RawEvent,
  EventChains as erc20Chains,
  IEventData,
} from './types';

import { createApi } from './subscribeFunc';

import {
  chainSupportedBy,
  CWEvent,
  EventSupportingChainT,
} from '../../interfaces';
import { networkUrls } from '../../index';
import { Processor } from './processor';
import { Subscriber } from './subscriber';
import { Listener as BaseListener } from '../../Listener';

export class Listener extends BaseListener {
  private readonly _options: Erc20ListenerOptions;

  constructor(
    chain: EventSupportingChainT,
    tokenAddresses: string[],
    url?: string,
    verbose?: boolean
  ) {
    super(chain, verbose);
    if (!chainSupportedBy(this._chain, erc20Chains))
      throw new Error(`${chain} is not a Substrate chain`);

    this._options = {
      url: url || networkUrls[chain],
      tokenAddresses: tokenAddresses,
    };

    this._subscribed = false;
  }

  public async init(): Promise<void> {
    try {
      this._api = await createApi(
        this._options.url,
        this._options.tokenAddresses
      );
    } catch (error) {
      console.error('Fatal error occurred while starting the API');
      throw error;
    }

    try {
      this._processor = new Processor(this._api);
      this._subscriber = new Subscriber(this._api, this._chain, this._verbose);
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
        `Subscribing to ERC20 contracts: ${this._chain}, on url ${this._options.url}`
      );
      await this._subscriber.subscribe(this.processBlock.bind(this));
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
    this._options.tokenAddresses = tokenAddresses;
    await this.init();
    if (this._subscribed === true) await this.subscribe();
  }

  protected async processBlock(event: RawEvent): Promise<void> {
    const cwEvents: CWEvent[] = await this._processor.process(event);

    // process events in sequence
    for (const event of cwEvents)
      await this.handleEvent(event as CWEvent<IEventData>);
  }

  public get chain(): string {
    return this._chain;
  }

  public get options(): Erc20ListenerOptions {
    return this._options;
  }

  public get subscribed(): boolean {
    return this._subscribed;
  }
}
