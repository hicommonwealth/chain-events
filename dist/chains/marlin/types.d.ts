import { TypedEvent } from '../../contractTypes/commons';
import { MPond, GovernorAlpha, Timelock } from '../../contractTypes';
declare type UnPromisify<T> = T extends Promise<infer U> ? U : T;
export declare type Proposal = UnPromisify<ReturnType<GovernorAlpha['functions']['proposals']>>;
export declare type Receipt = UnPromisify<ReturnType<GovernorAlpha['functions']['getReceipt']>>;
interface IMarlinContracts {
    comp: MPond;
    governorAlpha: GovernorAlpha;
    timelock: Timelock;
}
export interface ListenerOptions {
    url: string;
    skipCatchup: boolean;
    contractAddress: string;
}
export declare type Api = IMarlinContracts;
export declare const EventChains: readonly ["marlin", "marlin-local"];
export declare type RawEvent = TypedEvent<any>;
export declare enum EntityKind {
    Proposal = "proposal"
}
export declare enum EventKind {
    Approval = "approval",
    DelegateChanged = "delegate-changed",
    DelegateVotesChanged = "delegate-votes-changed",
    Transfer = "transfer",
    ProposalExecuted = "proposal-executed",
    ProposalCreated = "proposal-created",
    ProposalCanceled = "proposal-canceled",
    ProposalQueued = "proposal-queued",
    VoteCast = "vote-cast",
    CancelTransaction = "cancel-transaction",
    ExecuteTransaction = "execute-transactions",
    NewAdmin = "new-admin",
    NewDelay = "new-delay",
    NewPendingAdmin = "new-pending-admin",
    QueueTransaction = "queue-transaction"
}
interface IEvent {
    kind: EventKind;
}
declare type Address = string;
declare type Balance = string;
export interface IApproval extends IEvent {
    kind: EventKind.Approval;
    owner: Address;
    spender: Address;
    amount: Balance;
}
export interface IDelegateChanged extends IEvent {
    kind: EventKind.DelegateChanged;
    delegator: Address;
    fromDelegate: Address;
    toDelegate: Address;
}
export interface IDelegateVotesChanged extends IEvent {
    kind: EventKind.DelegateVotesChanged;
    delegate: Address;
    previousBalance: Balance;
    newBalance: Balance;
}
export interface ITransfer extends IEvent {
    kind: EventKind.Transfer;
    from: Address;
    to: Address;
    amount: Balance;
}
export interface IProposalCanceled extends IEvent {
    kind: EventKind.ProposalCanceled;
    id: number;
}
export interface IProposalCreated extends IEvent {
    kind: EventKind.ProposalCreated;
    id: number;
    proposer?: Address;
    targets?: Address[];
    values: string[];
    signatures: Address[];
    calldatas: string[];
    startBlock: number;
    endBlock: number;
    description: string;
}
export interface IProposalExecuted extends IEvent {
    kind: EventKind.ProposalExecuted;
    id: number;
}
export interface IProposalQueued extends IEvent {
    kind: EventKind.ProposalQueued;
    id: number;
    eta: number;
}
export interface IVoteCast extends IEvent {
    kind: EventKind.VoteCast;
    voter: Address;
    id: number;
    support: boolean;
    votes: Balance;
}
export interface ICancelTransaction extends IEvent {
    kind: EventKind.CancelTransaction;
    txHash: string;
    target: Address;
    value: Balance;
    signature: string;
    data: string;
    eta: number;
}
export interface IExecuteTransaction extends IEvent {
    kind: EventKind.ExecuteTransaction;
    txHash: string;
    target: Address;
    value: Balance;
    signature: string;
    data: string;
    eta: number;
}
export interface INewAdmin extends IEvent {
    kind: EventKind.NewAdmin;
    newAdmin: Address;
}
export interface INewDelay extends IEvent {
    kind: EventKind.NewDelay;
    newDelay: number;
}
export interface INewPendingAdmin extends IEvent {
    kind: EventKind.NewPendingAdmin;
    newPendingAdmin: Address;
}
export interface IQueueTransaction extends IEvent {
    kind: EventKind.QueueTransaction;
    txHash: string;
    target: Address;
    value: Balance;
    signature: string;
    data: string;
    eta: number;
}
export declare type IEventData = IApproval | IDelegateChanged | IDelegateVotesChanged | ITransfer | IProposalCanceled | IProposalCreated | IProposalExecuted | IProposalQueued | IVoteCast | ICancelTransaction | IExecuteTransaction | INewAdmin | INewDelay | INewPendingAdmin | IQueueTransaction;
export declare const EventKinds: EventKind[];
export {};
