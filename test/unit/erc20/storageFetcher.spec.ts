import chai from 'chai';
import { BigNumber } from 'ethers';

import { Api, EventKind } from '../../../src/chains/erc20/types';
import { createApi, StorageFetcher } from '../../../src/chains/erc20';

const { assert } = chai;

const makeApi = () => {
  return ({
    tokens: [
      {
        queryFilter: async () => [],
        filters: {
          Transfer: async () => null,
          Approval: async () => null,
        },
      },
    ],
    provider: {
      getBlock: async (n: number) => ({ timestamp: n * 1000 }),
      getBlockNumber: async () => 200,
    },
    tokenNames: [],
  } as unknown) as Api;
};

describe.only('Erc20 Storage Fetcher Tests', () => {
  it('should run gracefully with nothing in storage', async () => {
    const api = makeApi();
    const fetcher = new StorageFetcher(api);
    const fetched = await fetcher.fetch();
    assert.deepEqual(fetched, []);
  });

  it('should fetch transfer events', async () => {
    const api = await createApi(
      'wss://mainnet.infura.io/ws',
      ['0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'],
      10000,
      ['usdc']
    );
    const fetcher = new StorageFetcher(api);
    const fetched = await fetcher.fetch({
      startBlock: 13270138,
      endBlock: 13270139,
    });

    assert.deepEqual(fetched[fetched.length - 1], {
      blockNumber: 13270138,
      includeAddresses: [
        '0x503828976D22510aad0201ac7EC88293211D23Da',
        '0x9491A4d3197c8D14681CC64654a9Dc59544f00a0',
      ],
      data: {
        contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        kind: EventKind.Transfer,
        from: '0x503828976D22510aad0201ac7EC88293211D23Da',
        to: '0x9491A4d3197c8D14681CC64654a9Dc59544f00a0',
        value: <number>(<unknown>BigNumber.from(1000000000)),
      },
      chain: <never>'usdc',
    });
  });
});
