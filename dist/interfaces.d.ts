/**
 * Defines general interfaces for chain event fetching and processing.
 */
import * as SubstrateTypes from './chains/substrate/types';
import * as MolochTypes from './chains/moloch/types';
import * as MarlinTypes from './chains/marlin/types';
import * as Erc20Types from './chains/erc20/types';
import * as AaveTypes from './chains/aave/types';
export declare type IChainEntityKind = SubstrateTypes.EntityKind | MolochTypes.EntityKind | MarlinTypes.EntityKind | AaveTypes.EntityKind;
export declare type IChainEventData = SubstrateTypes.IEventData | MolochTypes.IEventData | MarlinTypes.IEventData | AaveTypes.IEventData | Erc20Types.IEventData;
export declare type IChainEventKind = SubstrateTypes.EventKind | MolochTypes.EventKind | MarlinTypes.EventKind | AaveTypes.EventKind | Erc20Types.EventKind;
export declare const ChainEventKinds: (SubstrateTypes.EventKind | MolochTypes.EventKind | MarlinTypes.EventKind | AaveTypes.EventKind | Erc20Types.EventKind)[];
export declare const EventSupportingChains: readonly ["clover", "edgeware", "edgeware-local", "edgeware-testnet", "hydradx", "kusama", "kusama-local", "polkadot", "polkadot-local", "kulupu", "stafi", "moloch", "moloch-local", "marlin", "marlin-local", "aave", "aave-local", "dydx-ropsten", "dydx", "erc20"];
export declare type EventSupportingChainT = typeof EventSupportingChains[number];
export declare function chainSupportedBy<T extends readonly string[]>(c: string, eventChains: T): c is T[number];
export declare function isSupportedChain(chain: string): chain is EventSupportingChainT;
export declare enum EntityEventKind {
    Create = 0,
    Update = 1,
    Vote = 2,
    Complete = 3
}
export interface CWEvent<IEventData = IChainEventData> {
    blockNumber: number;
    includeAddresses?: string[];
    excludeAddresses?: string[];
    data: IEventData;
    chain?: EventSupportingChainT;
    received?: number;
}
export declare abstract class IEventHandler<DBEventType = IChainEventData> {
    abstract handle(event: CWEvent, dbEvent?: DBEventType): Promise<DBEventType>;
}
export declare abstract class IEventProcessor<Api, RawEvent> {
    protected _api: Api;
    constructor(_api: Api);
    abstract process(block: RawEvent): Promise<CWEvent[]>;
}
export declare abstract class IEventSubscriber<Api, RawEvent> {
    protected _api: Api;
    protected _verbose: boolean;
    constructor(_api: Api, _verbose?: boolean);
    get api(): Api;
    abstract subscribe(cb: (event: RawEvent) => void): Promise<void>;
    abstract unsubscribe(): void;
}
export interface IDisconnectedRange {
    startBlock?: number;
    endBlock?: number;
    maxResults?: number;
}
export interface ISubscribeOptions<Api> {
    chain: EventSupportingChainT;
    api: Api;
    handlers: IEventHandler<IChainEventData>[];
    skipCatchup?: boolean;
    archival?: boolean;
    startBlock?: number;
    discoverReconnectRange?: () => Promise<IDisconnectedRange>;
    verbose?: boolean;
}
export declare type SubscribeFunc<Api, RawEvent, Options extends ISubscribeOptions<Api>> = (options: Options) => Promise<IEventSubscriber<Api, RawEvent>>;
export declare abstract class IStorageFetcher<Api> {
    protected _api: Api;
    constructor(_api: Api);
    abstract fetch(range?: IDisconnectedRange, fetchAllCompleted?: boolean): Promise<CWEvent[]>;
    abstract fetchOne(id: string, kind?: IChainEntityKind): Promise<CWEvent[]>;
}
export declare abstract class IEventPoller<Api, RawEvent> {
    protected _api: Api;
    constructor(_api: Api);
    abstract poll(range: IDisconnectedRange, maxRange?: number): Promise<RawEvent[]>;
}
export interface IEventLabel {
    heading: string;
    label: string;
    linkUrl?: string;
}
export declare type LabelerFilter = (blockNumber: number, chainId: string, data: IChainEventData, ...formatters: any[]) => IEventLabel;
export interface IEventTitle {
    title: string;
    description: string;
}
export declare type TitlerFilter = (kind: IChainEventKind) => IEventTitle;
export declare function entityToFieldName(chain: EventSupportingChainT, entity: IChainEntityKind): string | null;
export declare function eventToEntity(chain: EventSupportingChainT, event: IChainEventKind): [IChainEntityKind, EntityEventKind];
export declare function isEntityCompleted(chain: EventSupportingChainT, entityEvents: CWEvent<any>[]): boolean;
