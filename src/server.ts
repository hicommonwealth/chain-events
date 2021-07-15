import express from 'express';

import { chainSupportedBy, IChainEventKind, isSupportedChain } from './index';
import { StorageFetcher } from './chains/substrate';
import { EventChains as SubstrateEventChains } from './chains/substrate/types';
import {
  SubstrateListener,
  MolochListener,
  MarlinListener,
  Erc20Listener,
} from '../src/chains';

const listeners: { [key: string]: any } = {};

// TODO: setup the chain supported check as middleware
export function createNode() {
  const port = process.env.EVENT_NODE_PORT || 8081;
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
    const chain = req.body.chain;
    const spec: {} = req.body.spec;

    if (!chain || !spec) {
      return res
        .status(400)
        .json({ error: `${!chain ? 'chain' : 'spec'} is not defined` });
    }

    if (!isSupportedChain(chain))
      return res.status(400).json({ error: `${chain} is not supported` });

    if (listeners[chain] == null)
      return res
        .status(400)
        .json({ error: `No subscription to ${chain} found` });

    try {
      await listeners[chain].updateSpec(spec);
      res.status(200).json({ message: 'Success' });
      return;
    } catch (error) {
      res
        .status(400)
        .json({ error: 'An error occurred during listener setup' });
    }
  });

  // should adding a listener also instantiate a new storageFetcher for supported chains?
  /**
   * Adds a listener to an active chain-events node.
   * {
   *   "chain": *the chain name*,
   *   "options": *listener options as defined in the readme multiple listener configuration*
   * }
   */
  app.post('/addListener', (req, res) => {
    const chain: string = req.body.chain;
    const options = req.body.options;

    if (!chain || !options) {
      res
        .status(400)
        .json({ error: `${!chain ? 'chain' : 'options'} is not defined` });
      return;
    }

    if (!isSupportedChain(chain))
      return res.status(400).json({ error: `${chain} is not supported` });

    if (listeners[chain]?.subscriber) {
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
    const chain: string = req.body.chain;

    if (!chain) {
      res.status(400).json({ error: 'Chain is not defined' });
      return;
    }

    if (!isSupportedChain(chain))
      return res.status(400).json({ error: `${chain} is not supported` });

    if (listeners[chain] == null) {
      res.status(400).json({ error: `No subscription to ${chain} found` });
      return;
    }

    try {
      deleteListener(chain);
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
    const chain: string = req.body.chain;
    const excludedEvents: IChainEventKind[] = req.body.excludedEvents;

    if (!chain || !excludedEvents) {
      res
        .status(400)
        .json({ error: 'ERROR - Chain or excluded events is not defined' });
      return;
    }

    if (!isSupportedChain(chain))
      return res.status(400).json({ error: `${chain} is not supported` });

    if (listeners[chain] == null) {
      res
        .status(400)
        .json({ error: `ERROR - There is no active listener for ${chain}` });
      return;
    }

    try {
      listeners[chain].args.excludedEvents = excludedEvents;
      res.status(200).json({ message: 'Success' });
    } catch (error) {
      res.status(400).json(error);
    }
  });

  // addressArr may be large so get request is not suitable
  app.post('/getIdentity', async (req, res) => {
    const chain: string = req.body.chain;
    const addressArr: string[] = req.body.addresses;

    if (!chain || !addressArr) {
      res.status(400).json({
        error: `The ${!chain ? 'chain' : 'address array'} is not defined`,
      });
      return;
    }

    if (listeners[chain]?.subscriber == null) {
      res
        .status(400)
        .json({ error: `ERROR - There is no active listener for ${chain}` });
      return;
    }

    // This may change if supporting other chain identities
    if (!chainSupportedBy(chain, SubstrateEventChains)) {
      return res
        .status(400)
        .json({ message: `${chain} is not a Substrate chain` });
    }

    try {
      if (!listeners[chain].storageFetcher)
        listeners[chain].storageFetcher = new StorageFetcher(
          listeners[chain].subscriber.api
        );

      return res.status(200).json({
        identityEvents: await listeners[chain].storageFetcher.fetchIdentities(
          addressArr
        ),
      });
    } catch (error) {
      res.status(400).json({ error: error });
    }
  });

  app.listen(port, () => {
    console.log(`Events node started at http://localhost:${port}`);
  });

  return app;
}
