import { createNode } from '../src';
import { Listener } from '../src';

const listeners: { [key: string]: Listener } = {};
const app = createNode(listeners);
