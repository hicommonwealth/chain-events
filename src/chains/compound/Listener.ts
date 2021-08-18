import {
  ListenerOptions as CompoundListenerOptions,
  RawEvent,
  Api,
  EventChains as CompoundChains,
  IEventData,
  EventKind,
} from './types';

import { createApi } from './subscribeFunc';

import {
  chainSupportedBy,
  CWEvent,
  EventSupportingChainT,
  IDisconnectedRange,
} from '../../interfaces';
import { networkUrls } from '../../index';
import { Processor } from './processor';
import { StorageFetcher } from './storageFetcher';
import { Subscriber } from './subscriber';
import { Listener as BaseListener } from '../../Listener';
import { factory, formatFilename } from '../../logging';

const log = factory.getLogger(formatFilename(__filename));

export class Listener extends BaseListener<
  Api,
  StorageFetcher,
  Processor,
  Subscriber,
  EventKind
> {
  private readonly _options: CompoundListenerOptions;

  constructor(
    chain: EventSupportingChainT,
    contractAddress: string,
    url?: string,
    skipCatchup?: boolean,
    verbose?: boolean,
    discoverReconnectRange?: (chain: string) => Promise<IDisconnectedRange>
  ) {
    super(chain, verbose);
    if (!chainSupportedBy(this._chain, CompoundChains))
      throw new Error(`${this._chain} is not a Compound contract`);

    this._options = {
      url: url || networkUrls[chain],
      skipCatchup: !!skipCatchup,
      contractAddress,
    };

    this._subscribed = false;
    this.discoverReconnectRange = discoverReconnectRange;
  }

  public async init(): Promise<void> {
    try {
      this._api = await createApi(
        this._options.url,
        this._options.contractAddress
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

    try {
      this.storageFetcher = new StorageFetcher(this._api);
    } catch (error) {
      log.error(
        'Fatal error occurred while starting the Ethereum dater and storage fetcher'
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

    // processed blocks missed during downtime
    if (!this._options.skipCatchup) await this.processMissedBlocks();
    else log.info('Skipping event catchup on startup!');

    try {
      log.info(
        `Subscribing to Compound contract: ${this._chain}, on url ${this._options.url}`
      );
      await this._subscriber.subscribe(this.processBlock.bind(this));
      this._subscribed = true;
    } catch (error) {
      log.error(`Subscription error: ${error.message}`);
    }
  }

  public async updateContractAddress(
    contractName: string,
    address: string
  ): Promise<void> {
    if (contractName != ('comp' || 'governorAlpha' || 'timelock')) {
      log.info('Contract is not supported');
      return;
    }
    this._options.contractAddress = address;

    await this.init();
    if (this._subscribed === true) await this.subscribe();
  }

  protected async processBlock(event: RawEvent): Promise<void> {
    const blockNumber = event.blockNumber;
    if (!this._lastBlockNumber || blockNumber > this._lastBlockNumber) {
      this._lastBlockNumber = blockNumber;
    }

    const cwEvents: CWEvent[] = await this._processor.process(event);

    // process events in sequence
    for (const event of cwEvents)
      await this.handleEvent(event as CWEvent<IEventData>);
  }

  private async processMissedBlocks(): Promise<void> {
    log.info(
      `[${this._chain}]: Detected offline time, polling missed blocks...`
    );

    if (!this.discoverReconnectRange) {
      log.info(
        `[${this._chain}]: Unable to determine offline range - No discoverReconnectRange function given`
      );
      return;
    }

    let offlineRange: IDisconnectedRange;
    try {
      // fetch the block of the last server event from database
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
      log.warn(`[${this._chain}]: Unable to determine offline time range.`);
      return;
    }

    try {
      const cwEvents = await this.storageFetcher.fetch(offlineRange);
      for (const event of cwEvents) {
        await this.handleEvent(event as CWEvent<IEventData>);
      }
    } catch (error) {
      log.error(`Unable to fetch events from storage: ${error.message}`);
    }
  }

  public get options(): CompoundListenerOptions {
    return this._options;
  }
}
