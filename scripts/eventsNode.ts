import express from 'express';
import {
  listenerArgs,
  subscribers,
  setupListener,
  getSubstrateSpecs,
} from './listener';

export function createNode() {
  const app = express();

  app.use(express.json());

  app.post('/updateSpec', async (req, res) => {
    console.log(req.body);
    console.log(req.body.chain);

    req.body.spec = await getSubstrateSpecs('kulupu');

    console.log(req.body.spec);

    let chain = req.body.chain;
    let spec = req.body.spec;
    if (!chain || !spec) {
      res.status = 400;
      res.send('ERROR - Chain or Spec is not defined');
      return;
    }

    try {
      subscribers[chain].unsubscribe();
      listenerArgs[chain].spec = spec;
      subscribers[chain] = await setupListener(chain, listenerArgs[chain]);
      res.status(200).send('Success');
    } catch (error) {
      res.status = 400;
      res.send(error);
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
