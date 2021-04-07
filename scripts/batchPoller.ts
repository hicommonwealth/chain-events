import { spec } from '@edgeware/node-types';
import { ApiPromise } from '@polkadot/api';
import { LogGroupControlSettings } from 'typescript-logging';
import {
  chainSupportedBy, SubstrateEvents, EventSupportingChains, IEventHandler, IDisconnectedRange, CWEvent, SubstrateTypes
} from '../dist/index';
import { factoryControl } from '../dist/logging';
import { EventKind } from '../dist/substrate/types';
import { Db, MongoClient } from 'mongodb';

export async function batchQuery(
  api: ApiPromise,
  eventHandlers: IEventHandler<CWEvent>[],
  fullRange?: IDisconnectedRange,
  aggregateFirst = false, // fetch all blocks before running processor function
) {
  // turn off debug logging for poller -- it's annoying
  factoryControl.change({ group: 'all', logLevel: 'Info' } as LogGroupControlSettings);

  // create range if not already set
  const latestBlock = +(await api.derive.chain.bestNumber());
  if (!fullRange) {
    fullRange = {
      startBlock: 0,
      endBlock: latestBlock
    };
  } else if (!fullRange.endBlock) {
    fullRange.endBlock = latestBlock;
  }

  const processBlocksFn = async (blocks: SubstrateTypes.Block[]) => {
    // process all blocks
    const processor = new SubstrateEvents.Processor(api);
    for (const block of blocks) {
      // retrieve events from block
      const events = await processor.process(block);
      // send all events through event-handlers in sequence
      await Promise.all(events.map(async (event) => {
        let prevResult = null;
        for (const handler of eventHandlers) {
          try {
            // pass result of last handler into next one (chaining db events)
            prevResult = await handler.handle(event, prevResult);
          } catch (err) {
            console.error(`Event handle failure: ${err.message}`);
            break;
          }
        }
      }));
    }
  }

  // TODO: configure chunk size
  const CHUNK_SIZE = 10;

  const poller = new SubstrateEvents.Poller(api);
  const results = [];
  // iterate over all blocks in chunks, from smallest to largest, and place in result array
  for (let block = fullRange.startBlock + CHUNK_SIZE; block <= fullRange.endBlock; block += CHUNK_SIZE) {
    try {
      const chunk = await poller.poll({
        startBlock: block - CHUNK_SIZE,
        endBlock: Math.min(block, fullRange.endBlock)
      }, CHUNK_SIZE);

      // the final query will be smaller than CHUNK_SIZE, otherwise a shortened length means pruning took place
      if (chunk.length < CHUNK_SIZE && block < fullRange.endBlock) {
        throw new Error('Found pruned headers, must query archival node');
      }
      console.log(`Fetched blocks ${chunk[0].header.number} to ${chunk[CHUNK_SIZE - 1].header.number}.`);

      if (aggregateFirst) {
        // compile chunks into results
        results.push(...chunk);
      } else {
        // process chunk immediately, and do not aggregate
        await processBlocksFn(chunk);
      }
    } catch (err) {
      console.error(`Failed to fetch blocks ${block - CHUNK_SIZE}-${block}: ${err.message}.`);
      // TODO: exit if desired
    }
  }
  if (aggregateFirst) {
    await processBlocksFn(results);
  }
}

class StandaloneEventHandler extends IEventHandler {
  public async handle(event: CWEvent): Promise<any> {
    console.log(`Received event: ${JSON.stringify(event, null, 2)}`);
  }
}

class GovernanceEventHandler extends IEventHandler {
  public db;
  public lastBlock: number;

  public async setup(options?: any): Promise<Db> {
    var url = "mongodb://localhost:27017/participation-events";

    return new Promise((resolve) => {
      return (new MongoClient(url)).connect(async (err, db) => {
        if (err) throw err;
        var dbo = db.db("participation-events");
        try {
          await dbo.createCollection('events');
        } catch (e) {

        }
        this.db = dbo;
        resolve(this.db);
      });
    });
  }
  
  public async handle(event: CWEvent): Promise<any> {
    if (event.data.kind == EventKind.DemocracySeconded
        || event.data.kind == EventKind.DemocracyVoted
        || event.data.kind == EventKind.CollectiveProposed
        || event.data.kind == EventKind.CollectiveVoted
        || event.data.kind == EventKind.ElectionNewTerm
        || event.data.kind == EventKind.PreimageNoted
        || event.data.kind == EventKind.StakingElection
        || event.data.kind == EventKind.NewSession
        || event.data.kind == EventKind.TreasuryProposed
        || event.data.kind == EventKind.IdentitySet
        || event.data.kind == EventKind.ElectionCandidacySubmitted
    ) {
      const events = this.db.collection("events");
      events.insertOne(event, (err, result) => {
        if (err) throw err;
      });
    }
  }
}


function main() {
  const args = process.argv.slice(2);
  const chain = args[0] || 'edgeware';
  if (!chainSupportedBy(chain, EventSupportingChains)) {
    throw new Error(`invalid chain: ${args[0]}`);
  }
  console.log(`Listening to events on ${chain}.`);

  const networks = {
    'edgeware': 'ws://mainnet1.edgewa.re:9944',
    'edgeware-local': 'ws://localhost:9944',
    'edgeware-testnet': 'wss://beresheet1.edgewa.re',
  };

  const url = networks[chain];

  if (!url) throw new Error(`no url for chain ${chain}`);
  if (chainSupportedBy(chain, SubstrateEvents.Types.EventChains)) {
    SubstrateEvents.createApi(url, spec).then(async (api) => {
      const handler = new GovernanceEventHandler();
      const db = await handler.setup();
      const record = await db.collection('events').find().sort({blockNumber:-1}).limit(1).toArray();
      const range = {
        startBlock: record[0].blockNumber + 1,
      };

      await batchQuery(api, [ handler ], range);
      process.exit(0);
    });
  }
}

main();
