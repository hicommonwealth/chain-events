import * as yargs from 'yargs';
import { createListener, getRabbitMQConfig } from '../src/util';
import { EventChains as SubstrateChains } from '../src/chains/substrate/types';
import { Listener as SubstrateListener } from '../src/chains/substrate/Listener';
import { EventChains as MolochChains } from '../src/chains/moloch/types';
import { Listener as MolochListener } from '../src/chains/moloch/Listener';
import { EventChains as MarlinChains } from '../src/chains/marlin/types';
import { Listener as MarlinListener } from '../src/chains/marlin/Listener';
import { EventChains as Erc20Chain } from '../src/chains/erc20/types';
import { Listener as Erc20Listener } from '../src/chains/erc20/Listener';

import {
  EventSupportingChains,
  chainSupportedBy,
  SubstrateEvents,
  MolochEvents,
} from '../src';

import * as fs from 'fs';
import { RabbitMqHandler } from '../src/handlers/rabbitmqHandler';

const argv = yargs
  .options({
    config: {
      alias: 'z',
      type: 'string',
      description: 'path to config file to use to initiate multiple listeners',
    },
    network: {
      alias: 'n',
      choices: EventSupportingChains,
      description: 'chain to listen on',
    },
    url: {
      alias: 'u',
      type: 'string',
      description: 'node url',
    },
    MolochContractAddress: {
      alias: 'c',
      type: 'string',
      description: 'Moloch contract address',
    },
    MolochContractVersion: {
      alias: 'v',
      type: 'number',
      description: 'The version of the moloch contract to use',
    },
    MarlinContractAddresses: {
      alias: 'd',
      type: 'array',
      description:
        'An array of addresses for contracts in the following order: [comp, governorAlpha, timelock]',
    },
    Erc20TokenAddresses: {
      alias: 'w',
      type: 'array',
      description: 'An array of token contract addresses',
    },
    archival: {
      alias: 'a',
      type: 'boolean',
      description: 'run listener in archival mode or not',
    },
    startBlock: {
      alias: 'b',
      type: 'number',
      description:
        'when running in archival mode, which block should we start from',
    },
    rabbitMQ: {
      alias: 'q',
      type: 'string',
      description: 'Push events to queue in RabbitMQ',
    },
    skipCatchup: {
      alias: 's',
      type: 'boolean',
      description:
        'Whether to attempt to retrieve historical events not collected due to down-time',
    },
    verbose: {
      alias: 'v',
      type: 'boolean',
      description: 'Whether to run the listener in verbose mode or not',
    },
    // TODO: should be separate script since listeners can be added through the api
    // eventNode: {
    //   alias: 'e',
    //   type: 'boolean',
    //   description: 'Whether to run chain events as a node',
    // },
  })
  .conflicts({
    config: [
      'network',
      'url',
      'MolochContractAddress',
      'archival',
      'startBlock',
      'skipCatchup',
    ],
  })
  .coerce('rabbitMQ', getRabbitMQConfig)
  .coerce('config', (filepath) => {
    if (typeof filepath == 'string' && filepath.length == 0)
      throw new Error('Config filepath invalid');
    else {
      try {
        let raw = fs.readFileSync(filepath);
        return JSON.parse(raw.toString());
      } catch (error) {
        console.error(`Failed to load the configuration file at: ${filepath}`);
        console.error(error);
        throw new Error('Error occurred while loading the config file');
      }
    }
  })
  .coerce('MolochContractVersion', (version) => {
    if (!version) return;
    if (version != (1 || 2)) return 2; // default contract version to 2
  })
  .check((data) => {
    if (
      !chainSupportedBy(data.network, SubstrateEvents.Types.EventChains) &&
      data.spec
    ) {
      throw new Error('cannot pass spec on non-substrate network');
    }
    if (
      !chainSupportedBy(data.network, MolochEvents.Types.EventChains) &&
      data.MolcohContractAddress
    ) {
      throw new Error('cannot pass contract address on non-moloch network');
    }
    data.Erc20TokenAddresses.forEach((item) => {
      if (typeof item != 'string')
        throw new Error('Erc20 token addresses must be strings');
    });
    return true;
  }).argv;

let listener;
createListener(argv.network, argv as any).then((res) => {
  if (res instanceof Error) throw res;
  else listener = res;
});

if (listener) {
  listener.init().then(async () => {
    // add any handlers here

    if (argv.rabbitMQ) {
      const producer = new RabbitMqHandler(argv.rabbitMQ);
      await producer.init();
      listener.eventHandlers['rabbitmq'] = {
        handler: producer,
        excludedEvents: [],
      };
    }

    // start the subscription
    await listener.subscribe();
  });
} else {
  throw new Error('Could not start the listener!');
}
