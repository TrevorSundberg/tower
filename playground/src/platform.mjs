// The same synchronous platform ABI as library/platform.tower. Browser hosts
// supply byte sinks; no filesystem or network access is implied.
export function platformImports(write) {
  return {
    platform_write(context, stream, pointer, length) {
      if (stream !== 1 && stream !== 2) return -1n;
      const p = Number(pointer), n = Number(length), memory = context.memory();
      if (!Number.isSafeInteger(p) || !Number.isSafeInteger(n) || p < 0 || n < 0 || p > memory.length || n > memory.length-p)
        throw new Error('platform_write buffer is outside execution memory');
      const accepted = write(stream,memory.subarray(p,p+n),context);
      return accepted === undefined ? BigInt(n) : BigInt(accepted);
    },
  };
}
