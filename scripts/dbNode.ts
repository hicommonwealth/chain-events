import { listeners } from '../src/listener';
import { createListener } from '../src/listener/createListener';
import { deleteListener } from '../src/listener/util';
import { factory, formatFilename } from '../src/logging';
import { StorageFetcher } from '../src/chains/substrate';
import Identity from '../src/identity';
import { Pool } from 'pg';
import _ from 'underscore';

const log = factory.getLogger(formatFilename(__filename));

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

// TODO: API-WS from infinitely attempting reconnection i.e. mainnet1
async function dbNodeProcess() {
  const pool = new Pool({
    connectionString: DATABASE_URI,
  });

  pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
    // TODO: handle this
  });

  let query = `SELECT "Chains"."id", "substrate_spec", "url", "ChainNodes"."chain" FROM "Chains" JOIN "ChainNodes" ON "Chains"."id"="ChainNodes"."chain" WHERE "Chains"."has_chain_events_listener"='true';`;

  const allChains = (await pool.query(query))[0].rows;
  const myChainData = allChains.filter(
    (chain, index) =>
      index % NUM_CHAIN_EVENT_NODES === CHAIN_EVENTS_WORKER_NUMBER
  );
  // const myChains = myChainData.map((x) => x.id);

  // initialize listeners first (before dealing with identity)
  // TODO: fork off listeners as their own processes if needed (requires major changes to listener/handler structure)
  for (const chain of myChainData) {
    // start listeners that aren't already active
    if (!listeners[chain.id]) {
      await createListener(chain.id, {
        archival: false,
        url: chain.url,
        spec: chain.spec,
        skipCatchup: false,
      });
    }
    // check for updated specs and restarted the listener if there are
    else {
      if (!_.isEqual(chain.spec, listeners[chain.id].args.spec)) {
        deleteListener(chain.id);
        await createListener(chain.id, {
          archival: false,
          url: chain.url,
          spec: chain.spec,
          skipCatchup: false,
        });
      }
    }
  }

  // loop through chains again this time dealing with identity
  for (const chain of myChainData) {
    // fetch identities to fetch on this chain
    query = `SELECT * FROM "IdentityCache" WHERE "chain"=(eChain) VALUE($1);`;

    const identitiesToFetch = (await pool.query(query, [chain]))[0].rows.map(
      (c) => {
        c.address;
      }
    );

    // if no identities are cached go to next chain
    if (identitiesToFetch.length == 0) continue;

    // initialize storage fetcher if it doesn't exist
    if (!listeners[chain.id].storageFetcher)
      listeners[chain.id].storageFetcher = new StorageFetcher(
        listeners[chain.id].subscriber.api
      );

    // get identity events
    let identityEvents = await listeners[
      chain.id
    ].storageFetcher.fetchIdentities([]);

    // if no identity events are found the go to next chain
    if (identityEvents.length == 0) continue;

    // initialize identity handler
    const identityHandler = new Identity(chain.id, pool);

    await Promise.all(
      identityEvents.map((e) => identityHandler.handle(e, null))
    );

    query = `DELETE * FROM "IdentityCache" WHERE "chain"=(eChain) VALUE($1);`;
    await pool.query(query, [chain]);
  }

  await pool.end();
  log.info('Finished scheduled process.');
}

// begin process
log.info('db-node initialization');
dbNodeProcess().then(() => {
  // first run may take some time so start the clock after its done
  setInterval(dbNodeProcess, REPEAT_TIME * 60000);
});
