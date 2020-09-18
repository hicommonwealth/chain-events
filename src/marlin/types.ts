import { Event } from 'ethers';






export enum EntityKind {
  Proposal = 'proposal',
}

export enum EventKind {
  // MOLOCH EVENTS
  // SubmitProposal = 'submit-proposal',
  // SubmitVote = 'submit-vote',
  // ProcessProposal = 'process-proposal',
  // Ragequit = 'ragequit',
  // Abort = 'abort',
  // UpdateDelegateKey = 'update-delegate-key',
  // SummonComplete = 'summon-complete',

  // Marlin Events
}

interface IEvent {
  kind: EventKind;
}

type Address = string;
type Balance = string;

// for each EventKind, create interface that extends IEvent




// export type IEventData = IEachEventKind | IEachEventKind2...

export const EventKinds: EventKind[] = Object.values(EventKind);
