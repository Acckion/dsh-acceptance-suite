# rust-cli 约定

- 语言：Rust edition 2021，crate 名 `suite-rust-cli`。
- 测试：`cargo test`（本目录执行），包含 `src/lib.rs` 单元测试与 `tests/integration.rs` 集成测试。
- 不引入任何 crates.io 依赖，保证离线可构建。
- 修改公共函数行为时必须同步更新对应测试模块。
