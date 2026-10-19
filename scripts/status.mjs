#!/usr/bin/env node
import {
  api,
  listAllIssues,
  listAllPulls,
  markerRe,
  readManifest,
  requireToken,
  resolveRepo,
} from './lib.mjs';

const EXPECTED_ISSUE_STATE = { 'ISS-CLOSED': 'closed' };

async function main() {
  const token = requireToken();
  const manifest = readManifest();
  if (!manifest) {
    console.error('未找到 scenarios/manifest.json，请先运行 seed。');
    process.exit(1);
  }
  const ctx = await resolveRepo(token);
  const checks = [];
  const record = (name, ok, detail = '') => checks.push({ name, ok, detail });

  const repoInfo = await api(token, 'GET', `/repos/${ctx.fullName}`);
  record('仓库存在', repoInfo.ok, repoInfo.ok ? ctx.fullName : `status ${repoInfo.status}`);

  const issues = await listAllIssues(token, ctx.fullName);
  const issueIds = Object.keys(manifest.issueIds ?? {});
  for (const id of issueIds) {
    const found = issues.find((issue) => markerRe(id).test(issue.body ?? ''));
    if (!found) {
      record(`issue ${id}`, false, '未找到');
      continue;
    }
    const expectedState = EXPECTED_ISSUE_STATE[id] ?? 'open';
    record(`issue ${id}`, found.state === expectedState, `#${found.number} state=${found.state}（期望 ${expectedState}）`);
  }

  const crossChecks = [
    { commentId: 'crossref-A', issueId: 'ISS-DUP-A' },
    { commentId: 'crossref-B', issueId: 'ISS-DUP-B' },
  ];
  for (const cross of crossChecks) {
    const issue = issues.find((i) => markerRe(cross.issueId).test(i.body ?? ''));
    if (!issue) {
      record(`评论 ${cross.commentId}`, false, '宿主 issue 不存在');
      continue;
    }
    const comments = await api(token, 'GET', `/repos/${ctx.fullName}/issues/${issue.number}/comments?per_page=100`);
    const ok = comments.ok && comments.data.some((c) => markerRe(cross.commentId).test(c.body ?? ''));
    record(`评论 ${cross.commentId}`, ok, `#${issue.number}`);
  }

  const pulls = await listAllPulls(token, ctx.fullName);
  for (const [id, branch] of Object.entries(manifest.prBranches ?? defaultBranches())) {
    const pr = pulls.find((p) => p.head?.ref === branch);
    if (!pr) {
      record(`PR ${id}`, false, `分支 ${branch} 无 PR`);
      continue;
    }
    const expectedDraft = id === 'PR-DRAFT';
    record(`PR ${id}`, pr.draft === expectedDraft, `#${pr.number} draft=${pr.draft}`);
  }

  if (manifest.secondary) {
    const secRepo = await api(token, 'GET', `/repos/${manifest.secondary.fullName}`);
    record('secondary 仓库存在', secRepo.ok, manifest.secondary.fullName);
    if (secRepo.ok) {
      const secIssues = await listAllIssues(token, manifest.secondary.fullName);
      for (const id of Object.keys(manifest.secondary.issueIds ?? {})) {
        const found = secIssues.find((i) => markerRe(id).test(i.body ?? ''));
        record(`secondary issue ${id}`, Boolean(found), found ? `#${found.number}` : '未找到');
      }
    }
  }

  if (manifest.followupSeededAt) {
    const wait = issues.find((i) => markerRe('ISS-WAIT').test(i.body ?? ''));
    const newIssue = issues.find((i) => markerRe('ISS-NEW').test(i.body ?? ''));
    record('followup：ISS-WAIT 补充回复', Boolean(wait) && Boolean(newIssue), newIssue ? `ISS-NEW #${newIssue.number}` : 'ISS-NEW 未创建');
  }

  let failed = 0;
  for (const check of checks) {
    const mark = check.ok ? 'PASS' : 'FAIL';
    if (!check.ok) failed += 1;
    console.log(`[${mark}] ${check.name}${check.detail ? ` — ${check.detail}` : ''}`);
  }
  console.log(`\n合计 ${checks.length} 项，失败 ${failed} 项。`);
  process.exit(failed > 0 ? 1 : 0);
}

function defaultBranches() {
  return {
    'PR-CLEAN': 'acceptance/clean-feature',
    'PR-BUGGY': 'acceptance/buggy-review',
    'PR-DRAFT': 'acceptance/draft-experiment',
    'PR-CI-FAIL': 'acceptance/ci-failure',
    'PR-LINKED': 'acceptance/fix-node-app',
  };
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
