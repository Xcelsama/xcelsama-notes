# Deploy to Cloudflare Pages

## 1. Put the project on GitHub

Unzip `xcelsama-notes.zip` on your computer first. GitHub does not unzip files for you.

1. On github.com, tap **New repository**. Name it `xcelsama-notes`. Choose **Public**. Create it.
2. Tap **uploading an existing file**.
3. Drag in everything from inside the unzipped folder (the files and folders, not the zip itself). Make sure the `public` folder, `src` folder and `scripts` folder go in with their contents.
4. Tap **Commit changes**.

If you pick a different repository name, edit `githubRepo` in `site.json` so the suggestion links point to the right place.

## 2. Connect Cloudflare Pages

1. In the Cloudflare dashboard, open **Workers & Pages**.
2. Tap **Create application**, then **Pages**, then **Connect to Git**.
3. Choose GitHub, then select the `xcelsama-notes` repository. Tap **Begin setup**.
4. Production branch: `main`.
5. Fill in these settings:

| Setting | Value |
|---|---|
| Framework preset | None |
| Build command | `node scripts/build.mjs` |
| Build output directory | `dist` |

6. Tap **Save and Deploy**.

The project includes a `.node-version` file (22). If the build log complains about the Node version, add an environment variable named `NODE_VERSION` with the value `22`.

## 3. Get your address

When the first deploy finishes, tap **Continue to project**. Your address is shown at the top, like `xcelsama-notes.pages.dev`.

If Cloudflare gave it a different name (for example `xcelsama-notes-7x2.pages.dev` because the name was taken), open `site.json` on GitHub and change `siteUrl` to your real address. This fixes the sitemap and share links. Cloudflare redeploys by itself.

## 4. Redeploy after adding resources

You do not need to do anything. Every change you save to GitHub triggers a new build. See `HOW-TO-ADD-RESOURCES.md`.

## Limits (free plan)

- 20,000 files per site.
- 25 MiB per file.
- 500 builds per month.

Source: Cloudflare Pages limits page, checked 23 Nov 2026.
