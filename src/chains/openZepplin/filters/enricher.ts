import { Contract, utils } from 'ethers';

import { Api, EventKind, IEventData, RawEvent } from '../types';
import { CWEvent } from '../../../interfaces';
import { TypedEventFilter } from '../../../contractTypes/commons';
import { Governor } from '../../../contractTypes';

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
      const { proposalId } = rawData.args as GetArgType<
        Governor,
        'ProposalCanceled'
      >;
      return {
        blockNumber,
        excludeAddresses: [],
        data: {
          kind,
          id: +proposalId,
        },
      };
    }
    case EventKind.ProposalCreated: {
      const result = utils.defaultAbiCoder.decode(
        [
          'uint',
          'address',
          'address[]',
          'uint[]',
          'string[]',
          'bytes[]',
          'uint',
          'uint',
          'string',
        ],
        rawData.data
      );
      const [
        proposalId,
        proposer,
        targets,
        values,
        signatures,
        calldatas,
        startBlock,
        endBlock,
        descriptionBytes,
      ] = result;
      const description = utils.toUtf8String(
        descriptionBytes,
        utils.Utf8ErrorFuncs.ignore
      );

      return {
        blockNumber,
        excludeAddresses: [proposer],
        data: {
          kind,
          id: +proposalId,
          proposer,
          targets,
          values: values.map((v) => v.toString()),
          signatures,
          calldatas,
          startBlock: +startBlock,
          endBlock: +endBlock,
          description,
        },
      };
    }
    case EventKind.ProposalExecuted: {
      const { proposalId } = rawData.args as GetArgType<
        Governor,
        'ProposalExecuted'
      >;
      return {
        blockNumber,
        excludeAddresses: [],
        data: {
          kind,
          id: +proposalId,
        },
      };
    }
    // TODO: Zepplin Governor does not have proposalQueued event defined in Governor.sol
    // TODO: queue event is defined in the associated timelock contract so getArgType does not
    // TODO: recognize the 'ProposalQueued'
    // case EventKind.ProposalQueued: {
    //   const { proposalId, eta } = rawData.args as GetArgType<
    //     Governor,
    //     'ProposalQueued'
    //   >;
    //   return {
    //     blockNumber,
    //     excludeAddresses: [],
    //     data: {
    //       kind,
    //       id: +proposalId,
    //       eta: +eta,
    //     },
    //   };
    // }
    case EventKind.VoteCast: {
      const {
        voter,
        proposalId,
        support,
        weight,
        reason,
      } = rawData.args as GetArgType<Governor, 'VoteCast'>;
      return {
        blockNumber,
        excludeAddresses: [voter],
        data: {
          kind,
          voter,
          id: +proposalId,
          support,
          weight: +weight,
          reason,
        },
      };
    }
    default: {
      throw new Error('unknown open zepplin governance event kind!');
    }
  }
}
