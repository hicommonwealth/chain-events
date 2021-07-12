import {
  chainSupportedBy,
  EventSupportingChainT,
  IChainEventKind,
  IEventSubscriber,
  IListenerOptions,
} from '../interfaces';
import { producer } from './index';
import {
  Erc20Events,
  MarlinEvents,
  MolochEvents,
  SubstrateEvents,
} from '../index';
import { EventKind as SubstrateEventKind } from '../chains/substrate/types';
import { getTokenLists, StandaloneEventHandler } from './util';

/**
 * Sets up a listener
 * @param network The name of the chain/network to listen for events on
 * @param listenerArg An object containing the processed listener options
 * @return subscriber A subscriber instance to the chosen network
 */
export async function setupListener(
  network: EventSupportingChainT,
  listenerArg: IListenerOptions
): Promise<IEventSubscriber<any, any>> {
  // start rabbitmq
  let handlers;
  if (producer) {
    handlers = [new StandaloneEventHandler(), producer];
  } else {
    handlers = [new StandaloneEventHandler()];
  }

  console.log(`Connecting to ${network} on url ${listenerArg.url}...`);

  if (chainSupportedBy(network, SubstrateEvents.Types.EventChains)) {
    // TODO: this is hardcoded but ideally should be made explicit in a config file eventually
    const excludedEvents = [
      SubstrateEventKind.Reward,
      SubstrateEventKind.TreasuryRewardMinting,
      SubstrateEventKind.TreasuryRewardMintingV2,
      SubstrateEventKind.HeartbeatReceived,
    ];
    // NOTE: must check presence before pushing in order to avoid duplicates if running this function
    // more than once with the same listenerArg
    for (const eventKind of excludedEvents) {
      if (!listenerArg.excludedEvents.includes(<IChainEventKind>eventKind))
        listenerArg.excludedEvents.push(<IChainEventKind>eventKind);
    }

    const api = await SubstrateEvents.createApi(
      listenerArg.url,
      listenerArg.spec
    );
    const fetcher = new SubstrateEvents.StorageFetcher(api);
    try {
      await fetcher.fetch();
    } catch (err) {
      console.log(err);
      console.error(`Got error from fetcher: ${JSON.stringify(err, null, 2)}.`);
    }
    return SubstrateEvents.subscribeEvents({
      chain: network,
      api,
      handlers,
      skipCatchup: listenerArg.skipCatchup,
      archival: listenerArg.archival,
      startBlock: listenerArg.startBlock,
      verbose: true,
      enricherConfig: { balanceTransferThresholdPermill: 1_000 }, // 0.1% of total issuance
    });
  } else if (chainSupportedBy(network, MolochEvents.Types.EventChains)) {
    const contractVersion = 1;
    if (!listenerArg.contract)
      throw new Error(`no contract address for ${network}`);
    const api = await MolochEvents.createApi(
      listenerArg.url,
      contractVersion,
      listenerArg.contract
    );
    return MolochEvents.subscribeEvents({
      chain: network,
      api,
      contractVersion,
      handlers,
      skipCatchup: listenerArg.skipCatchup,
      verbose: true,
    });
  } else if (chainSupportedBy(network, MarlinEvents.Types.EventChains)) {
    const contracts = {
      comp: '0xEa2923b099b4B588FdFAD47201d747e3b9599A5f', // TESTNET
      governorAlpha: '0xeDAA76873524f6A203De2Fa792AD97E459Fca6Ff', // TESTNET
      timelock: '0x7d89D52c464051FcCbe35918cf966e2135a17c43', // TESTNET
    };
    const api = await MarlinEvents.createApi(listenerArg.url, contracts);
    return MarlinEvents.subscribeEvents({
      chain: network,
      api,
      handlers,
      skipCatchup: listenerArg.skipCatchup,
      verbose: true,
    });
  } else if (chainSupportedBy(network, Erc20Events.Types.EventChains)) {
    let tokens = await getTokenLists();
    let tokenAddresses = tokens.map((o) => o.address);
    const api = await Erc20Events.createApi(listenerArg.url, tokenAddresses);
    return Erc20Events.subscribeEvents({
      chain: network,
      api,
      handlers,
      skipCatchup: listenerArg.skipCatchup,
      verbose: true,
    });
  }
}
