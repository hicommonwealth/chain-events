/**
 * Fetches events from Marlin contract in real time.
 */
import { Listener } from '@ethersproject/providers';

import { IEventSubscriber } from '../../interfaces';
import log from '../../logging';

import { RawEvent, Api } from './types';

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
  public async subscribe(cb: (event: RawEvent) => void): Promise<void> {
    this._listener = (event: RawEvent): void => {
      const logStr = `Received ${this._name} event: ${JSON.stringify(
        event,
        null,
        2
      )}.`;
      // eslint-disable-next-line no-unused-expressions
      this._verbose ? log.info(logStr) : log.trace(logStr);
      cb(event);
    };
    this._api.comp.on('*', this._listener);
    this._api.governorAlpha.on('*', this._listener);
    this._api.timelock.on('*', this._listener);
  }

  public unsubscribe(): void {
    if (this._listener) {
      log.info(`Unsubscribing from ${this._name}`);
      this._api.comp.removeListener('*', this._listener);
      this._api.governorAlpha.removeListener('*', this._listener);
      this._api.timelock.removeListener('*', this._listener);
      this._listener = null;
    }
  }
}
