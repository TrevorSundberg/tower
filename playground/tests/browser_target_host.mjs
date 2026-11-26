import {inferBrowserTarget, defaultTargetSelection} from '../src/browser-target.mjs';
import {copyText, guestString} from './guest_text.mjs';

// Keep the actual detection for the three public default-selection calls in each test.
export function browserTargetImports() {
  let detection, values;
  return {
    infer_browser_target(context, nav, hints) {
      detection = inferBrowserTarget(JSON.parse(guestString(context, nav)), JSON.parse(guestString(context, hints)));
      return copyText(context, detection.key);
    },
    default_selection_values() {
      values = Object.values(defaultTargetSelection(detection));
      return values.length;
    },
    selection_value(_, index) { return Boolean(values[index]); },
    default_selection_member(context, key) {
      const value = defaultTargetSelection(detection)[guestString(context, key)];
      return copyText(context, JSON.stringify(value) ?? 'null');
    },
  };
}
