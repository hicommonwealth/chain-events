/**
 * Processes Compound events.
 */
import { IEventProcessor, CWEvent } from '../../interfaces';
import { factory, formatFilename } from '../../logging';

import { ParseType } from './filters/type_parser';
import { Enrich } from './filters/enricher';
import { IEventData, RawEvent, Api } from './types';

export class Processor extends IEventProcessor<Api, RawEvent> {
  /**
   * Parse events out of an ethereum block and standardizes their format
   * for processing.
   *
   * @param event
   * @param chain
   * @returns an array of processed events
   */
  public async process(
    event: RawEvent,
    chain?: string
  ): Promise<CWEvent<IEventData>[]> {
    const log = factory.getLogger(
      `${formatFilename(__filename)}::Compound${chain ? `::${chain}` : ''}`
    );
    const kind = ParseType(event.event, chain);
    if (!kind) return [];
    try {
      const cwEvent = await Enrich(
        this._api,
        event.blockNumber,
        kind,
        event,
        chain
      );
      return [cwEvent];
    } catch (e) {
      log.error(`Failed to enrich event: ${e.message}`);
      return [];
    }
  }
}
