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
  CurateProject = 'curate-project',
  WithdrawProject = 'withdraw-project',
  ProposedProject = 'proposed-project',
  SucceededProject = 'succeeded-project',
  FailedProject = 'failed-project'
}

interface IEvent {
  kind: EventKind;
}

type Address = string;
type Balance = string; // number???

// Project.sol Events
export interface IDepositProject extends IEvent {
  kind: EventKind.DepositProject;
  sender: Address,
  amount: Balance
}

export interface ICurateProject extends IEvent {
  kind: EventKind.CurateProject;
  sender: Address,
  amount: Balance
}

export interface IWithdrawProject extends IEvent {
  kind: EventKind.WithdrawProject;
  sender: Address,
  amount: Balance
}

export interface IProposedProject extends IEvent {
  kind: EventKind.ProposedProject;
  creator: Address,
  threshold: number,
  deadline: number
}

export interface ISucceededProject extends IEvent {
  kind: EventKind.SucceededProject;
  id: number
}

export interface IFailedProject extends IEvent {
  kind: EventKind.FailedProject;
  id: number
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