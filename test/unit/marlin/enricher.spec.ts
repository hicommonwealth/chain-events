import chai from 'chai';
import { EventKind, RawEvent, Api } from '../../../src/marlin/types';
import { Enrich } from '../../../src/marlin/filters/enricher';

const { assert } = chai;

const constructEvent = (data: object, section = '', typeDef: string[] = []): RawEvent => {
  return {
    args: data,
  } as RawEvent;
};

const blockNumber = 10000;
const api: Api = {} as unknown as Api;

const toHex = (n: number | string) => ({ _hex: `0x${n.toString(16)}` });

describe('Marlin Event Enricher Filter Tests', () => {
  // Comp Events
  // Approval
  it('should enrich approval event', async () => {
    const kind = EventKind.Approval;
    const owner = 'fromAddress';
    const spender = 'toAddress';
    const amount = '123';
    const event = constructEvent({
      owner,
      spender,
      amount,
    });
    const result = await Enrich(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      excludeAddresses: [ owner, spender ],
      data: {
        kind,
        owner,
        spender,
        amount,
      }
    });
  });
  // DelegateChanged

  // DelegateVotesChanged

  // Transfer

  // GovernorAlpha Events
  it('should enrich submit proposal event', async () => {
    const kind = EventKind.ProposalCreated;
    const event = constructEvent({
      id: 1,
      proposer: 'sender',
      targets: ['hello'],
      values: ['hello2'],
      signatures: ['hello3'],
      calldatas: ['hello4'],
      startBlock: blockNumber,
      endBlock: blockNumber + 172, // votingPeriod()
      description: 'test description',
    });
    const result = await Enrich(api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      excludeAddresses: [ 'sender' ],
      data: {
        kind,
        id: 1,
        proposer: 'sender',
        targets: ['hello'],
        values: ['hello2'],
        signatures: ['hello3'],
        calldatas: ['hello4'],
        startBlock: blockNumber,
        endBlock: blockNumber + 172, // votingPeriod()
        description: 'test description',
      }
    });
  });

});
