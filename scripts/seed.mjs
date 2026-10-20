#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import {
  api,
  authHeader,
  ensureRepo,
  findSeeded,
  git,
  listAllIssues,
  listAllPulls,
  loadEnv,
  markerRe,
  readManifest,
  requireToken,
  resolveRepo,
  rootDir,
  writeManifest,
} from './lib.mjs';

loadEnv();

const CUSTOM_LABELS = [
  { name: 'acceptance', color: '0e8a16', description: '维护工作台验收夹具数据' },
  { name: 'priority: high', color: 'd93f0b', description: '高优先级验收项' },
  { name: 'needs-info', color: 'fbca04', description: '缺少复现信息' },
  { name: 'maintenance', color: 'bfd4f2', description: '维护类验收项' },
];

const ISSUES = [
  {
    id: 'ISS-BUG',
    title: '[acceptance] add(2, 3) 返回 -1 而不是 5',
    labels: ['bug', 'acceptance'],
    body: `在 projects/node-ts-app 中运行 \`npm test\`，add 相关用例失败。

复现步骤：

\`\`\`sh
cd projects/node-ts-app
npm test
\`\`\`

期望：\`add(2, 3)\` 返回 \`5\`
实际：\`add(2, 3)\` 返回 \`-1\`

相关文件：\`projects/node-ts-app/src/calc.js\`

<!-- acceptance:ISS-BUG -->`,
  },
  {
    id: 'ISS-DOCS',
    title: '[acceptance] node-ts-app README 中 clamp 描述与实现不一致',
    labels: ['documentation', 'acceptance'],
    body: `\`projects/node-ts-app/README.md\` 对 \`clamp\` 的说明与实现不一致：README 写的是超出区间时循环回到另一端（wrap-around），但 \`src/calc.js\` 的实现是把值夹取（clamp）到边界。

请以源码为准修正文档，并确保新增的说明与示例同实际行为一致。

<!-- acceptance:ISS-DOCS -->`,
  },
  {
    id: 'ISS-FEATURE',
    title: '[acceptance] core 增加 round-half-up 四舍五入辅助函数',
    labels: ['enhancement', 'acceptance'],
    body: `希望 \`projects/ts-monorepo\` 的 core 包增加一个四舍五入（round-half-up）辅助函数，便于 CLI 输出统计结果。

验收建议：

- 支持指定小数位数
- 附带单元测试

<!-- acceptance:ISS-FEATURE -->`,
  },
  {
    id: 'ISS-QUESTION',
    title: '[acceptance] 如何运行 python-lib 的测试？',
    labels: ['question', 'acceptance'],
    body: `仓库里 Python 项目的测试入口是什么？如何在 CI 中运行它？

请给出可直接执行的命令。

<!-- acceptance:ISS-QUESTION -->`,
  },
  {
    id: 'ISS-MAINTENANCE',
    title: '[acceptance] rust-cli 升级到 edition 2024',
    labels: ['maintenance', 'acceptance'],
    body: `\`projects/rust-cli/Cargo.toml\` 目前使用 edition 2021，计划升级到 edition 2024，并确认 \`cargo test\` 仍然通过。

<!-- acceptance:ISS-MAINTENANCE -->`,
  },
  {
    id: 'ISS-NEEDSINFO',
    title: '[acceptance] 界面在某些情况下显示不太对',
    labels: ['bug', 'needs-info', 'acceptance'],
    body: `页面在某些情况下显示不太对，有时候颜色也会怪怪的。

麻烦看一下。

<!-- acceptance:ISS-NEEDSINFO -->`,
  },
  {
    id: 'ISS-DUP-A',
    title: '[acceptance] add 函数结果变成了减法',
    labels: ['bug', 'acceptance'],
    body: `计算器的 \`add\` 函数结果不对：\`add(5, 3)\` 得到 \`2\` 而不是 \`8\`。

<!-- acceptance:ISS-DUP-A -->`,
  },
  {
    id: 'ISS-DUP-B',
    title: '[acceptance] 加法运算 5 + 3 算成了 2',
    labels: ['bug', 'acceptance'],
    body: `加法运算结果不正确：5 + 3 算出来是 2，应该是 8。看起来和计算器有关。

<!-- acceptance:ISS-DUP-B -->`,
  },
  {
    id: 'ISS-CLOSED',
    title: '[acceptance] 文档中的拼写错误（已修复，用于已关闭筛选）',
    labels: ['documentation', 'acceptance'],
    closeAfterCreate: true,
    body: `文档中的拼写错误已经修复，此问题仅用于验收"已关闭"筛选。

<!-- acceptance:ISS-CLOSED -->`,
  },
  {
    id: 'ISS-HIGH',
    title: '[acceptance] Windows 上自动克隆报路径错误，阻塞代码任务',
    labels: ['bug', 'priority: high', 'acceptance'],
    body: `在 Windows 上执行自动克隆时报路径错误，阻塞全部代码类任务，多台机器复现。

<!-- acceptance:ISS-HIGH -->`,
  },
  {
    id: 'ISS-WAIT',
    title: '[acceptance] 导入 2000 条记录时界面卡住约 10 秒',
    labels: ['bug', 'acceptance'],
    body: `导入 2000 条记录时界面卡住约 10 秒，之后恢复。数据量小的时候没有问题。

<!-- acceptance:ISS-WAIT -->`,
  },
];

