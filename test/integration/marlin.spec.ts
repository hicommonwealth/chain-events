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

// submit proposal?