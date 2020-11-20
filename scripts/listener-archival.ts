import { ApiRx, WsProvider } from '@polkadot/api';
import { switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { Mainnet } from '@edgeware/node-types';

// todo: command line input for listening to local/mainnet
const url = 'ws://127.0.0.1:9944';

async function main () {
    const wsProvider = new WsProvider(url);
    const eApi = new ApiRx({ 
      provider: new WsProvider(url),
      ...Mainnet
    });  

    eApi.isReady.pipe(switchMap((api: ApiRx) => of(api)),).subscribe(async (api: ApiRx) => {
      const highest = (await api.rpc.chain.getBlock().toPromise()).block.header.number.toNumber();
      console.log('Highest block is', highest);

        for (let i = 0; i < highest; i++) {
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

              console.log(`\t${event.section}:${event.method}:: (phase=${phase.toString()})`);
      
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
          } catch (e) {
            console.log(e);
            console.log(`Failed on block ${i}`);
            break;
          } 
        }
    });

}
// invoke the function
main();