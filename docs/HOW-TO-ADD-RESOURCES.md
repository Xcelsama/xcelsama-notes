# How to add a resource

Two steps. No code changes.

1. Put the file in `public/resources/`.
2. Add one entry to `src/data/resources.json`.

Cloudflare rebuilds the site by itself after you save to GitHub.

## Add it from your phone (GitHub website)

1. Open your repository on github.com.
2. Open the `public/resources` folder, tap **Add file**, then **Upload files**, and choose your file. Tap **Commit changes**.
3. Open `src/data/resources.json`, tap the pencil icon, and paste a new entry before the final `]`. Put a comma after the entry above it. Tap **Commit changes**.
4. Wait about a minute. The new resource is live.

## Example entry

Copy this, then change every value.

```json
{
  "id": "my-css-notes",
  "title": "My CSS notes",
  "description": "One or two plain sentences on what this teaches.",
  "category": "pdfs-guides",
  "type": "pdf",
  "level": "beginner",
  "worksOffline": true,
  "files": [
    { "label": "PDF", "path": "/resources/my-css-notes.pdf" }
  ]
}
```

## Allowed values

| Field | Values |
|---|---|
| `category` | `how-to-code`, `offline-projects`, `explained-code`, `pdfs-guides` |
| `type` | `pdf`, `guide`, `project`, `repo` |
| `level` | `beginner`, `intermediate` |
| `worksOffline` | `true` or `false` |

- `id` must be unique. It becomes the page address: `/r/my-css-notes/`.
- `files` can hold more than one file. The size is added for you.
- For a GitHub repo, skip `files` and use `"type": "repo"` with `"repo": "https://github.com/Xcelsama/NAME"`. Only public repos work.
- To show a resource on the home page, add `"featured": true`.
- For a project, you can add `"build"` (a list of what to build), `"steps"` (a list) and `"answers"` (one sentence on where to find them). See Project 1 in the file.

## Check your work

If an entry has a mistake or points to a file that is not there, the build stops and Cloudflare shows the reason in its build log. The live site stays as it was.

To draft entries for new files on a computer, run this and copy the output:

```
node scripts/draft-entries.mjs
```

## File size

Cloudflare Pages allows files up to 25 MiB each. If a file is bigger, upload it to a GitHub Release and use its link as a `repo`-type entry instead.
