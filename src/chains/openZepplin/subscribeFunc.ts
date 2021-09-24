import sleep from 'sleep-promise';

import { factory, formatFilename } from '../../logging';
import { createProvider } from '../../eth';
import { Governor__factory as GovernorFactory } from '../../contractTypes';

import { Api } from './types';

const log = factory.getLogger(formatFilename(__filename));

/**
 * Attempts to open an API connection, retrying 3 times if it cannot be opened
 * @param ethNetworkUrl A url to a eth node endpoint such as wss://mainnet.infura.io/ws
 * @param govContractAddress The address of an Open Zepplin Governor contract: https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/governance/Governor.sol
 * @param retryTimeMs The number of milliseconds to wait before retrying to connect to the eth node
 */
export async function createApi(
  ethNetworkUrl: string,
  govContractAddress: string,
  retryTimeMs = 10000
): Promise<Api> {
  for (let i = 0; i < 3; ++i) {
    try {
      const provider = await createProvider(ethNetworkUrl);
      const govContract = GovernorFactory.connect(govContractAddress, provider);
      await govContract.deployed();

      log.info('Connection to deployed governance contract successful!');
      return govContract;
    } catch (error) {
      log.error(
        `Open Zepplin gov contract ${govContractAddress} connecting to ${ethNetworkUrl} failure: ${error.message}`
      );
      await sleep(retryTimeMs);
      log.error('Retrying connection...');
    }
  }
  throw new Error(
    `Failed to start Api for Open Zepplin contract ${govContractAddress} using ${ethNetworkUrl}`
  );
}
