import { EventEmitter } from 'events';
import chai from 'chai';

import { Subscriber } from '../../../src/compoundalpha/subscriber';
import { Api, RawEvent } from '../../../src/compoundalpha/types';

const { assert } = chai;

const toHex = (n: number | string) => ({ _hex: `0x${n.toString(16)}` });

const constructEvent = (data: object, section = '', typeDef: string[] = []): RawEvent => {
  return {
    args: data,
  } as RawEvent;
};

describe('Compoundalpha Event Subscriber Tests', () => {
  it('should callback with event data', async (done) => {
    const compoundalphaApi = {
      uni: new EventEmitter(),
      governorAlpha: new EventEmitter(),
      timelock: new EventEmitter(),
    }
    const subscriber = new Subscriber(compoundalphaApi as unknown as Api, 'compoundalpha-test');
    const fromDelegate = 'previousAddress';
    const toDelegate = 'toAddress';
    const delegator = 'fromAddress';
    const event = constructEvent({
      delegator,
      toDelegate,
      fromDelegate,
    });
    event.event = 'DelegateChanged';
    event.blockNumber = 10;
    const cb = (receivedEvent: RawEvent) => {
      assert.deepEqual(event, receivedEvent);
    };
    subscriber.subscribe(cb).then(() => {
      compoundalphaApi.uni.emit('*', event);
    });
    done();
  });

  it('should no-op on unnecessary unsubscribe', (done) => {
    const compoundalphaApi = new EventEmitter();
    const subscriber = new Subscriber(compoundalphaApi as unknown as Api, 'compoundalpha-test');
    subscriber.unsubscribe();
    done();
  });

  it('should unsubscribe successfully', (done) => {
    const compoundalphaApi = {
      uni: new EventEmitter(),
      governorAlpha: new EventEmitter(),
      timelock: new EventEmitter(),
    };
    const subscriber = new Subscriber(compoundalphaApi as unknown as Api, 'compoundalpha-test');
    const cb = (receivedEvent: RawEvent) => {
      assert.fail('should not reach callback');
    };
    subscriber.subscribe(cb).then(() => {
      subscriber.unsubscribe();
      assert.deepEqual(compoundalphaApi.uni.listeners('*'), []);
      assert.deepEqual(compoundalphaApi.governorAlpha.listeners('*'), []);
      assert.deepEqual(compoundalphaApi.timelock.listeners('*'), []);
      done();
    })
  });
});