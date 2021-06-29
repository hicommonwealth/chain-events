import express from 'express';
import {
  listenerArgs,
  subscribers,
  setupListener,
  createListener,
} from './listener';

import { EventSupportingChainT, IChainEventKind } from '../src';

export function createNode() {
  const app = express();

  // request body as JSON (Content-Type = application/json)
  app.use(express.json());

  /**
   * Used to update the spec for any listener (chain).
   * {
   *   "chain": *the chain name*,
   *   "spec": {}
   * }
   */
  app.post('/updateSpec', async (req, res) => {
    const chain: EventSupportingChainT = req.body.chain;
    const spec: {} = req.body.spec;

    if (!chain || !spec) {
      res
        .status(400)
        .json({ error: `${!chain ? 'chain' : 'spec'} is not defined` });
      return;
    }

    if (listenerArgs[chain] == null) {
      res.status(400).json({ error: `No subscription to ${chain} found` });
      return;
    }

    try {
      subscribers[chain].unsubscribe();

      // turn on catchup in order to retrieve events not collected during downtime
      listenerArgs[chain].skipCatchup = false;

      listenerArgs[chain].spec = spec;

      subscribers[chain] = await setupListener(chain, listenerArgs[chain]);
      res.status(200).json({ message: 'Success' });
      return;
    } catch (error) {
      res
        .status(400)
        .json({ error: 'An error occurred during listener setup' });
    }
  });

  /**
   * Adds a listener to an active chain-events node.
   * {
   *   "chain": *the chain name*,
   *   "options": *listener options as defined in the readme multiple listener configuration*
   * }
   */
  app.post('/addListener', (req, res) => {
    const chain: EventSupportingChainT = req.body.chain;
    const options = req.body.options;

    if (!chain || !options) {
      res
        .status(400)
        .json({ error: `${!chain ? 'chain' : 'options'} is not defined` });
      return;
    }

    if (subscribers[chain]) {
      res
        .status(400)
        .json({ error: `Listener for ${chain} is already active` });
      return;
    }

    createListener(chain, options)
      .then(() => {
        res.status(200).json({ message: 'Success' });
      })
      .catch((error) => {
        res.status(400).json({ error: error });
      });
  });

  /**
   * Removes a listener from an active chain-events node.
   * {
   *   "chain": *the chain name*
   * }
   */
  app.post('/removeListener', (req, res) => {
    const chain: EventSupportingChainT = req.body.chain;

    if (!chain) {
      res.status(400).json({ error: 'Chain is not defined' });
      return;
    }

    if (listenerArgs[chain] == null) {
      res.status(400).json({ error: `No subscription to ${chain} found` });
      return;
    }

    try {
      subscribers[chain].unsubscribe();
      subscribers[chain] = undefined;
      listenerArgs[chain] = undefined;
      res.status(200).json({ message: 'Success' });
    } catch (error) {
      res.status(400).json({ error: error });
    }
  });

  /**
   * Sets the excluded events for any active chain. ExcludedEvents should be an array of event names
   * to ignore.
   * {
   *   "chain": *the chain name*
   *   "excludedEvents: []
   * }
   */
  app.post('/setExcludedEvents', (req, res) => {
    const chain: EventSupportingChainT = req.body.chain;
    const excludedEvents: IChainEventKind[] = req.body.excludedEvents;

    if (!chain || !excludedEvents) {
      res
        .status(400)
        .json({ error: 'ERROR - Chain or excluded events is not defined' });
      return;
    }

    if (listenerArgs[chain] == null) {
      res
        .status(400)
        .json({ error: `ERROR - There is no active listener for ${chain}` });
      return;
    }

    try {
      listenerArgs[chain].excludedEvents = excludedEvents;
      res.status(200).json({ message: 'Success' });
    } catch (error) {
      res.status(400).json(error);
    }
  });

  app.listen(8081, () => {
    console.log(`Events node started at http://localhost:${8081}`);
  });

  return app;
}
