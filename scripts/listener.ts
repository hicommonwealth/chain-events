import * as yargs from 'yargs';
import { createListener } from '../src';
import { getRabbitMQConfig, RabbitMqHandler } from 'ce-rabbitmq-plugin';
import {
  EventSupportingChains,
  chainSupportedBy,
  SubstrateEvents,
  MolochEvents,
} from '../src';

import * as fs from 'fs';
import { LoggingHandler } from '../src';
import { isSupportedChain } from '../src';

const argv = yargs
  .options({
    config: {
      alias: 'z',
      type: 'string',
      description: 'path to config file to use to initiate multiple listeners',
    },
    network: {
      alias: 'n',
      // choices: EventSupportingChains,
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
      alias: 'mcv',
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
      !chainSupportedBy(
        data.network as any,
        SubstrateEvents.Types.EventChains
      ) &&
      data.spec
    ) {
      throw new Error('cannot pass spec on non-substrate network');
    }
    if (
      !chainSupportedBy(data.network as any, MolochEvents.Types.EventChains) &&
      data.MolcohContractAddress
    ) {
      throw new Error('cannot pass contract address on non-moloch network');
    }
    // if (data.Erc20TokenAddresses) {
    //   data.Erc20TokenAddresses.forEach((item) => {
    //     if (typeof item != 'string')
    //       throw new Error('Erc20 token addresses must be strings');
    //   });
    // }

    // if (!isSupportedChain(data.network as any)) {
    //   throw new Error('You must pass a valid chain to listen to!');
    // }
    return true;
  }).argv;

let listener;
argv.Erc20TokenAddresses = ['0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'];
createListener(argv.network as any, argv as any, true, 'ethereum')
  .then(async (res) => {
    if (res instanceof Error) throw res;
    else listener = res;

    // add any handlers

    // if (argv.rabbitMQ) {
    //   const producer = new RabbitMqHandler(argv.rabbitMQ);
    //   await producer.init();
    //   listener.eventHandlers['rabbitmq'] = {
    //     handler: producer,
    //     excludedEvents: [],
    //   };
    // }

    if (argv.verbose) {
      const logger = new LoggingHandler();
      listener.eventHandlers['logger'] = {
        handler: logger,
        excludedEvents: [],
      };
    }

    await listener.subscribe();
  })
  .catch((error) => {
    throw error;
  });
