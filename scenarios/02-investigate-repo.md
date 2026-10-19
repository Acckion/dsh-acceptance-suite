# 场景 02：仓库理解与问题调查

## 前置

- 本仓库已接入并完成一次同步
- 代码类任务会自动克隆到插件管理目录（或已绑定本地 clone）

## 步骤与预期

| # | 操作 | 预期 |
|---|---|---|
| 1 | 打开仓库资料页 | 识别出 JavaScript/TypeScript/Python/Rust 四种语言与 pnpm workspace 结构 |
| 2 | 查看约定与文档来源 | 列出根 AGENTS.md 与各项目 AGENTS.md / README，显示路径与裁剪警告（如有） |
| 3 | 查看构建与测试入口 | node-ts-app（红）、ts-monorepo、python-lib、rust-cli 的测试命令均有来源引用 |
| 4 | 查看 CI 识别 | 识别 `.github/workflows/ci.yml` 的 monorepo/python/rust 三个 job |
| 5 | 对 ISS-BUG 启动调查（独立节点） | 创建 worktree（固定提交）；只读代码 + 最小实验；事实与假设分离 |
| 6 | 查看调查产物 | 事实引用 `src/calc.js` 具体行；计划草稿带来源；不修改源码 |
| 7 | （可选）在无 Rust 环境的机器验证 rust-cli 任务 | 验证阶段如实报告"未运行理由/环境阻塞"，不伪造 passed |
| 8 | 检查源 checkout | 调查/验证期间插件目录与源仓库工作区均未被修改 |

## 记录表

| 检查项 | 通过 | 备注 |
|---|---|---|
| 多语言结构识别 | | |
| AGENTS 来源展示 | | |
| 测试入口识别 | | |
| worktree 隔离 | | |
| 事实/假设分离 | | |
| 环境阻塞如实报告 | | |
