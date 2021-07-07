import { SubstrateTypes } from 'index';
import { CWEvent, IChainEventData, IEventHandler } from './interfaces';
import { Pool } from 'pg';
import _ from 'underscore';

export default class extends IEventHandler {
  private client;

  constructor(private readonly _models, private readonly _chain: string) {
    super();
  }

  public async init(): Promise<void> {
    const pool = new Pool();
    this.client = await pool.connect();
  }

  public closeClient(): void {
    // EXTREMELY important to remember to use this once the handler instance is
    // no longer being used
    this.client.release();
  }

  /**
   * Handles an identity-related event by writing the corresponding update into
   * the database.
   */
  public async handle(event: CWEvent<IChainEventData>, dbEvent) {
    // do nothing if wrong type of event
    if (
      event.data.kind !== SubstrateTypes.EventKind.IdentitySet &&
      event.data.kind !== SubstrateTypes.EventKind.JudgementGiven &&
      event.data.kind !== SubstrateTypes.EventKind.IdentityCleared &&
      event.data.kind !== SubstrateTypes.EventKind.IdentityKilled
    ) {
      return dbEvent;
    }

    if (!this.client) {
      console.info('PG client not initialized');
      return dbEvent;
    }

    try {
      await this.client.query('BEGIN');

      // fetch OffchainProfile corresponding to address
      const { who } = event.data;

      const profiles = await this.client.query(
        `SELECT * FROM "Addresses" WHERE "address"=(eAddress) AND "chain"=(eChain) VALUES($1, $2)`,
        [who, this._chain]
      );

      if (profiles.length == 0) return dbEvent;

      // update profile data depending on event
      if (event.data.kind === SubstrateTypes.EventKind.IdentitySet) {
        await this.client.query(
          `UPDATE "OffchainProfiles" SET "identity"=(eIdentity), "judgements"=(eJudgement) WHERE "address_id"=(eAddressId) VALUES($1, $2, $3)`,
          [
            event.data.displayName,
            _.object<any>(event.data.judgements),
            profiles[0].address_id,
          ]
        );

        let logName = who;
        if (profiles[0].data) {
          const { name } = JSON.parse(profiles[0].data);
          logName = name;
        }
        console.debug(
          `Discovered name '${profiles[0].identity}' for ${logName}!`
        );
      } else if (event.data.kind === SubstrateTypes.EventKind.JudgementGiven) {
        // if we don't have an identity saved yet for a judgement, do nothing
        if (!profiles[0].identity) {
          console.warn(
            'No corresponding identity found for judgement! Needs identity-migration?'
          );
          return dbEvent;
        }

        await this.client.query(
          `UPDATE "OffchainProfiles" SET "judgements"=(eJudgements) WHERE "address_id"=(eAddressId) VALUES($1, $2)`,
          [
            { [event.data.registrar]: event.data.judgement },
            profiles[0].address_id,
          ]
        );
      } else {
        await this.client.query(
          `UPDATE "OffchainProfiles" SET "identity"=(eIdentity),"judgements"=(eJudgements) WHERE "address_id"=(eAddressId) VALUES($1, $2, $3)`,
          [null, null, profiles[0].address_id]
        );
      }

      await this.client.query('COMMIT');
    } catch (error) {
      await this.client.query('ROLLBACK');
      throw error;
    }

    // TODO: remove row from identity cache table
    return dbEvent;
  }
}
