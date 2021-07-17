import { IEventHandler, IChainEventKind, IEventSubscriber, IEventProcessor, EventSupportingChainT, IChainEventData, CWEvent } from './interfaces';
export declare abstract class Listener {
    eventHandlers: {
        [key: string]: {
            handler: IEventHandler;
            excludedEvents: IChainEventKind[];
        };
    };
    globalExcludedEvents: IChainEventKind[];
    protected _subscriber: IEventSubscriber<any, any>;
    protected _processor: IEventProcessor<any, any>;
    protected _api: any;
    protected _subscribed: boolean;
    protected readonly _chain: string;
    protected readonly _verbose: boolean;
    protected constructor(chain: EventSupportingChainT, verbose?: boolean);
    abstract init(): Promise<void>;
    abstract subscribe(): Promise<void>;
    unsubscribe(): Promise<void>;
    protected handleEvent(event: CWEvent<IChainEventData>): Promise<void>;
    protected abstract processBlock(block: any): Promise<void>;
    get chain(): string;
    get subscribed(): boolean;
}