const FOLLOWUP_ISSUE = {
  id: 'ISS-NEW',
  title: '[acceptance] 深色模式下分页按钮对比度不足',
  labels: ['bug', 'acceptance'],
  body: `列表页在深色模式下分页按钮对比度不足。

<!-- acceptance:ISS-NEW -->`,
};

const CROSS_COMMENTS = [
  {
    issueId: 'ISS-DUP-A',
    commentId: 'crossref-A',
    targets: ['ISS-DUP-B'],
    text: (nums) => `与 #${nums['ISS-DUP-B']} 描述的是同一个问题。`,
  },
  {
    issueId: 'ISS-DUP-B',
    commentId: 'crossref-B',
    targets: ['ISS-DUP-A', 'ISS-BUG'],
    text: (nums) => `与 #${nums['ISS-DUP-A']}、#${nums['ISS-BUG']} 描述的是同一个问题。`,
  },
];

const WAIT_REPLY = {
  issueId: 'ISS-WAIT',
  commentId: 'wait-reply',
  text: '补充复现记录：卡顿发生在点击“导入”按钮后的第 3 秒，控制台无报错，浏览器为 Chrome 130。',
};

const PULLS = [
  {
    id: 'PR-CLEAN',
    branch: 'acceptance/clean-feature',
    patch: 'seed-data/pr/clean-feature.patch',
    title: '[acceptance] core: 新增 sum 汇总函数',
    body: `为 core 包新增 \`sum\` 汇总函数并附带单元测试，全部现有测试保持通过。用作"无缺陷 PR"审查负对照。

<!-- acceptance:PR-CLEAN -->`,
  },
  {
    id: 'PR-BUGGY',
    branch: 'acceptance/buggy-review',
    patch: 'seed-data/pr/buggy-review.patch',
    title: '[acceptance] core: 新增 average / median 统计函数',
    body: `为 core 包新增 \`average\` 与 \`median\` 统计函数。本 PR 故意包含多处缺陷（错误除数、缺少测试、被削弱的断言、错误文档），用作审查正对照。

<!-- acceptance:PR-BUGGY -->`,
  },
  {
    id: 'PR-DRAFT',
    branch: 'acceptance/draft-experiment',
    patch: 'seed-data/pr/draft-experiment.patch',
    title: '[acceptance] (草稿) 实验性占位模块',
    draft: true,
    body: `实验性占位模块，保持草稿状态，用作 preflight readiness=draft 验收。

<!-- acceptance:PR-DRAFT -->`,
  },
  {
    id: 'PR-CI-FAIL',
    branch: 'acceptance/ci-failure',
    patch: 'seed-data/pr/ci-failure.patch',
    title: '[acceptance] 强制 CI 失败（ci 阶段与 Actions 日志验收）',
    body: `本分支携带 \`forced-failure\` workflow，push 与 PR 检查都会失败，用作 ci 阶段、Actions 日志读取与 track 阻塞验收。

<!-- acceptance:PR-CI-FAIL -->`,
  },
  {
    id: 'PR-LINKED',
    branch: 'acceptance/fix-node-app',
    patch: 'seed-data/pr/fix-node-app.patch',
    title: '[acceptance] fix: 修正 add 运算错误',
    body: `Closes #{{ISS-BUG}}

把 \`add\` 的实现从相减修正为相加，修复 #{{ISS-BUG}}。用作关联 PR 交付进度（closingIssues / track）验收。

<!-- acceptance:PR-LINKED -->`,
  },
];

