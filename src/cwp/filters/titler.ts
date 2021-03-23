import { IEventTitle, TitlerFilter } from '../../interfaces';
import { EventKind } from '../types';

/**
 * This a titler function, not to be confused with the labeler -- it takes a particular
 * kind of event, and returns a "plain english" description of that type. This is used
 * on the client to present a list of subscriptions that a user might want to subscribe to.
 */
export const Title: TitlerFilter = (kind: EventKind): IEventTitle => {
  switch (kind) {
    // Project.sol events
    case EventKind.DepositProject: {
      return {
        title: 'Project Deposit',
        description: 'A Deposit was made to a Project.',
      };
    }
    // TODO: All events

    default: {
      // ensure exhaustive matching -- gives ts error if missing cases
      const _exhaustiveMatch: never = kind;
      throw new Error('unknown event type');
    }
  }
};