# DSH Maintainer Workbench 验收测试仓库

本仓库是 [dsh-maintainer-workbench](https://github.com/Acckion/dsh-maintainer-workbench) 的功能验收夹具：多语言测试项目 + 预置 Issue/PR/CI 种子数据 + 手工验收清单。目标是在真实 GitHub 远端与真实模型下，逐项验证插件的收件箱、分诊、调查、修复、文档维护、PR 审查、CI 跟踪、发布与多仓库能力。

## 前置条件

- Node.js 24+、Git；可选：Python 3.10+、Rust stable（缺失时验证"环境阻塞"路径）
- 一个有写权限的 GitHub 测试仓库（建议公开仓库，避免 Actions 分钟数受限）
- GitHub Token：`Metadata`(read)、`Contents`(read/write)、`Issues`(read/write)、`Pull requests`(read/write)、`Actions`(read)
- 凭据三选一：环境变量 `GITHUB_TOKEN` ／ `.env` 文件（复制 `.env.example`，不入库）／ 本机已 `gh auth login`（脚本自动回退读取 `gh auth token`）

## 快速开始

```sh
npm run seed          # bootstrap（建远端仓库+推 main）+ 种 issues + 种 PR
npm run status        # 核对种子完整性
npm run seed:secondary  # 可选：创建多仓库隔离用的次要仓库
npm run seed:followup   # 可选：补 ISS-WAIT 回复 + 新建 ISS-NEW（自动化分诊用）
```

在插件中接入 `<SUITE_OWNER>/<SUITE_REPO>`，按 `scenarios/` 目录下的文档逐项验收，把结果记录进各文档的记录表。

## 测试项目

| 项目 | 结构 | 测试入口 | 故意状态 |
|---|---|---|---|
| `projects/node-ts-app` | 单包 Node ESM | `npm test`（node --test） | `add` 注入缺陷（测试红）；README 中 `clamp` 描述与实现不符 |
| `projects/ts-monorepo` | pnpm workspace（core + cli） | `npm test`（node --test + TS 类型剥离） | 无缺陷，绿基线 |
| `projects/python-lib` | src 布局 + unittest | `python -m unittest discover -s tests -v` | 无缺陷，绿基线 |
| `projects/rust-cli` | Cargo crate + 集成测试 | `cargo test` | 无缺陷，绿基线（CI 在 ubuntu 上运行） |

根目录 `npm test` 运行 monorepo 绿基线；`npm run test:node-app` 运行 node-ts-app（预期失败，供 fix 链路对照）。CI（`.github/workflows/ci.yml`）只运行绿基线项目，主分支保持全绿。

## 种子数据

### Issue（`<!-- acceptance:ID -->` 标记幂等）

| ID | 标题要点 | 标签 | 覆盖场景 |
|---|---|---|---|
| ISS-BUG | add(2,3) 返回 -1 | bug | 可复现 bug → fix→validate→review→publish 全链 |
| ISS-DOCS | README clamp 与实现不符 | documentation | 文档漂移 → docs 链 + 文档验证 |
| ISS-FEATURE | 增加 round-half-up | enhancement | feature 分类与调查 |
| ISS-QUESTION | 如何跑 python 测试 | question | question 短链（triage→investigate→decision→track） |
| ISS-MAINTENANCE | rust edition 2024 | maintenance | maintenance 分类 |
| ISS-NEEDSINFO | "某些情况下显示不对" | bug, needs-info | 缺信息：分诊须列出缺失项，不虚构根因 |
| ISS-DUP-A / ISS-DUP-B | 同一 add 缺陷的两份报告 | bug | 疑似重复筛选、重复建议、交叉引用评论 |
| ISS-CLOSED | 已修复的拼写错误 | documentation | 已关闭筛选（种子创建后即关闭） |
| ISS-HIGH | Windows 克隆路径错误 | bug, priority: high | 高优先级筛选 |
| ISS-WAIT | 导入 2000 条卡 10 秒 | bug | 追问等待 → `seed:followup` 后同步检测新回复 |
| ISS-NEW | 深色模式对比度 | bug | 仅 `seed:followup` 创建，验证自动分诊 |

### PR（分支 + 补丁，`<!-- acceptance:ID -->` 标记）

| ID | 分支 | 内容 | 覆盖场景 |
|---|---|---|---|
| PR-CLEAN | acceptance/clean-feature | core 增加 sum + 测试，全绿 | 无缺陷 PR 负对照（零发现） |
| PR-BUGGY | acceptance/buggy-review | average 除数错误、median 无测试、断言被削弱、README 错误声明 | 有缺陷 PR 正对照（findings 逐项处置）；测试保持绿 |
| PR-DRAFT | acceptance/draft-experiment | 占位模块 | preflight readiness=draft |
| PR-CI-FAIL | acceptance/ci-failure | forced-failure workflow | ci 阶段、Actions 日志、track 阻塞 |
| PR-LINKED | acceptance/fix-node-app | 修正 add，body 含 `Closes #ISS-BUG` | 关联 PR 交付进度、closingIssues |

## 功能对照矩阵

| 功能 | 测试项 | 操作入口 | 预期 | 场景 |
|---|---|---|---|---|
| 统一收件箱 | 同时显示 Issue/PR，标题编号标签可搜 | 收件箱 | 种子项全部出现，PR 与 Issue 分页签 | 01 |
| 收件箱筛选 | 五档筛选逐个切换 | 筛选菜单 | 高优先级只含 ISS-HIGH；疑似重复含 DUP 对；已关闭含 ISS-CLOSED | 01 |
| 智能分诊 | 全部勾选批量分诊 | 批量分诊 | 分类/优先级/置信度/缺失信息/建议标签齐全；ISS-BUG 定位到 calc.js | 01 |
| 两级重复检测 | DUP-A/B 分诊 | 分诊结果 | 给出疑似重复与理由，不自动关闭 | 01 |
| 缺信息处理 | ISS-NEEDSINFO 分诊 | 分诊结果 | 列出缺失信息（复现步骤/环境等），不虚构根因 | 01 |
| 信息追问与同步 | ISS-WAIT 追问后运行 `seed:followup` 再同步 | 等待记录 + 同步 | 检测到新回复并提示待重新评估，不自动重跑 | 01, 08 |
| 仓库理解 | 查看仓库资料 | 仓库资料页 | 识别 4 种语言/结构、AGENTS.md 来源、测试入口与 CI，裁剪有提示 | 02 |
| 问题调查 | ISS-BUG 调查 | 调查阶段 | 在 worktree 读代码，事实/假设分离，产出计划草稿 | 02, 03 |
| 修复全链 | ISS-BUG：fix→validate→review | 阶段导航 | 先失败回归测试后修复；验证记录命令/退出码；审查引用真实读取 | 03 |
| 补丁交接 | fix→validate→review 各阶段 | 证据页 | 同 SHA 同补丁指纹，源 checkout 不变 | 03 |
| 退回与重试 | 接受前退回 | 审核操作 | 保留历史尝试，重试基于新输入版本 | 03 |
| 文档维护 | ISS-DOCS：docs→validate | docs 阶段 | 以源码为准修正 README；文档验证执行 verify-document-patch | 04 |
| PR 预检 | PR-DRAFT / PR-CI-FAIL 预检 | preflight | draft 与 blocked 状态正确，列出 CI 失败 | 05, 06 |
| PR 审查负对照 | PR-CLEAN 审查 | review | 零发现或仅风格建议，覆盖声明有源码引用 | 05 |
| PR 审查正对照 | PR-BUGGY 审查 | review | 发现除数错误/缺测试/削弱断言/文档错误；证据门禁生效 | 05 |
| 发现逐项处置 | 采纳/驳回/需证据 | 发现列表 | 批量处置原子；未达证据门槛不能标接受 | 05 |
| CI 诊断 | PR-CI-FAIL ci 阶段 | ci | 列出失败 job/步骤，可读日志摘要，分类 regression | 06 |
| 关联 PR 跟踪 | PR-LINKED | track | 显示 closingIssues、合并状态；CI 完成等待推进 | 06 |
| 发布评论 | ISS-BUG 接受后发布回复 | 发布预览 | 预览显示将写入内容；发布带去重标记，重复发布被拦截 | 07 |
| 应用标签 | 发布时应用标签 | 发布预览 | 标签真实出现在 GitHub | 07 |
| 草稿 PR | fix 结果发布草稿 PR | 发布预览 | 推送 maintainer/ 分支并创建 draft PR，正文含 Refs 与验证段 | 07 |
| 发布审查 | PR-BUGGY 采纳后发布 COMMENT | 发布预览 | POST /pulls/N/reviews event=COMMENT，不代替 APPROVE | 07 |
| 讨论串 resolve | PR-BUGGY 行内讨论 | 讨论串操作 | 两步预览确认后 GraphQL 写入 | 07 |
| 发布新鲜度 | 预览后修改草稿再发布 | 发布预览 | 旧预览失效并阻止发布 | 07 |
| 多仓库接入 | 批量接入主仓+secondary | 接入仓库 | 逐项结果、去重合并；secondary 独立收件箱 | 08 |
| 仓库切换 | 切换当前仓库 | 仓库切换器 | 清空勾选/详情/预览，记住上次选择 | 08 |
| 自动化分诊 | 开启自动化后运行 `seed:followup` | 自动化设置 | 新建 ISS-NEW 被自动轻量分诊 | 08 |
| 队列与并发 | 批量派发全部 issue | 批量操作 | 每批 20、并发 2 可见；失败逐项报告 | 01, 08 |
| 导出 | 任务 JSON / patch 导出 | 任务详情 | 文件含产物与证据，不含凭据 | 03 |
| 模型设置 | 阶段级模型覆盖 | 设置→模型 | 8 阶段可分别设置，优先级阶段→插件默认→宿主 | 通用 |
| 环境阻塞 | 无 Rust 环境时验证 rust-cli 任务 | validate | 报告未运行理由，不伪造 passed | 02 |

## 重置

```sh
npm run cleanup              # 关闭种子 issue/PR、删除 acceptance/* 分支
npm run cleanup -- --secondary   # 连同 secondary 仓库一起清理
node scripts/seed.mjs all --recreate   # 删除已关闭的种子 issue 并重建
```

## 诚实边界

- 本仓库只提供数据与操作清单；模型分类质量、修复正确率不由种子数据保证。
- `seed`/`status`/`cleanup` 只操作带 `<!-- acceptance:… -->` 标记的数据。
- 真实模型调用按你的提供方计费；发布类验收会产生真实 GitHub 写入。
