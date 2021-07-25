import {
  chainSupportedBy,
  CWEvent,
  EventSupportingChainT,
  IDisconnectedRange,
  IStorageFetcher,
} from '../../interfaces';
import { networkUrls } from '../../index';
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
import { Listener as BaseListener } from '../../Listener';

export class Listener extends BaseListener {
  private readonly _options: MolochListenerOptions;
  public globalExcludedEvents: MolochEventKinds[];
  public _storageFetcher: IStorageFetcher<Api>;
  private _lastBlockNumber: number;

  constructor(
    chain: EventSupportingChainT,
    contractVersion: 1 | 2,
    contractAddress: string,
    url: string,
    skipCatchup?: boolean,
    verbose?: boolean
  ) {
    super(chain, verbose);
    if (!chainSupportedBy(this._chain, molochChains))
      throw new Error(`${this._chain} is not a moloch network`);

    this._options = {
      url: url || networkUrls[chain],
      skipCatchup: !!skipCatchup,
      contractAddress: contractAddress,
      contractVersion: contractVersion,
    };

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
      const web3 = new Web3(
        (this._api.provider as Web3Provider)._web3Provider as WebsocketProvider
      );
      const dater = new EthDater(web3);
      this._storageFetcher = new StorageFetcher(
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

  public get lastBlockNumber(): number {
    return this._lastBlockNumber;
  }

  public get chain(): string {
    return this._chain;
  }

  public get options(): MolochListenerOptions {
    return this._options;
  }

  public get subscribed(): boolean {
    return this._subscribed;
  }
}
