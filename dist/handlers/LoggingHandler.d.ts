import { CWEvent, IEventHandler } from '../interfaces';
export declare class LoggingHandler extends IEventHandler {
    handle(event: CWEvent): Promise<any>;
}
