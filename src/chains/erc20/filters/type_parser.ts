import { EventKind } from '../types';
import { factory, formatFilename } from '../../../logging';
import { SupportedNetwork } from '../../../interfaces';

const log = factory.getLogger(formatFilename(__filename));

/**
 * This is the Type Parser function, which takes a raw Event
 * and determines which of our local event kinds it belongs to.
 */
export function ParseType(name: string, tokenName?: string): EventKind | null {
  switch (name) {
    // ERC20 Events
    case 'Approval':
      return EventKind.Approval;
    case 'Transfer':
      return EventKind.Transfer;
    default: {
      log.info(
        `[${SupportedNetwork.ERC20}${
          tokenName ? `::${tokenName}` : ''
        }]: Unknown event name: ${name}!`
      );
      return null;
    }
  }
}
