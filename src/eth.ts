import { providers } from 'ethers';
import Web3 from 'web3';
import fetch from 'node-fetch';

import { factory, formatFilename } from './logging';

const log = factory.getLogger(formatFilename(__filename));

export async function createProvider(
  ethNetworkUrl: string
): Promise<providers.Web3Provider> {
  if (!ethNetworkUrl.includes('alchemy'))
    throw Error('Must use Alchemy Ethereum API');
  if (process && process.env) {
    const { ALCHEMY_API_KEY } = process.env;
    if (!ALCHEMY_API_KEY) {
      throw new Error('no alchemy api key found!');
    }

    const networkPrefix = ethNetworkUrl.split('alchemy')[0];

    ethNetworkUrl = `${networkPrefix}alchemyapi.io/v2/${ALCHEMY_API_KEY}`;

    let res;
    let data;
    try {
      res = await fetch(
        `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_API_KEY}`,
        {
          method: 'POST',
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_getBalance',
            params: ['0xBf4eD7b27F1d666546E30D74d50d173d20bca754', 'latest'],
            id: 1,
          }),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      data = await res.json();

      if (
        !data ||
        !Object.keys(data).includes('jsonrpc') ||
        !Object.keys(data).includes('id') ||
        !Object.keys(data).includes('result')
      )
        throw new Error('A connection to Alchemy could not be established.');
    } catch (error) {
      log.error('Check your ALCHEMY_API_KEY');
      throw error;
    }
  } else {
    throw new Error('must use nodejs to connect to Alchemy provider!');
  }

  const web3Provider = new Web3.providers.WebsocketProvider(ethNetworkUrl, {
    reconnect: {
      auto: false,
    },
  });
  const provider = new providers.Web3Provider(web3Provider);
  // 12s minute polling interval (default is 4s)
  provider.pollingInterval = 12000;
  return provider;
}
