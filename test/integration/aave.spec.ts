/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
/* eslint-disable no-unused-expressions */
import { EventEmitter } from 'events';

import { providers, utils } from 'ethers';
import { assert } from 'chai';

import {
  AaveTokenV2__factory as AaveTokenV2Factory,
  AaveTokenV2,
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
} from '../../src/aave/types';
import { subscribeEvents } from '../../src/aave/subscribeFunc';
import { IEventHandler, CWEvent, IChainEventData } from '../../src/interfaces';

function getProvider(): providers.Web3Provider {
  const web3Provider = require('ganache-cli').provider({
    allowUnlimitedContractSize: true,
    gasLimit: 1000000000,
    time: new Date(1000),
    mnemonic: 'Alice',
    logger: console,
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
  addresses: string[];
  provider: providers.Web3Provider;
  handler: AaveEventHandler;
}

async function setupSubscription(subscribe = true): Promise<ISetupData> {
  const provider = getProvider();
  const addresses: string[] = await provider.listAccounts();
  const [member] = addresses;
  const signer = provider.getSigner(member);

  // deploy Executor
  const executorFactory = new ExecutorFactory(signer);
  const executor = await executorFactory.deploy(
    member,
    60, // 1min delay
    60, // 1min grace period
    15, // 15s minimum delay
    120, // 2min maximum delay
    10000 * 10, // 10% of supply required to submit
    12, // 12 blocks voting period
    10000 * 10, // 10% differential required to pass
    10000 * 20 // 20% quorum
  );

  // deploy tokens and strategy
  const tokenFactory = new AaveTokenV2Factory(signer);
  const token1 = await tokenFactory.deploy();
  const token2 = await tokenFactory.deploy();
  const strategyFactory = new GovernanceStrategyFactory(signer);
  const strategy = await strategyFactory.deploy(token1.address, token2.address);

  // deploy AaveGovernance
  const govFactory = new AaveGovernanceV2Factory(signer);
  const governance = await govFactory.deploy(
    strategy.address,
    4, // 4 block voting delay
    member,
    [executor.address]
  );

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
  return { api, executor, addresses, provider, handler };
}

describe('Aave Event Integration Tests', () => {
  it('should create a proposal', async () => {
    const {
      api,
      executor,
      addresses,
      provider,
      handler,
    } = await setupSubscription();

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
          id: 0,
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
  });
});
