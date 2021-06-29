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
      res.status(400).send('ERROR - Chain or options is not defined');
      return;
    }

    createListener(chain, options)
      .then(() => {
        res.status(200).send('Success');
      })
      .catch((error) => {
        res.status(400).send(error);
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
      res.status(400).send('ERROR - Chain is not defined');
      return;
    }

    if (listenerArgs[chain] == null) {
      res.status(400).send(`ERROR: No subscription to ${chain} found`);
      return;
    }

    try {
      subscribers[chain].unsubscribe();
      subscribers[chain] = undefined;
      listenerArgs[chain] = undefined;
      res.status(200).send('Success');
    } catch (error) {
      res.status(400).send(error);
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
    const excludedEvents: IChainEventKind[] = req.body.spec;

    if (!chain || !excludedEvents) {
      res.status(400).send('ERROR - Chain or excluded events is not defined');
      return;
    }

    if (listenerArgs[chain] == null) {
      res.status(400).send(`ERROR - There is no active listener for ${chain}`);
      return;
    }

    try {
      listenerArgs[chain].excludedEvents = excludedEvents;
      res.status(200).send('Success');
    } catch (error) {
      res.status(400).send(error);
    }
  });

  app.listen(8081, () => {
    console.log(`Events node started at http://localhost:${8081}`);
  });

  return app;
}
