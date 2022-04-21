/* eslint-disable no-shadow */
import { IProjectBaseFactory } from '../../contractTypes';
import { TypedEvent } from '../../contractTypes/commons';

// options for the listener class
export interface ListenerOptions {
  url: string;
  skipCatchup: boolean;
  contractAddress: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RawEvent = TypedEvent<any>;

export type Api = IProjectBaseFactory;

// eslint-disable-next-line no-shadow
export enum EntityKind {
  // eslint-disable-next-line no-shadow
  Project = 'project',
}

export enum EventKind {
  ProjectCreated = 'project-created',
  ProjectBacked = 'project-backed',
  ProjectCurated = 'project-curated',
  ProjectSucceeded = 'project-succeeded',
  ProjectFailed = 'project-failed',
  ProjectWithdraw = 'project-withdraw',
}

interface IEvent {
  kind: EventKind;
}

type Address = string;
type Balance = string; // queried as BigNumber

export interface IProjectCreated extends IEvent {
  kind: EventKind.ProjectCreated;
  id: Address;
  index: string; // BN
}

export interface IProjectBacked extends IEvent {
  kind: EventKind.ProjectBacked;
  id: Address;
  sender: Address;
  token: Address;
  amount: Balance;
}

export interface IProjectCurated extends IEvent {
  kind: EventKind.ProjectCurated;
  id: Address;
  sender: Address;
  token: Address;
  amount: Balance;
}

export interface IProjectSucceeded extends IEvent {
  kind: EventKind.ProjectSucceeded;
  id: Address;
  timestamp: string; // BN
  amount: Balance;
}

export interface IProjectFailed extends IEvent {
  kind: EventKind.ProjectFailed;
  id: Address;
}

export interface IProjectWithdraw extends IEvent {
  kind: EventKind.ProjectWithdraw;
  id: Address;
  sender: Address;
  token: Address;
  amount: Balance;
  withdrawalType: string; // plaintext
}

export type IEventData =
  | IProjectCreated
  | IProjectBacked
  | IProjectCurated
  | IProjectSucceeded
  | IProjectFailed
  | IProjectWithdraw;

export const EventKinds: EventKind[] = Object.values(EventKind);
