import { LabelerFilter, IEventLabel } from '../../interfaces';
import { IEventData, EventKind } from '../types';

function fmtAddr(addr : string) {
  if (!addr) return;
  if (addr.length < 16) return addr;
  return `${addr.slice(0, 7)}…${addr.slice(addr.length - 3)}`;
}

/**
 * This a labeler function, which takes event data and describes it in "plain english",
 * such that we can display a notification regarding its contents.
 */
export const Label: LabelerFilter = (
  blockNumber: number,
  chainId: string,
  data: IEventData,
): IEventLabel => {
  // case EventKind.Approval: return {
  //   heading: 'Proposal Submitted',
  //   label: `Member ${fmtAddr(data.member)} submitted proposal with index ${data.proposalIndex}.`,
  //   // linkUrl: chainId ? `/${chainId}/proposal/molochproposal/${data.proposalIndex}` : null,
  // };
  switch (data.kind) {
    // Comp events
    case EventKind.Approval: {
      return {
        heading: 'Comp Approval', // TODO: Better heading
        label: '',
        linkUrl: '',
      };
    }
    case EventKind.DelegateChanged: {
      return {
        heading: '',
        label: '',
        linkUrl: '',
      };
    }
    case EventKind.DelegateVotesChanged: {
      return {
        heading: '',
        label: '',
        linkUrl: '',
      };
    }
    case EventKind.Transfer: {
      return {
        heading: '',
        label: '',
        linkUrl: '',
      };
    }
    // GovernorAlpha Events
    case EventKind.ProposalCanceled: {
      return {
        heading: '',
        label: '',
        linkUrl: '',
      };
    }
    case EventKind.ProposalCreated: {
      return {
        heading: '',
        label: '',
        linkUrl: '',
      };
    }
    case EventKind.ProposalExecuted: {
      return {
        heading: '',
        label: '',
        linkUrl: '',
      };
    }
    case EventKind.ProposalQueued: {
      return {
        heading: '',
        label: '',
        linkUrl: '',
      };
    }
    case EventKind.VoteCast: {
      return {
        heading: '',
        label: '',
        linkUrl: '',
      };

    }
    // Timelock events
    case EventKind.CancelTransaction: {
      return {
        heading: '',
        label: '',
        linkUrl: '',
      };
    }
    case EventKind.ExecuteTransaction: {
      return {
        heading: '',
        label: '',
        linkUrl: '',
      };
    }
    case EventKind.NewAdmin: {
      return {
        heading: '',
        label: '',
        linkUrl: '',
      };
    }
    case EventKind.NewDelay: {
      return {
        heading: '',
        label: '',
        linkUrl: '',
      };
    }
    case EventKind.NewPendingAdmin: {
      return {
        heading: '',
        label: '',
        linkUrl: '',
      };
    }
    case EventKind.QueueTransaction: {
      return {
        heading: '',
        label: '',
        linkUrl: '',
      };
    }
    default: {
      // ensure exhaustive matching -- gives ts error if missing cases
      const _exhaustiveMatch: never = data;
      throw new Error('unknown event type');
    }
  }
};
