import { RegisteredTypes } from '@polkadot/types/types';
export * from './interfaces';
export * as MolochEvents from './chains/moloch/index';
export * as MolochTypes from './chains/moloch/types';
export * as MarlinEvents from './chains/marlin/index';
export * as MarlinTypes from './chains/marlin/types';
export * as SubstrateEvents from './chains/substrate/index';
export * as SubstrateTypes from './chains/substrate/types';
export * as Erc20Events from './chains/erc20/index';
export * as Erc20Types from './chains/erc20/types';
export * as SubstrateListener from './chains/substrate/Listener';
export * as MolochListener from './chains/moloch/Listener';
export * as MarlinListener from './chains/marlin/Listener';
export * as Erc20Listener from './chains/erc20/Listener';
export { createListener, getRabbitMQConfig } from './util';
export * from './Listener';
export declare const networkUrls: {
    readonly clover: "wss://api.clover.finance";
    readonly hydradx: "wss://rpc-01.snakenet.hydradx.io";
    readonly edgeware: "ws://mainnet1.edgewa.re:9944";
    readonly 'edgeware-local': "ws://localhost:9944";
    readonly 'edgeware-testnet': "wss://beresheet1.edgewa.re";
    readonly kusama: "wss://kusama-rpc.polkadot.io";
    readonly polkadot: "wss://rpc.polkadot.io";
    readonly kulupu: "ws://rpc.kulupu.corepaper.org/ws";
    readonly stafi: "wss://scan-rpc.stafi.io/ws";
    readonly moloch: "wss://mainnet.infura.io/ws";
    readonly 'moloch-local': "ws://127.0.0.1:9545";
    readonly marlin: "wss://mainnet.infura.io/ws";
    readonly 'marlin-local': "ws://127.0.0.1:9545";
};
export declare const networkSpecs: {
    [chain: string]: RegisteredTypes;
};
export declare const molochContracts: {
    moloch: string;
    'moloch-local': string;
};
export declare const marlinContracts: {
    comp: string;
    governorAlpha: string;
    timelock: string;
};
export declare const Erc20TokenUrls: string[];
