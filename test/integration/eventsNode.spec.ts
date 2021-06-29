import { createNode } from '../../scripts/eventsNode';
import {
  getSubstrateSpecs,
  listenerArgs,
  subscribers,
} from '../../scripts/listener';
import fetch from 'node-fetch';
import { assert } from 'chai';

// TODO: test errors
describe.only('EventNode integration tests', () => {
  let listenerOption = {
    network: 'polkadot',
    archival: false,
    skipCatchup: true,
  };

  const app = createNode();

  it('should start a listener', function () {
    fetch('http://localhost:8081/addListener', {
      method: 'POST',
      body: JSON.stringify(listenerOption),
      headers: { 'Content-Type': 'application/json' },
    })
      .then(() => {
        return getSubstrateSpecs('polkadot');
      })
      .then((spec) => {
        let la = listenerArgs['polkadot'];
        assert.equal(la.archival, false);
        assert.equal(la.startBlock, 0);
        assert.equal(la.url, 'wss://rpc.polkadot.io');
        assert.equal(la.spec, spec);
        assert.equal(la.contract, undefined);
        assert.equal(la.skipCatchup, true);
        assert.equal(la.excludedEvents.length, 0);

        assert(
          subscribers['polkadot'] != undefined,
          'An active subscriber should be present'
        );
      });
  });

  it('should update the spec for an active listener', function () {
    const body = {
      chain: 'polkadot',
      spec: {
        fakeSpec: true,
      },
    };

    fetch('http://localhost:8081/addListener', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    }).then(() => {
      console.log(listenerArgs['polkadot']);
      // @ts-ignore
      assert.isTrue(listenerArgs['polkadot'].spec.fakeSpec);
    });
  });

  it('should change the excludedEvents of an active listener', function () {
    fetch('http://localhost:8081/setExcludedEvents', {
      method: 'POST',
      body: JSON.stringify(['random-test-event']),
      headers: { 'Content-Type': 'application/json' },
    }).then(() => {
      assert.equal(
        listenerArgs['polkadot'].excludedEvents[0],
        'random-test-event'
      );
    });
  });

  it('should remove an active listener', function () {
    fetch('http://localhost:8081/removeListener', {
      method: 'POST',
      body: JSON.stringify({ chain: 'polkadot' }),
      headers: { 'Content-Type': 'application/json' },
    }).then(() => {
      assert.isUndefined(listenerArgs['polkadot']);
      assert.isUndefined(subscribers['polkadot']);
    });
  });
});
