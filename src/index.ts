import { RegisteredTypes } from '@polkadot/types/types';
import { CloverSpec } from './specs/clover';
import { KulupuSpec } from './specs/kulupu';
import { HydraDXSpec } from './specs/hydraDX';
import { StafiSpec } from './specs/stafi';
import { spec as EdgewareSpec } from '@edgeware/node-types';

export * from './interfaces';
export * as MolochEvents from './chains/moloch/index';
export * as MolochTypes from './chains/moloch/types';
export * as MarlinEvents from './chains/marlin/index';
export * as MarlinTypes from './chains/marlin/types';
export * as SubstrateEvents from './chains/substrate/index';
export * as SubstrateTypes from './chains/substrate/types';
export * as Erc20Events from './chains/erc20/index';
export * as Erc20Types from './chains/erc20/types';
export * as AaveEvents from './chains/aave/index';
export * as AaveTypes from './chains/aave/types';
export * from './chains';

export { Listener } from './Listener';
export { createNode } from './server';
export * from './handlers';
export * from './util';

// defaults
export const networkUrls = {
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

export const networkSpecs: { [chain: string]: RegisteredTypes } = {
  clover: CloverSpec,
  hydradx: HydraDXSpec,
  kulupu: KulupuSpec,
  edgeware: EdgewareSpec,
  'edgeware-local': EdgewareSpec,
  'edgeware-testnet': EdgewareSpec,
  stafi: StafiSpec,
};

export const molochContracts = {
  moloch: '0x1fd169A4f5c59ACf79d0Fd5d91D1201EF1Bce9f1',
  'moloch-local': '0x9561C133DD8580860B6b7E504bC5Aa500f0f06a7',
};
export const marlinContracts = {
  comp: '0xEa2923b099b4B588FdFAD47201d747e3b9599A5f', // TESTNET
  governorAlpha: '0xeDAA76873524f6A203De2Fa792AD97E459Fca6Ff', // TESTNET
  timelock: '0x7d89D52c464051FcCbe35918cf966e2135a17c43', // TESTNET
};
export const Erc20TokenUrls = [
  'https://wispy-bird-88a7.uniswap.workers.dev/?url=http://tokenlist.aave.eth.link',
  'https://gateway.ipfs.io/ipns/tokens.uniswap.org',
  'https://wispy-bird-88a7.uniswap.workers.dev/?url=http://defi.cmc.eth.link',
];
