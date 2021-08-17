import fetch from 'node-fetch';
import * as yargs from 'yargs';
import { createListener, LoggingHandler } from '../src';

import dotenv from 'dotenv';
dotenv.config();

const { argv } = yargs.options({
  network: {
    alias: 'n',
    type: 'string',
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
  allTokens: {
    alias: 't',
    type: 'boolean',
    description: 'Listen to all erc20 tokens - overrides address',
  },
  verbose: {
    alias: 'v',
    types: 'boolean',
    description: 'Whether to log errors and events',
  },
});

const tokenListUrls = [
  'https://wispy-bird-88a7.uniswap.workers.dev/?url=http://tokenlist.aave.eth.link',
  'https://gateway.ipfs.io/ipns/tokens.uniswap.org',
  'https://wispy-bird-88a7.uniswap.workers.dev/?url=http://defi.cmc.eth.link',
];

async function getTokenLists() {
  const data = await Promise.all(
    tokenListUrls.map((listUrl) =>
      fetch(listUrl)
        .then((o) => o.json())
        .catch((e) => {
          console.error(e);
          return [];
        })
    )
  );
  return data
    .map((o) => o && o.tokens)
    .flat()
    .filter((o) => o);
}

let listener;
async function main() {
  if (argv.allTokens) {
    const tokens = await getTokenLists();
    argv.tokenAddresses = tokens.map((o) => o.address);
    argv.tokenNames = tokens.map((o) => o.name);
  }

  try {
    const res = await createListener(argv.network, argv as any, argv.base);
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
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

main();
