import * as yargs from 'yargs';

import { Mainnet, Beresheet, dev } from '@edgeware/node-types';
import {
  chainSupportedBy, IEventHandler, CWEvent, SubstrateEvents, MolochEvents, MarlinEvents, EventSupportingChains
} from '../dist/index';

const networks = {
  'edgeware': 'ws://mainnet1.edgewa.re:9944',
  'edgeware-local': 'ws://localhost:9944',
  'edgeware-testnet': 'wss://beresheet1.edgewa.re',
  'kusama': 'wss://kusama-rpc.polkadot.io',
  'polkadot': 'wss://rpc.polkadot.io',
  'kulupu': 'ws://rpc.kulupu.corepaper.org/ws',

  'moloch': 'wss://mainnet.infura.io/ws',
  'moloch-local': 'ws://127.0.0.1:9545',
  'marlin': 'wss://mainnet.infura.io/ws',
  'marlin-local': 'ws://127.0.0.1:9545',
} as const;

const specs = {
  'dev': dev,
  'edgeware-local': dev,
  'beresheet': Beresheet,
  'edgeware-testnet': Beresheet,
  'mainnet': Mainnet,
  'edgeware': Mainnet,
  'none': {},
}

const contracts = {
  'moloch': '0x1fd169A4f5c59ACf79d0Fd5d91D1201EF1Bce9f1',
  'moloch-local': '0x9561C133DD8580860B6b7E504bC5Aa500f0f06a7',
  // marlin + marlin-local
};

const argv = yargs.options({
  network: {
    alias: 'n',
    choices: EventSupportingChains,
    demandOption: true,
    description: 'chain to listen on',
  },
  spec: {
    alias: 's',
    choices: ['dev', 'beresheet', 'mainnet', 'none'] as const,
    description: 'edgeware spec to use'
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
  }
}).check((data) => {
  if (!chainSupportedBy(data.network, SubstrateEvents.Types.EventChains) && data.spec) {
    throw new Error('cannot pass spec on non-substrate network');
  }
  if (!chainSupportedBy(data.network, MolochEvents.Types.EventChains) && data.contractAddress) {
    throw new Error('cannot pass contract address on non-moloch network');
  }
  if (!chainSupportedBy(data.network, MarlinEvents.Types.EventChains) && data.contractAddress) {
    throw new Error('cannor pass contract address on non-marlin network');
  }
  return true;
}).argv;

const network = argv.network;
const spec = specs[argv.spec] || specs[network] || {};
const url: string = argv.url || networks[network];
const contract: string | undefined = argv.contractAddress || contracts[network];

class StandaloneEventHandler extends IEventHandler {
  public async handle(event: CWEvent): Promise<any> {
    console.log(`Received event: ${JSON.stringify(event, null, 2)}`);
  }
}

const skipCatchup = false;

console.log(`Connecting to ${network} on url ${url}...`)
if (chainSupportedBy(network, SubstrateEvents.Types.EventChains)) {
  SubstrateEvents.createApi(url, spec).then(async (api) => {
    const fetcher = new SubstrateEvents.StorageFetcher(api);
    try {
      await fetcher.fetch();
    } catch (err) {
      console.error(`Got error from fetcher: ${JSON.stringify(err, null, 2)}.`);
    }
    SubstrateEvents.subscribeEvents({
      chain: network,
      api,
      handlers: [ new StandaloneEventHandler() ],
      skipCatchup,
      verbose: true,
    });
  });
} else if (chainSupportedBy(network, MolochEvents.Types.EventChains)) {
  const contractVersion = 1;
  if (!contract) throw new Error(`no contract address for ${network}`);
  MolochEvents.createApi(url, contractVersion, contract).then((api) => {
    MolochEvents.subscribeEvents({
      chain: network,
      api,
      contractVersion,
      handlers: [ new StandaloneEventHandler() ],
      skipCatchup,
      verbose: true,
    });
  })
} else if (chainSupportedBy(network, MarlinEvents.Types.EventChains)) {
  // if (!contract) throw new Error(`no contract address for ${network}`);
  const contracts = { comp: '', governorAlpha: '', timelock: ''}; // TODO: Add addresses here
  MarlinEvents.createApi(url, contracts).then((api) => {
    MarlinEvents.subscribeEvents({
      chain: network,
      api,
      handlers: [ new StandaloneEventHandler() ],
      skipCatchup,
      verbose: true,
    })
  })
}
