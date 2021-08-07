import { CWEvent, IEventHandler } from '../interfaces';
import log from '../logging';

export class LoggingHandler extends IEventHandler {
  public async handle(event: CWEvent): Promise<any> {
    log.info(`Received event: ${JSON.stringify(event, null, 2)}`);
  }
}
