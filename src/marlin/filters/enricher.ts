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
    // Comp events
    case EventKind.Approval: {
      const {
        owner,
        spender,
        amount
      } = rawData.args as any;

      return {
        blockNumber,
        excludeAddresses: [ owner, spender ], // who shouldn't receive notification?
        data: {
          kind,
          owner,
          spender,
          amount,
        },
      };
    }
    case EventKind.DelegateChanged: {
      const {
        delegator,
        fromDelegate,
        toDelegate,
      } = rawData.args as any;

      return {
        blockNumber,
        excludeAddresses: [ delegator ],
        data: {
          kind,
          delegator,
          fromDelegate,
          toDelegate,
        },
      };
    }
    case EventKind.DelegateVotesChanged: {
      const {
        delegate,
        previousBalance,
        newBalance,
      } = rawData.args as any;

      return {
        blockNumber,
        excludeAddresses: [ delegate ],
        data: {
          kind,
          delegate,
          previousBalance,
          newBalance,
        },
      };
    }
    case EventKind.Transfer: {
      const {
        from,
        to,
        amount
      } = rawData.args as any;

      return {
        blockNumber,
        excludeAddresses: [ from ],
        data: {
          kind,
          from,
          to,
          amount,
        },
      };
    }
    // GovernorAlpha Events
    case EventKind.ProposalCanceled: {
      const { id, } = rawData.args as any;
      return {
        blockNumber,
        excludeAddresses: [],
        data: {
          kind,
          id,
        },
      };
    }
    case EventKind.ProposalCreated: {
      const {
        id,
        proposer,
        targets,
        values,
        signatures,
        calldatas,
        startBlock,
        endBlock,
        description,
      } = rawData.args as any;
      
      return {
        blockNumber,
        excludeAddresses: [ proposer ],
        data: {
          kind,
          id,
          proposer,
          targets,
          values,
          signatures,
          calldatas,
          startBlock,
          endBlock,
          description,
        },
      };
    }
    case EventKind.ProposalExecuted: {}
    case EventKind.ProposalQueued: {}
    case EventKind.VoteCast: {}

    case EventKind.CancelTransaction: {}
    case EventKind.ExecuteTransaction: {}
    case EventKind.NewAdmin: {}
    case EventKind.NewDelay: {}
    case EventKind.NewPendingAdmin: {}
    case EventKind.QueueTransaction: {}

    default: {}
  }




  return { blockNumber: null, data: null, }
}