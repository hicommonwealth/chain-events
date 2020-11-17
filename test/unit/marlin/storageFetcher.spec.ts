import chai from 'chai';
import { StorageFetcher } from '../../../src/marlin/storageFetcher';
import { EventKind, Proposal } from '../../../src/marlin/types';
import { Comp } from '../../../eth/types/Comp';
import { GovernorAlpha, } from '../../../eth/types/GovernorAlpha';
import { Timelock } from '../../../eth/types/Timelock';


const { assert } = chai;

const makeApi = (proposals?: Proposal[]) => {
  const comp = {
    provider: {
      getBlock: async (n: number) => ({ timestamp: n * 1000 }),
      getBlockNumber: async () => 200,
    }
  } as unknown as Comp;
  const governorAlpha = {
    votingDelay: async () => '2',
    votingPeriod: async () => '2',
    proposalCount: async () => '0',
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
    const api = makeApi();
    const fetcher = new StorageFetcher(api, makeDater());
    const fetched = await fetcher.fetch();
    assert.deepEqual(fetched, []);
  });

  xit('should fetch an active governorAlpha proposal from storage', async () => {
  });

  xit('should fetch an aborted governorAlpha proposal from storage', async () => {
  });

  xit('should fetch a processed governorAlpha proposal from storage', async () => {
  });

  xit('should accept a range parameter with/without endBlock', async () => {
  });

  xit('should terminate fetch on completed due to argument', async () => {
  });

  it('should throw error on api error', (done) => {
    const api = {} as any;
    const fetcher = new StorageFetcher(api, makeDater());
    fetcher.fetch().then(() => {
      done('should throw on api error');
    }).catch((err) => {
      done();
    });
  });

  // TODO: dater fail tests
});
