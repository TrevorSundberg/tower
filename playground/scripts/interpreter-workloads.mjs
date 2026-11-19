export const workloads = {
  arithmetic: 'var i: u32 = 0; var sum: u32 = 0; loop { var stop = i == 10000; if stop { break; } sum = sum + i; sum = sum ^ 17; i = i + 1; } print(sum);',
  calls: 'fn add(a: i32, b: i32): i32 { var result = a + b; return result; } var i = 0; var sum = 0; loop { var stop = i == 3000; if stop { break; } sum = add(sum, add(i, 1)); i = i + 1; } print(sum);',
  memory: 'var p = alloc(u32, 1024); var i: usize = 0; var sum: u32 = 0; loop { var stop = i == 10000; if stop { break; } var j = i % 1024; p[j] = convert(u32, i); sum = sum + p[j]; i = i + 1; } free(p); print(sum);',
  branch: 'var i = 0; var sum = 0; loop { var stop = i == 10000; if stop { break; } var rem = i % 7; var low = rem < 3; if low { sum = sum + 1; } else { sum = sum - 1; } i = i + 1; } print(sum);',
};
