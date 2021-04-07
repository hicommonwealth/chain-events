import { providers } from 'ethers';
import chai, { expect } from 'chai';
import { EventEmitter } from 'events';
import { BigNumberish } from "ethers/utils";
import { UniFactory } from '../../eth/types/UniFactory';
import { Uni } from '../../eth/types/Uni';
import { GovernorAlphaFactory } from '../../eth/types/GovernorAlphaFactory';
import { GovernorAlpha } from '../../eth/types/GovernorAlpha';
import { TimelockFactory } from '../../eth/types/TimelockFactory';
import { Timelock } from '../../eth/types/Timelock';
import { Api, IEventData, EventKind, IDelegateVotesChanged, ITransfer, IProposalCreated, IProposalCanceled, ICancelTransaction, IProposalQueued, IProposalExecuted, IQueueTransaction, IExecuteTransaction } from '../../src/compoundalpha/types';
import { subscribeEvents } from '../../src/compoundalpha/subscribeFunc';
import { IEventHandler, CWEvent } from '../../src/interfaces';
import { Provider } from 'ethers/providers';
import { compact } from 'underscore';
import { bytesToHex, hexToBytes, hexToNumber, toHex } from 'web3-utils';
import { resolve } from 'path';

const { assert } = chai;

function getProvider(): providers.Web3Provider {
  // eslint-disable-next-line global-require
  const web3Provider = require('ganache-cli').provider({
    allowUnlimitedContractSize: true,
    gasLimit: 1000000000,
    time: new Date(1000),
    pnuemonic: 'Alice',
    // logger: console,
  });
  return new providers.Web3Provider(web3Provider);
}

async function deployUni(signer, account: string, minter_: string, mintingAllowedAfter_: BigNumberish) {
  const factory = new UniFactory(signer);
  const uni = await factory.deploy(account, minter_, mintingAllowedAfter_);
  return uni;
}

async function deployGovernorAlpha(signer, timelock, uni, guardian) {
  const factory = new GovernorAlphaFactory(signer);
  const governorAlpha = await factory.deploy(timelock, uni, guardian);
  return governorAlpha;
}

async function deployTimelock(signer, admin, delay) {
  const factory = new TimelockFactory(signer);
  const timelock = await factory.deploy(admin, delay);
  return timelock;
}

class CompoundalphaEventHandler extends IEventHandler {
  constructor(
    public readonly emitter: EventEmitter,
  ) {
    super();
  }

  public async handle(event: CWEvent<IEventData>): Promise<any> {
    this.emitter.emit(event.data.kind.toString(), event);
    this.emitter.emit('*', event);
  }
}

interface ISetupData {
  api: Api;
  uni: Uni;
  timelock: Timelock;
  governorAlpha: GovernorAlpha;
  addresses: string[];
  provider: providers.Web3Provider;
  handler: CompoundalphaEventHandler;
}

async function setupSubscription(subscribe = true): Promise<ISetupData> {
  const provider = getProvider();
  const addresses: string[] = await provider.listAccounts();
  const [ account, minter ] = addresses;
  const signer = provider.getSigner(account);
  const uni = await deployUni(signer, account, minter, 1000);
  const timelock = await deployTimelock(signer, account, 172800);
  const governorAlpha = await deployGovernorAlpha(signer, timelock.address, uni.address, account);
  // await timelock.setPendingAdmin(governorAlpha.address, { from: timelock.address});
  // console.log('timelock admin address: ', await timelock.admin());
  // console.log('governorAlpha Address:', governorAlpha.address);
  // TODO: Fix this somehow, need to make governorAlpha admin of timelock... :le-penseur:
  const api = { uni, governorAlpha, timelock };
  const emitter = new EventEmitter();
  const handler = new CompoundalphaEventHandler(emitter);
  if (subscribe) {
    await subscribeEvents({
      chain: 'compoundalpha-local',
      api,
      handlers: [handler],
      // skipCatchup: true,
    })
  }
  return { api, uni, timelock, governorAlpha, addresses, provider, handler, };
}

const COMP_THRESHOLD = 100000e18;

