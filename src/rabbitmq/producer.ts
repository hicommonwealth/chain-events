import Rascal from 'rascal';

import { CWEvent, IEventHandler } from '../interfaces';

import { listenerArgs } from '../../scripts/listener';

export interface IProducer extends IEventHandler {
  broker: Rascal.BrokerAsPromised;
  init: () => Promise<void>;
}

export class Producer implements IProducer {
  public broker;
  private _publisher;
  private _vhost;

  constructor(private readonly _rabbitMQConfig: any) {
    // sets _vhost as the first vhost in the configuration passed
    this._vhost =
      _rabbitMQConfig.vhosts[Object.keys(_rabbitMQConfig.vhosts)[0]];

    // sets the publisher as the first publisher in _vhost
    this._publisher = Object.keys(this._vhost.publications)[0];
  }

  public async init(): Promise<void> {
    // this assumes the vhost is '/' --> change soon
    const cnct = this._vhost.connection;
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
      const publication = await this.broker.publish(this._publisher, event);
      publication.on('error', (err, messageId) => {
        console.error(`Publisher error ${err}, ${messageId}`);
      });
    } catch (err) {
      throw new Error(`Rascal config error: ${err.message}`);
    }
  }

  private static _shouldSkip(event: CWEvent): boolean {
    return !!listenerArgs[event.chain].excludedEvents.includes(event.data.kind);
  }
}
