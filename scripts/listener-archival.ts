import { ApiRx, WsProvider,ApiPromise } from '@polkadot/api';
import { switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { Mainnet } from '@edgeware/node-types';
import { SubstrateEvents, IEventHandler, SubstrateTypes } from '../dist/index';
import {Block, IEventData} from '../src/substrate/types';
import { Compact, Enum, Int, Struct, U8aFixed, UInt, Vec } from '@polkadot/types/codec';
import { Header, RuntimeVersion, EventRecord, Extrinsic } from '@polkadot/types/interfaces';
import { TypeRegistry } from '@polkadot/types';
import { IDisconnectedRange, CWEvent, SubscribeFunc, ISubscribeOptions } from '../src/interfaces';
import { Hash } from '@polkadot/types/interfaces';
import { has } from 'underscore';
import { Poller } from '../src/substrate/poller';
import { Subscriber } from '../src/substrate/subscriber';

// todo: command line input for listening to local/mainnet
const url = 'ws://127.0.0.1:9944';
// const url = 'ws://mainnet1.edgewa.re:9944';

class StandaloneEventHandler extends IEventHandler {
  public async handle(event: CWEvent): Promise<any> {
    console.log(`Received event: ${JSON.stringify(event, null, 2)}`);
  }
}

async function main () {
    const wsProvider = new WsProvider(url);
    const registry = new TypeRegistry();
    const handlers = [ new StandaloneEventHandler()];

    /*const eApi = new ApiRx({ 
      provider: new WsProvider(url),
      ...Mainnet
    });*/
    const api = await (await ApiPromise.create({ 
      provider:new WsProvider(url),
      registry,
      ...Mainnet
     })).isReady;
    
    let versionNumber;
    let versionName;
    // wait for version available before we start producing blocks
    await new Promise((resolve) => {
      api.rpc.state.subscribeRuntimeVersion((version: RuntimeVersion) => {
      versionNumber = +version.specVersion;
      versionName = version.specName.toString();
        console.log(`Fetched runtime version for ${versionName}: ${versionNumber}`);
        resolve();
      });
    });

    const handleEventFn = async (event: CWEvent<IEventData>) => {
      let prevResult = null;
      /* eslint-disable-next-line no-restricted-syntax */
      for (const handler of handlers) {
        try {
          // pass result of last handler into next one (chaining db events)
          /* eslint-disable-next-line no-await-in-loop */
          prevResult = await handler.handle(event);
        } catch (err) {
          console.log(`Event handle failure: ${err.message}`);
          break;
        }
      }
    };

    // helper function that sends a block through the event processor and
    // into the event handlers
    const processor = new SubstrateEvents.Processor(api);
    // const subscriber = new Subscriber(api, true);
    const poller = new Poller(api);
    
    const processBlockFn = async (block: Block) => {
      // retrieve events from block
      const events: CWEvent<IEventData>[] = await processor.process(block);
      // send all events through event-handlers in sequence
      await Promise.all(events.map((event) => handleEventFn(event)));
    };
    // helper function that runs after we've been offline/the server's been down,
  // and attempts to fetch events from skipped blocks
  const pollMissedBlocksFn = async () => {
    console.log('Detected offline time, polling missed blocks...');
    const CHUNK_SIZE = 1000;
    const header = await api.rpc.chain.getHeader();
    let range: IDisconnectedRange;
    range = { startBlock: 1, endBlock: +header.number};
    for (let block = range.startBlock + CHUNK_SIZE; block <= range.endBlock; block += CHUNK_SIZE) {
      const blocks = await poller.poll({
        startBlock: block - CHUNK_SIZE,
        endBlock: Math.min(block, range.endBlock)
        }, CHUNK_SIZE);
      await Promise.all(blocks.map(processBlockFn));
      return;
    }
  }
    // await pollMissedBlocksFn();
    // subscribe to events and pass to block processor
    let subscription = await api.rpc.chain.subscribeNewHeads(async (header: Header) => {
      const events = await api.query.system.events.at(header.hash);
      const signedBlock = await api.rpc.chain.getBlock(header.hash);
      const extrinsics: Extrinsic[] = signedBlock.block.extrinsics;
      const block: Block = {
        header,
        events,
        extrinsics,
        versionNumber: versionNumber,
        versionName: versionName,
      };
      const logStr = `Fetched Block for ${versionName}:${versionNumber}: ${+block.header.number}`;
      console.log(logStr);
      processBlockFn(block);
    });

    /*
  
    // const api = await new ApiPromise({ provider }).isReady;
    SubstrateEvents.createApi(url, Mainnet).then(async (api) => {
      const processor = new SubstrateEvents.Processor(api);
      eApi.isReady.pipe(switchMap((api: ApiRx) => of(api)),).subscribe(async (api: ApiRx) => {
        const highest = (await api.rpc.chain.getBlock().toPromise()).block.header.number.toNumber();
        const version = await api.rpc.state.getRuntimeVersion().toPromise();  
        console.log("version: ", +version.specVersion);      
        console.log('Highest block is', highest);

          for (let i = 0; i < 20; i++) {
            console.log('Reading block: ', i);
            const blockHash = await api.rpc.chain.getBlockHash(i).toPromise();
            const events = await api.query.system.events.at(blockHash).toPromise();
            const signedBlock = await api.rpc.chain.getBlock(blockHash).toPromise();

            let data = await processor.process({
                header: signedBlock.block.header,
                events: events.map((e) => {return e}),
                versionNumber: +version.specVersion,
                versionName:  version.specName.toString(),
                extrinsics: signedBlock.block.extrinsics,
              } as Block
            );
            console.log(data)

          }
        });
    });
    */

}
// invoke the function
main();