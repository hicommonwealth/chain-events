import { EventEmitter } from 'events';

import { ethers, waffle } from 'hardhat';
import chai from 'chai';
import { BigNumberish, providers, Signer, Wallet } from 'ethers';
import { Web3Provider } from '@ethersproject/providers';

import GovernorArtifact from '../../eth/artifacts/contracts/Zepplin/Governor.sol/Governor.json';
import ERC20VotesArtifact from '../../eth/artifacts/contracts/Zepplin/ERC20Votes.sol/ERC20Votes.json';
import { Governor, ERC20Votes } from '../../src/contractTypes';
import {
  Api,
  IEventData,
  EventKind,
  IProposalCreated,
  IProposalQueued,
  IProposalExecuted,
} from '../../src/chains/openZepplin/types';
import { subscribeEvents } from '../../src/chains/openZepplin';
import { IEventHandler, CWEvent, IChainEventData } from '../../src/interfaces';
import { Listener } from '../../src/chains/openZepplin/Listener';

const { assert, expect } = chai;
const { deployContract } = waffle;

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

async function deployErc20Votes(signer: Signer): Promise<ERC20Votes> {
  const token = (await deployContract(
    <Wallet>signer,
    ERC20VotesArtifact
  )) as ERC20Votes;
  return token;
}

/**
 * Deploys the governor contract to a test chain
 */
async function deployGovernor(signer: Signer): Promise<Governor> {
  const governor = (await deployContract(
    <Wallet>signer,
    GovernorArtifact
  )) as Governor;
  return governor;
}

class OpenZepplinEventHandler extends IEventHandler {
  constructor(public readonly emitter: EventEmitter) {
    super();
  }

  public async handle(event: CWEvent<IEventData>): Promise<IChainEventData> {
    this.emitter.emit(event.data.kind.toString(), event);
    return null;
  }
}

async function setupSubscription(
  subscribe = true
): Promise<{
  handler: OpenZepplinEventHandler;
  addresses: string[];
  provider: Web3Provider;
  api: Governor;
  token: ERC20Votes;
}> {
  const provider = getProvider();
  const addresses: string[] = await provider.listAccounts();
  const [member, bridge] = addresses;
  const signer = provider.getSigner(member);
  const token = await deployErc20Votes(signer);
  const governor = await deployGovernor(signer);
  const api = governor;
  const emitter = new EventEmitter();
  const handler = new OpenZepplinEventHandler(emitter);
  if (subscribe) {
    await subscribeEvents({
      chain: 'openZepplin',
      api,
      handlers: [handler],
    });
  }
  return { api, token, addresses, provider, handler };
}

async function createProposal(
  handler: OpenZepplinEventHandler,
  gov: Governor,
  token: ERC20Votes,
  from: string
): Promise<void> {
  await gov.propose(
    [token.address],
    ['0'],
    ethers.utils.hexlify(
      ethers.utils.toUft8Bytes(
        token.interface.encodeFunctionData('transferFrom', [from, from, 100])
      )
    ),
    'Proposal to transfer'
  );
}

async function preformDelegation(token: ERC20Votes, to: string): Promise<void> {
  await token.delegate(to);
}

function assertEvent<T extends IEventData>(
  handler: OpenZepplinEventHandler,
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

describe.only('Open Zepplin Event Integration Tests', () => {
  describe('ERC20Votes contract function events', () => {
    it('initial address should transfer tokens to an address', async () => {
      const { token, addresses } = await setupSubscription();
      const initialBalance = await token.balanceOf(addresses[0]);
      expect(+initialBalance).to.not.be.equal(0);
      const newUser = await token.balanceOf(addresses[2]);
      assert.isAtMost(+newUser, 0);
      assert.isAtLeast(+initialBalance, 100000);
      await token.transfer(addresses[2], 100);
      const newUserBalance = await token.balanceOf(addresses[2]);
      assert.isAtLeast(+newUserBalance, 100);
    });
    it('initial address should delegate to address 2', async () => {
      const { token, addresses } = await setupSubscription();
      await preformDelegation(token, addresses[2]);
    });
  });
});
