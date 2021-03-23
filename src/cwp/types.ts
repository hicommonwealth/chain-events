import { Event } from 'ethers';
import { BigNumber, BigNumberish } from 'ethers/utils';
import { compact } from 'underscore';
import { ISubscribeOptions } from '../interfaces';

// TODO: IMPORT CONTRACTS WHEN READY
// import { MPond } from './contractTypes/MPond';
// import { GovernorAlpha } from './contractTypes/GovernorAlpha';
// import { Timelock } from './contractTypes/Timelock';

/*
  THESE ARE REFERENCE EVENTS
  Project.sol Events
    event Deposit(address sender, uint amount);
    event Curate(address sender, uint amount);
    event Withdraw(address sender, uint amount);
    event Proposed(address creator, uint threshold, uint deadline);
    event Succeeded(uint id);
    event Failed(uint id);
*/


// Used to unwrap promises returned by contract functions
type UnPromisify<T> = T extends Promise<infer U> ? U : T;
// export type Project = UnPromisify<ReturnType<PROJECT['functions']['projects']>>

// API is imported contracts classes
interface ICWPContracts {
  // TODO: Uncomment when contracts are finished
  // protocol: Protocol;
  // project: Project;
  // collective: Collective;
};

export type Api = ICWPContracts;

export const EventChains = ['edgeware', 'edgeware-local'] as const;

export type RawEvent = Event;

export enum EntityKind {
  Project = 'project',
  Collective = 'collective',
}

export enum EventKind {
  DepositProject = 'deposit-project',
  CurateProject = 'curate-project'
  // TODO: @Wang add events, like above but for the rest of the Project.sol Events 
}

interface IEvent {
  kind: EventKind;
}

type Address = string;
type Balance = string; // number???

// Project.sol Events
// TODO: @Wang add relevant data to event interfaces below, 
export interface IDepositProject extends IEvent {
  kind: EventKind.DepositProject;
}

export interface ICurateProject extends IEvent {
  kind: EventKind.CurateProject;
}

export interface IWithdrawProject extends IEvent {
}

export interface IProposedProject extends IEvent {
}

export interface ISucceededProject extends IEvent {
}

export interface IFailedProject extends IEvent {
}


/*
  Project.sol Events
    event Deposit(address sender, uint amount);
    event Curate(address sender, uint amount);
    event Withdraw(address sender, uint amount);
    event Proposed(address creator, uint threshold, uint deadline);
    event Succeeded(uint id);
    event Failed(uint id);
*/


export type IEventData =
  // Project.sol Events
  IDepositProject
  | ICurateProject
  | IWithdrawProject
  | IProposedProject
  | ISucceededProject
  | IFailedProject
  // eslint-disable-next-line semi-style
;

export const EventKinds: EventKind[] = Object.values(EventKind);