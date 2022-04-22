/* eslint-disable @typescript-eslint/no-explicit-any */
import { TypedEventFilter } from '../../../contractTypes/commons';
import {
  ICuratedProjectFactory,
  ICuratedProject,
  IProjectBase__factory,
} from '../../../contractTypes';
import { CWEvent, SupportedNetwork } from '../../../interfaces';
import { EventKind, RawEvent, IEventData, Api } from '../types';

type GetEventArgs<T> = T extends TypedEventFilter<any, infer Y> ? Y : never;

type GetArgType<
  Name extends keyof ICuratedProjectFactory['filters']
> = GetEventArgs<ReturnType<ICuratedProjectFactory['filters'][Name]>>;

type GetProjectArgType<
  Name extends keyof ICuratedProject['filters']
> = GetEventArgs<ReturnType<ICuratedProject['filters'][Name]>>;

export async function Enrich(
  api: Api,
  blockNumber: number,
  kind: EventKind,
  rawData: RawEvent
): Promise<CWEvent<IEventData>> {
  switch (kind) {
    case EventKind.ProjectCreated: {
      const { projectIndex, newProject } = rawData.args as GetArgType<
        'ProjectCreated'
      >;
      const projectContract = IProjectBase__factory.connect(
        newProject,
        api.factory.provider
      );
      const {
        name,
        ipfsHash,
        cwUrl,
        creator,
      } = await projectContract.metaData();
      return {
        blockNumber,
        excludeAddresses: [],
        network: SupportedNetwork.Commonwealth,
        data: {
          kind,
          id: newProject,
          index: projectIndex.toString(),
          name,
          ipfsHash,
          cwUrl,
          creator,
        },
      };
    }
    case EventKind.ProjectBacked: {
      const { sender, token, amount } = rawData.args as GetProjectArgType<
        'Back'
      >;

      return {
        blockNumber,
        excludeAddresses: [sender],
        network: SupportedNetwork.Commonwealth,
        data: {
          kind,
          id: rawData.address,
          sender,
          token,
          amount: amount.toString(),
        },
      };
    }
    case EventKind.ProjectCurated: {
      const { sender, token, amount } = rawData.args as GetProjectArgType<
        'Curate'
      >;
      return {
        blockNumber,
        excludeAddresses: [sender],
        network: SupportedNetwork.Commonwealth,
        data: {
          kind,
          id: rawData.address,
          sender,
          token,
          amount: amount.toString(),
        },
      };
    }
    case EventKind.ProjectSucceeded: {
      const { timestamp, amount } = rawData.args as GetProjectArgType<
        'Succeeded'
      >;
      return {
        blockNumber,
        excludeAddresses: [],
        network: SupportedNetwork.Commonwealth,
        data: {
          kind,
          id: rawData.address,
          timestamp: timestamp.toString(),
          amount: amount.toString(),
        },
      };
    }
    case EventKind.ProjectFailed: {
      // no arg data on failure
      return {
        blockNumber,
        excludeAddresses: [],
        network: SupportedNetwork.Commonwealth,
        data: {
          kind,
          id: rawData.address,
        },
      };
    }
    case EventKind.ProjectWithdraw: {
      const {
        sender,
        token,
        amount,
        withdrawalType,
      } = rawData.args as GetProjectArgType<'Withdraw'>;
      return {
        blockNumber,
        excludeAddresses: [sender],
        network: SupportedNetwork.Aave,
        data: {
          kind,
          id: rawData.address,
          sender,
          token,
          amount: amount.toString(),
          withdrawalType,
        },
      };
    }
    default: {
      throw new Error(`Unknown event kind: ${kind}`);
    }
  }

  return {
    blockNumber: null,
    network: SupportedNetwork.Commonwealth,
    data: null,
  };
}
