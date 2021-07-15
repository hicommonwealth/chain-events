import * as yargs from 'yargs';
import { getRabbitMQConfig } from '../src/listener/util';
import { createListener } from '../src/listener/createListener';
import { createNode } from '../src/eventsNode';
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
  let cf = argv.config;
  if (cf) for (const chain of cf) createListener(chain.network, chain);
  else createListener(argv.network, argv);
}

// TODO: add listener options
let listener;
if (chainSupportedBy(argv.network, SubstrateChains)) {
  // start a substrate listener
  listener = new SubstrateListener();
} else if (chainSupportedBy(argv.network, MolochChains)) {
  listener = new MolochListener();
} else if (chainSupportedBy(argv.network, MarlinChains)) {
  listener = new MarlinListener();
} else if (chainSupportedBy(argv.network, Erc20Chain)) {
  listener = new Erc20Listener();
}

listener.init().then(async () => {
  if (argv.rabbitMQ) {
    // TODO: change this to return producer instance and add handler instance to the handlers of the listener
    await startProducer(argv.rabbitMQ);
  }

  listener.subscribe();
});
//
// let eventNode;
// init().then(() => {
//   if (argv.eventNode) eventNode = createNode();
// });

// TODO: possibly remove createListener and setupListener
