import {
  ListenerOptions as MarlinListenerOptions,
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
  IDisconnectedRange,
  IStorageFetcher,
} from '../../interfaces';
import { networkUrls } from '../../index';
import { Processor } from './processor';
import { StorageFetcher } from './storageFetcher';
import Web3 from 'web3';
import { Web3Provider } from 'ethers/providers';
import { WebsocketProvider } from 'web3-core';
import { Subscriber } from './subscriber';
import EthDater from 'ethereum-block-by-date';
import { Listener as BaseListener } from '../../Listener';

export class Listener extends BaseListener {
  private readonly _options: MarlinListenerOptions;
  public _storageFetcher: IStorageFetcher<Api>;
  private _lastBlockNumber: number;

  constructor(
    chain: EventSupportingChainT,
    contractAddresses: {
      comp: string;
      governorAlpha: string;
      timelock: string;
    },
    url?: string,
    skipCatchup?: boolean,
    verbose?: boolean
  ) {
    super(chain, verbose);
    if (!chainSupportedBy(this._chain, MarlinChains))
      throw new Error(`${this._chain} is not a Substrate chain`);

    this._options = {
      url: url || networkUrls[chain],
      skipCatchup: !!skipCatchup,
      contractAddresses,
    };

    this._subscribed = false;
  }

  public async init(): Promise<void> {
    try {
      this._api = await createApi(
        this._options.url,
        this._options.contractAddresses
      );
    } catch (error) {
      console.error('Fatal error occurred while starting the API');
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
    if (!this._options.skipCatchup) await this.processMissedBlocks();
    else console.log('Skipping event catchup on startup!');

    try {
      console.info(
        `Subscribing to Marlin contract: ${this._chain}, on url ${this._options.url}`
      );
      await this._subscriber.subscribe(this.processBlock.bind(this));
      this._subscribed = true;
    } catch (error) {
      console.error(`Subscription error: ${error.message}`);
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
        this._options.contractAddresses.comp = address;
        break;
      case 'governorAlpha':
        this._options.contractAddresses.governorAlpha = address;
        break;
      case 'timelock':
        this._options.contractAddresses.timelock = address;
        break;
    }

    await this.init();
    if (this._subscribed === true) await this.subscribe();
  }

  protected async processBlock(event: RawEvent): Promise<void> {
    const cwEvents: CWEvent[] = await this._processor.process(event);

    // process events in sequence
    for (const event of cwEvents)
      await this.handleEvent(event as CWEvent<IEventData>);
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
        await this.handleEvent(event as CWEvent<IEventData>);
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

  public get options(): MarlinListenerOptions {
    return this._options;
  }

  public get subscribed(): boolean {
    return this._subscribed;
  }
}
