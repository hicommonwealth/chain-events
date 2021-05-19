/* eslint-disable @typescript-eslint/no-explicit-any */
import { hexToNumberString, hexToNumber as web3HexToNumber } from 'web3-utils';

import { Erc20 } from '../contractTypes/Erc20';
import { CWEvent } from '../../interfaces';
import { EventKind, RawEvent, IEventData, Api } from '../types';

// these functions unwrap the uint type received from chain,
// which is an object like { _hex: <value> }, into a string/number
function hexToString({ _hex: n }: { _hex: string }): string {
  return hexToNumberString(n);
}

function hexToNumber({ _hex: n }: { _hex: string }): number {
  return web3HexToNumber(n);
}

/**
 * This is an "enricher" function, whose goal is to augment the initial event data
 * received from the "system.events" query with additional useful information, as
 * described in the event's interface in our "types.ts" file.
 *
 * Once fetched, the function marshalls the event data and the additional information
 * into the interface, and returns a fully-formed event, ready for database storage.
 */
export async function Enrich(
  api: Api,
  blockNumber: number,
  kind: EventKind,
  rawData: RawEvent
): Promise<CWEvent<IEventData>> {
  switch (kind) {
    case EventKind.Approval: {
      const { owner, spender, value } = rawData.args as any;
      const contractAddress = rawData.address;

      return {
        blockNumber,
        // TODO put contract address in here as well
        data: {
          kind,
          owner,
          spender,
          value,
          contractAddress,
        },
      };
    }
    case EventKind.Transfer: {
      const { from, to, value } = rawData.args as any;
      const contractAddress = rawData.address;

      return {
        blockNumber,
        data: {
          kind,
          from,
          to,
          value,
          contractAddress,
        },
      };
    }
    default: {
      throw new Error('unknown erc20 event kind!');
    }
  }
}
