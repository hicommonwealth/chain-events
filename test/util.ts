import { CWEvent, IChainEventData, IEventHandler } from '../src';
import events from 'events';
import { EventKind } from '../src/chains/substrate/types';

export class testHandler implements IEventHandler {
  private counter = 0;

  constructor(
    private _verbose: boolean,
    protected emitter: events.EventEmitter
  ) {}

  public async handle(
    event: CWEvent<IChainEventData>
  ): Promise<IChainEventData> {
    if (this._verbose)
      console.log(`Received event: ${JSON.stringify(event, null, 2)}`);
    if ((<any>Object).values(EventKind).includes(event.data.kind)) {
      ++this.counter;
      this.emitter.emit('eventHandled');
    }
    return event.data;
  }
}

export function discoverReconnectRange(chain: string) {
  // TODO: populate with good ranges for specific chains
  switch (chain) {
    case 'polkadot':
      return { startBlock: 650000 };
  }
}
