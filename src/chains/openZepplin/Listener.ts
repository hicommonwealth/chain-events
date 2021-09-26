import {
  chainSupportedBy,
  CWEvent,
  EventSupportingChainT,
  IDisconnectedRange,
} from '../../interfaces';
import { Listener as BaseListener } from '../../Listener';
import { factory, formatFilename } from '../../logging';

import {
  ListenerOptions as OpenZepplinListenerOptions,
  RawEvent,
  Api,
  EventChains as CompoundChains,
  IEventData,
  EventKind,
} from './types';
import { Processor } from './processor';
import { Subscriber } from './subscriber';
import { createApi } from './subscribeFunc';

const log = factory.getLogger(formatFilename(__filename));

export class Listener extends BaseListener<
  Api,
  null,
  Processor,
  Subscriber,
  EventKind
> {
  private readonly _options: OpenZepplinListenerOptions;

  constructor(
    chain: EventSupportingChainT,
    govContractAddress: string,
    url?: string,
    skipCatchup?: boolean,
    verbose?: boolean,
    discoverReconnectRange?: (chain: string) => Promise<IDisconnectedRange>
  ) {
    super(chain, verbose);
    if (!chainSupportedBy(this._chain, CompoundChains))
      throw new Error(
        `${this._chain} is not an Open Zepplin Governor contract`
      );

    this._options = {
      url,
      skipCatchup: !!skipCatchup,
      govContractAddress,
    };

    this._subscribed = false;
    this.discoverReconnectRange = discoverReconnectRange;
  }

  public async init(): Promise<void> {
    try {
      this._api = await createApi(
        this._options.url,
        this._options.govContractAddress
      );
    } catch (error) {
      log.error('Fatal error occurred while starting the API');
      throw error;
    }

    try {
      this._processor = new Processor(this._api);
      this._subscriber = await new Subscriber(
        this._api,
        this._chain,
        this._verbose
      );
    } catch (error) {
      log.error(
        'Fatal error occurred while starting the Processor, and Subscriber'
      );
      throw error;
    }
  }

  public get options(): OpenZepplinListenerOptions {
    return this._options;
  }

  protected async processBlock(event: RawEvent): Promise<void> {
    const { blockNumber } = event;
    if (!this._lastBlockNumber || blockNumber > this._lastBlockNumber) {
      this._lastBlockNumber = blockNumber;
    }

    const cwEvents: CWEvent[] = await this._processor.process(event);

    // process events in sequence
    for (const e of cwEvents) await this.handleEvent(e);
  }

  public async subscribe(): Promise<void> {
    if (!this._subscriber) {
      log.info(
        `Subscriber for ${this._chain} isn't initialized. Please run init() first!`
      );
      return;
    }

    // processed blocks missed during downtime
    // if (!this._options.skipCatchup) await this.processMissedBlocks();
    // else log.info('Skipping event catchup on startup!');

    try {
      log.info(
        `Subscribing to Open Zepplin Governor contract: ${this._chain}, on url ${this._options.url}`
      );
      await this._subscriber.subscribe(this.processBlock.bind(this));
      this._subscribed = true;
    } catch (error) {
      log.error(`Subscription error: ${error.message}`);
    }
  }
}
