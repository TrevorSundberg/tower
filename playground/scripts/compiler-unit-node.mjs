import {parentPort} from 'node:worker_threads';
import {compilerUnitMessages} from '../src/compiler-unit.mjs';
const receive = compilerUnitMessages((data,transfer) => parentPort.postMessage(data,transfer ?? []));
parentPort.on('message',receive);
