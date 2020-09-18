import { Event } from 'ethers';
import { ISubscribeOptions } from '../interfaces';
import { Comp } from './contractTypes/Comp';
import { GovernorAlpha } from './contractTypes/GovernorAlpha';
import { Timelock } from './contractTypes/Timelock';

// Used to unwrap promises returned by contract functions
type UnPromisify<T> = T extends Promise<infer U> ? U : T;
// export type CompSOMETHING= UnPromisify<ReturnType<Comp['functions'][]>>

// API is imported contracts classes
export type Api = Comp | GovernorAlpha | Timelock;

export const EventChains = ['marlin', 'marlin-local'] as const;

export type RawEvent = Event;

export enum EntityKind {
  Proposal = 'proposal',
}

export enum EventKind {
  // Comp Events
  Approval = 'approval',
  DelegateChanged = 'delegate-changed',
  DelegateVotesChanged = 'delegate-votes-changed',
  Transfer = 'transfer',
  // TODO: GovernorAlpha Events

  // TODO: Timelock Events
}

interface IEvent {
  kind: EventKind;
}

type Address = string;
type Balance = string;

// Comp Event Interfaces
export interface IApproval extends IEvent {
}

export interface IDelegateChanged extends IEvent {
}

export interface IDelegateVotesChanged extends IEvent {
}

export interface ITransfer extends IEvent {
}

// TODO: GovernorAlpha Event Interfaces

// TODO: Timelock Event Interfaces


export type IEventData =
  IApproval
  | IDelegateChanged
  | IDelegateVotesChanged
  | ITransfer
  // eslint-disable-next-line semi-style
;

export const EventKinds: EventKind[] = Object.values(EventKind);
