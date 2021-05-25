/* eslint-disable @typescript-eslint/no-explicit-any */
import { TypedEventFilter } from '../../contractTypes/commons';
import { IAaveGovernanceV2 } from '../../contractTypes';
import { CWEvent } from '../../interfaces';
import { EventKind, RawEvent, IEventData, Api } from '../types';

type GetEventArgs<T> = T extends TypedEventFilter<any, infer Y> ? Y : never;
type GetArgType<Name extends keyof IAaveGovernanceV2['filters']> = GetEventArgs<
  ReturnType<IAaveGovernanceV2['filters'][Name]>
>;

export async function Enrich(
  api: Api,
  blockNumber: number,
  kind: EventKind,
  rawData: RawEvent
): Promise<CWEvent<IEventData>> {
  switch (kind) {
    case EventKind.ProposalCanceled: {
      const { id } = rawData.args as GetArgType<'ProposalCanceled'>;
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
      const {
        id,
        creator,
        executor,
        targets,
        values,
        signatures,
        calldatas,
        startBlock,
        endBlock,
        strategy,
        ipfsHash,
      } = rawData.args as GetArgType<'ProposalCreated'>;

      return {
        blockNumber,
        excludeAddresses: [creator],
        data: {
          kind,
          id: +id,
          proposer: creator,
          executor,
          targets,
          values: values.map((v) => v.toString()),
          signatures,
          calldatas,
          startBlock: +startBlock,
          endBlock: +endBlock,
          strategy,
          ipfsHash,
        },
      };
    }
    case EventKind.ProposalExecuted: {
      const { id } = rawData.args as GetArgType<'ProposalExecuted'>;
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
      const { id, executionTime } = rawData.args as GetArgType<
        'ProposalQueued'
      >;
      return {
        blockNumber,
        excludeAddresses: [],
        data: {
          kind,
          id: +id,
          executionTime: +executionTime,
        },
      };
    }
    case EventKind.VoteEmitted: {
      const { voter, id, support, votingPower } = rawData.args as GetArgType<
        'VoteEmitted'
      >;
      return {
        blockNumber,
        excludeAddresses: [voter],
        data: {
          kind,
          id: +id,
          voter,
          support,
          votingPower: votingPower.toString(),
        },
      };
    }
    default: {
      throw new Error('unknown AAVE event kind!');
    }
  }

  return { blockNumber: null, data: null };
}
