import { CWEvent, IEventHandler } from '../interfaces';
import { RabbitMqProducer } from '../rabbitmq/producer';

export class RabbitMqHandler extends RabbitMqProducer implements IEventHandler {
  constructor(_rabbitMQConfig: {}) {
    super(_rabbitMQConfig);
  }

  // handler method used by the chain-event listeners/subscribers
  public async handle(event: CWEvent): Promise<any> {
    try {
      const publication = await this.broker.publish(this.publishers[0], event);
      publication.on('error', (err, messageId) => {
        console.error(`Publisher error ${err}, ${messageId}`);
      });
    } catch (err) {
      throw new Error(`Rascal config error: ${err.message}`);
    }
  }
}
