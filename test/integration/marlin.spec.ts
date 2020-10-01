import { providers } from 'ethers';
import chai from 'chai';
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

const { assert } = chai;

function getProvider(): providers.Web3Provider {
  // eslint-disable-next-line global-require
  const web3Provider = require('ganache-cli').provider({
    allowUnlimitedContractSize: true,
    gasLimit: 1000000000,
    time: new Date(1000),
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
  const governorAlpha = await deployGovernorAlpha(signer, timelock, comp, member); // todo: timelock.address, comp.address?
  const api = { comp, governorAlpha, timelock };
  const emitter = new EventEmitter();
  const handler = new MarlinEventHandler(emitter);
  if (subscribe) {
    await subscribeEvents({
      chain: 'test', // 'marlin-local'?
      api,
      handlers: [handler]
    })
  }
  return { api, comp, timelock, governorAlpha, addresses, provider, handler, };
}

const COMP_THRESHOLD = 100000e18;

// submit proposal
async function submitProposal(
  provider: providers.Web3Provider,
  api: Api,
  member: string,
  guardian: string,
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
}