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
    // TODO: Replace with actual event name when the contracts are ready
    // Project.sol Events
    case 'DepositProject': return EventKind.DepositProject;
    case 'CurateProject': return EventKind.CurateProject;
    case 'WithdrawProject': return EventKind.WithdrawProject;
    case 'ProposedProject': return EventKind.ProposedProject;
    case 'SucceededProject': return EventKind.SucceededProject;
    case 'FailedProject': return EventKind.FailedProject;

    default: {
      log.warn(`Unknown CWP event name: ${name}!`);
      return null;
    }
  }
}
