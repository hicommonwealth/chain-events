import {
  Listener,
  Poller,
  Processor,
  StorageFetcher,
  Subscriber,
} from '../../../src/chains/substrate';
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

const { assert } = chai;

class testHandler implements IEventHandler {
  private counter = 0;
  public async handle(
    event: CWEvent<IChainEventData>
  ): Promise<IChainEventData> {
    if ((<any>Object).values(EventKind).includes(event.data.kind))
      ++this.counter;
    return event.data;
  }
}

describe('Substrate listener class tests', () => {
  let listener;
  it('should create the substrate listener class', () => {
    listener = new Listener('polkadot');
    assert.equal(listener.chain, 'polkadot');
    assert.deepEqual(listener.options, {
      archival: false,
      startBlock: 0,
      url: networkUrls['polkadot'],
      spec: {},
      skipCatchup: false,
      enricherConfig: {},
    });
    assert.equal(listener.subscribed, false);
  });

  it('should throw if the chain is not a substrate chain', () => {
    try {
      new Listener('randomChain' as EventSupportingChainT);
    } catch (error) {
      assert(String(error).includes('randomChain'));
    }
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
      handler: new testHandler(),
      excludedEvents: [],
    };

    assert(
      listener.eventHandlers['testHandler'].handler instanceof testHandler
    );
  });

  it('should subscribe the listener to the specified chain', async () => {
    await listener.subscribe();
    assert.equal(listener.subscribed, true);
  });

  it('should update the chain spec', async () => {});

  it('should update the url to the listener should connect to', async () => {});

  it('should unsubscribe from the chain', async () => {});

  it('should return the updated options', async () => {});
});
