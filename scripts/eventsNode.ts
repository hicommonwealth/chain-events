import express from 'express';
import {
  listenerArgs,
  subscribers,
  setupListener,
  getSubstrateSpecs,
} from './listener';

import { EventSupportingChainT } from '../src';

export function createNode() {
  const app = express();

  app.use(express.json());

  /**
   * Used to update the spec for any listener (chain). Requires 2 keys in
   * the requests body as JSON (Content-Type should be application/json)
   * {
   *   "chain": *the chain name*,
   *   "spec": {}
   * }
   */
  app.post('/updateSpec', async (req, res) => {
    let chain: EventSupportingChainT = req.body.chain;
    let spec: {} = req.body.spec;

    if (!chain || !spec) {
      res.status(400).send('ERROR - Chain or Spec is not defined');
      return;
    }

    if (listenerArgs[chain] == null) {
      res.status(400).send(`ERROR: No subscription to ${chain} found`);
      return;
    }

    try {
      subscribers[chain].unsubscribe();

      // turn on catchup in order to retrieve events not collected during downtime
      listenerArgs[chain].skipCatchup = false;

      listenerArgs[chain].spec = spec;
      subscribers[chain] = await setupListener(chain, listenerArgs[chain]);
      res.status(200).send('Success');
      return;
    } catch (error) {
      res.status(400).send(error);
    }
  });

  // below paths are possibilities if we want to take this "node" concept further
  // it means in order to change settings of a listener there is no need to ssh and
  // do a hard restart you can just submit requests
  // this would also bring us closer to the whole competitor to Subscan/TheGraph
  // but with live update capabilities and support a large variety of chains

  app.post('/addListener', (req, res) => {});

  app.post('/removeListener', (req, res) => {});

  app.post('/setExcludedEvents', (req, res) => {});

  app.listen(8081, () => {
    console.log(`Events node started at http://localhost:${8081}`);
  });

  return app;
}