function parseArgs(argv) {
  const args = { _: [] };
  for (const arg of argv) {
    if (arg.startsWith('--')) args[arg.slice(2)] = true;
    else args._.push(arg);
  }
  return args;
}

function ensureLocalRepoState() {
  const head = git(['rev-parse', '--abbrev-ref', 'HEAD'], { stdio: 'pipe' }).stdout.trim();
  if (head !== 'main') {
    console.error(`种子脚本要求本地当前分支为 main（当前：${head}）。`);
    process.exit(1);
  }
  const dirty = git(['status', '--porcelain'], { stdio: 'pipe' }).stdout.trim();
  if (dirty) {
    console.error('本地工作区有未提交改动，种子脚本拒绝继续。');
    process.exit(1);
  }
}

async function bootstrap(token, ctx) {
  await ensureRepo(token, ctx.owner, ctx.repo, ctx.isOrg, 'Acceptance fixture repository for dsh-maintainer-workbench');
  const remoteUrl = `https://github.com/${ctx.fullName}.git`;
  const remotes = git(['remote'], { stdio: 'pipe' }).stdout.trim().split(/\r?\n/);
  if (!remotes.includes('origin')) {
    git(['remote', 'add', 'origin', remoteUrl]);
  } else {
    git(['remote', 'set-url', 'origin', remoteUrl]);
  }
  const hasMain = git(['rev-parse', '--verify', 'main'], { stdio: 'pipe', allowFail: true }).status === 0;
  if (!hasMain) {
    git(['checkout', '-b', 'main']);
  }
  ensureLocalRepoState();
  console.log(`推送 main → ${ctx.fullName} …`);
  git(['-c', authHeader(token), 'push', '-u', 'origin', 'main']);
  console.log('bootstrap 完成。');
}

async function ensureLabels(token, ctx, labelNames) {
  for (const def of CUSTOM_LABELS) {
    if (!labelNames.includes(def.name)) continue;
    const r = await api(token, 'POST', `/repos/${ctx.fullName}/labels`, {
      name: def.name,
      color: def.color,
      description: def.description,
    });
    if (r.ok) console.log(`已创建标签 ${def.name}`);
    else if (r.status === 422) {
    } else {
      console.error(`创建标签 ${def.name} 失败：`, r.status, r.data);
      process.exit(1);
    }
  }
}

async function seedIssue(token, ctx, def, existingIssues, recreate) {
  const re = markerRe(def.id);
  const found = existingIssues.find((issue) => re.test(issue.body ?? ''));
  if (found) {
    if (!recreate) return found;
    const del = await api(token, 'DELETE', `/repos/${ctx.fullName}/issues/${found.number}`);
    if (!del.ok) {
      console.error(`删除旧 issue #${found.number} 失败：`, del.status, del.data);
      process.exit(1);
    }
  }
  const r = await api(token, 'POST', `/repos/${ctx.fullName}/issues`, {
    title: def.title,
    body: def.body,
    labels: def.labels,
  });
  if (!r.ok) {
    console.error(`创建 issue ${def.id} 失败：`, r.status, r.data);
    process.exit(1);
  }
  console.log(`已创建 issue ${def.id} → #${r.data.number}`);
  if (def.closeAfterCreate) {
    const closed = await api(token, 'PATCH', `/repos/${ctx.fullName}/issues/${r.data.number}`, { state: 'closed' });
    if (!closed.ok) {
      console.error(`关闭 issue #${r.data.number} 失败：`, closed.status, closed.data);
      process.exit(1);
    }
  }
  return r.data;
}

