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
  // Moloch Example
  // case EventKind.Approval: return {
  //   heading: 'Proposal Submitted',
  //   label: `Member ${fmtAddr(data.member)} submitted proposal with index ${data.proposalIndex}.`,
  //   // linkUrl: chainId ? `/${chainId}/proposal/molochproposal/${data.proposalIndex}` : null,
  // };
  switch (data.kind) {
    // Comp events
    case EventKind.Approval: {
      return {
        heading: 'Approval', // TODO: Better heading
        label: '',
      };
    }
    case EventKind.DelegateChanged: {
      return {
        heading: 'Delegate Changed',
        label: '',
      };
    }
    case EventKind.DelegateVotesChanged: {
      return {
        heading: 'Delegate Votes Changed',
        label: '',
      };
    }
    case EventKind.Transfer: {
      return {
        heading: 'Transfer Occurred',
        label: '',
      };
    }
    // GovernorAlpha Events
    case EventKind.ProposalCanceled: {
      return {
        heading: 'Proposal Canceled',
        label: '',
        linkUrl: chainId ? `/${chainId}/proposal/marlinproposal/${data.id}` : null,
      };
    }
    case EventKind.ProposalCreated: {
      return {
        heading: 'Proposal Created',
        label: '',
        linkUrl: chainId ? `/${chainId}/proposal/marlinproposal/${data.id}` : null,
      };
    }
    case EventKind.ProposalExecuted: {
      return {
        heading: 'Proposal Executed',
        label: '',
        linkUrl: chainId ? `/${chainId}/proposal/marlinproposal/${data.id}` : null,
      };
    }
    case EventKind.ProposalQueued: {
      return {
        heading: 'Proposal Queued',
        label: '',
        linkUrl: chainId ? `/${chainId}/proposal/marlinproposal/${data.id}` : null,
      };
    }
    case EventKind.VoteCast: {
      return {
        heading: 'Vote Cast',
        label: '',
        linkUrl: chainId ? `/${chainId}/proposal/marlinproposal/${data.proposalId}` : null,
      };

    }
    // Timelock events
    case EventKind.CancelTransaction: {
      return {
        heading: 'Transaction Cancelled',
        label: '',
      };
    }
    case EventKind.ExecuteTransaction: {
      return {
        heading: 'Transaction Executed',
        label: '',
      };
    }
    case EventKind.NewAdmin: {
      return {
        heading: 'New Admin',
        label: '',
      };
    }
    case EventKind.NewDelay: {
      return {
        heading: 'New Delay',
        label: '',
      };
    }
    case EventKind.NewPendingAdmin: {
      return {
        heading: 'New Pending Admin',
        label: '',
      };
    }
    case EventKind.QueueTransaction: {
      return {
        heading: 'Transaction Queued',
        label: '',
      };
    }
    default: {
      // ensure exhaustive matching -- gives ts error if missing cases
      const _exhaustiveMatch: never = data;
      throw new Error('unknown event type');
    }
  }
};
