import { createNode } from '../../src/eventsNode';
import { getRabbitMQConfig } from '../../src/listener/util';
import { listeners } from '../../src/listener';

import fetch from 'node-fetch';
// @ts-ignore
import chai from 'chai';
import { getSubstrateSpecs } from '../../src/listener/util';

const { assert } = chai;

describe.only('EventNode integration tests', () => {
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
      let la = listeners['polkadot'].args;
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

    it('should fail if the chain is not supported', async () => {
      const res = await fetch('http://localhost:8081/addListener', {
        method: 'POST',
        body: JSON.stringify({
          chain: 'some-random-chain',
          options: listenerOption,
        }),
        headers: { 'Content-Type': 'application/json' },
      });
      assert.equal(res.status, 400);
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
      assert.isTrue(listeners['polkadot'].args.spec.fakeSpec);

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

    it('should fail if the chain is not supported', async () => {
      const spec = await getSubstrateSpecs('polkadot');
      const res = await fetch('http://localhost:8081/updateSpec', {
        method: 'POST',
        body: JSON.stringify({
          chain: 'some-random-chain',
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
        listeners['polkadot'].args.excludedEvents[0],
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

    it('should fail if the chain is not supported', async () => {
      const res = await fetch('http://localhost:8081/setExcludedEvents', {
        method: 'POST',
        body: JSON.stringify({
          chain: 'some-random-chain',
          excludedEvents: ['random-test-event'],
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      assert.equal(res.status, 400);
      return;
    });
  });

  describe('Tests for getting chain identities', () => {
    it('should return an array of chain identity events', async () => {
      const res = await fetch('http://localhost:8081/getIdentity', {
        method: 'POST',
        body: JSON.stringify({
          // this address belongs to a current council member - test will fail
          // if he/she changes their chain identity details
          chain: 'polkadot',
          addresses: ['1629Shw6w88GnyXyyUbRtX7YFipQnjScGKcWr1BaRiMhvmAg'],
        }),
        headers: { 'Content-Type': 'application/json' },
      });
      assert.equal(res.status, 200);

      const identityEvents = (await res.json()).identityEvents;
      assert.equal(identityEvents[0].data.kind, 'identity-set');
      assert.equal(
        identityEvents[0].data.who,
        '1629Shw6w88GnyXyyUbRtX7YFipQnjScGKcWr1BaRiMhvmAg'
      );
      assert.equal(identityEvents[0].data.displayName, 'Patract');

      return;
    });

    it('should fail if chain or addresses is null', async () => {
      let res = await fetch('http://localhost:8081/getIdentity', {
        method: 'POST',
        body: JSON.stringify({
          chain: 'polkadot',
        }),
        headers: { 'Content-Type': 'application/json' },
      });
      assert.equal(res.status, 400);

      res = await fetch('http://localhost:8081/getIdentity', {
        method: 'POST',
        body: JSON.stringify({
          addressArr: ['1629Shw6w88GnyXyyUbRtX7YFipQnjScGKcWr1BaRiMhvmAg'],
        }),
        headers: { 'Content-Type': 'application/json' },
      });
      assert.equal(res.status, 400);

      return;
    });

    it('should fail if there is no listener for the given chain', async () => {
      const res = await fetch('http://localhost:8081/getIdentity', {
        method: 'POST',
        body: JSON.stringify({
          // this address belongs to a current council member - test will fail
          // if he/she changes their chain identity details
          chain: 'kusama',
          addressArr: ['1629Shw6w88GnyXyyUbRtX7YFipQnjScGKcWr1BaRiMhvmAg'],
        }),
        headers: { 'Content-Type': 'application/json' },
      });
      assert.equal(res.status, 400);

      return;
    });
  });

  // NOTE: THIS TEST SHOULD ALWAYS BE LAST AS IT REMOVES THE POLKADOT LISTENER
  describe('Tests for removing a listener', () => {
    it('Should remove an active listener', async () => {
      const res = await fetch('http://localhost:8081/removeListener', {
        method: 'POST',
        body: JSON.stringify({ chain: 'polkadot' }),
        headers: { 'Content-Type': 'application/json' },
      });
      assert.equal(res.status, 200);
      assert.isUndefined(listeners['polkadot']);
      return;
    });

    it('should fail if the chain is not supported', async () => {
      const res = await fetch('http://localhost:8081/removeListener', {
        method: 'POST',
        body: JSON.stringify({ chain: 'some-random-chain' }),
        headers: { 'Content-Type': 'application/json' },
      });
      assert.equal(res.status, 400);

      return;
    });

    it('should fail if the listener does not exist', async () => {
      const res = await fetch('http://localhost:8081/removeListener', {
        method: 'POST',
        body: JSON.stringify({ chain: 'edgeware' }),
        headers: { 'Content-Type': 'application/json' },
      });
      assert.equal(res.status, 400);

      return;
    });
  });
});
