import {
  Poller,
  Processor,
  StorageFetcher,
  Subscriber,
} from '../../../src/chains/substrate';
import { Listener } from '../../../src/chains/substrate/Listener';
import { EventKind } from '../../../src/chains/substrate/types';
import {
  networkUrls,
  EventSupportingChainT,
  CWEvent,
  IEventHandler,
  IChainEventData,
} from '../../../src';
import * as chai from 'chai';
import { ApiPromise } from '@polkadot/api';
import * as events from 'events';

const { assert } = chai;

class testHandler implements IEventHandler {
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

function delay(interval) {
  return it('delaying...', (done) => {
    setTimeout(() => done(), interval);
  }).timeout(interval + 100);
}

describe('Substrate listener class tests', () => {
  let listener;
  let handlerEmitter = new events.EventEmitter();

  it('should throw if the chain is not a substrate chain', () => {
    try {
      new Listener('randomChain' as EventSupportingChainT);
    } catch (error) {
      assert(String(error).includes('randomChain'));
    }
  });

  it('should create the substrate listener class', () => {
    // @ts-ignore
    listener = new Listener('polkadot', ...Array(4), true, null, true);
    assert.equal(listener.chain, 'polkadot');
    assert.deepEqual(listener.options, {
      archival: false,
      startBlock: 0,
      url: networkUrls['polkadot'],
      spec: {},
      skipCatchup: true,
      enricherConfig: {},
    });
    assert.equal(listener.subscribed, false);
    assert.equal(listener._verbose, true);
  });

  it('should initialize the substrate listener class', async () => {
    await listener.init();
    assert(listener._subscriber instanceof Subscriber);
    assert(listener._poller instanceof Poller);
    assert(listener._storageFetcher instanceof StorageFetcher);
    assert(listener._processor instanceof Processor);
    assert(listener._api instanceof ApiPromise);
    return;
  });

  it('should add a handler', async () => {
    listener.eventHandlers['testHandler'] = {
      handler: new testHandler(listener._verbose, handlerEmitter),
      excludedEvents: [],
    };

    assert(
      listener.eventHandlers['testHandler'].handler instanceof testHandler
    );
    return;
  });

  it('should subscribe the listener to the specified chain', async () => {
    await listener.subscribe();
    assert.equal(listener.subscribed, true);
  });

  it('should verify that the handler handled an event successfully', (done) => {
    let counter = 0;
    const verifyHandler = () => {
      assert(listener.eventHandlers['testHandler'].handler.counter >= 1);
      ++counter;
      if (counter == 1) done();
    };
    handlerEmitter.on('eventHandled', verifyHandler);
  }).timeout(20000);

  it('should update the chain spec', async () => {
    await listener.updateSpec({ randomSpec: 0 });
    assert.deepEqual(listener._options.spec, { randomSpec: 0 });
  });

  it('should verify that the handler handled an event successfully after restarting', (done) => {
    listener.eventHandlers['testHandler'].handler.counter = 0;
    let counter = 0;
    const verifyHandler = () => {
      assert(listener.eventHandlers['testHandler'].handler.counter >= 1);
      ++counter;
      if (counter == 1) done();
    };
    handlerEmitter.on('eventHandled', verifyHandler);
  }).timeout(20000);

  it('should update the url to the listener should connect to', async () => {});

  it('should verify that the handler handled an event successfully', () => {
    console.log(listener.eventHandlers['testHandler'].handler.counter);
    assert(listener.eventHandlers['testHandler'].handler.counter >= 1);
    listener.eventHandlers['testHandler'].handler.counter = 0;
    return;
  });

  it('should unsubscribe from the chain', async () => {
    listener.unsubscribe();
    assert.equal(listener.subscribed, false);
  });

  it('should return the updated options', async () => {
    assert.deepEqual(listener.options, {
      archival: false,
      startBlock: 0,
      url: networkUrls['polkadot'],
      spec: { randomSpec: 0 },
      skipCatchup: true,
      enricherConfig: {},
    });
  });
});
