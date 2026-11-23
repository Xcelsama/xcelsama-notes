# Things Excel still needs to check or supply

Nothing in the site is invented, but these need your eye.

1. **Site address.** `siteUrl` and `githubRepo` in `site.json` assume `xcelsama-notes.pages.dev` and `Xcelsama/xcelsama-notes`. Change them if your names differ.
2. **Name.** The site is called "Xcelsama Notes". Change `name` in `site.json` to rename the whole site.
3. **Bot mentions inside your manuals.** The Fullstack Manual (PDF and Word) and the Mastery Manual contain a starter-code sample with "Frontend Developer & Bot Creator" and "Star-bot", and a Phase 3 option about a Tech-X WhatsApp channel. The site text says nothing about bots, but the downloads do. Edit those lines in your Word files, then replace the files in `public/resources/`. The PDF has to be exported again from the edited Word file.
4. **Mastery Manual.** It overlaps the Fullstack Manual. If it is an older version, delete its entry and file.
5. **Levels.** Beginner or intermediate for each project is my judgement. Change `level` in `resources.json` if you disagree.
6. **Project 4 and the practice files.** The Project 4 page links to the manual. The practice zip is your unfinished login form and a JavaScript switch example. It still has mistakes (`display:flexbox`, `rgba (` with a space, an unquoted `Friday`, an empty `script.js`). Fix them or leave them as debugging practice.
7. **Your notes and roadmap.** MY-NOTEBOOK and MY-WEB-DEVELOPMENT-ROAD-MAP are private. Make them public, or send me the content, and I will add entries.
8. **More repos.** Only Learn-how-to-use-Google-fonts is listed. Bug-Tackler was left out because it is an AI-agent project, and breadcrumbs had no content yet.
9. **Left out on purpose.** The Nematrian HTML/CSS/JavaScript tutorial text (copyright Nematrian, 2020) and the London App Brewery Web Dev Syllabus PDF belong to other people. Do not upload them unless you have permission.
10. **Journey page.** It now only says you know HTML, CSS and JavaScript, plus one sentence that many resources were made with AI (from your brief). Delete that sentence if you want.
10b. **Free sites.** W3Schools, MDN and freeCodeCamp are listed as sites you use. I read "double three code" as W3Schools and "MD" as MDN. I chose the levels and descriptions, so check them.
10c. **Old story removed.** Nothing on the site says you learned on a phone any more. Read it and change anything that is not how you would say it. Add a photo or more of your story if you want.
11. **`lesson-reference.html` was missing.** Your design spec points to it, but it did not come through. I built from the spec text alone. Send the file if you want me to match it exactly.
12. **Design parts waiting for real lesson text.** The spec has Try-it widgets, Quick checks and Common mistake cards. They need real lesson content, and I will not make any up. Send me the lessons, or the questions and wrong-versus-right examples, and I will add them.
13. **Fonts.** The spec asks for Google Fonts (Newsreader, IBM Plex Sans, JetBrains Mono). They load from Google the first time and are cached after that. If data cost matters more, say so and I will switch to the fonts already on the phone.
14. **Progress is per device.** "Mark project complete" saves in the visitor's own browser. It does not follow them to another phone.
15. **Share image.** There is no preview image for social shares yet. Send me one (1200 x 630) if you want it.
