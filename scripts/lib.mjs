import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const manifestPath = path.join(rootDir, 'scenarios', 'manifest.json');

export function loadEnv() {
  const envPath = path.join(rootDir, '.env');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

export function requireToken() {
  loadEnv();
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (!token) {
    console.error('缺少 GITHUB_TOKEN：请设置环境变量或复制 .env.example 为 .env 后填写。');
    process.exit(1);
  }
  return token;
}

export async function api(token, method, apiPath, body) {
  const res = await fetch(`https://api.github.com${apiPath}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'dsh-acceptance-suite-seed',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { status: res.status, ok: res.ok, data };
}

export function git(args, opts = {}) {
  const res = spawnSync('git', args, {
    cwd: opts.cwd ?? rootDir,
    stdio: opts.stdio ?? 'inherit',
    encoding: 'utf8',
  });
  if (res.status !== 0 && !opts.allowFail) {
    console.error(`git ${args.join(' ')} 失败（exit ${res.status}）`);
    if (res.stderr) console.error(res.stderr);
    process.exit(1);
  }
  return res;
}

export function authHeader(token) {
  const basic = Buffer.from(`x-access-token:${token}`).toString('base64');
  return `http.https://github.com/.extraheader=AUTHORIZATION: basic ${basic}`;
}

export async function resolveRepo(token) {
  loadEnv();
  let owner = process.env.SUITE_OWNER;
  const repo = process.env.SUITE_REPO || 'dsh-acceptance-suite';
  if (!owner) {
    const r = await api(token, 'GET', '/user');
    if (!r.ok) {
      console.error('无法读取当前 GitHub 用户：', r.status, r.data);
      process.exit(1);
    }
    owner = r.data.login;
  }
  const userMeta = await api(token, 'GET', `/users/${owner}`);
  const isOrg = userMeta.ok && userMeta.data?.type === 'Organization';
  return { owner, repo, fullName: `${owner}/${repo}`, isOrg };
}

export async function ensureRepo(token, owner, repo, isOrg, description) {
  const existing = await api(token, 'GET', `/repos/${owner}/${repo}`);
  if (existing.status === 200) return existing.data;
  if (existing.status !== 404) {
    console.error('查询仓库失败：', existing.status, existing.data);
    process.exit(1);
  }
  const endpoint = isOrg ? `/orgs/${owner}/repos` : '/user/repos';
  const created = await api(token, 'POST', endpoint, {
    name: repo,
    private: false,
    auto_init: false,
    description,
  });
  if (!created.ok) {
    console.error('创建仓库失败：', created.status, created.data);
    process.exit(1);
  }
  console.log(`已创建仓库 ${owner}/${repo}`);
  return created.data;
}

export function markerRe(id) {
  return new RegExp(`<!--\\s*acceptance:${id}\\s*-->`);
}

export async function listAllIssues(token, fullName) {
  const issues = [];
  for (let page = 1; page <= 5; page++) {
    const r = await api(token, 'GET', `/repos/${fullName}/issues?state=all&per_page=100&page=${page}`);
    if (!r.ok) {
      console.error(`读取 issue 列表失败：${r.status}`, r.data);
      process.exit(1);
    }
    for (const item of r.data) {
      if (!item.pull_request) issues.push(item);
    }
    if (r.data.length < 100) break;
  }
  return issues;
}

export async function listAllPulls(token, fullName) {
  const pulls = [];
  for (let page = 1; page <= 5; page++) {
    const r = await api(token, 'GET', `/repos/${fullName}/pulls?state=all&per_page=100&page=${page}`);
    if (!r.ok) {
      console.error(`读取 PR 列表失败：${r.status}`, r.data);
      process.exit(1);
    }
    pulls.push(...r.data);
    if (r.data.length < 100) break;
  }
  return pulls;
}

export function findSeeded(items, id, idField = 'id') {
  const re = markerRe(id);
  return items.find((item) => re.test(item.body ?? ''));
}

export function readManifest() {
  if (!existsSync(manifestPath)) return null;
  return JSON.parse(readFileSync(manifestPath, 'utf8'));
}

export function writeManifest(manifest) {
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}
