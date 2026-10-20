# ts-monorepo

pnpm workspace 结构的 TypeScript 夹具项目，用于验收 monorepo 识别与跨包测试入口。

## 运行测试

```sh
npm test
```

等价命令：`node --test "packages/*/test/**/*.test.ts"`。依赖 Node.js 24+ 的原生 TypeScript 类型剥离，无需安装任何依赖。

## 结构

- `packages/core`：纯函数库（slugify / chunk / average / median），其中 `chunk` 对空数组会抛出 `RangeError`。
- `packages/cli`：基于 core 的格式化入口。
