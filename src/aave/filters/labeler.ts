import moment from 'moment';

import { LabelerFilter, IEventLabel } from '../../interfaces';
import { IEventData, EventKind } from '../types';

/**
 * This a labeler function, which takes event data and describes it in "plain english",
 * such that we can display a notification regarding its contents.
 */
export const Label: LabelerFilter = (
  blockNumber: number,
  chainId: string,
  data: IEventData
): IEventLabel => {
  switch (data.kind) {
    case EventKind.ProposalCanceled: {
      return {
        heading: 'Proposal Canceled',
        label: `Proposal ${data.id} was cancelled.`,
        linkUrl: chainId
          ? `/${chainId}/proposal/aaveproposal/${data.id}`
          : null,
      };
    }
    case EventKind.ProposalCreated: {
      return {
        heading: 'Proposal Created',
        label: `Proposal ${data.id} was created.`,
        linkUrl: chainId
          ? `/${chainId}/proposal/aaveproposal/${data.id}`
          : null,
      };
    }
    case EventKind.ProposalExecuted: {
      return {
        heading: 'Proposal Executed',
        label: `Proposal ${data.id} was executed.`,
        linkUrl: chainId
          ? `/${chainId}/proposal/aaveproposal/${data.id}`
          : null,
      };
    }
    case EventKind.ProposalQueued: {
      return {
        heading: 'Proposal Queued',
        label: `Proposal ${data.id} queued up. Execution time: ${moment
          .unix(data.executionTime)
          .format()}.`,
        linkUrl: chainId
          ? `/${chainId}/proposal/aaveproposal/${data.id}`
          : null,
      };
    }
    case EventKind.VoteEmitted: {
      return {
        heading: 'Vote Emitted',
        label: `Voter (${data.voter}) voted with weight ${data.votingPower} ${
          data.support ? 'against' : 'for'
        } proposal ${data.id}.`,
        linkUrl: chainId
          ? `/${chainId}/proposal/aaveproposal/${data.id}`
          : null,
      };
    }
    default: {
      // ensure exhaustive matching -- gives ts error if missing cases
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _exhaustiveMatch: never = data;
      throw new Error('unknown event type');
    }
  }
};
