import { hexToNumberString, hexToNumber as web3HexToNumber } from 'web3-utils';
import { CWEvent } from '../../interfaces';
import { EventKind, RawEvent, IEventData, Api } from '../types';


export async function Enrich(
  api: Api,
  blockNumber: number,
  kind: EventKind,
  rawData: RawEvent,
): Promise<CWEvent<IEventData>> {
  switch (kind) {
    // Project.sol Events
    case EventKind.DepositProject: {
      const {
        // TODO:
      } = rawData.args as any;
    }
    case EventKind.CurateProject: {
      const {
        // TODO:
      } = rawData.args as any;
    }
    case EventKind.WithdrawProject: {
      const {
        // TODO:
      } = rawData.args as any;
    }
    case EventKind.ProposedProject: {
      const {
        // TODO:
      } = rawData.args as any;
    }
    case EventKind.SucceededProject: {
      const {
        // TODO:
      } = rawData.args as any;
    }
    case EventKind.FailedProject: {
      const {
        // TODO:
      } = rawData.args as any;
    }

    // TODO: Fill in all events

    default: {
      throw new Error('unknown cwp event kind!');
    }
  }

  return { blockNumber: null, data: null, }
};