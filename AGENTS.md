# dsh-acceptance-suite 约定

本仓库是 dsh-maintainer-workbench 的验收夹具，不是产品代码。修改任何内容前先读根 README 的"故意状态/种子数据"表。

- 脚本：Node 24+，仅标准库；`scripts/seed.mjs | status.mjs | cleanup.mjs`，共享 `scripts/lib.mjs`。
- 凭据：只从环境变量或 `.env` 读取 `GITHUB_TOKEN`，不入库、不打印。
- 幂等：所有种子数据带 `<!-- acceptance:ID -->` 标记；只增带标记的数据，绝不触碰真实用户数据。
- 测试入口：根 `npm test` 为 monorepo 绿基线；`npm run test:node-app` 预期失败（`add` 故意缺陷）；`npm run test:python` / `test:rust` 依赖本机工具链。
- 故意缺陷清单（不要"顺手修复"）：`projects/node-ts-app/src/calc.js` 的 `add`；`projects/node-ts-app/README.md` 的 `clamp` 描述；PR-BUGGY 补丁内的四处审查目标。
- 补丁：`seed-data/pr/*.patch` 由真实改动经 `git diff --binary` 生成，经 `git apply --check` 校验后才可提交。
- 行尾：`.gitattributes` 强制 LF；新增文本文件保持 LF。
