import { providers } from 'ethers';
import Web3 from 'web3';

import { factory, formatFilename } from './logging';

export async function createProvider(
  ethNetworkUrl: string,
  chain?: string
): Promise<providers.Web3Provider> {
  const log = factory.getLogger(
    `${formatFilename(__filename)}::Aave${chain ? `::${chain}` : ''}`
  );

  if (!ethNetworkUrl.includes('alchemy') && !ethNetworkUrl.includes('infura'))
    throw new Error('Must use Alchemy or Infura Ethereum API');
  if (process && process.env) {
    // TODO: alchemy keys are different per network, so we need to ensure we have the correct
    //   keys for arbitrary networks
    let ALCHEMY_API_KEY;
    if (ethNetworkUrl.includes('ropsten')) {
      ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY_ROPSTEN;
      ethNetworkUrl = `wss://eth-ropsten.alchemyapi.io/v2/${ALCHEMY_API_KEY}`;
    } else if (ethNetworkUrl.includes('mainnet')) {
      ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
      ethNetworkUrl = `wss://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_API_KEY}`;
    } else {
      throw new Error('Must be on either ropsten or mainnet');
    }
    if (!ALCHEMY_API_KEY) {
      throw new Error('Alchemy API key not found, check your .env file');
    }

    try {
      const web3Provider = new Web3.providers.WebsocketProvider(ethNetworkUrl, {
        reconnect: {
          auto: false,
        },
      });
      const provider = new providers.Web3Provider(web3Provider);
      // 12s minute polling interval (default is 4s)
      provider.pollingInterval = 12000;
      const data = await provider.getBlock('latest');
      if (!data)
        throw new Error('A connection to Alchemy could not be established.');
      return provider;
    } catch (error) {
      log.error(`Failed to connect on ${ethNetworkUrl}`);
      log.error(`Check your ALCHEMY_API_KEY: ${error.message}`);
      throw error;
    }
  } else {
    throw new Error('must use nodejs to connect to Alchemy provider!');
  }
}
