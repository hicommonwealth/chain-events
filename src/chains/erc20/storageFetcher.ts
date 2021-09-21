import {
  CWEvent,
  IChainEntityKind,
  IDisconnectedRange,
  IStorageFetcher,
} from '../../interfaces';
import { factory, formatFilename } from '../../logging';

import { Api, EventKind } from './types';
import { Enrich, EnricherConfig } from './filters/enricher';

const log = factory.getLogger(formatFilename(__filename));

export class StorageFetcher extends IStorageFetcher<Api> {
  constructor(
    protected readonly _api: Api,
    protected readonly enricherConfig?: EnricherConfig
  ) {
    super(_api);
  }

  private _currentBlock: number;

  public async fetch(
    range?: IDisconnectedRange | undefined,
    fetchAllCompleted?: boolean | undefined,
    tokens?: string[]
  ): Promise<CWEvent[]> {
    this._currentBlock = await this._api.provider.getBlockNumber();
    log.info(`Current block: ${this._currentBlock}.`);
    if (!this._currentBlock) {
      log.error('Failed to fetch current block! Aborting fetch.');
      return [];
    }

    // populate range fully if not given
    if (!range) {
      range = { startBlock: 0 };
    } else if (!range.startBlock) {
      range.startBlock = 0;
    } else if (range.startBlock >= this._currentBlock) {
      log.error(
        `Start block ${range.startBlock} greater than current block ${this._currentBlock}!`
      );
      return [];
    }
    if (range.endBlock && range.startBlock >= range.endBlock) {
      log.error(`Invalid fetch range: ${range.startBlock}-${range.endBlock}.`);
      return [];
    }
    log.info(
      `Fetching Compound entities for range: ${range.startBlock}-${range.endBlock}.`
    );

    let tokenContracts = [];
    if (!tokens) tokenContracts = this._api.tokens;
    else if (tokens && this._api.tokenNames) {
      for (const token of tokens) {
        const tokenIndex = this._api.tokenNames.indexOf(token);
        if (tokenIndex >= 0) {
          tokenContracts.push(this._api.tokens[tokenIndex]);
        }
      }
    }

    const cleanedEvents = [];
    for (const token of tokenContracts) {
      const tokenName = this._api.tokenNames
        ? this._api.tokenNames[this._api.tokens.indexOf(token)]
        : null;

      // transfers
      const transferFilter = token.filters.Transfer(null);
      const transferEvents = await token.queryFilter(
        transferFilter,
        range.startBlock,
        range.endBlock || 'latest'
      );
      cleanedEvents.push(
        await Promise.all(
          transferEvents.map(async (event) => {
            const processedEvent = await Enrich(
              this._api,
              event.blockNumber,
              EventKind.Transfer,
              event,
              this.enricherConfig || {}
            );
            processedEvent.chain = <never>tokenName;
            return processedEvent;
          })
        )
      );

      // approvals
      const approvalEvents = await token.queryFilter(
        token.filters.Approval(null),
        range.startBlock,
        range.endBlock || 'latest'
      );
      cleanedEvents.push(
        await Promise.all(
          approvalEvents.map(async (event) => {
            const processedEvent = await Enrich(
              this._api,
              event.blockNumber,
              EventKind.Approval,
              event,
              this.enricherConfig || {}
            );
            processedEvent.chain = <never>tokenName;
            return processedEvent;
          })
        )
      );

      cleanedEvents.sort((a, b) => b.blockNumber - a.blockNumber);
      log.info(
        `Found ${transferEvents.length + approvalEvents.length}${
          ` ${tokenName} ` || ' '
        }events`
      );
    }

    return cleanedEvents.flat();
  }

  public async fetchOne(
    id: string,
    kind: IChainEntityKind | undefined
  ): Promise<CWEvent[]> {
    this._currentBlock = +(await this._api.provider.getBlockNumber());
    log.info(`Current block: ${this._currentBlock}.`);
    if (!this._currentBlock) {
      log.error('Failed to fetch current block! Aborting fetch.');
      return [];
    }
    return this.fetch();
  }
}
