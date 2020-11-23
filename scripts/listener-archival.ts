import { ApiRx, WsProvider } from '@polkadot/api';
import { switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { Mainnet } from '@edgeware/node-types';
import { SubstrateEvents, SubstrateTypes } from '../dist/index';
import {Block} from '../src/substrate/types';
import { Compact, Enum, Int, Struct, U8aFixed, UInt, Vec } from '@polkadot/types/codec';
import { Header, EventRecord, Extrinsic } from '@polkadot/types/interfaces';

// todo: command line input for listening to local/mainnet
const url = 'ws://127.0.0.1:9944';
// const url = 'ws://mainnet1.edgewa.re:9944';

async function main () {
    const wsProvider = new WsProvider(url);
    const eApi = new ApiRx({ 
      provider: new WsProvider(url),
      ...Mainnet
    });  
    // const api = await new ApiPromise({ provider }).isReady;
    let temp = ApiRx.create().toPromise();
    SubstrateEvents.createApi(url, Mainnet).then(async (api) => {
      const processor = new SubstrateEvents.Processor(api);
      eApi.isReady.pipe(switchMap((api: ApiRx) => of(api)),).subscribe(async (api: ApiRx) => {
        const highest = (await api.rpc.chain.getBlock().toPromise()).block.header.number.toNumber();
        console.log('Highest block is', highest);
          for (let i = 0; i < 20; i++) {
            console.log('Reading block: ', i);
            const blockHash = await api.rpc.chain.getBlockHash(i).toPromise();
            const events = await api.query.system.events.at(blockHash).toPromise();
            const signedBlock = await api.rpc.chain.getBlock(blockHash).toPromise();
            const extrinsics: Extrinsic[] = signedBlock.block.extrinsics;

            // const extrensicsData = await api.query.system.extrinsicData.at(blockHash).toPromise();
            // const extrensicsRoot = await api.query.system.extrinsicsRoot.at(blockHash).toPromise();
            // const extrensicsCount = await api.query.system.extrinsicCount.at(blockHash).toPromise();
            const blockNumber = await api.query.system.number.at(blockHash).toPromise();
            let extrs: Extrinsic[] = new Array();
            const extr = await events.forEach((record) => {
              const { event /*, phase*/ } = record;
                const eventObj = {
                  section: event.section,
                  method: event.method,
                  data: {}
                };
                Object.keys(event.data.typeDef).forEach((index) => {
                  eventObj.data[event.data.typeDef[index].type] = event.data[index].toString();
                });
                extrs.push(eventObj as unknown as Extrinsic);
            });

            let b: Block = {
              header:{ hash:blockHash, number:blockNumber } as unknown as Header,
              events: events.map((e) => {return e}),
              versionNumber: 10,
              versionName: 'edgeware',
              extrinsics: extrinsics,
            };
            let data = await processor.process(b);
            console.log(data)

          }
        });
    });
    /*
    eApi.isReady.pipe(switchMap((api: ApiRx) => of(api)),).subscribe(async (api: ApiRx) => {
      const highest = (await api.rpc.chain.getBlock().toPromise()).block.header.number.toNumber();
      console.log('Highest block is', highest);
        for (let i = 0; i < 20; i++) {
          console.log('Current block: ', i);
          
          try {
            // returns Hash
            const blockHash = await api.rpc.chain.getBlockHash(i).toPromise();
            const events = await api.query.system.events.at(blockHash).toPromise();
            events.forEach((record) => {
              // extract the phase, event and the event types
              const { event, phase } = record;
              const types = event.typeDef;
              //console.log(event.section, event.method, event.data.toString());

              console.log("section: ", event.section);
              console.log("method: ", event.method);
              console.log("phase:", phase.toString());
              
                // loop through each of the parameters, displaying the type and data
                if (event.data && event.data.forEach) {
                  event.data.forEach((data, index) => {
                    console.log(`\t\t\t${types[index].type}: ${data.toString()}`);
                  });
                }
            });
            events.forEach(({ event: { data, method, section } }) => {
                  if(section != 'system' && section != 'treasuryReward'){
                    console.log(section, method, data.toString());
                  }
                });

            console.log("================= Processing Block ===================")
          } catch (e) {
            console.log(e);
            console.log(`Failed on block ${i}`);
            break;
          } 
        }
    });*/

}
// invoke the function
main();