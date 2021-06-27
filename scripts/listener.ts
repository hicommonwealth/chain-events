import * as yargs from 'yargs';
import fetch from 'node-fetch';
import type { RegisteredTypes } from '@polkadot/types/types';
import { EventKind as SubstrateEventKind } from '../src/substrate/types';
import { spec as EdgewareSpec } from '@edgeware/node-types';
import { Producer } from '../src/rabbitmq/producer';

import { HydraDXSpec } from './specs/hydraDX';
import { KulupuSpec } from './specs/kulupu';
import { StafiSpec } from './specs/stafi';
import { CloverSpec } from './specs/clover';

// @ts-ignore
import config from '../src/rabbitmq/RabbitMQconfig.json';

import {
  chainSupportedBy,
  IEventHandler,
  CWEvent,
  SubstrateEvents,
  MarlinEvents,
  MolochEvents,
  Erc20Events,
  EventSupportingChains,
  EventSupportingChainT,
  IEventSubscriber,
} from '../dist/index';

import { IProducer } from '../src/rabbitmq/producer';
import * as fs from 'fs';
import { listenerOptionsT } from '../src';

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
  })
  .conflicts('config', [
    'network',
    'url',
    'contractAddress',
    'archival',
    'startBlock',
    'rabbitMQ',
    'skipCatchup',
  ])
  .coerce('rabbitMQ', (filepath) => {
    if (typeof filepath == 'string' && filepath.length == 0) return config;
    else {
      try {
        let raw = fs.readFileSync(filepath);
        return JSON.parse(raw.toString());
      } catch (error) {
        console.error(`Failed to load the configuration file at: ${filepath}`);
        console.error(error);
        console.warn('Using default RabbitMQ configuration');
        // leave config empty to use default
        return config;
      }
    }
  })
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

class StandaloneEventHandler extends IEventHandler {
  public async handle(event: CWEvent): Promise<any> {
    console.log(`Received event: ${JSON.stringify(event, null, 2)}`);
  }
}

const tokenListUrls = [
  'https://wispy-bird-88a7.uniswap.workers.dev/?url=http://tokenlist.aave.eth.link',
  'https://gateway.ipfs.io/ipns/tokens.uniswap.org',
  'https://wispy-bird-88a7.uniswap.workers.dev/?url=http://defi.cmc.eth.link',
];
async function getTokenLists() {
  let data: any = await Promise.all(
    tokenListUrls.map((url) =>
      fetch(url)
        .then((o) => o.json())
        .catch((e) => console.error(e))
    )
  );
  data = data.map((o) => o && o.tokens).flat();
  data = data.filter((o) => o); //remove undefined
  return data;
}

async function getSubstrateSpecs(chain: EventSupportingChainT) {
  let url: string =
    process.env.NODE_ENV == 'production'
      ? `https://commonwealth.im/api/getSubstrateSpec?chain=${chain}`
      : `http://localhost:8080/api/getSubstrateSpec?chain=${chain}`;
  console.log(`Getting ${chain} spec at url ${url}`);

  let data: any = await fetch(url)
    .then((res) => res.json())
    .then((json) => json.result)
    .catch((err) => console.error(err));

  return data;
}