async function seedIssues(token, ctx, recreate) {
  const customNames = CUSTOM_LABELS.map((l) => l.name);
  await ensureLabels(token, ctx, customNames);
  const existing = await listAllIssues(token, ctx.fullName);
  const numbers = {};
  const results = {};
  for (const def of ISSUES) {
    const issue = await seedIssue(token, ctx, def, existing, recreate);
    numbers[def.id] = issue.number;
    results[def.id] = issue.state;
  }
  for (const cross of CROSS_COMMENTS) {
    const issueNumber = numbers[cross.issueId];
    const comments = await api(token, 'GET', `/repos/${ctx.fullName}/issues/${issueNumber}/comments?per_page=100`);
    const re = markerRe(cross.commentId);
    if (comments.ok && comments.data.some((c) => re.test(c.body ?? ''))) continue;
    const posted = await api(token, 'POST', `/repos/${ctx.fullName}/issues/${issueNumber}/comments`, {
      body: `${cross.text(numbers)}\n\n<!-- acceptance:${cross.commentId} -->`,
    });
    if (!posted.ok) {
      console.error(`发布交叉引用评论失败（${cross.commentId}）：`, posted.status, posted.data);
      process.exit(1);
    }
    console.log(`已发布交叉引用评论 ${cross.commentId}`);
  }
  return numbers;
}

function stagePatchPaths(fullPatch) {
  const text = readFileSync(fullPatch, 'utf8');
  const paths = new Set();
  for (const line of text.split('\n')) {
    const match = /^(?:---|\+\+\+) [ab]\/(.+)$/.exec(line);
    if (match) paths.add(match[1]);
  }
  if (paths.size === 0) {
    console.error(`补丁中没有可暂存路径：${fullPatch}`);
    process.exit(1);
  }
  git(['add', '-A', '--', ...paths]);
}

function applyBranchPatch(branch, patchFile, message) {
  const fullPatch = path.join(rootDir, patchFile);
  if (!existsSync(fullPatch)) {
    console.error(`补丁不存在：${patchFile}`);
    process.exit(1);
  }
  git(['checkout', '-q', 'main']);
  git(['fetch', '-q', 'origin']);
  git(['checkout', '-q', '-B', branch, 'origin/main']);
  const applied = git(['apply', '--whitespace=nowarn', fullPatch], { stdio: 'pipe', allowFail: true });
  if (applied.status !== 0) {
    console.error(`git apply 失败（${patchFile}）：`);
    console.error(applied.stderr || applied.stdout);
    git(['checkout', '-q', 'main']);
    git(['branch', '-D', branch], { stdio: 'pipe', allowFail: true });
    process.exit(1);
  }
  stagePatchPaths(fullPatch);
  git(['-c', 'user.name=Acceptance Seed', '-c', 'user.email=seed@local', 'commit', '-q', '-m', message]);
  console.log(`已创建分支 ${branch} 并提交。`);
  return true;
}

async function pushBranchAndCleanup(token, ctx, branch) {
  git(['-c', authHeader(token), 'push', '-q', '-u', 'origin', branch]);
  git(['checkout', '-q', 'main']);
  git(['branch', '-D', branch], { stdio: 'pipe' });
  console.log(`已推送分支 ${branch}`);
}

async function remoteBranchExists(token, ctx, branch) {
  const r = await api(token, 'GET', `/repos/${ctx.fullName}/git/ref/heads/${branch}`);
  return r.status === 200;
}

