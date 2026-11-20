Pinned from the WebAssembly testsuite used by wasm2brs:

- wasm2brs: https://github.com/MotleyCoderDev/wasm2brs/tree/671b23b8c4833beed88b31267b91af0f13593a50
- testsuite: https://github.com/MotleyCoderDev/testsuite/tree/075fda7a3b5a21d29fff1b3ff120c4e0984f2a21

The unmodified `i32.wast` and `i64.wast` files retain their Apache 2.0 license
in `LICENSE`. The test harness checks numeric invoke/return/trap expectations;
it does not claim to implement Wasm validation or run the full wasm2brs suite.
The Tower runtime is independently implemented. No wasm2brs runtime code is
bundled or required at compilation/execution time.
