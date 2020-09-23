import { hexToNumberString, hexToNumber as web3HexToNumber } from 'web3-utils';
import { CWEvent } from '../../interfaces';
import { EventKind, RawEvent, IEventData, Api } from '../types';


export async function Enrich(
  api: Api,
  blockNumber: number,
  kind: EventKind,
  rawData: RawEvent,
): Promise<CWEvent<IEventData>> {
  return { blockNumber: null, data: null, }
}