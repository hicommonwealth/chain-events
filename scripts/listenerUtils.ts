import type { RegisteredTypes } from '@polkadot/types/types';
import { spec as EdgewareSpec } from '@edgeware/node-types';

import { HydraDXSpec } from './specs/hydraDX';
import { KulupuSpec } from './specs/kulupu';
import { StafiSpec } from './specs/stafi';
import { CloverSpec } from './specs/clover';

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

  moloch: 'wss://eth-mainnet.alchemyapi.io/v2/',
  'moloch-local': 'ws://127.0.0.1:9545',

  marlin: 'wss://eth-mainnet.alchemyapi.io/v2/',
  'marlin-local': 'ws://127.0.0.1:9545',
  uniswap: 'wss://eth-mainnet.alchemyapi.io/v2/',
  tribe: 'wss://eth-mainnet.alchemyapi.io/v2/',

  aave: 'wss://eth-mainnet.alchemyapi.io/v2/',
  'aave-local': 'ws://127.0.0.1:9545',
  'dydx-ropsten': 'wss://eth-ropsten.alchemyapi.io/v2/',
  dydx: 'wss://eth-mainnet.alchemyapi.io/v2/',

  erc20: 'wss://eth-mainnet.alchemyapi.io/v2/',
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
  uniswap: '0xc4e172459f1e7939d522503b81afaac1014ce6f6',
};
