/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
/* eslint-disable no-unused-expressions */
import { EventEmitter } from 'events';

import { providers, utils } from 'ethers';
import { assert } from 'chai';

import {
  AaveTokenV2Mock__factory as AaveTokenV2Factory,
  AaveTokenV2Mock as AaveTokenV2,
  GovernanceStrategy__factory as GovernanceStrategyFactory,
  GovernanceStrategy,
  Executor__factory as ExecutorFactory,
  Executor,
  AaveGovernanceV2__factory as AaveGovernanceV2Factory,
} from '../../src/contractTypes';
import {
  Api,
  IEventData,
  EventKind,
  IProposalCreated,
  IProposalCanceled,
  IVoteEmitted,
  ProposalState,
  IProposalQueued,
  IProposalExecuted,
} from '../../src/aave/types';
import { subscribeEvents } from '../../src/aave/subscribeFunc';
import { IEventHandler, CWEvent, IChainEventData } from '../../src/interfaces';
import { StorageFetcher } from '../../src/aave/storageFetcher';

function getProvider(): providers.Web3Provider {
  const web3Provider = require('ganache-cli').provider({
    allowUnlimitedContractSize: true,
    gasLimit: 1000000000,
    time: new Date(1000),
    mnemonic: 'Alice',
    // logger: console,
  });
  return new providers.Web3Provider(web3Provider);
}

class AaveEventHandler extends IEventHandler {
  constructor(public readonly emitter: EventEmitter) {
    super();
  }

  public async handle(event: CWEvent<IEventData>): Promise<IChainEventData> {
    this.emitter.emit(event.data.kind.toString(), event);
    return null;
  }
}

