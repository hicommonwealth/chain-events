import sleep from 'sleep-promise';
import _ from 'underscore';
import BN from 'bn.js';

import { createProvider } from '../../eth';
import { CWEvent, SubscribeFunc, ISubscribeOptions } from '../../interfaces';
import { factory, formatFilename } from '../../logging';
import { ERC20__factory as ERC20Factory, ERC20 } from '../../contractTypes';

import { Subscriber } from './subscriber';
import { Processor } from './processor';
import { IEventData, RawEvent, IErc20Contracts } from './types';
import { EnricherConfig } from './filters/enricher';

const log = factory.getLogger(formatFilename(__filename));

export interface IErc20SubscribeOptions
  extends ISubscribeOptions<IErc20Contracts> {
  enricherConfig?: EnricherConfig;
}

/**
 * Attempts to open an API connection, retrying if it cannot be opened.
 * @param ethNetworkUrl
 * @param tokenAddresses
 * @param tokenNames
 * @param retryTimeMs
 * @returns a promise resolving to an ApiPromise once the connection has been established

 */
export async function createApi(
  ethNetworkUrl: string,
  tokenAddresses: string[],
  tokenNames?: string[],
  retryTimeMs = 10 * 1000
): Promise<IErc20Contracts> {
  const chainLog = factory.getLogger(`${formatFilename(__filename)}::Erc20`);

  for (let i = 0; i < 3; ++i) {
    try {
      const provider = await createProvider(ethNetworkUrl, 'Erc20');
      chainLog.info(`Connection to ${ethNetworkUrl} successful!`);

      const tokenContracts = tokenAddresses.map((o) =>
        ERC20Factory.connect(o, provider)
      );
      const deployResults: IErc20Contracts = { provider, tokens: [] };
      for (const [contract, tokenName] of _.zip(tokenContracts, tokenNames) as [
        ERC20,
        string | undefined
      ][]) {
        try {
          await contract.deployed();
          const totalSupply = new BN((await contract.totalSupply()).toString());
          deployResults.tokens.push({
            contract,
            totalSupply,
            tokenName,
          });
        } catch (err) {
          chainLog.error(
            `Error loading token ${contract.address} (${tokenName}): ${err.message}`
          );
        }
      }
      return deployResults;
    } catch (err) {
      chainLog.error(`Erc20 at ${ethNetworkUrl} failure: ${err.message}`);
      await sleep(retryTimeMs);
      chainLog.error('Retrying connection...');
    }
  }

  throw new Error(
    `[Erc20]: Failed to start the ERC20 listener for ${tokenAddresses} at ${ethNetworkUrl}`
  );
}

/**
 * This is the main function for edgeware event handling. It constructs a connection
 * to the chain, connects all event-related modules, and initializes event handling.
 * @param options
 * @returns An active block subscriber.
 */
export const subscribeEvents: SubscribeFunc<
  IErc20Contracts,
  RawEvent,
  IErc20SubscribeOptions
> = async (options) => {
  const { chain, api, handlers, verbose, enricherConfig } = options;
  // helper function that sends an event through event handlers
  const handleEventFn = async (
    event: CWEvent<IEventData>,
    tokenName?: string
  ): Promise<void> => {
    event.chain = (tokenName as never) || chain;
    event.received = Date.now();
    let prevResult = null;
    for (const handler of handlers) {
      try {
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
  const processor = new Processor(api, enricherConfig || {});
  const processEventFn = async (
    event: RawEvent,
    tokenName?: string
  ): Promise<void> => {
    // retrieve events from block
    const cwEvents: CWEvent<IEventData>[] = await processor.process(event);

    // process events in sequence
    for (const cwEvent of cwEvents) {
      await handleEventFn(cwEvent, tokenName);
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
