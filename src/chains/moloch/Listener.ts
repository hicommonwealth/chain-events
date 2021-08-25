import EthDater from 'ethereum-block-by-date';

import {
  chainSupportedBy,
  CWEvent,
  EventSupportingChainT,
  IDisconnectedRange,
} from '../../interfaces';
import { networkUrls, contracts } from '../../index';
import { Listener as BaseListener } from '../../Listener';
import { factory, formatFilename } from '../../logging';

import {
  EventKind,
  Api,
  RawEvent,
  EventChains as molochChains,
  ListenerOptions as MolochListenerOptions,
  IEventData,
} from './types';

import { createApi, Processor, StorageFetcher, Subscriber } from '.';

const log = factory.getLogger(formatFilename(__filename));

export class Listener extends BaseListener<
  Api,
  StorageFetcher,
  Processor,
  Subscriber,
  EventKind
> {
  private readonly _options: MolochListenerOptions;

  constructor(
    chain: EventSupportingChainT,
    contractVersion?: 1 | 2,
    contractAddress?: string,
    url?: string,
    skipCatchup?: boolean,
    verbose?: boolean,
    discoverReconnectRange?: (chain: string) => Promise<IDisconnectedRange>
  ) {
    super(chain, verbose);
    if (!chainSupportedBy(this._chain, molochChains))
      throw new Error(`${this._chain} is not a moloch network`);

    this._options = {
      url: url || networkUrls[chain],
      skipCatchup: !!skipCatchup,
      contractAddress: contractAddress || contracts[chain],
      contractVersion: contractVersion || 1,
    };

    this.discoverReconnectRange = discoverReconnectRange;
    this._subscribed = false;
  }

  public async init(): Promise<void> {
    try {
      this._api = await createApi(
        this._options.url,
        this._options.contractVersion,
        this._options.contractAddress
      );
    } catch (error) {
      console.error('Fatal error occurred while starting the API');
      throw error;
    }

    try {
      this._processor = new Processor(this._api, this._options.contractVersion);
      this._subscriber = await new Subscriber(
        this._api,
        this._chain,
        this._verbose
      );
    } catch (error) {
      console.error(
        'Fatal error occurred while starting the Processor, and Subscriber'
      );
      throw error;
    }
    try {
      const dater = new EthDater(this._api.provider);
      this.storageFetcher = new StorageFetcher(
        this._api,
        this._options.contractVersion,
        dater
      );
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
    if (!this._options.skipCatchup) await this.processMissedBlocks();
    else console.log('Skipping event catchup on startup!');

    try {
      console.info(
        `Subscribing Moloch contract: ${this._chain}, on url ${this._options.url}`
      );
      await this._subscriber.subscribe(this.processBlock.bind(this));
      this._subscribed = true;
    } catch (error) {
      console.error(`Subscription error: ${error.message}`);
    }
  }

  protected async processBlock(event: RawEvent): Promise<void> {
    const { blockNumber } = event;
    if (!this._lastBlockNumber || blockNumber > this._lastBlockNumber) {
      this._lastBlockNumber = blockNumber;
    }

    const cwEvents: CWEvent[] = await this._processor.process(event);

    // process events in sequence
    for (const cwEvent of cwEvents) await this.handleEvent(cwEvent);
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

      // process events in sequence
      for (const event of cwEvents) {
        await this.handleEvent(event as CWEvent<IEventData>);
      }
    } catch (e) {
      console.error(`Unable to fetch events from storage: ${e.message}`);
    }
  }

  public async updateContractVersion(version: 1 | 2): Promise<void> {
    if (version === this._options.contractVersion) {
      console.log(`The contract version is already set to ${version}`);
      return;
    }

    this._options.contractVersion = version;
    await this.init();
    // only subscribe if the listener was already subscribed before the version change
    if (this._subscribed === true) await this.subscribe();
  }

  public async updateContractAddress(address: string): Promise<void> {
    if (address === this._options.contractAddress) {
      console.log(`The contract address is already set to ${address}`);
      return;
    }

    this._options.contractAddress = address;
    await this.init();
    if (this._subscribed === true) await this.subscribe();
  }

  public get options(): MolochListenerOptions {
    return this._options;
  }
}
