# 场景 07：发布与交付（评论 / 标签 / 草稿 PR / Review / 讨论串）

## 前置

- 已在场景 03/04/05 产生本地接受的产物
- Token 具备写权限；本场景产生真实 GitHub 写入

## 步骤与预期

| # | 操作 | 预期 |
|---|---|---|
| 1 | 对 ISS-BUG 已接受结果执行发布预览（评论） | 预览显示将写入的评论正文；输入新鲜度与补丁一致性通过 |
| 2 | 确认发布评论 | Issue 下出现带 `<!-- maintainer-workbench:jobId:action -->` 去重标记的评论 |
| 3 | 再次对同一产物发布 | 去重拦截，不产生重复评论 |
| 4 | 发布时应用标签 | 选择的标签真实出现在 Issue 上 |
| 5 | 发布草稿 PR（fix 结果） | 本地 commit（固定署名）→ 推送 `maintainer/…` 分支 → 创建 draft PR，正文含 Refs # 与 Validation 段 |
| 6 | 对 PR-BUGGY 采纳的发现发布审查 | POST /pulls/N/reviews event=COMMENT；不代替 APPROVE/REQUEST_CHANGES；工作台不合并 PR |
| 7 | 讨论串 resolve（如有行内讨论） | 两步预览确认后 GraphQL 写入；resolve/unresolve 可回退 |
| 8 | 预览后修改回复草稿再发布 | 旧预览失效，发布被阻止 |
| 9 | 发布新鲜度 | 若 Issue 在预览后被同步到新版本，发布被阻止并提示 |
| 10 | 查看发布记录 | 任务中保存 publishing/published/failed 三态记录与回执 |
| 11 | 检查不做的事 | 未自动合并 PR、未自动关闭 Issue、未指派、未发 release |

## 记录表

| 检查项 | 通过 | 备注 |
|---|---|---|
| 评论发布与去重 | | |
| 标签应用 | | |
| 草稿 PR 创建 | | |
| Review COMMENT | | |
| 讨论串两步确认 | | |
| 过期预览阻止 | | |
| 无未授权写入 | | |
