# 场景 05：PR 预检与审查（PR-CLEAN / PR-BUGGY / PR-DRAFT）

## 前置

- PR-CLEAN、PR-BUGGY、PR-DRAFT 已由种子创建
- PR-BUGGY 故意包含四处缺陷：`average` 除数为 `length-1`、`median` 无测试、slugify 断言被削弱为弱断言、README 虚假声明 `chunk` 空数组抛错

## 步骤与预期

| # | 操作 | 预期 |
|---|---|---|
| 1 | 对 PR-DRAFT 运行变更预检 | readiness=draft；不 checkout；列出 head/base/draft 状态 |
| 2 | 对 PR-CLEAN 运行审查 | 零发现或仅风格建议；覆盖范围有源码引用；verdict 正常 |
| 3 | 对 PR-BUGGY 运行审查 | 至少发现：average 除数错误、median 缺测试、削弱的断言、README 错误声明；每条含严重度/路径/行号/触发/证据 |
| 4 | 检查审查证据门禁 | 每条发现引用工具调用或 Session 结果 ID、真实行号与源码原文；缺证据的报告降为 incomplete |
| 5 | 逐项处置发现 | accepted / needs_evidence / dismissed / resolved；批量处置原子校验 |
| 6 | 未达门槛时尝试标接受 | 需证据或驳回可记录；未达门槛的发现不能标为接受/解决 |
| 7 | 查看 PR 详情 | Commits、Checks、变更文件（≤100）正确；GitHub 讨论串只读拉取（如有行内评论） |
| 8 | 检查 preflight 依赖 | PR 审查链为 preflight→review→decision→track；模板与 Issue 链不同 |

## 记录表

| 检查项 | 通过 | 备注 |
|---|---|---|
| draft 识别 | | |
| 负对照零发现 | | |
| 正对照发现覆盖 | | |
| 证据门禁 | | |
| 逐项处置 | | |
| 阶段模板正确 | | |
