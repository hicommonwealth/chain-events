import { createNode } from '../../scripts/eventsNode';
import {
  getSubstrateSpecs,
  listenerArgs,
  subscribers,
} from '../../scripts/listener';

import fetch from 'node-fetch';
import chai from 'chai';

const { assert } = chai;

describe('EventNode integration tests', () => {
  let listenerOption = {
    network: 'polkadot',
    archival: false,
    skipCatchup: true,
  };

  const app = createNode();

  describe('Tests adding a listener', () => {
    it('starts a listener', async function () {
      const res = await fetch('http://localhost:8081/addListener', {
        method: 'POST',
        body: JSON.stringify({ chain: 'polkadot', options: listenerOption }),
        headers: { 'Content-Type': 'application/json' },
      });
      assert.equal(res.status, 200);

      // TODO: test spec
      let la = listenerArgs['polkadot'];
      assert.equal(la.archival, false);
      assert.equal(la.startBlock, 0);
      assert.equal(la.url, 'wss://rpc.polkadot.io');
      assert.equal(la.contract, undefined);
      assert.equal(la.skipCatchup, true);
      // there are 4 default excluded events for substrate
      assert.equal(la.excludedEvents.length, 4);
      return;
    });

    it('should fail if chain or options are not given', async () => {
      let res = await fetch('http://localhost:8081/addListener', {
        method: 'POST',
        body: JSON.stringify({ options: listenerOption }),
        headers: { 'Content-Type': 'application/json' },
      });
      assert.equal(res.status, 400);

      res = await fetch('http://localhost:8081/addListener', {
        method: 'POST',
        body: JSON.stringify({ chain: 'polkadot' }),
        headers: { 'Content-Type': 'application/json' },
      });
      assert.equal(res.status, 400);

      return;
    });

    it('should fail if listener already exists', async () => {
      const res = await fetch('http://localhost:8081/addListener', {
        method: 'POST',
        body: JSON.stringify({ chain: 'polkadot', options: listenerOption }),
        headers: { 'Content-Type': 'application/json' },
      });
      assert.equal(res.status, 400);

      return;
    });
  });

  describe('Tests for updating specs', () => {
    it('should change the specs for any active listener', async () => {
      // const spec = await getSubstrateSpecs('polkadot');
      const spec = {
        fakeSpec: true,
      };

      const res = await fetch('http://localhost:8081/updateSpec', {
        method: 'POST',
        body: JSON.stringify({
          chain: 'polkadot',
          spec: spec,
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      assert.equal(res.status, 200);
      //@ts-ignore
      assert.isTrue(listenerArgs['polkadot'].spec.fakeSpec);

      return;
    });

    it('should fail if the chain or spec is not given', async () => {
      const spec = await getSubstrateSpecs('polkadot');

      let res = await fetch('http://localhost:8081/updateSpec', {
        method: 'POST',
        body: JSON.stringify({
          spec: spec,
        }),
        headers: { 'Content-Type': 'application/json' },
      });
      assert.equal(res.status, 400);

      res = await fetch('http://localhost:8081/updateSpec', {
        method: 'POST',
        body: JSON.stringify({
          chain: 'polkadot',
        }),
        headers: { 'Content-Type': 'application/json' },
      });
      assert.equal(res.status, 400);

      return;
    });

    it('should fail if the listener is inactive', async () => {
      const spec = await getSubstrateSpecs('polkadot');
      const res = await fetch('http://localhost:8081/updateSpec', {
        method: 'POST',
        body: JSON.stringify({
          chain: 'kusama',
          spec: spec,
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      assert.equal(res.status, 400);

      return;
    });
  });

  describe('Tests for changing excludedEvents', () => {
    it('should update the excluded events', async () => {
      const res = await fetch('http://localhost:8081/setExcludedEvents', {
        method: 'POST',
        body: JSON.stringify({
          chain: 'polkadot',
          excludedEvents: ['random-test-event'],
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      assert.equal(res.status, 200);
      assert.equal(
        listenerArgs['polkadot'].excludedEvents[0],
        'random-test-event'
      );

      return;
    });

    it('should fail if chain or excluded events is not given', async () => {
      let res = await fetch('http://localhost:8081/setExcludedEvents', {
        method: 'POST',
        body: JSON.stringify({
          excludedEvents: ['random-test-event'],
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      assert.equal(res.status, 400);

      res = await fetch('http://localhost:8081/setExcludedEvents', {
        method: 'POST',
        body: JSON.stringify({
          chain: 'polkadot',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      assert.equal(res.status, 400);

      return;
    });

    it('should fail if the listener/chain specified is not active', async () => {
      const res = await fetch('http://localhost:8081/setExcludedEvents', {
        method: 'POST',
        body: JSON.stringify({
          chain: 'kusama',
          excludedEvents: ['random-test-event'],
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      assert.equal(res.status, 400);
      return;
    });
  });

  describe('Tests for removing a listener', () => {
    it('Should remove an active listener', async () => {
      const res = await fetch('http://localhost:8081/removeListener', {
        method: 'POST',
        body: JSON.stringify({ chain: 'polkadot' }),
        headers: { 'Content-Type': 'application/json' },
      });
      assert.equal(res.status, 200);
      assert.isUndefined(listenerArgs['polkadot']);
      assert.isUndefined(subscribers['polkadot']);

      return;
    });
  });
});
