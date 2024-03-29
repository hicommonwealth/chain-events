import { EventEmitter } from 'events';

import chai from 'chai';

import { Subscriber } from '../../../src/chains/moloch/subscriber';
import { Api, RawEvent } from '../../../src/chains/moloch/types';

const { assert } = chai;

const toHex = (n: number | string) => ({ _hex: `0x${n.toString(16)}` });

describe('Moloch Event Subscriber Tests', () => {
  it('should callback with event data', (done) => {
    const molochApi = new EventEmitter();
    const subscriber = new Subscriber(
      (molochApi as unknown) as Api,
      'moloch-test'
    );
    const event = ({
      event: 'SubmitProposal',
      blockNumber: 10,
      args: {
        proposalIndex: toHex(1),
        delegateKey: 'delegate',
        memberAddress: 'member',
        applicant: 'applicant',
        tokenTribute: toHex(5),
        sharesRequested: toHex(6),
      },
    } as unknown) as RawEvent;
    const cb = (receivedEvent: RawEvent) => {
      assert.deepEqual(event, receivedEvent);
      done();
    };
    subscriber.subscribe(cb).then(() => {
      molochApi.emit('*', event);
    });
  });

  it('should no-op on unnecessary unsubscribe', (done) => {
    const molochApi = new EventEmitter();
    const subscriber = new Subscriber(
      (molochApi as unknown) as Api,
      'moloch-test'
    );
    subscriber.unsubscribe();
    done();
  });

  it('should unsubscribe successfully', (done) => {
    const molochApi = new EventEmitter();
    const subscriber = new Subscriber(
      (molochApi as unknown) as Api,
      'moloch-test'
    );
    const cb = () => {
      assert.fail('should not reach callback');
    };
    subscriber.subscribe(cb).then(() => {
      subscriber.unsubscribe();
      assert.deepEqual(molochApi.listeners('*'), []);
      done();
    });
  });
});
