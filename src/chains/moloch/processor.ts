/**
 * Processes Moloch events.
 */
import { IEventProcessor, CWEvent, SupportedNetwork } from '../../interfaces';
import { factory, formatFilename } from '../../logging';

import { ParseType } from './filters/type_parser';
import { Enrich } from './filters/enricher';
import { IEventData, RawEvent, Api } from './types';

const log = factory.getLogger(formatFilename(__filename));

export class Processor extends IEventProcessor<Api, RawEvent> {
  private readonly _version: 1 | 2;

  constructor(
    api: Api,
    contractVersion: 1 | 2,
    protected readonly chain?: string
  ) {
    super(api);
    this._version = contractVersion;
  }

  /**
   * Parse events out of an edgeware block and standardizes their format
   * for processing.
   * @param event
   * @returns an array of processed events
   */
  public async process(event: RawEvent): Promise<CWEvent<IEventData>[]> {
    const kind = ParseType(this._version, event.event, this.chain);
    if (!kind) return [];
    try {
      const cwEvent = await Enrich(
        this._version,
        this._api,
        event.blockNumber,
        kind,
        event,
        this.chain
      );
      return [cwEvent];
    } catch (e) {
      log.error(
        `[${SupportedNetwork.Moloch}${
          this.chain ? `::${this.chain}` : ''
        }]: Failed to enrich event: ${e.message}`
      );
      return [];
    }
  }
}
