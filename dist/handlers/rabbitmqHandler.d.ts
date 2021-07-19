import { CWEvent, IEventHandler } from '../interfaces';
import { RabbitMqProducer } from '../rabbitmq/producer';
export declare class RabbitMqHandler extends RabbitMqProducer implements IEventHandler {
    constructor(_rabbitMQConfig: {});
    handle(event: CWEvent): Promise<any>;
}
