export declare class RabbitMqProducer {
    private readonly _rabbitMQConfig;
    broker: any;
    readonly publishers: any;
    private _vhost;
    constructor(_rabbitMQConfig: any);
    init(): Promise<void>;
    publish(data: any, publisherName: string): Promise<any>;
}