async function setupListener(
  network,
  rabbitMQ,
  url,
  skipCatchup,
  startBlock,
  archival,
  contract,
  spec
): Promise<IEventSubscriber<any, any>> {
  // start rabbitmq
  let handlers, producer;
  if (rabbitMQ) {
    producer = new Producer(rabbitMQ);
    await producer.init();
    handlers = [new StandaloneEventHandler(), producer];
  } else {
    handlers = [new StandaloneEventHandler()];
  }

  console.log(`Connecting to ${network} on url ${url}...`);

  if (chainSupportedBy(network, SubstrateEvents.Types.EventChains)) {
    if (producer)
      producer.filterConfig.excludedEvents = [
        SubstrateEventKind.Reward,
        SubstrateEventKind.TreasuryRewardMinting,
        SubstrateEventKind.TreasuryRewardMintingV2,
        SubstrateEventKind.HeartbeatReceived,
      ];

    const api = await SubstrateEvents.createApi(url, spec);
    const fetcher = new SubstrateEvents.StorageFetcher(api);
    try {
      await fetcher.fetch();
    } catch (err) {
      console.log(err);
      console.error(`Got error from fetcher: ${JSON.stringify(err, null, 2)}.`);
    }
    return SubstrateEvents.subscribeEvents({
      chain: network,
      api,
      handlers: handlers,
      skipCatchup: skipCatchup,
      archival: archival,
      startBlock: startBlock,
      verbose: true,
      enricherConfig: { balanceTransferThresholdPermill: 1_000 }, // 0.1% of total issuance
    });
  } else if (chainSupportedBy(network, MolochEvents.Types.EventChains)) {
    const contractVersion = 1;
    if (!contract) throw new Error(`no contract address for ${network}`);
    const api = await MolochEvents.createApi(url, contractVersion, contract);
    return MolochEvents.subscribeEvents({
      chain: network,
      api,
      contractVersion,
      handlers: handlers,
      skipCatchup: skipCatchup,
      verbose: true,
    });
  } else if (chainSupportedBy(network, MarlinEvents.Types.EventChains)) {
    const contracts = {
      comp: '0xEa2923b099b4B588FdFAD47201d747e3b9599A5f', // TESTNET
      governorAlpha: '0xeDAA76873524f6A203De2Fa792AD97E459Fca6Ff', // TESTNET
      timelock: '0x7d89D52c464051FcCbe35918cf966e2135a17c43', // TESTNET
    };
    const api = await MarlinEvents.createApi(url, contracts);
    return MarlinEvents.subscribeEvents({
      chain: network,
      api,
      handlers: handlers,
      skipCatchup: skipCatchup,
      verbose: true,
    });
  } else if (chainSupportedBy(network, Erc20Events.Types.EventChains)) {
    let tokens = await getTokenLists();
    let tokenAddresses = tokens.map((o) => o.address);
    const api = await Erc20Events.createApi(url, tokenAddresses);
    return Erc20Events.subscribeEvents({
      chain: network,
      api,
      handlers: handlers,
      skipCatchup: skipCatchup,
      verbose: true,
    });
  }
}

export let listenerArgs: { [key: string]: listenerOptionsT } = {};
let cf = argv.config;
if (cf) {
  for (const chain of cf) {
    listenerArgs[chain.network] = {
      archival: !!chain.archival,
      startBlock: chain.startBlock ?? 0,
      url: chain.url || networkUrls[chain.network],
      spec: networkSpecs[chain.network] || {},
      contract: chain.contractAddress || contracts[chain.network],
      skipCatchup: !!chain.skipCatchup,
      rabbitMQ: chain.rabbitMQ,
    };
  }
} else {
  listenerArgs[argv.network] = {
    archival: !!argv.archival,
    startBlock: argv.startBlock ?? 0,
    url: argv.url || networkUrls[argv.network],
    spec: networkSpecs[argv.network] || {},
    contract: argv.contractAddress || contracts[argv.network],
    skipCatchup: !!argv.skipCatchup,
    rabbitMQ: argv.rabbitMQ,
  };
}

// TODO: add excludedEvents to the listenerOptionsT
// exposed in order to allow external scripts to unsubscribe
export let subscribers: { [key: string]: IEventSubscriber<any, any> };
for (const chain in listenerArgs) {
  getSubstrateSpecs(chain as EventSupportingChainT)
    .then((newSpec) => {
      if (newSpec?.types != undefined) listenerArgs[chain].spec = newSpec;
      setupListener(
        chain,
        listenerArgs[chain].rabbitMQ,
        listenerArgs[chain].url,
        listenerArgs[chain].skipCatchup,
        listenerArgs[chain].startBlock,
        listenerArgs[chain].archival,
        listenerArgs[chain].contract,
        newSpec
      ).then((subscriber) => {
        subscribers[chain] = subscriber;
      });
    })
    .catch((error) => {
      // TODO: use default/hardcoded spec if getSubstrateSpecs fails
      console.log(error);
    });
}
