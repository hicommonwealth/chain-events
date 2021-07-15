import { CWEvent, IEventHandler } from '../interfaces';
import fetch from 'node-fetch';

export class httpPostHandler implements IEventHandler {
  public readonly url;

  constructor(url) {
    this.url = url;
  }

  public async handle(event: CWEvent): Promise<any> {
    try {
      const res = await fetch(this.url, {
        method: 'POST',
        body: JSON.stringify(event),
        headers: { 'Content-Type': 'application/json' },
      });

      // throw if there is an error
      console.log(`Post request status code: ${res.status}`);
      if (!res.ok) throw res;

      // log post request response
      console.log(await res.json());
    } catch (error) {
      console.error(`Error posting event ${event} to ${this.url}`);
      // log error info returned by the server if any
      console.error(await error.text());
    }
  }
}
