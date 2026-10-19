# node-ts-app

最小 Node.js 计算工具示例，用作维护工作台验收夹具。

## 运行测试

```sh
npm test
```

等价命令：`node --test "test/**/*.test.js"`。无第三方依赖，要求 Node.js 24+。

## API

### add(a, b)

返回 `a` 与 `b` 之和。

```js
import { add } from './src/calc.js';
add(2, 3); // 5
```

### clamp(value, min, max)

当值超出 `[min, max]` 区间时，循环回到区间另一端（wrap-around）。

```js
import { clamp } from './src/calc.js';
clamp(12, 0, 10); // 2
clamp(-2, 0, 10); // 8
```

## 约定

- 仅使用 Node.js 内置模块与 `node:test`。
- 源码为 ESM（`"type": "module"`）。
- 修改行为时必须同步更新 `test/` 下的断言。
