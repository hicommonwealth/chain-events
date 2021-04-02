import { EventKind } from '../types';

import { factory, formatFilename } from '../../logging';
const log = factory.getLogger(formatFilename(__filename));

/**
 * This is the Type Parser function, which takes a raw Event
 * and determines which of our local event kinds it belongs to.
 */
export function ParseType(
  name: string,
): EventKind | null {
  switch (name) {
    // Uni Events
    case 'Approval': return EventKind.Approval;
    case 'DelegateChanged': return EventKind.DelegateChanged;
    case 'DelegateVotesChanged': return EventKind.DelegateVotesChanged;
    case 'MinterChanged': return EventKind.MinterChanged;
    case 'Transfer': return EventKind.Transfer;
    // GovernorAlpha Events
    case 'ProposalCanceled': return EventKind.ProposalCanceled;
    case 'ProposalCreated': return EventKind.ProposalCreated;
    case 'ProposalExecuted': return EventKind.ProposalExecuted;
    case 'ProposalQueued': return EventKind.ProposalQueued;
    case 'VoteCast': return EventKind.VoteCast;
    // Timelock Events
    case 'CancelTransaction': return EventKind.CancelTransaction;
    case 'ExecuteTransaction': return EventKind.ExecuteTransaction;
    case 'NewAdmin': return EventKind.NewAdmin;
    case 'NewDelay': return EventKind.NewDelay;
    case 'NewPendingAdmin': return EventKind.NewPendingAdmin;
    case 'QueueTransaction': return EventKind.QueueTransaction;
    default: {
      log.warn(`Unknown Compoundalpha event name: ${name}!`);
      return null;
    }
  }
}