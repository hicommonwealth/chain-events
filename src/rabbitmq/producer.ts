import Rascal from 'rascal';

import config from './RabbitMQconfig.json';
import { factory, formatFilename } from '../logging';
import { CWEvent, IEventHandler } from '../interfaces';

const log = factory.getLogger(formatFilename(__filename));

// TODO: remove option purge from queue config

export interface IProducer extends IEventHandler {
  broker: Rascal.BrokerAsPromised;
  init: () => Promise<void>;
}

export class Producer implements IProducer {
  public broker;

  public async init(): Promise<void> {
    this.broker = await Rascal.BrokerAsPromised.create(
      Rascal.withDefaultConfig(config)
    );
    this.broker.on('error', log.error);
    this.broker.on('vhost_initialized', ({ vhost, connectionUrl }) => {
      log.info(
        `Vhost: ${vhost} was initialised using connection: ${connectionUrl}`
      );
    });
    this.broker.on('blocked', (reason, { vhost, connectionUrl }) => {
      log.info(
        `Vhost: ${vhost} was blocked using connection: ${connectionUrl}. Reason: ${reason}`
      );
    });
    this.broker.on('unblocked', ({ vhost, connectionUrl }) => {
      log.info(
        `Vhost: ${vhost} was unblocked using connection: ${connectionUrl}.`
      );
    });
  }

  public async handle(event: CWEvent): Promise<any> {
    try {
      const publication = await this.broker.publish('eventsPub', event);
      publication.on('error', (err, messageId) => {
        log.error(`Publisher error ${err}, ${messageId}`);
      });
    } catch (err) {
      throw new Error(`Rascal config error: ${err.message}`);
    }
  }
}
