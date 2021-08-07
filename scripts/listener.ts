import * as yargs from 'yargs';
import { createListener } from '../src';

import { LoggingHandler } from '../src';

const { argv } = yargs.options({
  network: {
    alias: 'n',
    demandOption: true,
    description: 'chain to listen on',
  },
  base: {
    alias: 'b',
    choices: ['substrate', 'ethereum'],
    description:
      'If using a chain that is not natively supported by chain-events specify the base',
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
    alias: 'sb',
    type: 'number',
    description:
      'when running in archival mode, which block should we start from',
  },
  verbose: {
    alias: 'v',
    types: 'boolean',
    description: 'Whether to log errors and events',
  },
});

let listener;
createListener(
  <string>argv.network,
  argv as any,
  !!argv.base,
  <string>argv.base
)
  .then(async (res) => {
    if (res instanceof Error) throw res;
    else listener = res;

    // add any handlers
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
