// Transport the editor's public comparison result to the selected Tower test.
import {compareResults} from '../src/comparison.mjs';
import {copyText, guestString} from './guest_text.mjs';

export function compare_results(context, left, right) {
  const fields = compareResults(
    JSON.parse(guestString(context, left)), JSON.parse(guestString(context, right)));
  if (fields !== null && !Array.isArray(fields)) throw new TypeError('Expected a field list or null');
  return copyText(context, JSON.stringify(fields));
}
