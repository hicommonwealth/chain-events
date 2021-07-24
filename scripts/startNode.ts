import { createNode } from '../src/server';
import { Listener } from '../src/Listener';

const listeners: { [key: string]: Listener } = {};
const app = createNode(listeners);
