/**
 * Processes ERC20 events.
 */
import { IEventProcessor, CWEvent } from '../../interfaces';
import { IEventData, RawEvent, Api } from './types';
export declare class Processor extends IEventProcessor<Api, RawEvent> {
    /**
     * Parse events out of an ethereum block and standardizes their format
     * for processing.
     * @param event
     * @returns an array of processed events
     */
    process(event: RawEvent): Promise<CWEvent<IEventData>[]>;
}
