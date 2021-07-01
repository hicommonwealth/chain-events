// TODO: implement check to make sure returned data is really a spec
import { CWEvent, EventSupportingChainT, IEventHandler } from '../interfaces';
import fetch from 'node-fetch';
import { listeners } from './index';
import fs from 'fs';
import config from '../rabbitmq/RabbitMQconfig.json';

const tokenListUrls = [
  'https://wispy-bird-88a7.uniswap.workers.dev/?url=http://tokenlist.aave.eth.link',
  'https://gateway.ipfs.io/ipns/tokens.uniswap.org',
  'https://wispy-bird-88a7.uniswap.workers.dev/?url=http://defi.cmc.eth.link',
];

export class StandaloneEventHandler extends IEventHandler {
  public async handle(event: CWEvent): Promise<any> {
    console.log(`Received event: ${JSON.stringify(event, null, 2)}`);
  }
}

export function deleteListener(chain: EventSupportingChainT) {
  try {
    listeners[chain].subscriber.unsubscribe();
    listeners[chain] = undefined;
    return;
  } catch (error) {
    return error;
  }
}

// returns either the RabbitMQ config specified by the filepath or the default config
export function getRabbitMQConfig(filepath?: string) {
  if (typeof filepath == 'string' && filepath.length == 0) return config;
  else {
    try {
      let raw = fs.readFileSync(filepath);
      return JSON.parse(raw.toString());
    } catch (error) {
      console.error(`Failed to load the configuration file at: ${filepath}`);
      console.warn('Using default RabbitMQ configuration');
      return config;
    }
  }
}

export async function getSubstrateSpecs(chain: EventSupportingChainT) {
  let url: string = `${
    process.env.SUBSTRATE_SPEC_ENDPOINT ||
    'http://localhost:8080/api/getSubstrateSpec'
  }?chain=${chain}`;

  console.log(`Getting ${chain} spec at url ${url}`);

  let data: any = await fetch(url)
    .then((res) => res.json())
    .then((json) => json.result)
    .catch((err) => console.error(err));

  return data;
}

export async function getTokenLists() {
  let data: any = await Promise.all(
    tokenListUrls.map((url) =>
      fetch(url)
        .then((o) => o.json())
        .catch((e) => console.error(e))
    )
  );
  data = data.map((o) => o && o.tokens).flat();
  data = data.filter((o) => o); //remove undefined
  return data;
}
