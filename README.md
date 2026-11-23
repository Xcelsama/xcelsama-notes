# Xcelsama Notes

Free coding resources by Excel (Xcelsama): manuals, offline projects and explained code. A fully static site with no backend, no database and no dependencies to install.

## Run it on your computer

Needs Node.js 18 or newer.

```
node scripts/build.mjs
```

The finished site is written to `dist/`. Open `dist/index.html`, or serve the folder:

```
npx serve dist
```

## What is where

| Path | What it is |
|---|---|
| `src/data/resources.json` | Every resource. The one file you edit. |
| `public/resources/` | The PDFs, Word files and zips people download. |
| `site.json` | Site name, address, GitHub repo, folder names. |
| `src/assets/` | `style.css` (the design tokens are at the top) and `app.js` (theme, search, progress, PDF preview). |
| `scripts/build.mjs` | Builds the pages into `dist/`. |
| `docs/` | Step-by-step guides and the to-do list. |

## Add a resource

See [docs/HOW-TO-ADD-RESOURCES.md](docs/HOW-TO-ADD-RESOURCES.md).

## Deploy

See [docs/DEPLOY-CLOUDFLARE.md](docs/DEPLOY-CLOUDFLARE.md). Settings in short: framework preset None, build command `node scripts/build.mjs`, output directory `dist`.

## Still to do

See [docs/TODO.md](docs/TODO.md).
