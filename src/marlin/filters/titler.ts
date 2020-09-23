import { IEventTitle, TitlerFilter } from '../../interfaces';
import { EventKind } from '../types';

/**
 * This a titler function, not to be confused with the labeler -- it takes a particular
 * kind of event, and returns a "plain english" description of that type. This is used
 * on the client to present a list of subscriptions that a user might want to subscribe to.
 */
export const Title: TitlerFilter = (kind: EventKind): IEventTitle => {
  switch (kind) {
    // Comp events
    case EventKind.Approval: {
      return {
        title: '',
        description: '',
      };
    }
    case EventKind.DelegateChanged: {
      return {
        title: '',
        description: '',
      };
    }
    case EventKind.DelegateVotesChanged: {
      return {
        title: '',
        description: '',
      };
    }
    case EventKind.Transfer: {
      return {
        title: '',
        description: '',
      };
    }
    // GovernorAlpha Events
    case EventKind.ProposalCanceled: {
      return {
        title: '',
        description: '',
      };
    }
    case EventKind.ProposalCreated: {
      return {
        title: '',
        description: '',
      };
    }
    case EventKind.ProposalExecuted: {
      return {
        title: '',
        description: '',
      };
    }
    case EventKind.ProposalQueued: {
      return {
        title: '',
        description: '',
      };
    }
    case EventKind.VoteCast: {
      return {
        title: '',
        description: '',
      };

    }
    // Timelock events
    case EventKind.CancelTransaction: {
      return {
        title: '',
        description: '',
      };
    }
    case EventKind.ExecuteTransaction: {
      return {
        title: '',
        description: '',
      };
    }
    case EventKind.NewAdmin: {
      return {
        title: '',
        description: '',
      };
    }
    case EventKind.NewDelay: {
      return {
        title: '',
        description: '',
      };
    }
    case EventKind.NewPendingAdmin: {
      return {
        title: '',
        description: '',
      };
    }
    case EventKind.QueueTransaction: {
      return {
        title: '',
        description: '',
      };
    }
    default: {
      // ensure exhaustive matching -- gives ts error if missing cases
      const _exhaustiveMatch: never = kind;
      throw new Error('unknown event type');
    }
  }
};
