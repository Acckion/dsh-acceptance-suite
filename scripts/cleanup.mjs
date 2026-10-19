#!/usr/bin/env node
import {
  api,
  listAllIssues,
  listAllPulls,
  readManifest,
  requireToken,
  resolveRepo,
} from './lib.mjs';

const SEEDED_BRANCHES = [
  'acceptance/clean-feature',
  'acceptance/buggy-review',
  'acceptance/draft-experiment',
  'acceptance/ci-failure',
  'acceptance/fix-node-app',
];

function parseArgs(argv) {
  const args = {};
  for (const arg of argv) {
    if (arg.startsWith('--')) args[arg.slice(2)] = true;
  }
  return args;
}

async function cleanupRepo(token, fullName, branches) {
  let closed = 0;
  const issues = await listAllIssues(token, fullName);
  for (const issue of issues) {
    if (issue.state !== 'open') continue;
    if (!/<!--\s*acceptance:/.test(issue.body ?? '')) continue;
    const r = await api(token, 'PATCH', `/repos/${fullName}/issues/${issue.number}`, { state: 'closed' });
    if (r.ok) {
      closed += 1;
      console.log(`已关闭 issue #${issue.number}`);
    } else {
      console.error(`关闭 issue #${issue.number} 失败：`, r.status, r.data);
    }
  }
  const pulls = await listAllPulls(token, fullName);
  for (const pr of pulls) {
    if (pr.state !== 'open') continue;
    if (!branches.includes(pr.head?.ref)) continue;
    const r = await api(token, 'PATCH', `/repos/${fullName}/pulls/${pr.number}`, { state: 'closed' });
    if (r.ok) console.log(`已关闭 PR #${pr.number}`);
    else console.error(`关闭 PR #${pr.number} 失败：`, r.status, r.data);
  }
  for (const branch of branches) {
    const r = await api(token, 'DELETE', `/repos/${fullName}/git/refs/heads/${branch}`);
    if (r.ok) console.log(`已删除分支 ${branch}`);
    else if (r.status === 404) console.log(`分支 ${branch} 不存在，跳过`);
    else console.error(`删除分支 ${branch} 失败：`, r.status, r.data);
  }
  console.log(`清理完成：${fullName}，关闭 issue ${closed} 条。`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const token = requireToken();
  const ctx = await resolveRepo(token);
  await cleanupRepo(token, ctx.fullName, SEEDED_BRANCHES);
  const manifest = readManifest();
  if (args.secondary && manifest?.secondary?.fullName) {
    await cleanupRepo(token, manifest.secondary.fullName, []);
  } else if (!args.secondary && manifest?.secondary) {
    console.log('secondary 仓库未清理（需要时加 --secondary）。');
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
