import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, resolve, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { load, render, main as build, README } from '../scripts/build.mjs';
import { classify } from '../scripts/check-links.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const data = load();
const names = new Set(data.categories.map((c) => c.name));

const SKIP = new Set(['.git', 'node_modules']);
const TEXT = new Set(['.md', '.mjs', '.json', '.yml', '.yaml', '.cff', '.cjs', '']);
const files = [];
(function walk(d) {
  for (const n of readdirSync(d)) {
    if (SKIP.has(n)) continue;
    const p = join(d, n);
    statSync(p).isDirectory() ? walk(p) : files.push(p);
  }
})(ROOT);

test('every resource has the four fields and a known category', () => {
  for (const r of data.resources) {
    assert.deepEqual(Object.keys(r).sort(), ['category', 'description', 'name', 'url'], r.name);
    assert.ok(names.has(r.category), `${r.name}: unknown category ${r.category}`);
    assert.ok(r.name.length > 1 && r.name.length <= 60, r.name);
  }
});

test('every category has an intro and at least one resource', () => {
  for (const c of data.categories) {
    assert.ok(c.intro.endsWith('.'), c.name);
    assert.ok(data.resources.some((r) => r.category === c.name), `${c.name} is empty`);
  }
  assert.equal(new Set(data.categories.map((c) => c.name)).size, data.categories.length);
});

test('links are https, well formed and unique', () => {
  const seen = new Set();
  for (const r of data.resources) {
    const u = new URL(r.url);
    assert.equal(u.protocol, 'https:', r.url);
    assert.ok(!/utm_|ref=|affiliate|tag=/i.test(r.url), `tracking parameters in ${r.url}`);
    const key = u.href.replace(/\/$/, '').toLowerCase();
    assert.ok(!seen.has(key), `duplicate link ${r.url}`);
    seen.add(key);
  }
  assert.equal(new Set(data.resources.map((r) => r.name.toLowerCase())).size, data.resources.length, 'duplicate name');
});

test('descriptions are one neutral sentence that ends with a full stop', () => {
  const hype = /\b(best|leading|ultimate|amazing|awesome|powerful|revolutionary|cutting-edge|world-class|must-have|#1)\b/i;
  for (const r of data.resources) {
    assert.ok(r.description.length >= 20 && r.description.length <= 140, `${r.name}: length ${r.description.length}`);
    assert.ok(r.description.endsWith('.'), `${r.name}: needs a full stop`);
    assert.equal(r.description.slice(0, -1).includes('. '), false, `${r.name}: one sentence only`);
    assert.ok(/^[A-Z0-9]/.test(r.description), `${r.name}: start with a capital`);
    assert.ok(!hype.test(r.description), `${r.name}: promotional wording`);
  }
});

test('the maintainer section is last and no larger than a quarter of the list', () => {
  assert.equal(data.categories.at(-1).name, 'By the maintainer');
  const own = data.resources.filter((r) => r.category === 'By the maintainer');
  assert.ok(own.length * 4 <= data.resources.length);
  for (const r of own) assert.ok(r.url.startsWith('https://github.com/pJijesh/'), r.url);
});

test('README.md is generated from the data and is current', () => {
  assert.equal(readFileSync(README, 'utf8'), render(data));
  assert.equal(build(['--check']), 0);
});

test('README lists every resource once, in alphabetical order within its section', () => {
  const text = readFileSync(README, 'utf8');
  for (const r of data.resources) assert.equal(text.split(`[${r.name}](${r.url})`).length - 1, 1, r.name);
  for (const c of data.categories) {
    const section = text.split(`## ${c.name}\n`)[1].split('\n## ')[0];
    const listed = [...section.matchAll(/^- \[([^\]]+)\]/gm)].map((m) => m[1]);
    const sorted = [...listed].sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));
    assert.deepEqual(listed, sorted, c.name);
  }
});

test('README contents links point at real headings', () => {
  const text = readFileSync(README, 'utf8');
  const heads = new Set([...text.matchAll(/^## (.+)$/gm)].map((m) => m[1].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')));
  for (const m of text.matchAll(/^- \[[^\]]+\]\(#([^)]+)\)$/gm)) assert.ok(heads.has(m[1]), m[1]);
});

test('link classification: 2xx and 3xx ok, 401 403 429 blocked, the rest broken', () => {
  assert.equal(classify(200), 'ok');
  assert.equal(classify(301), 'ok');
  for (const s of [401, 403, 429]) assert.equal(classify(s), 'blocked');
  for (const s of [404, 410, 500, 503]) assert.equal(classify(s), 'broken');
});

test('no em or en dashes in any text file', () => {
  const bad = files.filter((f) => TEXT.has(extname(f)) && /[\u2013\u2014]/.test(readFileSync(f, 'utf8'))).map((f) => f.slice(ROOT.length + 1));
  assert.deepEqual(bad, []);
});

test('markdown relative links resolve', () => {
  const bad = [];
  for (const f of files.filter((x) => x.endsWith('.md'))) {
    for (const m of readFileSync(f, 'utf8').matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) {
      const t = m[1];
      if (/^[a-z]+:/.test(t) || t.startsWith('#')) continue;
      if (!existsSync(resolve(dirname(f), t.split('#')[0]))) bad.push(`${f.slice(ROOT.length + 1)} -> ${t}`);
    }
  }
  assert.deepEqual(bad, []);
});

test('package metadata, changelog and citation agree, and there are no dependencies', () => {
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
  assert.equal(pkg.dependencies, undefined);
  assert.equal(pkg.devDependencies, undefined);
  assert.match(readFileSync(join(ROOT, 'CHANGELOG.md'), 'utf8'), new RegExp(`## \\[${pkg.version.replace(/\./g, '\\.')}\\]`));
  assert.ok(readFileSync(join(ROOT, 'CITATION.cff'), 'utf8').includes(`version: ${pkg.version}`));
});

test('required files exist', () => {
  for (const f of ['LICENSE', 'CONTRIBUTING.md', 'SECURITY.md', 'CODE_OF_CONDUCT.md', 'CITATION.cff', 'CHANGELOG.md', '.github/workflows/test.yml', '.github/workflows/links.yml', '.github/dependabot.yml', '.github/PULL_REQUEST_TEMPLATE.md', 'docs/images/banner.png']) {
    assert.ok(existsSync(join(ROOT, f)), f);
  }
});
