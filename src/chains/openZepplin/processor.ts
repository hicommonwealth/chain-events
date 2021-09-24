import { factory, formatFilename } from '../../logging';
import { CWEvent, IEventProcessor } from '../../interfaces';

import { Api, RawEvent, IEventData } from './types';
import { Enrich } from './filters/enricher';
import { ParseType } from './filters/type_parser';

const log = factory.getLogger(formatFilename(__filename));

export class Processor extends IEventProcessor<Api, RawEvent> {
  /**
   * Parse events out of an ethereum block and standardizes their format
   * for processing.
   *
   * @returns an array of processed events
   * @param event
   */
  public async process(event: RawEvent): Promise<CWEvent<IEventData>[]> {
    const kind = ParseType(event.event);
    if (!kind) return [];
    try {
      const cwEvent = await Enrich(this._api, event.blockNumber, kind, event);
      return [cwEvent];
    } catch (e) {
      log.error(`Failed to enrich event: ${e.message}`);
      return [];
    }
  }
}
