import {
  Processor,
  StorageFetcher,
  Subscriber,
} from '../../../src/chains/aave';
import { Listener } from '../../../src/chains/aave';
import { networkUrls, EventSupportingChainT, contracts } from '../../../src';
import * as chai from 'chai';
import * as events from 'events';
import { testHandler } from '../../util';

import dotenv from 'dotenv';
dotenv.config();

const { assert } = chai;

describe('Aave listener class tests', () => {
  let listener;
  let handlerEmitter = new events.EventEmitter();

  it('should throw if the chain is not an Aave based contract', () => {
    try {
      new Listener('randomChain' as EventSupportingChainT, contracts['aave']);
    } catch (error) {
      assert(String(error).includes('randomChain'));
    }
  });

  it('should create an Aave listener', () => {
    listener = new Listener('aave', contracts['aave'], null, true, false);
    assert.equal(listener.chain, 'aave');
    assert.deepEqual(listener.options, {
      url: networkUrls['aave'],
      skipCatchup: true,
      govContractAddress: contracts['aave'],
    });
    assert.equal(listener.subscribed, false);
    assert.equal(listener._verbose, false);
  });

  it('should initialize the Aave listener', async () => {
    await listener.init();
    assert(listener._subscriber instanceof Subscriber);
    assert(listener.storageFetcher instanceof StorageFetcher);
    assert(listener._processor instanceof Processor);
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
      if (counter == 1) {
        clearTimeout(timeoutHandler);
        done();
      }
    };
    handlerEmitter.on('eventHandled', verifyHandler);

    // after 10 seconds with no event received use storage fetcher to verify api/connection
    const timeoutHandler = setTimeout(() => {
      // handlerEmitter.removeAllListeners();
      let startBlock = 9786650;

      listener.storageFetcher.fetch({ startBlock }).then((events) => {
        if (events.length > 0) done();
        else assert.fail('No event received and storage handler failed');
      });
    }, 10000);
  }).timeout(50000);

  xit('should update the contract address');

  xit('should verify that the handler handled an event successfully after changing contract address', (done) => {
    listener.eventHandlers['testHandler'].handler.counter = 0;
    let counter = 0;
    const verifyHandler = () => {
      assert(listener.eventHandlers['testHandler'].handler.counter >= 1);
      ++counter;
      if (counter == 1) done();
    };
    handlerEmitter.on('eventHandled', verifyHandler);
  }).timeout(20000);

  xit('should update the url the listener should connect to', async () => {});

  xit('should verify that the handler handled an event successfully after changing urls', () => {
    assert(
      listener.eventHandlers['testHandler'].handler.counter >= 1,
      'Handler was not triggered/used'
    );
    listener.eventHandlers['testHandler'].handler.counter = 0;
    return;
  });

  it('should unsubscribe from the chain', async () => {
    listener.unsubscribe();
    assert.equal(listener.subscribed, false);
  });

  it('should return the updated options', async () => {
    assert.deepEqual(listener.options, {
      url: networkUrls['aave'],
      skipCatchup: true,
      govContractAddress: contracts['aave'],
    });
  });
});
