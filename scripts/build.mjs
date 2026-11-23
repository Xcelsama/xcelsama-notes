// Static site builder. No dependencies. Run: node scripts/build.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));

const site = read('site.json');
const resources = read('src/data/resources.json');

const TYPES = { pdf: 'PDF', repo: 'GitHub repo', project: 'Project', guide: 'Guide' };
const LEVELS = { beginner: 'Beginner', intermediate: 'Intermediate' };
const cats = Object.fromEntries(site.categories.map((c) => [c.id, c]));

// ---------- validate (fail loudly, never ship a dead link) ----------
const errors = [];
const seen = new Set();
for (const r of resources) {
  const where = `resource "${r.id ?? '?'}"`;
  for (const k of ['id', 'title', 'description', 'category', 'type', 'level']) {
    if (!r[k]) errors.push(`${where}: missing "${k}"`);
  }
  if (seen.has(r.id)) errors.push(`${where}: duplicate id`);
  seen.add(r.id);
  if (!cats[r.category]) errors.push(`${where}: unknown category "${r.category}"`);
  if (!TYPES[r.type]) errors.push(`${where}: unknown type "${r.type}"`);
  if (!LEVELS[r.level]) errors.push(`${where}: unknown level "${r.level}"`);
  if (typeof r.worksOffline !== 'boolean') errors.push(`${where}: "worksOffline" must be true or false`);
  if (r.type === 'repo' && !r.repo) errors.push(`${where}: repo type needs "repo" URL`);
  if (r.link && !/^https:\/\//.test(r.link)) errors.push(`${where}: "link" must start with https://`);
  for (const f of r.files ?? []) {
    const p = path.join(root, 'public', f.path);
    if (!fs.existsSync(p)) errors.push(`${where}: file not found: public${f.path}`);
    else f.size = fs.statSync(p).size;
  }
}
if (errors.length) {
  console.error('Build stopped:\n - ' + errors.join('\n - '));
  process.exit(1);
}

fs.rmSync(dist, { recursive: true, force: true });

// ---------- helpers ----------
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fmtSize = (b) => (b < 1024 ? `${b} B` : b < 1048576 ? `${Math.round(b / 1024)} KB` : `${(b / 1048576).toFixed(1)} MB`);
const base = (p) => p.split('/').pop();
const issueUrl = (title, body) =>
  `https://github.com/${site.githubRepo}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
const out = (rel, content) => {
  const p = path.join(dist, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
};
const sitePages = [];

// The course: every project that has a "build" list, in file order.
const course = resources.filter((r) => r.build);
const courseName = 'Offline projects';
const courseJson = JSON.stringify(course.map((r) => ({ id: r.id, title: r.title }))).replace(/</g, '\\u003c');

const NAV = [
  { href: '/library/', label: 'Library' },
  { href: '/projects/', label: 'Projects' },
  { href: '/repos/', label: 'Repos' },
  { href: '/journey/', label: 'Journey' },
  { href: '/contribute/', label: 'Contribute' },
];

const svg = (inner, s = 16, extra = '') =>
  `<svg aria-hidden="true" focusable="false" width="${s}" height="${s}" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"${extra}>${inner}</svg>`;
const icon = {
  check: (s) => svg('<path d="M3 8.5l3.2 3.2L13 4.5"/>', s),
  down: (s) => svg('<path d="M8 2v8m0 0L4.5 6.5M8 10l3.5-3.5M3 13.5h10"/>', s),
  ext: (s) => svg('<path d="M9 2h5v5M14 2 7.5 8.5M12 9.5V13a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3.5"/>', s),
  menu: (s) => svg('<path d="M2 4h12M2 8h12M2 12h12"/>', s),
  close: (s) => svg('<path d="M3.5 3.5l9 9M12.5 3.5l-9 9"/>', s),
  search: (s) => svg('<circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/>', s),
  file: (s) => svg('<path d="M4 1.5h5l3.5 3.5v9a.5.5 0 0 1-.5.5H4a.5.5 0 0 1-.5-.5v-12a.5.5 0 0 1 .5-.5zM9 1.5V5h3.5"/>', s),
  globe: (s) => svg('<circle cx="8" cy="8" r="6"/><path d="M2 8h12M8 2c2 2 2 10 0 12M8 2c-2 2-2 10 0 12"/>', s),
  left: (s) => svg('<path d="M10 3L5 8l5 5"/>', s),
  right: (s) => svg('<path d="M6 3l5 5-5 5"/>', s),
  theme: (s) => svg('<circle cx="8" cy="8" r="5.6"/><path d="M8 2.4a5.6 5.6 0 0 1 0 11.2z" fill="currentColor"/>', s),
};

const FONTS =
  'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=JetBrains+Mono&family=Newsreader:wght@600&display=swap';

function bar(extra = '') {
  return `<div class="bar" role="progressbar" aria-label="Projects completed" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"${extra}><span data-progress-bar></span></div>`;
}

function outlineHtml(currentId) {
  const items = course
    .map((r) => {
      const cur = r.id === currentId;
      return `<li><a class="lesson-link" href="/r/${r.id}/" data-id="${r.id}"${cur ? ' aria-current="page"' : ''}><span class="dot" aria-hidden="true">${icon.check(14)}</span><span class="lt"><span class="ltitle">${esc(r.title)}</span><span class="lmeta">${LEVELS[r.level]}<span class="sr" hidden> · completed</span></span></span></a></li>`;
    })
    .join('');
  return `<aside class="outline" id="outline" aria-label="Course outline">
  <div class="outline-inner">
    <button class="icon-btn close-outline" type="button" aria-label="Close outline">${icon.close(18)}</button>
    <p class="label">Course</p>
    <h2 class="outline-title">${courseName}</h2>
    <p class="progress-line"><span data-progress-text>0 of ${course.length} projects done</span><span data-progress-pct>0%</span></p>
    ${bar()}
    <ol class="lessons">${items}</ol>
  </div>
</aside>
<div class="scrim" hidden></div>`;
}

function layout({ title, desc, path: urlPath, body, noindex = false, outline = null, strip = '' }) {
  const full = urlPath === '/' ? `${site.name}: ${site.tagline}` : `${title} · ${site.name}`;
  const url = site.siteUrl + urlPath;
  if (!noindex) sitePages.push(urlPath);
  const inSection = (href) => urlPath.startsWith(href) || (href === '/projects/' && /^\/r\/project-/.test(urlPath));
  const nav = NAV.map((n) => `<a href="${n.href}"${inSection(n.href) ? ' aria-current="page"' : ''}>${n.label}</a>`).join('');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(full)}</title>
<meta name="description" content="${esc(desc)}">
${noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${url}">`}
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(site.name)}">
<meta property="og:title" content="${esc(full)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta name="twitter:card" content="summary">
<meta name="color-scheme" content="light dark">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<script>document.documentElement.classList.add('js');try{var t=localStorage.getItem('theme');if(!t)t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.theme=t}catch(e){}</script>
<link rel="stylesheet" href="/assets/style.css">
<script type="application/json" id="course-data">${courseJson}</script>
<script src="/assets/app.js" defer></script>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="site-header">
  <div class="hbar">
    ${outline ? `<button class="icon-btn menu-btn" type="button" aria-label="Open course outline" aria-controls="outline" aria-expanded="false">${icon.menu(20)}</button>` : ''}
    <a class="brand" href="/"><span class="logo" aria-hidden="true">{ }</span><span class="brand-name">${esc(site.name)}</span></a>
    <form class="search" role="search" action="/library/" method="get">
      <label class="sr" for="hs">Search resources</label>
      ${icon.search(18)}
      <input id="hs" name="q" type="search" placeholder="Search resources, e.g. flexbox" autocomplete="off">
      <kbd aria-hidden="true">/</kbd>
    </form>
    <nav class="nav" aria-label="Main">${nav}</nav>
    <button class="icon-btn search-btn" type="button" aria-label="Search" aria-expanded="false">${icon.search(20)}</button>
    <button class="icon-btn" type="button" id="theme-toggle" aria-label="Switch theme">${icon.theme(20)}</button>
  </div>
</header>
${strip}
${outline ? `<div class="shell has-outline">${outline}<div class="content">` : '<div class="shell"><div class="content">'}
<main id="main">
${body}
</main>
</div></div>
<footer class="site-footer">
  <div class="wrap">
    <p><strong>${esc(site.name)}</strong>. ${resources.length} resources, all free.</p>
    <p><a href="https://github.com/${site.githubUser}">github.com/${site.githubUser}</a> · <a href="/contribute/">Suggest a resource</a> · <a href="${issueUrl('Problem: ', 'What went wrong?\n\nPage: ' + url + '\n')}">Report a problem</a></p>
  </div>
</footer>
</body>
</html>
`;
}

// ---------- components ----------
const chips = (r) =>
  `<ul class="chips"><li class="chip">${TYPES[r.type]}</li><li class="chip">${LEVELS[r.level]}</li>${
    r.worksOffline
      ? `<li class="chip good">${icon.check(14)}Works offline</li>`
      : `<li class="chip">${icon.globe(14)}Needs internet</li>`
  }</ul>`;

const fileBtn = (f, primary) =>
  `<a class="btn${primary ? ' primary' : ''}" href="${esc(f.path)}" download>${icon.down(18)}<span>Download ${esc(f.label)}</span><span class="size">${fmtSize(f.size)}</span></a>`;

const downloads = (r) =>
  (r.files ?? []).map((f, i) => fileBtn(f, i === 0)).join('') +
  (r.repo ? `<a class="btn primary" href="${esc(r.repo)}">${icon.ext(18)}<span>Open on GitHub</span></a>` : '') +
  (r.link ? `<a class="btn primary" href="${esc(r.link)}">${icon.ext(18)}<span>Visit ${esc(r.title)}</span></a>` : '');

const card = (r) => {
  const hay = `${r.title} ${r.description} ${cats[r.category].title} ${TYPES[r.type]} ${LEVELS[r.level]}`.toLowerCase();
  return `<article class="card item" data-hay="${esc(hay)}" data-category="${r.category}" data-type="${r.type}" data-level="${r.level}" data-offline="${r.worksOffline}">
  <h3><a href="/r/${r.id}/">${esc(r.title)}</a></h3>
  ${chips(r)}
  <p>${esc(r.description)}</p>
  <div class="actions">${r.answers ? `<a class="btn" href="/r/${r.id}/">View project</a>` : downloads(r)}</div>
</article>`;
};

const courseCard = () => `<section class="card course-card" aria-labelledby="cc-t">
  <p class="label">Course</p>
  <h2 id="cc-t">${courseName}</h2>
  <p class="progress-line"><span data-progress-text>0 of ${course.length} projects done</span><span data-progress-pct>0%</span></p>
  ${bar()}
  <p class="actions"><a class="btn primary" data-continue href="/r/${course[0].id}/">Start ${esc(course[0].title.split(':')[0])}</a></p>
</section>`;

// ---------- pages ----------
const featured = resources.filter((r) => r.featured);
const fileCard = (r) => `<article class="card file">
    <span class="file-icon" aria-hidden="true">${icon[r.link ? 'globe' : 'file'](22)}</span>
    <div class="file-main"><h3><a href="/r/${r.id}/">${esc(r.title)}</a></h3><p>${esc(r.description)}</p></div>
    ${r.answers ? `<a class="btn" href="/r/${r.id}/">View project</a>` : r.link ? downloads(r) : fileBtn(r.files[0], false)}
  </article>`;
const featuredCards = featured.map(fileCard).join('');
const siteCards = resources.filter((r) => r.category === 'free-sites').map(fileCard).join('');

const folderCards = site.categories
  .filter((c) => c.id !== 'free-sites')
  .map((c) => {
    const n = resources.filter((r) => r.category === c.id).length;
    return `<a class="card folder" href="/library/?category=${c.id}"><h3>${esc(c.title)}</h3><p>${esc(c.blurb)}</p><span class="count">${n} ${n === 1 ? 'item' : 'items'}</span></a>`;
  })
  .join('');

out('index.html', layout({
  title: site.name,
  desc: site.description,
  path: '/',
  body: `<section class="wrap hero">
  <h1>Free HTML, CSS and JavaScript resources to download and keep.</h1>
  <p class="lede">I know HTML, CSS and JavaScript. These are the manuals, projects and notes I made for them. Download them once, keep them, and learn <mark>offline</mark>.</p>
  <div class="actions">
    <a class="btn primary" href="/library/">Start here</a>
    <a class="btn" href="/projects/">Browse offline projects</a>
  </div>
</section>
<section class="wrap block" aria-labelledby="h-prog">
  <h2 id="h-prog" class="sr">Your progress</h2>
  ${courseCard()}
</section>
<section class="wrap block" aria-labelledby="h-feat">
  <h2 id="h-feat">Start with these</h2>
  <div class="stack">${featuredCards}</div>
</section>
<section class="wrap block" aria-labelledby="h-fold">
  <h2 id="h-fold">Pick a folder</h2>
  <div class="grid">${folderCards}</div>
</section>
<section class="wrap block" aria-labelledby="h-sites">
  <h2 id="h-sites">Free sites I use</h2>
  <p>I use these three to help myself.</p>
  <div class="stack">${siteCards}</div>
</section>
<section class="wrap block">
  <aside class="note big" aria-labelledby="h-why">
    <p class="label" id="h-why">Why I'm giving these away</p>
    <p>These resources helped me a lot when I was coming up as a coder. Now I want to give them back. Everything here is free, and the offline projects need nothing more than a document editor like Microsoft Word and VS Code.</p>
    <p><a href="/journey/">Read how it started</a></p>
  </aside>
</section>`,
}));

const sel = (id, label, opts) =>
  `<label class="field" for="${id}"><span>${label}</span><select id="${id}"><option value="">All</option>${opts.map(([v, t]) => `<option value="${v}">${esc(t)}</option>`).join('')}</select></label>`;

out('library/index.html', layout({
  title: 'Library',
  desc: 'Search and filter every free coding manual, project and repo. Download them and learn offline.',
  path: '/library/',
  body: `<section class="wrap page">
  <h1>Library</h1>
  <p class="lede">Every resource in one place. Search, or narrow it down by folder, type and level.</p>
  <form class="card filters" id="filters" role="search" onsubmit="return false">
    <label class="field grow" for="q"><span>Search</span><input id="q" type="search" placeholder="Try &quot;flexbox&quot; or &quot;quiz&quot;" autocomplete="off"></label>
    ${sel('f-category', 'Folder', site.categories.map((c) => [c.id, c.title]))}
    ${sel('f-type', 'Type', Object.entries(TYPES))}
    ${sel('f-level', 'Level', Object.entries(LEVELS))}
    <label class="check"><input id="f-offline" type="checkbox"><span>Works offline only</span></label>
  </form>
  <p class="count-line" id="count" role="status" aria-live="polite">${resources.length} of ${resources.length} resources</p>
  <div class="stack" id="rows">${resources.map(card).join('')}</div>
  <div class="card empty" id="empty" hidden>
    <p><strong>No resources match.</strong> Remove a filter or try a shorter search.</p>
    <button class="btn" type="button" id="reset">Clear filters</button>
  </div>
</section>`,
}));

const projects = resources.filter((r) => r.category === 'offline-projects');
out('projects/index.html', layout({
  title: 'Offline projects',
  desc: 'Projects you can build with just a document editor and VS Code. The answers are in the manual.',
  path: '/projects/',
  outline: outlineHtml(null),
  body: `<div class="lesson">
  <section class="pair"><div class="pair-main">
    <h1>Offline projects</h1>
    <p class="lede">Build real things with no Wi-Fi. Download the manual once, then work through the projects in order.</p>
  </div></section>
  <section class="pair"><div class="pair-main">
    ${courseCard()}
    <h2>What you need</h2>
    <ul class="checks">${site.need.map((n) => `<li>${icon.check(18)}<span>${esc(n)}</span></li>`).join('')}</ul>
  </div></section>
  <section class="pair"><div class="pair-main">
    <h2>All offline projects</h2>
    <div class="stack">${projects.map(card).join('')}</div>
  </div></section>
</div>`,
}));

const repos = resources.filter((r) => r.type === 'repo');
out('repos/index.html', layout({
  title: 'GitHub repos',
  desc: 'Code repositories by Xcelsama with a plain line on what each one teaches.',
  path: '/repos/',
  body: `<section class="wrap page">
  <h1>GitHub repos</h1>
  <p class="lede">Code I wrote and explained, on <a href="https://github.com/${site.githubUser}">github.com/${site.githubUser}</a>.</p>
  <div class="stack">${repos.map(card).join('')}</div>
</section>`,
}));

out('journey/index.html', layout({
  title: 'My journey',
  desc: 'Who is behind Xcelsama Notes, and why these resources are free.',
  path: '/journey/',
  body: `<section class="col page">
  <h1>My journey</h1>
  <p class="lede">I'm Excel, and I go by <a href="https://github.com/${site.githubUser}">${site.githubUser}</a> on GitHub. I know HTML, CSS and JavaScript.</p>
  <p>I kept my code, notes and projects in a GitHub repository. Many of them were made with AI to help me learn. They helped me a lot, so I put them in one place and made them free for anyone to use.</p>
  <p class="actions"><a class="btn primary" href="/library/">Start with the library</a></p>
</section>`,
}));

const suggest = issueUrl('Suggestion: ', 'What would you like to see added?\n\nLink or title:\n\nWhy it would help:\n');
out('contribute/index.html', layout({
  title: 'Contribute',
  desc: 'Suggest a resource or report a problem. It opens a pre-filled GitHub issue.',
  path: '/contribute/',
  body: `<section class="col page">
  <h1>Contribute</h1>
  <p class="lede">Found a broken link, a mistake in a file, or something that should be here? Tell me on GitHub.</p>
  <p>The buttons below open a pre-filled issue. You need a free GitHub account to send it.</p>
  <p class="actions">
    <a class="btn primary" href="${suggest}">${icon.ext(18)}<span>Suggest a resource</span></a>
    <a class="btn" href="${issueUrl('Problem: ', 'What went wrong?\n\nPage or file:\n\nWhat did you expect?\n')}">${icon.ext(18)}<span>Report a problem</span></a>
  </p>
</section>`,
}));

// ---------- resource pages ----------
const crumbs = (items) =>
  `<nav class="crumbs" aria-label="Breadcrumb"><ol>${items
    .map(([label, href], i) => `<li>${href ? `<a href="${href}">${esc(label)}</a>` : `<span aria-current="page">${esc(label)}</span>`}${i < items.length - 1 ? icon.right(12) : ''}</li>`)
    .join('')}</ol></nav>`;

for (const r of resources) {
  const inCourse = course.includes(r);
  const idx = course.indexOf(r);
  const pdfs = (r.files ?? []).filter((f) => f.path.endsWith('.pdf'));
  const trail = inCourse
    ? [['Projects', '/projects/'], [r.title.split(':')[0], null]]
    : [['Library', '/library/'], [cats[r.category].title, `/library/?category=${r.category}`], [r.title, null]];

  const offlineNote = r.worksOffline
    ? `<aside class="note"><p class="label">Works offline</p><p>Once the files are downloaded you do not need Wi-Fi. You only need a document editor and VS Code.</p></aside>`
    : `<aside class="note"><p class="label">Needs internet</p><p>${esc(r.id === 'project-7-weather-app' ? 'This project fetches data from the Open-Meteo API while you test it.' : r.link ? 'This opens another website, so you need an internet connection.' : r.type === 'repo' ? 'This opens GitHub, so you need a connection to read it.' : 'Parts of this need an internet connection to set up.')}</p></aside>`;

  const prev = inCourse && idx > 0 ? course[idx - 1] : null;
  const next = inCourse && idx < course.length - 1 ? course[idx + 1] : null;
  const pager = inCourse
    ? `<nav class="pager" aria-label="Previous and next project">${
        prev ? `<a class="card pg" href="/r/${prev.id}/"><span class="label">Previous</span><span class="pt">${icon.left(16)}${esc(prev.title)}</span></a>` : '<span></span>'
      }${
        next ? `<a class="card pg next" href="/r/${next.id}/"><span class="label">Next</span><span class="pt">${esc(next.title)}${icon.right(16)}</span></a>` : `<a class="card pg" href="/projects/"><span class="label">Finished the course?</span><span class="pt">Back to all projects</span></a>`
      }</nav>`
    : '';

  const strip = inCourse
    ? `<div class="strip"><p class="progress-line"><span>${courseName} · Project ${idx + 1} of ${course.length}</span><span data-progress-pct>0%</span></p>${bar()}</div>`
    : '';

  out(`r/${r.id}/index.html`, layout({
    title: r.title,
    desc: r.description,
    path: `/r/${r.id}/`,
    outline: inCourse ? outlineHtml(r.id) : null,
    strip,
    body: `<article class="lesson">
  <section class="pair"><div class="pair-main">
    ${crumbs(trail)}
    <h1>${esc(r.title)}</h1>
    ${chips(r)}
    <p class="lede">${esc(r.description)}</p>
  </div>${offlineNote}</section>
  <section class="pair"><div class="pair-main">
    <h2 class="sr">Downloads</h2>
    <div class="actions">${downloads(r)}</div>
    ${pdfs.map((f) => `<div class="preview"><button class="btn" type="button" data-pdf="${esc(f.path)}" hidden>Preview ${esc(base(f.path))}</button><div class="pdf-slot"></div></div>`).join('')}
  </div></section>
  ${r.build ? `<section class="pair"><div class="pair-main"><div class="card outcomes"><p class="label">What you build</p><ul class="checks">${r.build.map((b) => `<li>${icon.check(18)}<span>${esc(b)}</span></li>`).join('')}</ul></div></div></section>
  <section class="pair"><div class="pair-main"><h2>What you need</h2><ul class="checks">${site.need.map((n) => `<li>${icon.check(18)}<span>${esc(n)}</span></li>`).join('')}</ul></div></section>` : ''}
  ${r.steps ? `<section class="pair"><div class="pair-main"><h2>Steps</h2><ol class="steps">${r.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol></div></section>` : ''}
  ${r.answers ? `<section class="pair"><div class="pair-main"><h2>Where to find the answers</h2><p>${esc(r.answers)}</p></div><aside class="note"><p class="label">Tip</p><p>Open the manual and use its contents page to jump to the chapter named here.</p></aside></section>` : ''}
  ${inCourse ? `<section class="pair"><div class="pair-main"><button class="btn primary complete" type="button" data-complete="${r.id}" aria-pressed="false"><span class="c-off">Mark project complete</span><span class="c-on">${icon.check(18)}Project complete</span></button><p class="sr" id="complete-msg" role="status" aria-live="polite"></p></div></section>` : ''}
  ${pager ? `<section class="pair"><div class="pair-main">${pager}</div></section>` : ''}
  <section class="pair"><div class="pair-main"><p class="report"><a href="${issueUrl('Problem with: ' + r.title, 'What went wrong?\n\nPage: ' + site.siteUrl + '/r/' + r.id + '/\n')}">Report a problem with this page</a></p></div></section>
</article>`,
  }));
}

out('404.html', layout({
  title: 'Page not found',
  desc: 'This page does not exist.',
  path: '/404.html',
  noindex: true,
  body: `<section class="col page">
  <h1>Page not found</h1>
  <p class="lede">This address does not exist. It may have moved, or the link may have a typo.</p>
  <p class="actions"><a class="btn primary" href="/library/">Go to the library</a><a class="btn" href="/">Back to home</a></p>
</section>`,
}));

// ---------- static files, sitemap, robots ----------
fs.cpSync(path.join(root, 'public'), dist, { recursive: true });
fs.mkdirSync(path.join(dist, 'assets'), { recursive: true });
for (const f of fs.readdirSync(path.join(root, 'src/assets'))) fs.copyFileSync(path.join(root, 'src/assets', f), path.join(dist, 'assets', f));
out('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitePages.map((p) => `  <url><loc>${site.siteUrl}${p}</loc></url>`).join('\n')}\n</urlset>\n`);
out('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${site.siteUrl}/sitemap.xml\n`);

console.log(`Built ${sitePages.length} pages and ${resources.length} resources into dist/`);