describe('Compoundalpha Event Integration Tests', () => {
  let api, uni, timelock, governorAlpha, addresses, provider, handler;

  before('should setup a new subscription', async () => {
    const setup = await setupSubscription();
    api = setup.api;
    uni = setup.uni;
    timelock = setup.timelock;
    governorAlpha = setup.governorAlpha;
    addresses = setup.addresses;
    provider = setup.provider;
    handler = setup.handler;
  });
  it('should deploy all three contracts', async () => {
    expect(api).to.not.be.null;
    expect(uni).to.not.be.null;
    expect(timelock).to.not.be.null;
    expect(governorAlpha).to.not.be.null;
    expect(addresses).to.not.be.null;
    expect(provider).to.not.be.null;
    expect(handler).to.not.be.null;
  });

  describe('UNI contract function events', () => {
    it('initial address should have all the tokens ', async () => {
      // test volume
      const balance = await uni.balanceOf(addresses[0]);
      expect(balance).to.not.be.equal(0);
    });
    it('initial address should transfer tokens to an address', async () => {
      const initialBalance = await uni.balanceOf(addresses[0]);
      const newUser = await uni.balanceOf(addresses[2]);
      assert.isAtMost(+newUser, 0)
      assert.isAtLeast(+initialBalance, 100000);
      await uni.transfer(addresses[2], 100);
      const newUserNewBalance = await uni.balanceOf(addresses[2]);
      assert.isAtLeast(+newUserNewBalance, 100);
      await new Promise((resolve) => {
        handler.emitter.on(
          EventKind.Transfer.toString(),
          (evt: CWEvent<ITransfer>) => {
            const { kind, from, to, amount } = evt.data;
            assert.deepEqual({
              kind,
              from,
              to,
              amount: amount.toString()
            }, {
              kind: EventKind.Transfer,
              from: addresses[0],
              to: addresses[2],
              amount: newUserNewBalance.toString(),
            })
            resolve();
          }
        );
      });
    });
    it('initial address should delegate to address 2', async () => {
      const initialBalance = await uni.balanceOf(addresses[0]);
      // delegate
      await uni.delegate(addresses[2]);
      await Promise.all([
        handler.emitter.on(
          EventKind.DelegateChanged.toString(),
          (evt: CWEvent<IEventData>) => {
            assert.deepEqual(evt.data, {
              kind: EventKind.DelegateChanged,
              delegator: addresses[0],
              toDelegate: addresses[2],
              fromDelegate: '0x0000000000000000000000000000000000000000',
            });
            resolve();
          }
        ),
        handler.emitter.on(
          EventKind.DelegateVotesChanged.toString(),
          (evt: CWEvent<IDelegateVotesChanged>) => {
            const { kind, delegate, previousBalance, newBalance, } = evt.data;
            assert.deepEqual({
              kind,
              delegate,
              previousBalance: previousBalance.toString(),
              newBalance: newBalance.toString(),
            }, {
              kind: EventKind.DelegateVotesChanged,
              delegate: addresses[2],
              previousBalance: '0',
              newBalance: initialBalance.toString(),
            });
            resolve();
          }
        ),
      ])
    });
    it('initial address should delegate to itself', async () => {
      // DelegateChanged & Delegate Votes Changed Events
      const initialBalance = await uni.balanceOf(addresses[0]);
      const newUser = await uni.balanceOf(addresses[1]);
      // delegate
      await uni.delegate(addresses[0]);
      await Promise.all([
        handler.emitter.on(
          EventKind.DelegateChanged.toString(),
          (evt: CWEvent<IEventData>) => {
            assert.deepEqual(evt.data, {
              kind: EventKind.DelegateChanged,
              delegator: addresses[0],
              toDelegate: addresses[0],
              fromDelegate: '0x0000000000000000000000000000000000000000',
            });
            resolve();
          }
        ),
        handler.emitter.on(
          EventKind.DelegateVotesChanged.toString(),
          (evt: CWEvent<IDelegateVotesChanged>) => {
            const { kind, delegate, previousBalance, newBalance, } = evt.data;
            assert.deepEqual({
              kind,
              delegate,
              previousBalance: previousBalance.toString(),
              newBalance: newBalance.toString(),
            }, {
              kind: EventKind.DelegateVotesChanged,
              delegate: addresses[0],
              previousBalance: '0',
              newBalance: initialBalance.toString(),
            });
            resolve();
          }
        )
      ]);
    });
  });

  describe('GovernorAlpha contract function events', () => {
    let proposal;
    before('it should setupSubscriber and delegate', async () => {
      const initialBalance = await uni.balanceOf(addresses[0]);
      await uni.delegate(addresses[0]);
      await Promise.all([
        handler.emitter.on(
          EventKind.DelegateChanged.toString(),
          (evt: CWEvent<IEventData>) => {
            console.log('1', evt.data);
            assert.deepEqual(evt.data, {
              kind: EventKind.DelegateChanged,
              delegator: addresses[0],
              toDelegate: addresses[0],
              fromDelegate: '0x0000000000000000000000000000000000000000',
            });
            resolve();
          }
        ),
        handler.emitter.on(
          EventKind.DelegateVotesChanged.toString(),
          (evt: CWEvent<IDelegateVotesChanged>) => {
            console.log('2', evt.data);
            const { kind, delegate, previousBalance, newBalance } = evt.data;
            assert.deepEqual({
              kind,
              delegate,
              previousBalance: previousBalance.toString(),
              newBalance: newBalance.toString(),
            }, {
              kind: EventKind.DelegateVotesChanged,
              delegate: addresses[0],
              previousBalance: '0',
              newBalance: initialBalance.toString(),
            });
            resolve();
          }
        )
      ]);
    });
    it('should create a proposal', async () => {
      // ProposalCreated Event
      const targets = [
        '0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b',
      ];
      const values = [0,];
      const signatures = [
        '_setCollateralFactor(address,uint256)'
      ];
      const calldatas = [
        '0x000000000000000000000000C11B1268C1A384E55C48C2391D8D480264A3A7F40000000000000000000000000000000000000000000000000853A0D2313C0000',
      ];
      proposal = await governorAlpha.propose(targets, values, signatures, calldatas, 'test description');
      await new Promise((resolve) => {
        handler.emitter.on(
          EventKind.ProposalCreated.toString(),
          (evt: CWEvent<IProposalCreated>) => {
            const {kind, proposer, description } = evt.data;
            assert.deepEqual({
              kind,
              proposer,
              description,
            }, {
              kind: EventKind.ProposalCreated,
              proposer: addresses[0],
              description: 'test description',
            });
            resolve();
          }
        )
      });
    });
    it('proposal castvote', async () => {
      // ProposalCreated Event
      // VoteCast Event
      const activeProposals = await governorAlpha.latestProposalIds(addresses[0]);
      await provider.send('evm_increaseTime', [1]);
      await provider.send('evm_mine', []);
      const vote = await governorAlpha.castVote(activeProposals, true);
      assert.notEqual(vote, null);
    });

    xit('should succeed upon 3 days simulation (should take awhile, lag)', async (done) => {
      const activeProposals = await governorAlpha.latestProposalIds(addresses[0]);
      await provider.send('evm_increaseTime', [19500]); // 3 x 6500 (blocks/day)
      for (let i=0; i < 19500; i++) {
        await provider.send('evm_mine', []);
      }
      const state = await governorAlpha.state(activeProposals)
      expect(state).to.be.equal(4); // 4 is 'Succeeded'
    }).timeout(1000000);;

    xit('should be queued and executed', async (done) => {
      const activeProposals = await governorAlpha.latestProposalIds(addresses[0]);
      await governorAlpha.queue(activeProposals);
      await Promise.all([
        handler.emitter.on(
          EventKind.ProposalQueued.toString(),
          (evt: CWEvent<IProposalQueued>) => {
            const {kind, id, eta } = evt.data;
            assert.deepEqual({
              kind,
              id,
            }, {
              kind: EventKind.ProposalQueued,
              id: activeProposals,
            });
            resolve();
          }
        ),
        handler.emitter.on(
          EventKind.QueueTransaction.toString(),
          (evt: CWEvent<IQueueTransaction>) => {
            const {kind, } = evt.data;
            assert.deepEqual({
              kind,
            }, {
              kind: EventKind.QueueTransaction,
            });
            resolve();
          }
        ),
      ]);
      await governorAlpha.execute(activeProposals);
      await Promise.all([
        handler.emitter.on(
          EventKind.ProposalExecuted.toString(),
          (evt: CWEvent<IProposalExecuted>) => {
            const {kind, id } = evt.data;
            assert.deepEqual({
              kind,
              id,
            }, {
              kind: EventKind.ProposalExecuted,
              id: activeProposals,
            });
            resolve();
          }
        ),
        handler.emitter.on(
          EventKind.ExecuteTransaction.toString(),
          (evt: CWEvent<IExecuteTransaction>) => {
            const {kind, } = evt.data;
            assert.deepEqual({
              kind,
            }, {
              kind: EventKind.ExecuteTransaction,
            });
            resolve();
          }
        ),
      ]);
      done();
    });
  });
});