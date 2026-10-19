# ts-monorepo 约定

- 语言：TypeScript，由 Node.js 24+ 原生类型剥离直接运行，不使用构建步骤，不引入依赖。
- 包管理结构：pnpm workspace（`pnpm-workspace.yaml`），但测试不依赖 pnpm。
- 测试：根目录 `npm test`，或分包 `npm run test:core` / `npm run test:cli`。
- 跨包引用：测试内使用相对路径导入源文件（如 `../../core/src/index.ts`），必须带 `.ts` 扩展名。
- 新增导出函数时必须在同包 `test/` 下补充测试。
