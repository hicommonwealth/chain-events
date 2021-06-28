import Rascal from 'rascal';

// import { factory, formatFilename } from '../logging';
import { CWEvent, IChainEventKind, IEventHandler } from '../interfaces';

import config from './RabbitMQconfig.json';
import { listenerArgs } from '../../scripts/listener';

export interface StorageFilterConfig {
  excludedEvents?: IChainEventKind[];
}

export interface IProducer extends IEventHandler {
  broker: Rascal.BrokerAsPromised;
  filterConfig: StorageFilterConfig;
  init: () => Promise<void>;
}

export class Producer implements IProducer {
  public broker;
  public filterConfig: StorageFilterConfig = {};

  constructor(private readonly _rabbitMQConfig: {}) {
    this._rabbitMQConfig = _rabbitMQConfig;
    // if (!!_rabbitMQConfig) this._rabbitMQConfig = _rabbitMQConfig;
  }

  public async init(): Promise<void> {
    const cnct = config.vhosts['/'].connection;
    console.info(
      `Rascal connecting to RabbitMQ: ${cnct.protocol}://${cnct.user}:*****@${cnct.hostname}:${cnct.port}/`
    );
    this.broker = await Rascal.BrokerAsPromised.create(
      Rascal.withDefaultConfig(this._rabbitMQConfig)
    );

    this.broker.on('error', console.error);
    this.broker.on('vhost_initialized', ({ vhost, connectionUrl }) => {
      console.info(
        `Vhost: ${vhost} was initialised using connection: ${connectionUrl}`
      );
    });
    this.broker.on('blocked', (reason, { vhost, connectionUrl }) => {
      console.info(
        `Vhost: ${vhost} was blocked using connection: ${connectionUrl}. Reason: ${reason}`
      );
    });
    this.broker.on('unblocked', ({ vhost, connectionUrl }) => {
      console.info(
        `Vhost: ${vhost} was unblocked using connection: ${connectionUrl}.`
      );
    });
  }

  public async handle(event: CWEvent): Promise<any> {
    if (Producer._shouldSkip(event)) return;
    try {
      const publication = await this.broker.publish('eventsPub', event);
      publication.on('error', (err, messageId) => {
        console.error(`Publisher error ${err}, ${messageId}`);
      });
    } catch (err) {
      throw new Error(`Rascal config error: ${err.message}`);
    }
  }

  private static _shouldSkip(event: CWEvent): boolean {
    return !!listenerArgs[event.chain].excludedEvents.includes(event.data.kind);
    // return !!this.filterConfig.excludedEvents?.includes(event.data.kind);
  }
}
