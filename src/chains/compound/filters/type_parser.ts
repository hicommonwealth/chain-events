import { EventKind } from '../types';
import { factory, formatFilename } from '../../../logging';
import { SupportedNetwork } from '../../../interfaces';

const log = factory.getLogger(formatFilename(__filename));

/**
 * This is the Type Parser function, which takes a raw Event
 * and determines which of our local event kinds it belongs to.
 */
export function ParseType(name: string, chain?: string): EventKind | null {
  switch (name) {
    case 'ProposalExecuted':
      return EventKind.ProposalExecuted;
    case 'ProposalCreated':
      return EventKind.ProposalCreated;
    case 'ProposalCanceled':
      return EventKind.ProposalCanceled;
    case 'ProposalQueued':
      return EventKind.ProposalQueued;
    case 'VoteCast':
      return EventKind.VoteCast;
    default: {
      log.warn(
        `[${SupportedNetwork.Compound}${
          chain ? `::${chain}` : ''
        }]: Unknown event name: ${name}!`
      );
      return null;
    }
  }
}
