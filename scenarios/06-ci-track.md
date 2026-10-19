# 场景 06：CI 诊断与关联 PR 跟踪（PR-CI-FAIL / PR-LINKED）

## 前置

- PR-CI-FAIL 携带 `forced-failure` workflow（push 与 PR 检查均失败）
- PR-LINKED 修正了 `add` 缺陷，body 含 `Closes #<ISS-BUG>`（真实编号见 `scenarios/manifest.json`）

## 步骤与预期

| # | 操作 | 预期 |
|---|---|---|
| 1 | 对 PR-CI-FAIL 运行预检 | 检出 CI 失败；readiness=blocked |
| 2 | 启动 CI 诊断（ci 阶段） | 按 head SHA 读取 Actions runs/jobs；列出失败 job `fail` 与步骤；日志摘要可读（≤512KiB）；分类 regression |
| 3 | 查看 CI 证据绑定 | CI 报告绑定 head SHA 的真实 check/jobs 记录；不是模型转述 |
| 4 | 打开 PR-LINKED | track 视图显示关联 Issue（ISS-BUG）与 closingIssues |
| 5 | 查看 PR-LINKED 状态 | draft/review/mergeState/checks 正确；CI（monorepo/python/rust）通过 |
| 6 | 合并 PR-LINKED（可选，人工） | 同步后插件反映 Issue 关闭与合并状态；不自动合并是插件行为，合并由你执行 |
| 7 | 检查 Actions 读取边界 | 不 rerun Actions、不下载任意 CI 提供商日志、失败步骤逐条列出 |

## 记录表

| 检查项 | 通过 | 备注 |
|---|---|---|
| 失败检查检出 | | |
| 日志真实下载 | | |
| 分类合理 | | |
| closingIssues 关联 | | |
| 合并状态同步 | | |
