import { TypedEvent } from '../contractTypes/commons';
import { IAaveGovernanceV2 } from '../contractTypes';

// Used to unwrap promises returned by contract functions
type UnPromisify<T> = T extends Promise<infer U> ? U : T;
export type Proposal = UnPromisify<
  ReturnType<IAaveGovernanceV2['getProposalById']>
>;

// API is imported contracts classes
interface IAAVEContracts {
  // keep arg name same as Compound structure, functions similarly
  governance: IAaveGovernanceV2;
}

export type Api = IAAVEContracts;

export const EventChains = ['aave', 'aave-local'] as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RawEvent = TypedEvent<any>;

// eslint-disable-next-line no-shadow
export enum EntityKind {
  // eslint-disable-next-line no-shadow
  Proposal = 'proposal',
}

// eslint-disable-next-line no-shadow
export enum EventKind {
  ProposalCanceled = 'proposal-canceled',
  ProposalCreated = 'proposal-created',
  ProposalExecuted = 'proposal-executed',
  ProposalQueued = 'proposal-queued',
  VoteEmitted = 'vote-emitted',
}

interface IEvent {
  kind: EventKind;
}

type Address = string;
type Balance = string;

// eslint-disable-next-line no-shadow
export enum ProposalState {
  PENDING = 0,
  CANCELED = 1,
  ACTIVE = 2,
  FAILED = 3,
  SUCCEEDED = 4,
  QUEUED = 5,
  EXPIRED = 6,
  EXECUTED = 7,
}

// GovernorAlpha Event Interfaces
export interface IProposalCanceled extends IEvent {
  kind: EventKind.ProposalCanceled;
  id: number;
}

export interface IProposalCreated extends IEvent {
  kind: EventKind.ProposalCreated;
  id: number;
  proposer: Address;
  executor: Address;
  targets: Address[];
  values: Balance[];
  signatures: Address[];
  calldatas: string[];
  startBlock: number;
  endBlock: number;
  strategy: string;
  ipfsHash: string;

  // if fetching from storage, we cannot query for votes, but we receive
  // current vote totals instead. we can use fetchedAt to filter against
  // stored VoteEmitted objects.
  fetchedAt?: number;
  forVotes?: Balance;
  againstVotes?: Balance;
}

export interface IProposalExecuted extends IEvent {
  kind: EventKind.ProposalExecuted;
  id: number;
}

export interface IProposalQueued extends IEvent {
  kind: EventKind.ProposalQueued;
  id: number;
  executionTime: number; // timestamp
}

export interface IVoteEmitted extends IEvent {
  kind: EventKind.VoteEmitted;
  id: number;
  voter: Address;
  support: boolean;
  votingPower: Balance;
}

export type IEventData =
  | IProposalCanceled
  | IProposalCreated
  | IProposalExecuted
  | IProposalQueued
  | IVoteEmitted;
// eslint-disable-next-line semi-style

export const EventKinds: EventKind[] = Object.values(EventKind);
