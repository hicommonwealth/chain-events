import { TypedEvent } from '../contractTypes/commons';
import {
  GovernorBravoDelegateStorageV1,
  GovernorBravoEvents,
} from '../contractTypes';

// Used to unwrap promises returned by contract functions
type UnPromisify<T> = T extends Promise<infer U> ? U : T;
export type Proposal = UnPromisify<
  ReturnType<GovernorBravoDelegateStorageV1['functions']['proposals']>
>;

// API is imported contracts classes
interface IMarlinContracts {
  // same address and contract e.g. GovernorBravoDelegate
  bravoStorage: GovernorBravoDelegateStorageV1;
  bravoEvents: GovernorBravoEvents;
}

// eslint-disable-next-line no-shadow
export enum VoteSupport {
  Against = 0,
  For = 1,
  Abstain = 2,
}

export type Api = IMarlinContracts;

export const EventChains = ['marlin', 'marlin-local'] as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RawEvent = TypedEvent<any>;

// eslint-disable-next-line no-shadow
export enum EntityKind {
  // eslint-disable-next-line no-shadow
  Proposal = 'proposal',
}

// eslint-disable-next-line no-shadow
export enum EventKind {
  // GovernorAlpha Events
  ProposalCreated = 'proposal-created',
  ProposalCanceled = 'proposal-canceled',
  ProposalQueued = 'proposal-queued',
  ProposalExecuted = 'proposal-executed',
  VoteCast = 'vote-cast',
}

interface IEvent {
  kind: EventKind;
}

type Address = string;
type Balance = string;

export interface IProposalCreated extends IEvent {
  kind: EventKind.ProposalCreated;
  id: number;
  proposer: Address;
  startBlock: number;
  endBlock: number;
  // TODO: we can only support description field if we use event filter
  //   rather than storage for fetching (same for calldatas etc)
  // description: string;
}

export interface IProposalCanceled extends IEvent {
  kind: EventKind.ProposalCanceled;
  id: number;
}

export interface IProposalQueued extends IEvent {
  kind: EventKind.ProposalQueued;
  id: number;
  eta: number;
}

export interface IProposalExecuted extends IEvent {
  kind: EventKind.ProposalExecuted;
  id: number;
}

export interface IVoteCast extends IEvent {
  kind: EventKind.VoteCast;
  voter: Address;
  id: number;
  support: VoteSupport;
  votes: Balance;
  // TODO: we may want to fetch reason later but for now it's wasted data
  // reason: string;
}

export type IEventData =
  | IProposalCanceled
  | IProposalCreated
  | IProposalExecuted
  | IProposalQueued
  | IVoteCast;

export const EventKinds: EventKind[] = Object.values(EventKind);
