# rust-cli

Rust 夹具 crate，用于验收仓库理解对 `Cargo.toml`、crate 结构与测试入口的识别。

## 运行测试

```sh
cargo test
```

无第三方依赖，要求本机安装 Rust toolchain（stable）。

## 结构

- `src/lib.rs`：`fib` 与 `is_palindrome` 纯函数 + 单元测试。
- `src/main.rs`：最小二进制入口。
- `tests/integration.rs`：集成测试。
