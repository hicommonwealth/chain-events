/* eslint-disable @typescript-eslint/no-explicit-any */
import { BigNumber, Contract } from 'ethers';

import { GovernorBravoEvents } from '../../contractTypes';
import { TypedEventFilter } from '../../contractTypes/commons';
import { CWEvent } from '../../interfaces';
import { EventKind, RawEvent, IEventData, Api } from '../types';

type GetEventArgs<T> = T extends TypedEventFilter<any, infer Y> ? Y : never;
type GetArgType<
  C extends Contract,
  Name extends keyof C['filters']
> = GetEventArgs<ReturnType<C['filters'][Name]>>;

export async function Enrich(
  api: Api,
  blockNumber: number,
  kind: EventKind,
  rawData: RawEvent
): Promise<CWEvent<IEventData>> {
  switch (kind) {
    case EventKind.ProposalCanceled: {
      const { id } = rawData.args as GetArgType<
        GovernorBravoEvents,
        'ProposalCanceled'
      >;
      return {
        blockNumber,
        excludeAddresses: [],
        data: {
          kind,
          id: +id,
        },
      };
    }
    case EventKind.ProposalCreated: {
      const { id, proposer, startBlock, endBlock } = rawData.args as GetArgType<
        GovernorBravoEvents,
        'ProposalCreated'
      >;

      return {
        blockNumber,
        excludeAddresses: [proposer],
        data: {
          kind,
          id: +id,
          proposer,
          startBlock: +startBlock,
          endBlock: +endBlock,
        },
      };
    }
    case EventKind.ProposalExecuted: {
      const { id } = rawData.args as GetArgType<
        GovernorBravoEvents,
        'ProposalExecuted'
      >;
      return {
        blockNumber,
        excludeAddresses: [],
        data: {
          kind,
          id: +id,
        },
      };
    }
    case EventKind.ProposalQueued: {
      const { id, eta } = rawData.args as GetArgType<
        GovernorBravoEvents,
        'ProposalQueued'
      >;
      return {
        blockNumber,
        excludeAddresses: [],
        data: {
          kind,
          id: +id,
          eta: +eta,
        },
      };
    }
    case EventKind.VoteCast: {
      const {
        voter,
        proposalId,
        support,
        votes,
        // reason,
      } = rawData.args as GetArgType<GovernorBravoEvents, 'VoteCast'>;
      return {
        blockNumber,
        excludeAddresses: [voter],
        data: {
          kind,
          voter,
          id: +proposalId,
          support,
          votes: votes.toString(),
          // reason,
        },
      };
    }
    default: {
      throw new Error('unknown marlin event kind!');
    }
  }

  return { blockNumber: null, data: null };
}
