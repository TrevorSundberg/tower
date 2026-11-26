const decoder = new TextDecoder('utf-8', {fatal:true});
const encoder = new TextEncoder();

export function guestString(context, pointer) {
  const start = Number(pointer);
  if (!Number.isSafeInteger(start) || start <= 0) throw new Error('Invalid guest pointer');
  const memory = context.memory(), end = memory.indexOf(0, start);
  if (end < 0) throw new Error('Unterminated guest string');
  return decoder.decode(memory.subarray(start, end));
}

export function copyText(context, text) {
  if (typeof text !== 'string') throw new Error('Expected guest text');
  const bytes = encoder.encode(text);
  const address = context.allocate(bytes.length + 1);
  if (!address) throw new Error('Cannot allocate guest text');
  const memory = context.memory();
  memory.set(bytes, address);
  memory[address + bytes.length] = 0;
  return address;
}
