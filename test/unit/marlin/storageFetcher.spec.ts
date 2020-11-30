import chai from 'chai';
import { StorageFetcher } from '../../../src/marlin/storageFetcher';
import { EventKind, Proposal } from '../../../src/marlin/types';
import { Comp } from '../../../eth/types/Comp';
import { GovernorAlpha, } from '../../../eth/types/GovernorAlpha';
import { Timelock } from '../../../eth/types/Timelock';
import { BigNumber } from 'ethers/utils';


const { assert } = chai;

const makeApi = (proposals: Proposal[]) => {
  const comp = {
    provider: {
      getBlock: async (n: number) => ({ timestamp: n * 1000 }),
      getBlockNumber: async () => 200,
    }
  } as unknown as Comp;
  const governorAlpha = {
    votingDelay: async () => '2',
    votingPeriod: async () => '2',
    proposalCount: async () => proposals.length,
    proposals: async (n: number) => proposals[n],
    provider: {
      getBlock: async (n: number) => ({ timestamp: n * 1000 }),
      getBlockNumber: async () => 200,
    }
  } as unknown as GovernorAlpha;
  const timelock = {
    provider: {
      getBlock: async (n: number) => ({ timestamp: n * 1000 }),
      getBlockNumber: async () => 200,
    }
  } as unknown as Timelock;
  return {
    comp,
    governorAlpha,
    timelock,
  };
};

const makeDater = (minAvailableBlock = 0) => {
  return {
    getDate: (timestamp) => {
      if (!timestamp) throw new Error('no timestamp given');
      if ((timestamp / 1000) < minAvailableBlock) return undefined;
      return {
        date: `${timestamp / 1000}`,
        block: timestamp / 1000,
      };
    }
  };
};

describe('Marlin Storage Fetcher Tests', () => {
  it('should run gracefully with nothing in storage', async () => {
    const api = makeApi([]);
    const fetcher = new StorageFetcher(api, makeDater());
    const fetched = await fetcher.fetch();
    assert.deepEqual(fetched, []);
  });
  it('should handle an event from the contract', async () => {
    const proposals: Proposal[] = [{
      id: new BigNumber(1),
      proposer: '',
      eta: new BigNumber(3),
      startBlock: new BigNumber(0),
      endBlock: new BigNumber(3*172),
      forVotes: new BigNumber(0),
      againstVotes: new BigNumber(0),
      canceled: false,
      executed: false,
      description: 'hello world',
    } as unknown as Proposal]
    const api = makeApi(proposals);
    const fetcher = new StorageFetcher(api, makeDater());
    console.log(await api.governorAlpha.proposalCount());
    const fetched = await fetcher.fetch();
    console.log('fetched:', fetched);
    assert.deepEqual(fetched, []);
  });
});
