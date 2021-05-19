/**
 * Fetches events from Marlin contract in real time.
 */
import { Listener } from 'ethers/providers';

import { IEventSubscriber } from '../interfaces';
import { factory, formatFilename } from '../logging';

import { RawEvent, Api, Token } from './types';

const log = factory.getLogger(formatFilename(__filename));

export class Subscriber extends IEventSubscriber<Api, RawEvent> {
  private _name: string;
  public tokens: Token[];

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
    this._api.tokens.forEach(o=>o.addListener('*', this._listener));
  }

  public unsubscribe(): void {
    if (this._listener) {
      this._api.tokens.forEach(o=>o.removeListener('*', this._listener));
      this._listener = null;
    }
  }
}