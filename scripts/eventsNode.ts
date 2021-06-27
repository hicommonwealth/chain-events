import express from 'express';
import { IEventSubscriber } from "../src";

function createApp(
  listenerArgs,
  subscribers: { [key: string]: IEventSubscriber<any, any> }
) {
  const app = express();

  app.post('/updateSpec', (req, res) => {
    console.log(req);
    try {
      subscribers[req.chain].unsubscribe();
    } catch (error) {
      res.status = 400;
      res.send('ERROR');
    }
  });

  app.listen(8081, () => {
    console.log(`server started at http://localhost:${8081}`);
  });

  return app;
}
