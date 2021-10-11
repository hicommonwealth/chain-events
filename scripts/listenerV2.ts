import { createListener, LoggingHandler, SupportedNetwork } from '../src';

import * as yargs from 'yargs';

import { createListener, EventSupportingChains, LoggingHandler } from '../src';

import { networkUrls, contracts, networkSpecs } from './listenerUtils';

require('dotenv').config();

const { argv } = yargs.options({
  network: {
    alias: 'n',
    choices: Object.values(SupportedNetwork),
    demandOption: true,
    description: 'network to listen on',
  },
  chain: {
    alias: 'c',
    type: 'string',
    description: 'name of chain to listen on',
  },
  url: {
    alias: 'u',
    type: 'string',
    description: 'node url',
  },
  contractAddress: {
    alias: 'a',
    type: 'string',
    description: 'eth contract address',
  },
  tokenName: {
    alias: 't',
    type: 'string',
    description:
      'Name of the token if network is erc20 and contractAddress is a erc20 token address',
  },
  baseOverride: {
    alias: 'b',
    type: 'string',
    description:
      'Used to specify a base chain-events controller (overrides built-in types)',
  },
});

async function main(): Promise<any> {
  let listener;
  try {
    console.log(argv.baseOverride);
    listener = await createListener(
      argv.chain || 'dummyChain', argv.network,
      {
        url: argv.url || networkUrls[argv.network],
        address: argv.contractAddress || contracts[argv.network],
        tokenAddresses: [argv.contractAddress],
        tokenNames: [argv.tokenName],
        verbose: false,
        spec: <any>networkSpecs[argv.network],
        enricherConfig: {
          balanceTransferThreshold: 500_000,
        },
      },
      argv.baseOverride
    );

    listener.eventHandlers.logger = {
      handler: new LoggingHandler(),
      excludedEvents: [],
    };

    await listener.subscribe();
  } catch (e) {
    console.log(e);
  }

  return listener;
}

main().then((listener) => {
  const temp = listener;
  console.log('Subscribed...');
});
