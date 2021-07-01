import * as yargs from 'yargs';
import { getRabbitMQConfig } from '../src/listener/util';
import { createListener } from '../src/listener/createListener';
import { createNode } from '../src/eventsNode';

import {
  EventSupportingChains,
  chainSupportedBy,
  SubstrateEvents,
  MolochEvents,
} from '../src';

import * as fs from 'fs';
import { startProducer } from '../src/listener';

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
    contractAddress: {
      alias: 'c',
      type: 'string',
      description: 'eth contract address',
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
    eventNode: {
      alias: 'e',
      type: 'boolean',
      description: 'Whether to run chain events as a node',
    },
  })
  .conflicts('config', [
    'network',
    'url',
    'contractAddress',
    'archival',
    'startBlock',
    'skipCatchup',
  ])
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
  .check((data) => {
    if (
      !chainSupportedBy(data.network, SubstrateEvents.Types.EventChains) &&
      data.spec
    ) {
      throw new Error('cannot pass spec on non-substrate network');
    }
    if (
      !chainSupportedBy(data.network, MolochEvents.Types.EventChains) &&
      data.contractAddress
    ) {
      throw new Error('cannot pass contract address on non-moloch network');
    }
    return true;
  }).argv;

async function init() {
  if (argv.rabbitMQ) await startProducer(argv.rabbitMQ);

  let cf = argv.config;
  if (cf) for (const chain of cf) createListener(chain.network, chain);
  else createListener(argv.network, argv);
}

let eventNode;
init().then(() => {
  if (argv.eventNode) eventNode = createNode();
});
