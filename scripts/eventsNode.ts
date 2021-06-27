import express from 'express';
import { IEventSubscriber, listenerOptionsT } from '../src';
import { listenerArgs } from './listener';

function createApp(
  listenerArgs: { [key: string]: listenerOptionsT },
  subscribers: { [key: string]: IEventSubscriber<any, any> },
  createSubscriber: () => Promise<IEventSubscriber<any, any>>
) {
  const app = express();

  app.post('/updateSpec', async (req, res) => {
    let chain = req.body.chain;
    let spec = req.body.spec;
    if (!chain || !spec) {
      res.status = 400;
      res.send('ERROR');
    }

    try {
      subscribers[chain].unsubscribe();
      listenerArgs[chain].spec = spec;
      subscribers[chain] = await createSubscriber();
    } catch (error) {
      res.status = 400;
      res.send('ERROR');
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
    console.log(`server started at http://localhost:${8081}`);
  });

  return app;
}
