import { Event } from 'ethers';
import { Web3Provider } from 'ethers/providers';
import { Erc20 } from './contractTypes/Erc20';
interface IErc20Contracts {
    tokens: Erc20[];
    provider: Web3Provider;
}
export interface ListenerOptions {
    url: string;
    tokenAddresses: string[];
}
export declare type Api = IErc20Contracts;
export declare const EventChains: readonly ["erc20"];
export declare type RawEvent = Event;
export declare enum EventKind {
    Approval = "approval",
    Transfer = "transfer"
}
interface IEvent {
    kind: EventKind;
}
declare type Address = string;
export interface IApproval extends IEvent {
    kind: EventKind.Approval;
    owner: Address;
    spender: Address;
    value: number;
    contractAddress: Address;
}
export interface ITransfer extends IEvent {
    kind: EventKind.Transfer;
    from: Address;
    to: Address;
    value: number;
    contractAddress: Address;
}
export declare type IEventData = IApproval | ITransfer;
export declare class Token {
    name: string;
    symbol: string;
    address: string;
    constructor(name: string, symbol: string, address: string);
}
export declare const EventKinds: EventKind[];
export {};
