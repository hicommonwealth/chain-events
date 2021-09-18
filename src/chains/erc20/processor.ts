/**
 * Processes ERC20 events.
 */
import { IEventProcessor, CWEvent } from '../../interfaces';
import { factory, formatFilename } from '../../logging';

import { ParseType } from './filters/type_parser';
import { Enrich, EnricherConfig } from './filters/enricher';
import { IEventData, RawEvent, Api } from './types';

const log = factory.getLogger(formatFilename(__filename));

export class Processor extends IEventProcessor<Api, RawEvent> {
  constructor(
    protected _api: Api,
    private _enricherConfig: EnricherConfig = {}
  ) {
    super(_api);
  }

  /**
   * Parse events out of an ethereum block and standardizes their format
   * for processing.
   * @param event
   * @returns an array of processed events
   */
  public async process(event: RawEvent): Promise<CWEvent<IEventData>[]> {
    const kind = ParseType(event.event);
    if (!kind) return [];
    try {
      const cwEvent = await Enrich(
        this._api,
        event.blockNumber,
        kind,
        event,
        this._enricherConfig
      );
      return [cwEvent];
    } catch (e) {
      log.error(`Failed to enrich event: ${e.message}`);
      return [];
    }
  }
}
