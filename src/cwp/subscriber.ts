/**
 * Fetches events from CWP contract in real time.
 */
import { Listener } from 'ethers/providers';

import { IEventSubscriber } from '../interfaces';
import { RawEvent, Api } from './types';

import { factory, formatFilename } from '../logging';
const log = factory.getLogger(formatFilename(__filename));

export class Subscriber extends IEventSubscriber<Api, RawEvent> {
  private _name: string;
  private _listener: Listener | null;
  constructor(api: Api, name: string, verbose = false) {
    super(api, verbose);
    this._name = name;
  }

  /**
  * Initializes subscription to chain and starts emitting events.
  */
  public async subscribe(cb: (event: RawEvent) => any): Promise<void> {
    this._listener = (event: RawEvent) => {
      const logStr = `Received ${this._name} event: ${JSON.stringify(event, null, 2)}.`;
      this._verbose ? log.info(logStr) : log.trace(logStr);
      cb(event);
    };
    // TODO: Uncomment when contracts are finished
    // this._api.protocol.addListener('*', this._listener);
    // this._api.project.addListener('*', this._listener);
    // this._api.collective.addListener('*', this._listener);
  }

  public unsubscribe(): void {
    if (this._listener) {
    // TODO: Uncomment when contracts are finished
      // this._api.protocol.removeListener('*', this._listener);
      // this._api.project.removeListener('*', this._listener);
      // this._api.collective.removeListener('*', this._listener);
      this._listener = null;
    }
  }
}
