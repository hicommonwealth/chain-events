import chai from 'chai';
import { utils } from 'ethers';

import { EventKind, RawEvent, Api } from '../../../src/aave/types';
import { Enrich } from '../../../src/aave/filters/enricher';

const { assert } = chai;

const constructEvent = (data): RawEvent => {
  return {
    args: data,
  } as RawEvent;
};

const blockNumber = 10000;
const api: Api = ({} as unknown) as Api;

describe('Aave Event Enricher Filter Tests', () => {
  // ProposalCreated
  it('should enrich ProposalCreated event', async () => {
    const kind = EventKind.ProposalCreated;
    const targets = ['0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B'];
    const values = ['0'];
    const signatures = ['_setCollateralFactor(address,uint256)'];
    const calldatas = [
      '0x000000000000000000000000c11b1268c1a384e55c48c2391d8d480264a3a7f40000000000000000000000000000000000000000000000000853a0d2313c0000',
    ];
    const ipfsHash = utils.formatBytes32String('0x123abc');
    const event = constructEvent({
      id: 1,
      creator: 'sender',
      executor: 'executor',
      targets,
      4: values,
      signatures,
      calldatas,
      startBlock: blockNumber,
      endBlock: blockNumber + 172,
      strategy: 'strategy',
      ipfsHash,
    });
    const result = await Enrich(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      excludeAddresses: ['sender'],
      data: {
        kind,
        id: 1,
        proposer: 'sender',
        executor: 'executor',
        targets,
        values,
        signatures,
        calldatas,
        startBlock: blockNumber,
        endBlock: blockNumber + 172,
        strategy: 'strategy',
        ipfsHash,
      },
    });
  });

  // ProposalCanceled
  it('should enrich ProposalCanceled event', async () => {
    const kind = EventKind.ProposalCanceled;
    const event = constructEvent({
      id: 1,
    });
    const result = await Enrich(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      excludeAddresses: [],
      data: {
        kind,
        id: 1,
      },
    });
  });

  // ProposalExecuted
  it('should enrich ProposalExecuted event', async () => {
    const kind = EventKind.ProposalExecuted;
    const event = constructEvent({
      id: 1,
    });
    const result = await Enrich(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      excludeAddresses: [],
      data: {
        kind,
        id: 1,
      },
    });
  });

  // ProposalQueued
  it('should enrich ProposalQueued event', async () => {
    const kind = EventKind.ProposalQueued;
    const executionTime = 123;
    const event = constructEvent({
      id: 1,
      executionTime,
    });
    const result = await Enrich(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      excludeAddresses: [],
      data: {
        kind,
        id: 1,
        executionTime,
      },
    });
  });

  // VoteEmitted
  it('should enrich VoteEmitted event', async () => {
    const kind = EventKind.VoteEmitted;
    const voter = 'i voted!';
    const id = 123;
    const support = false;
    const votingPower = '525600';
    const event = constructEvent({
      id,
      voter,
      support,
      votingPower,
    });
    const result = await Enrich(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      excludeAddresses: [voter],
      data: {
        kind,
        id,
        voter,
        support,
        votingPower,
      },
    });
  });
});
