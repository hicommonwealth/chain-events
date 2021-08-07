import { Listener as BaseListener } from '../../Listener';
import {
  ListenerOptions as AaveListenerOptions,
  EventChains as AaveEventChains,
  IEventData,
  RawEvent,
  Api,
} from './types';
import { createApi } from './subscribeFunc';
import {
  chainSupportedBy,
  CWEvent,
  EventSupportingChainT,
  IDisconnectedRange,
  IStorageFetcher,
} from '../../interfaces';
import { networkUrls } from '../../index';
import { Subscriber } from './subscriber';
import { Processor } from './processor';
import log from '../../logging';
import { StorageFetcher } from './storageFetcher';

export class Listener extends BaseListener {
  private readonly _options: AaveListenerOptions;
  public lastBlockNumber: number;
  public discoverReconnectRange: (chain: string) => Promise<IDisconnectedRange>;
  public storageFetcher: IStorageFetcher<Api>;

  constructor(
    chain: EventSupportingChainT,
    govContractAddress: string,
    url?: string,
    skipCatchup?: boolean,
    verbose?: boolean,
    ignoreChainType?: boolean,
    discoverReconnectRange?: (chain: string) => Promise<IDisconnectedRange>
  ) {
    super(chain, verbose);
    if (!ignoreChainType && !chainSupportedBy(this._chain, AaveEventChains))
      throw new Error(`${this._chain} is not an Aave chain`);

    this._options = {
      url: url || networkUrls[chain],
      govContractAddress,
      skipCatchup: !!skipCatchup,
    };

    this.discoverReconnectRange = discoverReconnectRange;

    this._subscribed = false;
  }

  public async init(): Promise<void> {
    try {
      this._api = await createApi(
        this._options.url,
        this._options.govContractAddress
      );
    } catch (error) {
      log.error(
        `[${this._chain}]: Fatal error occurred while starting the API`
      );
      throw error;
    }

    try {
      this._processor = new Processor(this._api);
      this._subscriber = new Subscriber(this._api, this._chain, this._verbose);
      this.storageFetcher = new StorageFetcher(this._api);
    } catch (error) {
      log.error(
        `[${this._chain}]: Fatal error occurred while starting the Processor, StorageFetcher and Subscriber`
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

    if (!this.options.skipCatchup) await this.processMissedBlocks();
    else log.info(`[${this._chain}]: Skipping event catchup!`);

    try {
      log.info(
        `[${this._chain}]: Subscribing to Aave contract: ${this._chain}, on url ${this._options.url}`
      );
      await this._subscriber.subscribe(this.processBlock.bind(this));
      this._subscribed = true;
    } catch (error) {
      log.error(`[${this._chain}]: Subscription error: ${error.message}`);
    }
  }

  public async updateAddress(): Promise<void> {}

  private async processMissedBlocks(): Promise<void> {
    if (!this.discoverReconnectRange) {
      log.info(
        `[${this._chain}]: Unable to determine offline range - No discoverReconnectRange function given`
      );
    }
    log.info(
      `[${this._chain}]: Detected offline time, polling missed blocks...`
    );

    log.info(
      `[${this._chain}]: Fetching missed events since last startup of ${this._chain}...`
    );
    let offlineRange: IDisconnectedRange;
    try {
      offlineRange = await this.discoverReconnectRange(this._chain);
      if (!offlineRange) {
        log.warn(
          `[${this._chain}]: No offline range found, skipping event catchup.`
        );
        return;
      }
    } catch (error) {
      log.error(
        `[${this._chain}]: Could not discover offline range: ${error.message}. Skipping event catchup.`
      );
      return;
    }

    try {
      const cwEvents = await this.storageFetcher.fetch(offlineRange);
      for (const event of cwEvents) {
        await this.handleEvent(event);
      }
    } catch (error) {
      log.error(
        `[${this._chain}]: Unable to fetch events from storage: ${error.message}`
      );
    }
  }

  protected async processBlock(event: RawEvent): Promise<void> {
    const cwEvents: CWEvent[] = await this._processor.process(event);

    for (const event of cwEvents) {
      await this.handleEvent(event as CWEvent<IEventData>);
    }
  }
  public get chain(): string {
    return this._chain;
  }

  public get options(): AaveListenerOptions {
    return this._options;
  }

  public get subscribed(): boolean {
    return this._subscribed;
  }
}
