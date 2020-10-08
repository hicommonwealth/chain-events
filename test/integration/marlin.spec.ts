import { providers } from 'ethers';
import chai, { expect } from 'chai';
import { EventEmitter } from 'events';
import { CompFactory } from '../../eth/types/CompFactory';
import { Comp } from '../../eth/types/Comp';
import { GovernorAlphaFactory } from '../../eth/types/GovernorAlphaFactory';
import { GovernorAlpha } from '../../eth/types/GovernorAlpha';
import { TimelockFactory } from '../../eth/types/TimelockFactory';
import { Timelock } from '../../eth/types/Timelock';
import { Api, IEventData, EventKind } from '../../src/marlin/types';
import { subscribeEvents } from '../../src/marlin/subscribeFunc';
import { IEventHandler, CWEvent } from '../../src/interfaces';
import { Provider } from 'ethers/providers';
import { compact } from 'underscore';
import { toHex } from 'web3-utils';
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

async function deployComp(signer, account: string) {
  const factory = new CompFactory(signer);
  const comp = await factory.deploy(account);
  return comp;
}

async function deployGovernorAlpha(signer, timelock, comp, guardian) {
  const factory = new GovernorAlphaFactory(signer);
  const governorAlpha = await factory.deploy(timelock, comp, guardian);
  return governorAlpha;
}

async function deployTimelock(signer, admin, delay) {
  const factory = new TimelockFactory(signer);
  const timelock = await factory.deploy(admin, delay);
  return timelock;
}

class MarlinEventHandler extends IEventHandler {
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
  comp: Comp;
  timelock: Timelock;
  governorAlpha: GovernorAlpha;
  addresses: string[];
  provider: providers.Web3Provider;
  handler: MarlinEventHandler;
}

async function setupSubscription(subscribe = true): Promise<ISetupData> {
  const provider = getProvider();
  const addresses: string[] = await provider.listAccounts();
  const [ member ] = addresses;
  const signer = provider.getSigner(member);
  const comp = await deployComp(signer, member);
  const timelock = await deployTimelock(signer, member, 172800);
  const governorAlpha = await deployGovernorAlpha(signer, timelock.address, comp.address, member); // todo: timelock.address, comp.address?
  const api = { comp, governorAlpha, timelock };
  const emitter = new EventEmitter();
  const handler = new MarlinEventHandler(emitter);
  if (subscribe) {
    await subscribeEvents({
      chain: 'test', // 'marlin-local'?
      api,
      handlers: [handler],
      // skipCatchup: true,
    })
  }
  return { api, comp, timelock, governorAlpha, addresses, provider, handler, };
}

const COMP_THRESHOLD = 100000e18;

// COMP functions
async function delegate(
  provider: providers.Web3Provider,
  api: Api,
  member: string,
  guardian: string,
  data: any[],
  mineBlocks = false,
) {
 
}

// TODO: WIP 
async function submitProposal(
  provider: providers.Web3Provider,
  api: Api,
  member: string,
  guardian: string,
  data: any[],
  mineBlocks = false,
): Promise<void> {
  if (mineBlocks) provider.send('evm_increaseTime', [2]);
  /** member needs comp threshold to submit a proposal, so
   *  guardian (who has all comp in our tests) will send them threshold,
   *  prior to submitting. */
  await api.comp.transfer(member, COMP_THRESHOLD);
  if (mineBlocks) provider.send('evm_increaseTime', [2]);
  await api.comp.approve(api.comp.address, COMP_THRESHOLD); // todo: should this be guardian instead?
  const appSigner = provider.getSigner(member);
  const appComp = CompFactory.connect(api.comp.address, appSigner);
  if (mineBlocks) provider.send('evm_increaseTime', [2]);
  await appComp.deployed();
  if (mineBlocks) provider.send('evm_increaseTime', [2]);
  await appComp.approve(member, COMP_THRESHOLD);

  // TODO: Do you just need COMP or do you need to be delegated as well? (or delegate your own?)
  const proposerBalance = await api.comp.balanceOf(member);
  const guardianBalance = await api.comp.balanceOf(guardian);
  const propserAllowance = await api.comp.allowance(member, api.comp.address);
  const guardianAllowance = await api.comp.allowance(guardian, api.comp.address);
  assert.isAtLeast(+proposerBalance, COMP_THRESHOLD);
  assert.isAtLeast(+guardianBalance, COMP_THRESHOLD);
  assert.isAtLeast(+propserAllowance, COMP_THRESHOLD);
  assert.isAtLeast(+guardianAllowance, COMP_THRESHOLD);

  if (mineBlocks) provider.send('evm_increaseTime', [2]);
  // await api.governorAlpha.propose(['hello'], )
  // make proposal!
  return Promise.resolve();
}

