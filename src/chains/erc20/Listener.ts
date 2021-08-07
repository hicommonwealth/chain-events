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

import log from '../../logging';

export class Listener extends BaseListener {
  private readonly _options: Erc20ListenerOptions;

  constructor(
    chain: EventSupportingChainT,
    tokenAddresses: string[],
    url?: string,
    verbose?: boolean,
    ignoreChainType?: boolean
  ) {
    super(chain, verbose);
    if (!ignoreChainType && !chainSupportedBy(this._chain, erc20Chains))
      throw new Error(`${chain} is not an ERC20 token`);

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
      log.error('Fatal error occurred while starting the API');
      throw error;
    }

    try {
      this._processor = new Processor(this._api);
      this._subscriber = new Subscriber(this._api, this._chain, this._verbose);
    } catch (error) {
      log.error(
        'Fatal error occurred while starting the Processor and Subscriber'
      );
      throw error;
    }
  }

  public async subscribe(): Promise<void> {
    if (!this._subscriber) {
      log.info(
        `Subscriber for ${this._chain} isn't initialized. Please run init() first!`
      );
      return;
    }

    try {
      log.info(
        `Subscribing to ERC20 contracts: ${this._chain}, on url ${this._options.url}`
      );
      await this._subscriber.subscribe(this.processBlock.bind(this));
      this._subscribed = true;
    } catch (error) {
      log.error(`Subscription error: ${error.message}`);
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
