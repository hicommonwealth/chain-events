import { listeners } from '../src/listener';
import { createListener } from '../src/listener/createListener';
import { deleteListener } from '../src/listener/util';
import { factory, formatFilename } from '../src/logging';

const log = factory.getLogger(formatFilename(__filename));

const { Client } = require('pg');

export const CHAIN_EVENTS_WORKER_NUMBER: number =
  Number(process.env.WORKER_NUMBER) || 0;
export const NUM_CHAIN_EVENT_NODES: number =
  Number(process.env.NUM_CHAIN_EVENT_NODES) || 1;
export const DATABASE_URI =
  !process.env.DATABASE_URL || process.env.NODE_ENV === 'development'
    ? 'postgresql://commonwealth:edgeware@localhost/commonwealth'
    : process.env.DATABASE_URL;

// The number of minutes to wait between each run -- rounded to the nearest whole number
export const REPEAT_TIME = Math.round(Number(process.env.REPEAT_TIME)) || 10;

const client = new Client({
  connectionString: DATABASE_URI,
});

async function pollDatabase(queries: string[]): Promise<any[]> {
  try {
    log.info('Connecting to the database');
    await client.connect();
  } catch (err) {
    log.error('A connection error occurred\n', err);
    return;
  }

  const res = [];
  try {
    for (const query of queries) res.push(await client.query(query));
  } catch (error) {
    log.error('An error occurred while querying the database', error);
    throw error;
  } finally {
    await client.end();
  }

  log.info('Queries complete and connection closed.');
  return res;
}

// TODO: API-WS from infinitely attempting reconnection i.e. mainnet1
async function dbNodeProcess() {
  const queries = [
    `SELECT "Chains"."id", "substrate_spec", "url", "ChainNodes"."chain" FROM "Chains" JOIN "ChainNodes" ON "Chains"."id"="ChainNodes"."chain" WHERE "Chains"."has_chain_events_listener"='true';`,
    // `SELECT * FROM "Addresses" WHERE "created_at" > current_timestamp - interval '${REPEAT_TIME} minutes';`,
    // `SELECT "address" FROM "Addresses" WHERE "fetchedOnChainProfile"=false;`,
    `SELECT * FROM "IdentityCache";`, // TODO: filter for myChains if possible
  ];

  const res = await pollDatabase(queries);
  const chains = res[0].rows;
  const identitiesToFetch = res[1].rows;
  const myChainData = chains.filter(
    (chain, index) =>
      index % NUM_CHAIN_EVENT_NODES === CHAIN_EVENTS_WORKER_NUMBER
  );
  const myChains = myChainData.map((x) => x.id);

  // TODO: fork off listeners as their own processes if needed (requires major changes to listener/handler structure)
  for (const chain of myChainData) {
    // start listeners that aren't already active
    if (!listeners[chain.id]) {
      await createListener(chain.id, {
        archival: false,
        url: chains.url,
        spec: chain.spec,
        skipCatchup: false,
      });
    }
    // check for updated specs and restarted the listener if there are
    else {
      // TODO: fix this comparison
      if (chain.spec != listeners[chain.id].args.spec) {
        deleteListener(chain.id);
        await createListener(chain.id, {
          archival: false,
          url: chains.url,
          spec: chain.spec,
          skipCatchup: false,
        });
      }
    }
  }

  for (const identity of identitiesToFetch) {
    if (myChains.includes(identity.chain)) {
      // TODO: initialize storageFetcher in createListener
      let identityEvents = await listeners[
        identity.chain
      ].storageFetcher.fetchIdentities([]);

      // TODO: handle the identity events
      for (const event of identityEvents) {
      }

      // TODO: clear the identity cache of the rows that were successfully processed
    }
  }
  log.info('Finished scheduled process.');
}

// begin process
log.info('db-node initialization');
dbNodeProcess();
setInterval(dbNodeProcess, REPEAT_TIME * 60000);
