/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-console */
import * as yargs from 'yargs';
import type { RegisteredTypes } from '@polkadot/types/types';
import { spec as EdgewareSpec } from '@edgeware/node-types';

import {
  chainSupportedBy,
  IEventHandler,
  CWEvent,
  SubstrateEvents,
  MarlinEvents,
  MolochEvents,
  EventSupportingChains,
  AaveEvents,
} from '../dist/index';

import { HydraDXSpec } from './specs/hydraDX';
import { KulupuSpec } from './specs/kulupu';
import { StafiSpec } from './specs/stafi';
import { CloverSpec } from './specs/clover';

// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

const networkUrls = {
  clover: 'wss://api.clover.finance',
  hydradx: 'wss://rpc-01.snakenet.hydradx.io',
  edgeware: 'ws://mainnet1.edgewa.re:9944',
  'edgeware-local': 'ws://localhost:9944',
  'edgeware-testnet': 'wss://beresheet1.edgewa.re',
  kusama: 'wss://kusama-rpc.polkadot.io',
  polkadot: 'wss://rpc.polkadot.io',
  kulupu: 'ws://rpc.kulupu.corepaper.org/ws',
  stafi: 'wss://scan-rpc.stafi.io/ws',

  moloch: 'wss://mainnet.infura.io/ws',
  'moloch-local': 'ws://127.0.0.1:9545',

  marlin: 'wss://mainnet.infura.io/ws',
  'marlin-local': 'ws://127.0.0.1:9545',

  aave: 'wss://mainnet.infura.io/ws',
  'aave-local': 'ws://127.0.0.1:9545',
} as const;

const networkSpecs: { [chain: string]: RegisteredTypes } = {
  clover: CloverSpec,
  hydradx: HydraDXSpec,
  kulupu: KulupuSpec,
  edgeware: EdgewareSpec,
  'edgeware-local': EdgewareSpec,
  'edgeware-testnet': EdgewareSpec,
  stafi: StafiSpec,
};

const contracts = {
  moloch: '0x1fd169A4f5c59ACf79d0Fd5d91D1201EF1Bce9f1',
  'moloch-local': '0x9561C133DD8580860B6b7E504bC5Aa500f0f06a7',
};

const { argv } = yargs
  .options({
    network: {
      alias: 'n',
      choices: EventSupportingChains,
      demandOption: true,
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
  });
const { archival } = argv;
// if running in archival mode then which block shall we star from
const startBlock: number = argv.startBlock ?? 0;
const { network } = argv;
const url: string = argv.url || networkUrls[network];
const spec = networkSpecs[network] || {};
const contract: string | undefined = argv.contractAddress || contracts[network];

class StandaloneEventHandler extends IEventHandler {
  // eslint-disable-next-line class-methods-use-this
  public async handle(event: CWEvent): Promise<null> {
    console.log(`Received event: ${JSON.stringify(event, null, 2)}`);
    return null;
  }
}

const skipCatchup = false;

console.log(`Connecting to ${network} on url ${url}...`);
if (chainSupportedBy(network, SubstrateEvents.Types.EventChains)) {
  SubstrateEvents.createApi(url, spec).then(async (api) => {
    const fetcher = new SubstrateEvents.StorageFetcher(api);
    try {
      await fetcher.fetch();
    } catch (err) {
      console.log(err);
      console.error(`Got error from fetcher: ${JSON.stringify(err, null, 2)}.`);
    }
    SubstrateEvents.subscribeEvents({
      chain: network,
      api,
      handlers: [new StandaloneEventHandler()],
      skipCatchup,
      archival,
      startBlock,
      verbose: true,
      enricherConfig: { balanceTransferThresholdPermill: 1_000 }, // 0.1% of total issuance
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
      handlers: [new StandaloneEventHandler()],
      skipCatchup,
      verbose: true,
    });
  });
} else if (chainSupportedBy(network, MarlinEvents.Types.EventChains)) {
  const marlinContracts = {
    comp: '0xEa2923b099b4B588FdFAD47201d747e3b9599A5f', // TESTNET
    governorAlpha: '0xeDAA76873524f6A203De2Fa792AD97E459Fca6Ff', // TESTNET
    timelock: '0x7d89D52c464051FcCbe35918cf966e2135a17c43', // TESTNET
  };
  MarlinEvents.createApi(url, marlinContracts).then((api) => {
    MarlinEvents.subscribeEvents({
      chain: network,
      api,
      handlers: [new StandaloneEventHandler()],
      skipCatchup,
      verbose: true,
    });
  });
} else if (chainSupportedBy(network, AaveEvents.Types.EventChains)) {
  const aaveContracts = {
    governance: '0xEC568fffba86c094cf06b22134B23074DFE2252c',
  };
  AaveEvents.createApi(url, aaveContracts).then(async (api) => {
    const fetcher = new AaveEvents.StorageFetcher(api);
    try {
      const fetched = await fetcher.fetch({ startBlock: 12300000 }, true);
      console.log(fetched.map((f) => f.data));
    } catch (err) {
      console.log(err);
      console.error(`Got error from fetcher: ${JSON.stringify(err, null, 2)}.`);
    }
    AaveEvents.subscribeEvents({
      chain: network,
      api,
      handlers: [new StandaloneEventHandler()],
      skipCatchup,
      verbose: true,
    });
  });
}
