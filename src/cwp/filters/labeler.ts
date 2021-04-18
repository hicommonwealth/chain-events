import { LabelerFilter, IEventLabel } from '../../interfaces';
import { IEventData, EventKind } from '../types';

/**
 * This a labeler function, which takes event data and describes it in "plain english",
 * such that we can display a notification regarding its contents.
 */
export const Label: LabelerFilter = (
  blockNumber: number,
  chainId: string,
  data: IEventData,
): IEventLabel => {
  switch (data.kind) {
    // Project.sol Events
    case EventKind.DepositProject: {
      return {
        heading: 'DepositProject',
        label: "",
      };
    }
    case EventKind.CurateProject: {
      return {
        heading: 'CurateProject',
        label: "",
      };
    }
    case EventKind.WithdrawProject: {
      return {
        heading: 'WithdrawProject',
        label: "",
      };
    }
    case EventKind.ProposedProject: {
      return {
        heading: 'ProposedProject',
        label: "",
      };
    }
    case EventKind.SucceededProject: {
      return {
        heading: 'SucceededProject',
        label: "",
      };
    }
    case EventKind.FailedProject: {
      return {
        heading: 'FailedProject',
        label: "",
      };
    }
    
    default: {
      // ensure exhaustive matching -- gives ts error if missing cases
      const _exhaustiveMatch: never = data;
      throw new Error('unknown event type');
    }
  }
};