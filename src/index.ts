import { RegisteredTypes } from '@polkadot/types/types';
import { CloverSpec } from './specs/clover';
import { KulupuSpec } from './specs/kulupu';
import { HydraDXSpec } from './specs/hydraDX';
import { StafiSpec } from './specs/stafi';
import { spec as EdgewareSpec } from '@edgeware/node-types';

export * from './interfaces';
export * as MolochEvents from './chains/moloch/index';
export * as MolochTypes from './chains/moloch/types';
export * as CompoundEvents from './chains/compound/index';
export * as CompoundTypes from './chains/compound/types';
export * as SubstrateEvents from './chains/substrate/index';
export * as SubstrateTypes from './chains/substrate/types';
export * as Erc20Events from './chains/erc20/index';
export * as Erc20Types from './chains/erc20/types';
export * as AaveEvents from './chains/aave/index';
export * as AaveTypes from './chains/aave/types';

export { Listener } from './Listener';
export * from './handlers';
export * from './util';

// defaults
export const networkUrls = {
  clover: 'wss://api.clover.finance',
  hydradx: 'wss://rpc-01.snakenet.hydradx.io',
  edgeware: 'ws://mainnet2.edgewa.re:9944',
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
  uniswap: 'wss://mainnet.infura.io/ws',

  aave: 'wss://mainnet.infura.io/ws',
  'aave-local': 'ws://127.0.0.1:9545',
  'dydx-ropsten': 'wss://ropsten.infura.io/ws',
  dydx: 'wss://mainnet.infura.io/ws',

  erc20: 'wss://mainnet.infura.io/ws',
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

export const contracts = {
  moloch: '0x1fd169A4f5c59ACf79d0Fd5d91D1201EF1Bce9f1',
  'moloch-local': '0x9561C133DD8580860B6b7E504bC5Aa500f0f06a7',
  marlin: '0x777992c2E4EDF704e49680468a9299C6679e37F6',
  aave: '0xEC568fffba86c094cf06b22134B23074DFE2252c',
  'aave-local': '0xcf7ed3acca5a467e9e704c703e8d87f634fb0fc9',
  'dydx-ropsten': '0x6938240Ba19cB8a614444156244b658f650c8D5c',
  dydx: '0x7E9B1672616FF6D6629Ef2879419aaE79A9018D2',
  uniswap: '0x5e4be8Bc9637f0EAA1A755019e06A68ce081D58F',
};

export const Erc20TokenUrls = [
  'https://wispy-bird-88a7.uniswap.workers.dev/?url=http://tokenlist.aave.eth.link',
  'https://gateway.ipfs.io/ipns/tokens.uniswap.org',
  'https://wispy-bird-88a7.uniswap.workers.dev/?url=http://defi.cmc.eth.link',
];
