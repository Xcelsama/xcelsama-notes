# Deploy to Cloudflare Pages

## 1. Put the project on GitHub

Unzip `xcelsama-notes.zip` on your computer first. GitHub does not unzip files for you.

1. On github.com, tap **New repository**. Name it `xcelsama-notes`. Choose **Public**. Create it.
2. Tap **uploading an existing file**.
3. Drag in everything from inside the unzipped folder (the files and folders, not the zip itself). Make sure the `public` folder, `src` folder and `scripts` folder go in with their contents.
4. Tap **Commit changes**.

If you pick a different repository name, edit `githubRepo` in `site.json` so the suggestion links point to the right place.

## 2. Connect Cloudflare

Cloudflare's "Create application" screen now starts with Workers. Both routes work for this site. The repo includes `wrangler.jsonc`, which tells Cloudflare to build the site and serve the `dist` folder.

**Workers route (what you get by default)**

1. In the Cloudflare dashboard, open **Workers & Pages**, then **Create application**, then connect your GitHub repository `xcelsama-notes`.
2. Use these settings:

| Setting | Value |
|---|---|
| Build command | `node scripts/build.mjs` |
| Deploy command | `npx wrangler deploy` |
| Root directory | leave empty |

3. Save and deploy. The name in `wrangler.jsonc` (`xcelsama-notes`) must match your project name in Cloudflare. If your project has a different name, change `name` in `wrangler.jsonc` on GitHub.

Your address ends in `.workers.dev`.

**Pages route (gives a `.pages.dev` address)**

1. In **Workers & Pages**, tap **Create application**, then **Pages**, then **Connect to Git**.
2. Pick the repository. Framework preset: None. Build command: `node scripts/build.mjs`. Build output directory: `dist`.

The project includes a `.node-version` file (22).

## 3. Get your address

When the first deploy finishes, tap **Continue to project**. Your address is shown at the top, like `xcelsama-notes.pages.dev` (Pages route) or `xcelsama-notes.YOURNAME.workers.dev` (Workers route).

If Cloudflare gave it a different name (for example `xcelsama-notes-7x2.pages.dev` because the name was taken), open `site.json` on GitHub and change `siteUrl` to your real address. This fixes the sitemap and share links. Cloudflare redeploys by itself.

## 4. Redeploy after adding resources

You do not need to do anything. Every change you save to GitHub triggers a new build. See `HOW-TO-ADD-RESOURCES.md`.

## Limits (free plan)

- 20,000 files per site.
- 25 MiB per file.
- 500 builds per month.

Source: Cloudflare Pages limits page, checked 23 Nov 2026.
