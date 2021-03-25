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
    // Project.sol Events
    // TODO: Replace with actual event name when the contracts are ready
    case 'DepositProject': return EventKind.DepositProject;

    default: {
      log.warn(`Unknown CWP event name: ${name}!`);
      return null;
    }
  }
}