async function seedPulls(token, ctx, numbers) {
  const existingPulls = await listAllPulls(token, ctx.fullName);
  for (const def of PULLS) {
    let body = def.body;
    for (const [id, num] of Object.entries(numbers)) {
      body = body.replaceAll(`{{${id}}}`, String(num));
    }
    const hasBranch = await remoteBranchExists(token, ctx, def.branch);
    if (!hasBranch) {
      applyBranchPatch(def.branch, def.patch, def.title);
      await pushBranchAndCleanup(token, ctx, def.branch);
    } else {
      console.log(`分支 ${def.branch} 已存在，跳过内容创建。`);
    }
    const re = markerRe(def.id);
    const found = existingPulls.find((pr) => pr.head?.ref === def.branch);
    if (found) {
      console.log(`PR ${def.id} 已存在 → #${found.number}`);
      continue;
    }
    const r = await api(token, 'POST', `/repos/${ctx.fullName}/pulls`, {
      title: def.title,
      body,
      head: def.branch,
      base: 'main',
      draft: Boolean(def.draft),
    });
    if (!r.ok) {
      console.error(`创建 PR ${def.id} 失败：`, r.status, r.data);
      process.exit(1);
    }
    console.log(`已创建 PR ${def.id} → #${r.data.number}${def.draft ? '（草稿）' : ''}`);
  }
}

async function seedFollowup(token, ctx) {
  const manifest = readManifest();
  const numbers = manifest?.issueIds ?? {};
  const existing = await listAllIssues(token, ctx.fullName);
  const waitIssue = findSeeded(existing, 'ISS-WAIT');
  if (waitIssue) {
    const comments = await api(token, 'GET', `/repos/${ctx.fullName}/issues/${waitIssue.number}/comments?per_page=100`);
    const re = markerRe(WAIT_REPLY.commentId);
    if (comments.ok && comments.data.some((c) => re.test(c.body ?? ''))) {
      console.log(`ISS-WAIT 的补充回复已存在（#${waitIssue.number}），跳过。`);
    } else {
      const posted = await api(token, 'POST', `/repos/${ctx.fullName}/issues/${waitIssue.number}/comments`, {
        body: `${WAIT_REPLY.text}\n\n<!-- acceptance:${WAIT_REPLY.commentId} -->`,
      });
      if (!posted.ok) {
        console.error('发布 ISS-WAIT 补充回复失败：', posted.status, posted.data);
        process.exit(1);
      }
      console.log(`已向 ISS-WAIT（#${waitIssue.number}）发布补充回复。`);
    }
  } else {
    console.error('未找到 ISS-WAIT，请先运行 seed issues。');
    process.exit(1);
  }
  const newIssue = findSeeded(existing, 'ISS-NEW');
  if (newIssue) {
    console.log(`ISS-NEW 已存在 → #${newIssue.number}，跳过。`);
  } else {
    const r = await api(token, 'POST', `/repos/${ctx.fullName}/issues`, {
      title: FOLLOWUP_ISSUE.title,
      body: FOLLOWUP_ISSUE.body,
      labels: FOLLOWUP_ISSUE.labels,
    });
    if (!r.ok) {
      console.error('创建 ISS-NEW 失败：', r.status, r.data);
      process.exit(1);
    }
    console.log(`已创建 ISS-NEW → #${r.data.number}`);
    numbers['ISS-NEW'] = r.data.number;
  }
  if (manifest) {
    manifest.issueIds = { ...manifest.issueIds, ...numbers };
    manifest.followupSeededAt = new Date().toISOString();
    writeManifest(manifest);
  }
}

