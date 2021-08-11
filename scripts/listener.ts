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
    choices: ['substrate', 'erc20', 'moloch', 'marlin', 'aave'],
    description:
      'If using a chain that is not natively supported by chain-events specify the base (overrides built-in chain types)',
  },
  url: {
    alias: 'u',
    type: 'string',
    description: 'node url',
  },
  address: {
    alias: 'c',
    type: 'string',
    description: 'erc20 token or moloch/marlin/aave contract address',
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
argv.network = 'usdc';
argv.url = 'wss://mainnet.infura.io/ws';
argv.address = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
argv.tokenAddresses = [
  '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
];
argv.tokenNames = ['tether-usd', 'usdc'];
argv.base = 'erc20';
argv.verbose = true;

createListener('erc20', argv as any, !!argv.base, <string>argv.base)
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
