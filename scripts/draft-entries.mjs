// Lists files in public/resources/ that have no entry yet and prints draft entries.
// Run: node scripts/draft-entries.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const resources = JSON.parse(fs.readFileSync(path.join(root, 'src/data/resources.json'), 'utf8'));
const used = new Set(resources.flatMap((r) => (r.files ?? []).map((f) => f.path)));
const typeFor = { '.pdf': 'pdf', '.docx': 'guide', '.doc': 'guide', '.zip': 'project', '.md': 'guide', '.txt': 'guide' };

const fresh = fs.readdirSync(path.join(root, 'public/resources')).filter((n) => !used.has('/resources/' + n));
if (!fresh.length) {
  console.log('Every file in public/resources/ already has an entry.');
  process.exit(0);
}
const drafts = fresh.map((n) => {
  const id = n.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return {
    id,
    title: '[TODO: Excel to write a title]',
    description: '[TODO: Excel to write one or two sentences]',
    category: 'pdfs-guides',
    type: typeFor[path.extname(n).toLowerCase()] ?? 'guide',
    level: 'beginner',
    worksOffline: true,
    files: [{ label: path.extname(n).slice(1).toUpperCase(), path: '/resources/' + n }],
  };
});
console.log(`${fresh.length} file(s) without an entry. Copy these into src/data/resources.json and fill in the TODO lines:\n`);
console.log(JSON.stringify(drafts, null, 2));
