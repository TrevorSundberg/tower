const encoder = new TextEncoder();

export function copyText(context, text) {
  if (typeof text !== 'string') throw new Error('Missing parser text');
  const bytes = encoder.encode(text);
  const address = context.allocate(bytes.length + 1);
  if (!address) throw new Error('Cannot allocate parser observation');
  const memory = context.memory();
  memory.set(bytes, address);
  memory[address + bytes.length] = 0;
  return address;
}

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
