import { ListenerT } from '../interfaces';
import { IProducer, Producer } from '../rabbitmq/producer';

export const listeners: { [key: string]: ListenerT } = {};
export let producer: IProducer;

export async function startProducer(config) {
  producer = new Producer(config);
  await producer.init();
  return producer;
}
