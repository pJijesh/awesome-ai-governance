// Generates README.md from data/resources.json. Zero dependencies.
//   node scripts/build.mjs           write README.md
//   node scripts/build.mjs --check   exit 1 if README.md is out of date
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const DATA = join(ROOT, 'data', 'resources.json');
export const README = join(ROOT, 'README.md');

export const load = () => JSON.parse(readFileSync(DATA, 'utf8'));
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const byName = (a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' });

export function render(data = load()) {
  const out = [];
  out.push('# awesome-ai-governance', '');
  out.push('![awesome-ai-governance: project banner](docs/images/banner.png)', '');
  out.push('[![Checks](https://github.com/pJijesh/awesome-ai-governance/actions/workflows/test.yml/badge.svg)](https://github.com/pJijesh/awesome-ai-governance/actions/workflows/test.yml) [![Licence: MIT](https://img.shields.io/badge/licence-MIT-blue.svg)](LICENSE) ![Resources](https://img.shields.io/badge/resources-' + data.resources.length + '-informational.svg)', '');
  out.push('A short, checked list of primary sources and open-source tools for AI governance: the law, the standards, the guidance from public bodies, the security references, the incident databases and the tools for testing and fairness.', '');
  out.push('It is small on purpose. Every entry is a primary source or a tool I could open and read, with a one-sentence description that says what it is, not how good it is. If you want a long list, other lists exist; if you want somewhere to start that you can trust, start here.', '');
  out.push('## Contents', '');
  for (const c of data.categories) out.push(`- [${c.name}](#${slug(c.name)})`);
  out.push('- [How this list is kept honest](#how-this-list-is-kept-honest)', '- [Contributing](#contributing)', '- [Licence](#licence)', '');
  for (const c of data.categories) {
    out.push(`## ${c.name}`, '', c.intro, '');
    for (const r of data.resources.filter((x) => x.category === c.name).sort(byName)) out.push(`- [${r.name}](${r.url}): ${r.description}`);
    out.push('');
  }
  out.push('## How this list is kept honest', '');
  out.push('- **Source of truth is [`data/resources.json`](data/resources.json).** This README is generated from it with `node scripts/build.mjs`, and a test fails if the two disagree.');
  out.push('- **Rules are checked by tests**: https links only, no duplicates, every category known, one-sentence descriptions that end with a full stop, no promotional wording, no long dashes.');
  out.push('- **Links are checked by a script**, `node scripts/check-links.mjs`, which a scheduled workflow runs monthly. Some sites (for example ISO) refuse automated requests; the script reports those as blocked, not broken, and they need checking by hand.');
  out.push('- **No ratings, no rankings and no affiliate links.** Entries are in alphabetical order within a section.');
  out.push('- **Laws and standards change.** An entry is a place to start, not legal advice. Check the date and version of whatever you rely on.', '');
  out.push('## Contributing', '');
  out.push('Suggestions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) first: add one entry to `data/resources.json`, run `node scripts/build.mjs` and `node --test`, and open a pull request. A good entry is a primary source or an open-source tool that is maintained, with a description that is neutral and checkable.', '');
  out.push('## Licence', '');
  out.push('[MIT](LICENSE), 2026 Puliyappottammal Jijesh. The linked resources belong to their owners and have their own licences.', '');
  out.push('Maintained by [Puliyappottammal Jijesh](https://www.linkedin.com/in/pjijesh), an IT manager. [GitHub](https://github.com/pJijesh)', '');
  return out.join('\n');
}

export function main(argv) {
  const text = render();
  if (argv.includes('--check')) {
    if (existsSync(README) && readFileSync(README, 'utf8') === text) { console.log('README.md is current'); return 0; }
    console.error('README.md is out of date; run: node scripts/build.mjs');
    return 1;
  }
  writeFileSync(README, text);
  console.log('wrote README.md');
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exit(main(process.argv.slice(2)));