async function seedSecondary(token, ctx) {
  loadEnv();
  const repo = process.env.SECONDARY_REPO || 'dsh-acceptance-secondary';
  const fullName = `${ctx.owner}/${repo}`;
  const info = await ensureRepo(token, ctx.owner, repo, ctx.isOrg, 'Secondary acceptance repo for multi-repository isolation checks');
  const readme = `# ${repo}\n\n多仓库隔离验收用的次要仓库，由 seed 脚本创建。\n`;
  const existingReadme = await api(token, 'GET', `/repos/${fullName}/contents/README.md`);
  if (existingReadme.status === 404) {
    const created = await api(token, 'PUT', `/repos/${fullName}/contents/README.md`, {
      message: 'Add README',
      content: Buffer.from(readme).toString('base64'),
      branch: info.default_branch || 'main',
    });
    if (!created.ok) {
      console.error('创建 secondary README 失败：', created.status, created.data);
      process.exit(1);
    }
    console.log(`已在 ${fullName} 创建 README。`);
  }
  await ensureLabels(token, { ...ctx, fullName }, ['acceptance']);
  const existing = await listAllIssues(token, fullName);
  const defs = [
    {
      id: 'SEC-FEATURE',
      title: '[acceptance-secondary] 输出版本号信息',
      body: '希望命令行支持 `--version` 输出版本号。\n\n<!-- acceptance:SEC-FEATURE -->',
      labels: ['enhancement', 'acceptance'],
    },
    {
      id: 'SEC-CLOSED',
      title: '[acceptance-secondary] 初始化清理（已关闭）',
      body: '初始化残留文件已清理。\n\n<!-- acceptance:SEC-CLOSED -->',
      labels: ['documentation', 'acceptance'],
      closeAfterCreate: true,
    },
  ];
  const secNumbers = {};
  for (const def of defs) {
    const issue = await seedIssue(token, { ...ctx, fullName }, def, existing, false);
    secNumbers[def.id] = issue.number;
  }
  const manifest = readManifest() ?? { owner: ctx.owner, repo: ctx.repo, repoFullName: ctx.fullName };
  manifest.secondary = { repo, fullName, issueIds: secNumbers, seededAt: new Date().toISOString() };
  writeManifest(manifest);
  console.log(`secondary 种子完成：${fullName}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const command = args._[0] ?? 'all';
  const token = requireToken();
  const ctx = await resolveRepo(token);

  if (command === 'bootstrap') {
    await bootstrap(token, ctx);
    return;
  }

  if (command === 'issues') {
    const numbers = await seedIssues(token, ctx, Boolean(args.recreate));
    const manifest = readManifest() ?? {};
    manifest.owner = ctx.owner;
    manifest.repo = ctx.repo;
    manifest.repoFullName = ctx.fullName;
    manifest.issueIds = numbers;
    manifest.issuesSeededAt = new Date().toISOString();
    writeManifest(manifest);
    console.log('issue 种子完成，编号已写入 scenarios/manifest.json。');
    return;
  }

  if (command === 'prs') {
    const manifest = readManifest();
    if (!manifest?.issueIds) {
      console.error('缺少 issue 编号（scenarios/manifest.json），请先运行 seed issues。');
      process.exit(1);
    }
    await seedPulls(token, ctx, manifest.issueIds);
    const pulls = await listAllPulls(token, ctx.fullName);
    const prNumbers = {};
    for (const def of PULLS) {
      const pr = pulls.find((p) => p.head?.ref === def.branch);
      if (pr) prNumbers[def.id] = pr.number;
    }
    manifest.prIds = prNumbers;
    manifest.prsSeededAt = new Date().toISOString();
    writeManifest(manifest);
    console.log('PR 种子完成，编号已写入 scenarios/manifest.json。');
    return;
  }

  if (command === 'followup') {
    await seedFollowup(token, ctx);
    return;
  }

  if (command === 'secondary') {
    await seedSecondary(token, ctx);
    return;
  }

  if (command === 'all') {
    await bootstrap(token, ctx);
    const numbers = await seedIssues(token, ctx, Boolean(args.recreate));
    const manifest = readManifest() ?? {};
    manifest.owner = ctx.owner;
    manifest.repo = ctx.repo;
    manifest.repoFullName = ctx.fullName;
    manifest.issueIds = numbers;
    manifest.issuesSeededAt = new Date().toISOString();
    writeManifest(manifest);
    await seedPulls(token, ctx, numbers);
    const pulls = await listAllPulls(token, ctx.fullName);
    const prNumbers = {};
    for (const def of PULLS) {
      const pr = pulls.find((p) => p.head?.ref === def.branch);
      if (pr) prNumbers[def.id] = pr.number;
    }
    manifest.prIds = prNumbers;
    manifest.prsSeededAt = new Date().toISOString();
    manifest.seededAt = new Date().toISOString();
    writeManifest(manifest);
    console.log('全部种子完成：issues + PRs，编号见 scenarios/manifest.json。');
    console.log(`可选：node scripts/seed.mjs secondary ｜ node scripts/seed.mjs followup`);
    return;
  }

  console.error(`未知命令：${command}
用法：node scripts/seed.mjs [bootstrap|issues|prs|followup|secondary|all] [--recreate]`);
  process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
