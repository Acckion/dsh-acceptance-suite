# node-ts-app 约定

- 语言：JavaScript（ESM），Node.js 24+，不引入任何 npm 依赖。
- 测试：`npm test`（即 `node --test "test/**/*.test.js"`），测试文件位于 `test/*.test.js`。
- 验证入口：CI 不运行本项目测试（主分支保持红色状态用于修复链路验收）；本地修复验收必须运行 `npm test`。
- 代码风格：使用 `node:test` 与 `node:assert/strict`；不使用类，只导出纯函数。
- 已知夹具状态：`src/calc.js` 中的 `add` 存在故意注入的缺陷（相减而非相加）；`README.md` 中 `clamp` 的描述与实现不一致。这两处是验收场景的一部分，不要在未接单的情况下"顺手修复"。