describe('Marlin Event Integration Tests', () => {
  it('should deploy all three contracts', async () => {
    const { api, comp, timelock, governorAlpha,
      addresses, provider, handler, } = await setupSubscription();
    expect(api).to.not.be.null;
    expect(comp).to.not.be.null;
    expect(timelock).to.not.be.null;
    expect(governorAlpha).to.not.be.null;
    expect(addresses).to.not.be.null;
    expect(provider).to.not.be.null;
    expect(handler).to.not.be.null;
  /** TODO: NOT GETTING CONTRACT DEPLOYED EVENT EMISSIONS:
      COMP.SOL should emit EventKind.Transfer
      GovernorAlpha and Timelock do not emit constructor events. */
    // await new Promise((resolve) => {
    //   handler.emitter.on(
    //     EventKind.Transfer.toString(),
    //     (evt: CWEvent<IEventData>) => {
    //       console.log(evt);
    //       assert.deepEqual(evt.data, {
    //         kind: EventKind.Transfer,
    //         from: addresses[0],
    //         to: addresses[1],
    //         amount: COMP_THRESHOLD.toString(),
    //       });
    //       resolve();
    //     }
    //   )
    // });
  });

  describe('COMP contract function events', () => {
    it('initial address should have all the tokens ', async () => {
      // test volume
      const { api, comp, timelock, governorAlpha,
        addresses, provider, handler, } = await setupSubscription();
      const balance = await comp.balanceOf(addresses[0]);
      expect(balance).to.not.be.equal(0);
    });
    it('initial address should transfer tokens to an address', async () => {
      const { api, comp, timelock, governorAlpha,
        addresses, provider, handler, } = await setupSubscription();
      const initialBalance = await comp.balanceOf(addresses[0]);
      const newUser = await comp.balanceOf(addresses[1]);
      assert.isAtMost(+newUser, 0)
      assert.isAtLeast(+initialBalance, 100000);
      await comp.transfer(addresses[1], 100);
      const newUserNewBalance = await comp.balanceOf(addresses[1]);
      assert.isAtLeast(+newUserNewBalance, 100);
      await new Promise((resolve) => {
        handler.emitter.on(
          EventKind.Transfer.toString(),
          (evt: CWEvent<IEventData>) => {
            const { kind, from, to, amount } = evt.data;
            assert.deepEqual({
              kind,
              from,
              to,
              amount: amount.toString()
            }, {
              kind: EventKind.Transfer,
              from: addresses[0],
              to: addresses[1],
              amount: newUserNewBalance.toString(),
            })
            resolve();
          }
        );
      });
    });
    it('initial address should delegate to address 2', async () => {
      // transfer
      const { api, comp, timelock, governorAlpha,
        addresses, provider, handler, } = await setupSubscription();
      const initialBalance = await comp.balanceOf(addresses[0]);
      // delegate
      await comp.delegate(addresses[1]);
      await Promise.all([
        handler.emitter.on(
          EventKind.DelegateChanged.toString(),
          (evt: CWEvent<IEventData>) => {
            assert.deepEqual(evt.data, {
              kind: EventKind.DelegateChanged,
              delegator: addresses[0],
              toDelegate: addresses[1],
              fromDelegate: '0x0000000000000000000000000000000000000000',
            });
            resolve();
          }
        ),
        handler.emitter.on(
          EventKind.DelegateVotesChanged.toString(),
          (evt: CWEvent<IEventData>) => {
            const { kind, delegate, previousBalance, newBalance, } = evt.data;
            assert.deepEqual({
              kind,
              delegate,
              previousBalance: previousBalance.toString(),
              newBalance: newBalance.toString(),
            }, {
              kind: EventKind.DelegateVotesChanged,
              delegate: addresses[1],
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
      const { api, comp, timelock, governorAlpha,
        addresses, provider, handler, } = await setupSubscription();
      const initialBalance = await comp.balanceOf(addresses[0]);
      const newUser = await comp.balanceOf(addresses[1]);
      // delegate
      await comp.delegate(addresses[0]);
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
          (evt: CWEvent<IEventData>) => {
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
    it('should create a proposal', async () => {
      // ProposalCreated Event
    });
    it('should cancel a proposal', async () => {
      // ProposalCanceled Event
    });
    it('proposal create and castvote', async () => {
      // ProposalCreated Event
      // VoteCast Event
    });
    it('should queue a proposal after voting period', async () => {
      // simulate 3 days passing in blocks, voting grace period
      // execute queue proposal, emit ProposalQueued Event
    });
  });

  describe('Timelock contract function events', () => {
    it('');

    it('should execute governorAlpha execute proposal function', async () => {

    })
  })
});