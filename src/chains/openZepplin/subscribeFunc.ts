import sleep from 'sleep-promise';

import { factory, formatFilename } from '../../logging';
import { createProvider } from '../../eth';
import { Governor__factory as GovernorFactory } from '../../contractTypes';
import {
  CWEvent,
  IDisconnectedRange,
  ISubscribeOptions,
  SubscribeFunc,
} from '../../interfaces';

import { Api, IEventData, RawEvent } from './types';
import { Processor } from './processor';
import { Subscriber } from './subscriber';

const log = factory.getLogger(formatFilename(__filename));

/**
 * Attempts to open an API connection, retrying 3 times if it cannot be opened
 * @param ethNetworkUrl A url to a eth node endpoint such as wss://mainnet.infura.io/ws
 * @param govContractAddress The address of an Open Zepplin Governor contract: https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/governance/Governor.sol
 * @param retryTimeMs The number of milliseconds to wait before retrying to connect to the eth node
 */
export async function createApi(
  ethNetworkUrl: string,
  govContractAddress: string,
  retryTimeMs = 10000
): Promise<Api> {
  for (let i = 0; i < 3; ++i) {
    try {
      const provider = await createProvider(ethNetworkUrl);
      const govContract = GovernorFactory.connect(govContractAddress, provider);
      await govContract.deployed();

      log.info('Connection to deployed governance contract successful!');
      return govContract;
    } catch (error) {
      log.error(
        `Open Zepplin gov contract ${govContractAddress} connecting to ${ethNetworkUrl} failure: ${error.message}`
      );
      await sleep(retryTimeMs);
      log.error('Retrying connection...');
    }
  }
  throw new Error(
    `Failed to start Api for Open Zepplin contract ${govContractAddress} using ${ethNetworkUrl}`
  );
}

/**
 * This is the main function for edgeware event handling. It constructs a connection
 * to the chain, connects all event-related modules, and initializes event handling.
 *
 * @param url The edgeware chain endpoint to connect to.
 * @param handler An event handler object for processing received events.
 * @param skipCatchup If true, skip all fetching of "historical" chain data that may have been
 *                    emitted during downtime.
 * @param discoverReconnectRange A function to determine how long we were offline upon reconnection.
 * @returns An active block subscriber.
 */
export const subscribeEvents: SubscribeFunc<
  Api,
  RawEvent,
  ISubscribeOptions<Api>
> = async (options) => {
  const { chain, api, handlers, verbose } = options;
  // helper function that sends an event through event handlers
  const handleEventFn = async (event: CWEvent<IEventData>): Promise<void> => {
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

  try {
    log.info(`Subscribing to Compound contracts ${chain}...`);
    await subscriber.subscribe(processEventFn);
  } catch (e) {
    log.error(`Subscription error: ${e.message}`);
  }

  return subscriber;
};
