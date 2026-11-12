#!/usr/bin/env node
// Checks that every link in data/resources.json still resolves. Zero dependencies (Node 18+ fetch).
//   node scripts/check-links.mjs [--timeout 20000]
// 2xx and 3xx are fine. 401, 403 and 429 are reported as "blocked" (the site may refuse automated requests).
// Anything else, or a network error, is "broken". Exit code 1 only if something is broken.
import { load } from './build.mjs';

export function classify(status) {
  if (status >= 200 && status < 400) return 'ok';
  if ([401, 403, 429].includes(status)) return 'blocked';
  return 'broken';
}

async function probe(url, timeout) {
  const attempt = async (method) => {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), timeout);
    try {
      const res = await fetch(url, { method, redirect: 'follow', signal: ctl.signal, headers: { 'user-agent': 'awesome-ai-governance-link-check (+https://github.com/pJijesh/awesome-ai-governance)' } });
      return res.status;
    } finally { clearTimeout(timer); }
  };
  try {
    const head = await attempt('HEAD');
    if (classify(head) === 'ok') return head;
    return await attempt('GET');
  } catch (e) {
    return `error: ${e.name === 'AbortError' ? 'timeout' : e.message}`;
  }
}

export async function main(argv) {
  const i = argv.indexOf('--timeout');
  const timeout = i >= 0 ? Number(argv[i + 1]) : 20000;
  const data = load();
  let broken = 0;
  let blocked = 0;
  for (const r of data.resources) {
    const status = await probe(r.url, timeout);
    const kind = typeof status === 'number' ? classify(status) : 'broken';
    if (kind === 'broken') broken += 1;
    if (kind === 'blocked') blocked += 1;
    if (kind !== 'ok') console.log(`${kind.toUpperCase().padEnd(7)} ${status}  ${r.name}  ${r.url}`);
  }
  console.log(`${data.resources.length} link(s): ${broken} broken, ${blocked} blocked, ${data.resources.length - broken - blocked} ok`);
  return broken ? 1 : 0;
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) main(process.argv.slice(2)).then((c) => process.exit(c));
