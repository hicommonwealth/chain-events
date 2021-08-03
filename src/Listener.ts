import {
  IEventHandler,
  IChainEventKind,
  IEventSubscriber,
  IEventProcessor,
  EventSupportingChainT,
  IChainEventData,
  CWEvent,
} from './interfaces';
import { factory, formatFilename } from './logging';

const log = factory.getLogger(formatFilename(__filename));

export abstract class Listener {
  public eventHandlers: {
    [key: string]: {
      handler: IEventHandler;
      excludedEvents: IChainEventKind[];
    };
  };
  // events to be excluded regardless of handler (overrides handler specific excluded events
  public globalExcludedEvents: IChainEventKind[];
  protected _subscriber: IEventSubscriber<any, any>;
  protected _processor: IEventProcessor<any, any>;
  protected _api: any;
  protected _subscribed: boolean;
  protected readonly _chain: string;
  protected readonly _verbose: boolean;

  protected constructor(chain: EventSupportingChainT, verbose?: boolean) {
    this._chain = chain;
    this.eventHandlers = {};
    this._verbose = !!verbose;
    this.globalExcludedEvents = [];
  }

  public abstract init(): Promise<void>;

  public abstract subscribe(): Promise<void>;

  public async unsubscribe(): Promise<void> {
    if (!this._subscriber) {
      log.warn(
        `Subscriber for ${this._chain} isn't initialized. Please run init() first!`
      );
      return;
    }

    if (!this._subscribed) {
      log.warn(`The listener for ${this._chain} is not subscribed`);
      return;
    }

    this._subscriber.unsubscribe();
    this._subscribed = false;
  }

  protected async handleEvent(event: CWEvent<IChainEventData>): Promise<void> {
    let prevResult;

    event.chain = this._chain as EventSupportingChainT;
    event.received = Date.now();

    for (const key in this.eventHandlers) {
      const eventHandler = this.eventHandlers[key];
      if (
        this.globalExcludedEvents.includes(event.data.kind) ||
        eventHandler.excludedEvents.includes(event.data.kind)
      )
        continue;

      try {
        prevResult = await eventHandler.handler.handle(event, prevResult);
      } catch (err) {
        log.error(`Event handle failure: ${err.message}`);
        break;
      }
    }
  }

  protected abstract processBlock(block: any): Promise<void>;

  public get chain(): string {
    return this._chain;
  }

  public get subscribed(): boolean {
    return this._subscribed;
  }

  public abstract get options(): {};
}
