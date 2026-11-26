import {copyText} from './guest_text.mjs';
export {copyText};

export function numberField(value) {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error('Invalid numeric parser observation');
  return value;
}

export function diagnosticFields(terminal) {
  return {
    diagnostic_text: context => copyText(context, terminal().error),
    diagnostic_offset: () => numberField(terminal().errorOffset),
    diagnostic_length: () => terminal().errorLength === undefined ? -1 : numberField(terminal().errorLength),
  };
}