function assertEvent<T extends IEventData>(
  handler: AaveEventHandler,
  event: EventKind,
  cb: (evt: CWEvent<T>) => void
) {
  return new Promise<void>((resolve, reject) => {
    handler.emitter.on(event, (evt: CWEvent<T>) => {
      try {
        cb(evt);
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  });
}

interface ISetupData {
  api: Api;
  executor: Executor;
  strategy: GovernanceStrategy;
  addresses: string[];
  provider: providers.Web3Provider;
  handler: AaveEventHandler;
}

async function increaseTime(
  blocks: number,
  provider: providers.Web3Provider
): Promise<void> {
  const timeToAdvance = blocks * 15;
  console.log(`Mining ${blocks} blocks and adding ${timeToAdvance} seconds!`);
  await provider.send('evm_increaseTime', [timeToAdvance]);
  for (let i = 0; i < blocks; i++) {
    await provider.send('evm_mine', []);
  }
}

async function setupSubscription(subscribe = true): Promise<ISetupData> {
  const provider = getProvider();
  const addresses: string[] = await provider.listAccounts();
  const [member] = addresses;
  const signer = provider.getSigner(member);
  const TOTAL_SUPPLY = '1000000';

  // deploy and delegate tokens
  const tokenFactory = new AaveTokenV2Factory(signer);
  const token1 = await tokenFactory.deploy();
  await token1.mint(member, TOTAL_SUPPLY);
  await token1.delegate(member);
  const token2 = await tokenFactory.deploy();
  await token2.mint(member, TOTAL_SUPPLY);
  await token2.delegate(member);
  await increaseTime(1, provider);

  // deploy strategy
  const strategyFactory = new GovernanceStrategyFactory(signer);
  const strategy = await strategyFactory.deploy(token1.address, token2.address);

  // deploy AaveGovernance without executor, so we can pass as admin to executor constructor
  const govFactory = new AaveGovernanceV2Factory(signer);
  const governance = await govFactory.deploy(
    strategy.address,
    4, // 4 block voting delay
    member,
    []
  );

  // deploy Executor
  const executorFactory = new ExecutorFactory(signer);
  const executor = await executorFactory.deploy(
    governance.address,
    60, // 1min delay
    60, // 1min grace period
    15, // 15s minimum delay
    120, // 2min maximum delay
    10, // 10% of supply required to submit
    12, // 12 blocks voting period
    10, // 10% differential required to pass
    20 // 20% quorum
  );

  // authorize executor on governance contract
  await governance.authorizeExecutors([executor.address]);

  const api = { governance };
  const emitter = new EventEmitter();
  const handler = new AaveEventHandler(emitter);
  if (subscribe) {
    await subscribeEvents({
      chain: 'aave-local',
      api,
      handlers: [handler],
      // skipCatchup: true,
    });
  }
  return { api, executor, strategy, addresses, provider, handler };
}

async function createProposal({
  api,
  executor,
  addresses,
  provider,
  handler,
}: ISetupData): Promise<number> {
  const targets = ['0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B'];
  const values = ['0'];
  const signatures = ['_setCollateralFactor(address,uint256)'];
  const calldatas = [
    '0x000000000000000000000000c11b1268c1a384e55c48c2391d8d480264a3a7f40000000000000000000000000000000000000000000000000853a0d2313c0000',
  ];
  const withDelegateCalls = [false];
  const ipfsHash = utils.formatBytes32String('0x123abc');
  const strategy = await api.governance.getGovernanceStrategy();
  const blockNumber = await provider.getBlockNumber();
  const id = await api.governance.getProposalsCount();
  await api.governance.create(
    executor.address,
    targets,
    values,
    signatures,
    calldatas,
    withDelegateCalls,
    ipfsHash
  );
  await assertEvent(
    handler,
    EventKind.ProposalCreated,
    (evt: CWEvent<IProposalCreated>) => {
      assert.deepEqual(evt.data, {
        kind: EventKind.ProposalCreated,
        id: +id,
        proposer: addresses[0],
        executor: executor.address,
        targets,
        values,
        signatures,
        calldatas,
        startBlock: blockNumber + 1 + 4, // voting delay
        endBlock: blockNumber + 1 + 4 + 12, // voting delay + voting duration
        strategy,
        ipfsHash,
      });
    }
  );
  const state = await api.governance.getProposalState(id);
  assert.equal(state, ProposalState.PENDING);
  return +id;
}

async function createAndCancel(setupData: ISetupData): Promise<number> {
  const id = await createProposal(setupData);
  await setupData.api.governance.cancel(id);
  await assertEvent(
    setupData.handler,
    EventKind.ProposalCanceled,
    (evt: CWEvent<IProposalCanceled>) => {
      assert.deepEqual(evt.data, {
        kind: EventKind.ProposalCanceled,
        id,
      });
    }
  );
  return id;
}

async function createAndVote({
  api,
  executor,
  addresses,
  strategy,
  provider,
  handler,
}: ISetupData): Promise<number> {
  const id = await createProposal({
    api,
    executor,
    addresses,
    strategy,
    provider,
    handler,
  });

  // advance time to proposal start
  const { startBlock } = await api.governance.getProposalById(id);
  const currentBlock = await provider.getBlockNumber();
  const blocksToAdvance = +startBlock - currentBlock + 1;
  await increaseTime(blocksToAdvance, provider);

  const votingBlock = await provider.getBlockNumber();
  const state = await api.governance.getProposalState(id);
  assert.equal(state, ProposalState.ACTIVE);

  // emit vote
  const votingPower = await strategy.getVotingPowerAt(
    addresses[0],
    votingBlock
  );
  await api.governance.submitVote(id, true);
  await assertEvent(
    handler,
    EventKind.VoteEmitted,
    (evt: CWEvent<IVoteEmitted>) => {
      assert.deepEqual(evt.data, {
        kind: EventKind.VoteEmitted,
        id,
        voter: addresses[0],
        support: true,
        votingPower: votingPower.toString(),
      });
    }
  );
  return id;
}

async function proposeToCompletion(setupData: ISetupData): Promise<number> {
  const id = await createAndVote(setupData);

  // wait for voting to succeed
  const { api, provider, executor } = setupData;
  const { endBlock } = await api.governance.getProposalById(id);
  const currentBlock = await provider.getBlockNumber();
  const blocksToAdvance = +endBlock - currentBlock + 1;
  await increaseTime(blocksToAdvance, provider);

  const state = await api.governance.getProposalState(id);
  assert.equal(state, ProposalState.SUCCEEDED);

  // queue proposal
  const delay = await executor.getDelay();
  await api.governance.queue(id);
  const queueBlock = await provider.getBlockNumber();
  const { timestamp } = await provider.getBlock(queueBlock);
  const executionTime = timestamp + +delay;
  await assertEvent(
    setupData.handler,
    EventKind.ProposalQueued,
    (evt: CWEvent<IProposalQueued>) => {
      assert.deepEqual(evt.data, {
        kind: EventKind.ProposalQueued,
        id,
        executionTime,
      });
    }
  );
  const queuedState = await api.governance.getProposalState(id);
  assert.equal(queuedState, ProposalState.QUEUED);

  // wait for execution
  const delayBlocks = Math.ceil(+delay / 15) + 1;
  await increaseTime(delayBlocks, provider);
  await api.governance.execute(id);
  await assertEvent(
    setupData.handler,
    EventKind.ProposalExecuted,
    (evt: CWEvent<IProposalExecuted>) => {
      assert.deepEqual(evt.data, {
        kind: EventKind.ProposalExecuted,
        id,
      });
    }
  );
  return id;
}

describe('Aave Event Integration Tests', () => {
  it('should create a proposal', async () => {
    const setupData = await setupSubscription();
    await createProposal(setupData);
  });

  it('should cancel a proposal', async () => {
    const setupData = await setupSubscription();
    await createAndCancel(setupData);
  });

  it('should vote on a proposal', async () => {
    const setupData = await setupSubscription();
    await createAndVote(setupData);
  });

  it('should queue and execute a proposal', async () => {
    const setupData = await setupSubscription();
    await proposeToCompletion(setupData);
  });

  it('should fetch proposals from storage', async () => {
    const setupData = await setupSubscription();
    const { api, strategy, executor, addresses } = setupData;

    const targets = ['0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B'];
    const values = ['0'];
    const signatures = ['_setCollateralFactor(address,uint256)'];
    const calldatas = [
      '0x000000000000000000000000c11b1268c1a384e55c48c2391d8d480264a3a7f40000000000000000000000000000000000000000000000000853a0d2313c0000',
    ];
    const ipfsHash = utils.formatBytes32String('0x123abc');

    // cancel first proposal
    const cancelledId = await createAndCancel(setupData);
    const cancelledProposal = await api.governance.getProposalById(cancelledId);
    const cancelledEventData: CWEvent<IEventData>[] = [
      {
        blockNumber: +cancelledProposal.startBlock,
        data: {
          kind: EventKind.ProposalCreated,
          id: cancelledId,
          proposer: addresses[0],
          executor: executor.address,
          targets,
          values,
          signatures,
          calldatas,
          startBlock: +cancelledProposal.startBlock,
          endBlock: +cancelledProposal.endBlock,
          strategy: strategy.address,
          ipfsHash,
        },
      },
      {
        blockNumber: +cancelledProposal.endBlock,
        data: {
          kind: EventKind.ProposalCanceled,
          id: cancelledId,
        },
      },
    ];

    // complete second proposal
    const completedId = await proposeToCompletion(setupData);
    const completedProposal = await api.governance.getProposalById(completedId);
    const completedEventData: CWEvent<IEventData>[] = [
      {
        blockNumber: +completedProposal.startBlock,
        data: {
          kind: EventKind.ProposalCreated,
          id: completedId,
          proposer: addresses[0],
          executor: executor.address,
          targets,
          values,
          signatures,
          calldatas,
          startBlock: +completedProposal.startBlock,
          endBlock: +completedProposal.endBlock,
          strategy: strategy.address,
          ipfsHash,
        },
      },
      {
        blockNumber: +completedProposal.endBlock,
        data: {
          kind: EventKind.ProposalQueued,
          id: completedId,
          executionTime: +completedProposal.executionTime,
        },
      },
      {
        blockNumber: +completedProposal.endBlock,
        data: {
          kind: EventKind.ProposalExecuted,
          id: completedId,
        },
      },
    ];

    // fetch all non-complete from storage (only most recent)
    const fetcher = new StorageFetcher(api);
    const nonCompletedData = await fetcher.fetch(undefined, false);
    assert.sameDeepMembers(nonCompletedData, completedEventData);

    // fetch all from storage incl complete
    const allData = await fetcher.fetch(undefined, true);
    assert.sameDeepMembers(allData, [
      ...cancelledEventData,
      ...completedEventData,
    ]);

    // fetch cancelled from storage via range
    const cancelledData = await fetcher.fetch(
      { startBlock: 0, endBlock: +cancelledProposal.startBlock + 1 },
      true
    );
    assert.sameDeepMembers(cancelledData, cancelledEventData);

    // fetch completed from storage via range
    const completedData = await fetcher.fetch(
      { startBlock: +completedProposal.startBlock },
      true
    );
    assert.sameDeepMembers(completedData, completedEventData);
  });
});
