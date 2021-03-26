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
    case EventKind.CurateProject: {
      return {
        title: 'Project Curate',
        description: 'Project Curate',
      };
    }
    case EventKind.WithdrawProject: {
      return {
        title: 'Project Withdraw',
        description: 'Project Withdraw',
      };
    }
    case EventKind.ProposedProject: {
      return {
        title: 'Project Proposed',
        description: 'Project Proposed',
      };
    }
    case EventKind.SucceededProject: {
      return {
        title: 'Project Succeeded',
        description: 'Project Succeeded',
      };
    }
    case EventKind.FailedProject: {
      return {
        title: 'Project Failed',
        description: 'Project Failed',
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