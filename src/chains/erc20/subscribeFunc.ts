import { providers } from 'ethers';
import Web3 from 'web3';
import sleep from 'sleep-promise';
import fetch from 'node-fetch';

import { CWEvent, SubscribeFunc, ISubscribeOptions } from '../../interfaces';
import { factory, formatFilename } from '../../logging';

import { Erc20Factory } from './contractTypes/Erc20Factory';
import { Subscriber } from './subscriber';
import { Processor } from './processor';
import { IEventData, RawEvent, Api } from './types';
import { EnricherConfig } from './filters/enricher';

const log = factory.getLogger(formatFilename(__filename));

export interface IErc20SubscribeOptions extends ISubscribeOptions<Api> {
  enricherConfig?: EnricherConfig;
}

/**
 * Attempts to open an API connection, retrying if it cannot be opened.
 * @returns a promise resolving to an ApiPromise once the connection has been established
 * @param ethNetworkUrl
 * @param tokenAddresses
 * @param retryTimeMs
 * @param retryCount
 */
export async function createApi(
  ethNetworkUrl: string,
  tokenAddresses: string[],
  retryTimeMs = 10 * 1000,
  retryCount: number = 0
): Promise<Api> {
  // TODO: are if statements here necessary?
  if (ethNetworkUrl.includes('infura')) {
    if (process && process.env) {
      const { INFURA_API_KEY } = process.env;
      if (!INFURA_API_KEY) {
        throw new Error('no infura key found!');
      }
      ethNetworkUrl = `wss://mainnet.infura.io/ws/v3/${INFURA_API_KEY}`;

      let res, data;
      try {
        res = await fetch(`https://mainnet.infura.io/v3/${INFURA_API_KEY}`, {
          method: 'POST',
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_getBalance',
            params: ['0xBf4eD7b27F1d666546E30D74d50d173d20bca754', 'latest'],
            id: 1,
          }),
          headers: { 'Content-Type': 'application/json' },
        });

        data = await res.json();

        if (
          !data ||
          !Object.keys(data).includes('jsonrpc') ||
          !Object.keys(data).includes('id') ||
          !Object.keys(data).includes('result')
        )
          throw new Error('A connection to infura could not be established.');
      } catch (error) {
        log.error('Check your INFURA_API_KEY');
        throw error;
      }
    } else throw new Error('must use nodejs to connect to infura provider!');
  }
  try {
    const web3Provider = new Web3.providers.WebsocketProvider(ethNetworkUrl, {
      reconnect: {
        auto: true,
        delay: retryTimeMs,
        onTimeout: true,
      },
    });
    const provider = new providers.Web3Provider(web3Provider);

    const tokenContracts = tokenAddresses.map((o) =>
      Erc20Factory.connect(o, provider)
    );
    const deployResults = await Promise.all(
      tokenContracts.map((o) =>
        o
          .deployed()
          .then(() => {
            return { token: o, deployed: true };
          })
          .catch((err) => {
            log.error('Failed to deploy', err);
            return { token: o, deployed: false };
          })
      )
    );

    const result = deployResults.filter((o) => o.deployed).map((o) => o.token);

    log.info('Connection successful!');
    return { tokens: result, provider };
  } catch (err) {
    log.error(`Erc20 at ${ethNetworkUrl} failure: ${err.message}`);

    if (retryCount < 3) {
      await sleep(retryTimeMs);
      log.error('Retrying connection...');
      return createApi(
        ethNetworkUrl,
        tokenAddresses,
        retryTimeMs,
        ++retryCount
      );
    } else
      throw new Error(
        `Failed to start the ERC20 listener for ${tokenAddresses} at ${ethNetworkUrl}`
      );
  }
}

/**
 * This is the main function for edgeware event handling. It constructs a connection
 * to the chain, connects all event-related modules, and initializes event handling.
 * @param options
 * @returns An active block subscriber.
 */
export const subscribeEvents: SubscribeFunc<
  Api,
  RawEvent,
  IErc20SubscribeOptions
> = async (options) => {
  const { chain, api, handlers, verbose } = options;
  // helper function that sends an event through event handlers
  const handleEventFn = async (event: CWEvent<IEventData>): Promise<void> => {
    let prevResult = null;
    for (const handler of handlers) {
      try {
        event.chain = chain;
        event.received = Date.now();
        // pass result of last handler into next one (chaining db events)
        prevResult = await handler.handle(event, prevResult);
      } catch (err) {
        log.error(`Event handle failure: ${err.message}`);
        break;
      }
    }
  };

  // helper function that sends a block through the event processor and
  // into the event handlers
  const processor = new Processor(api);
  const processEventFn = async (event: RawEvent): Promise<void> => {
    // retrieve events from block
    const cwEvents: CWEvent<IEventData>[] = await processor.process(event);

    // process events in sequence
    for (const cwEvent of cwEvents) {
      await handleEventFn(cwEvent);
    }
  };

  const subscriber = new Subscriber(api, chain, verbose);

  // helper function that runs after we've been offline/the server's been down,
  // and attempts to fetch skipped events

  try {
    log.info(`Subscribing to ERC20 contracts ${chain}...`);
    await subscriber.subscribe(processEventFn);
  } catch (e) {
    log.error(`Subscription error: ${e.message}`);
  }

  return subscriber;
};
