# Editing the gala site

All the words on the page live in one file, `content/site.json`. The design lives in `src/template.html` and is not editable from the editor, so wording changes can't break the layout. `index.html`, `llms.txt` and `sitemap.xml` are generated from those two files.

There are two ways to edit:

| | Gala site editor (recommended) | Pages CMS (backup) |
|---|---|---|
| Address | `https://dinner.jewishfredericksburg.org/editor/` | https://app.pagescms.org |
| Sign in with | An "editor key" (see below), no GitHub account needed | A GitHub account with write access to the repo |
| Live preview | Yes, phone and desktop | No |
| Shows what will change before publishing | Yes | No |
| One-click return to an earlier version | Yes (History) | Via GitHub |
| Publishes | Straight away (live in 1 to 2 minutes) | Saves, then a GitHub Action rebuilds the page |

## One-time setup (site owner)

### 1. Create the editor key (about 2 minutes)
1. On GitHub: **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**.
2. Name: `Gala editor`. Expiration: 1 year (set a reminder to renew).
3. **Repository access → Only select repositories →** `chabadfredericksburgdinner`.
4. **Permissions → Repository permissions → Contents → Read and write.** (Metadata: Read is added automatically.)
5. Generate the token and send it to the client privately (not by public chat or email subject lines).

The key can only touch this one repository. To cut access at any time, delete the token on the same GitHub page.
Changes made with the key appear on GitHub under the account that created it.

### 2. First run
1. Open `/editor/` and sign in with the key. Tick "Keep me signed in on this device" on a private device only.
2. Change one small thing (for example the footer text), press **Publish**, and wait for "It's live!".
3. Open **History**, choose the earlier version, press **Publish** again to put it back.

### 3. Optional: the automatic rebuild (only needed for Pages CMS)
The workflow file `.github/workflows/build.yml` rebuilds the page when `content/site.json` is changed by anything other than the editor.
In the repository: **Settings → Actions → General → Workflow permissions → Read and write permissions**.

### 4. Optional: Pages CMS
Go to https://app.pagescms.org, sign in with GitHub, and open this repository. The configuration is already in `.pages.yml`.

## Using the editor (for the client)
- Open a section on the left, change the words, and the preview on the right updates immediately. Nothing is public until you press **Publish**.
- **Changing the date?** Open *Event details*, pick the new date and time, and press **Fill in the date for me**. It updates the date, Hebrew date, time and the start time Google uses. Please double-check the Hebrew date.
- Press **Publish**. You will see exactly what is changing, then confirm.
- Made a mistake? **History → Use this version → Publish** puts old wording back. **Discard changes** throws away anything not yet published.
- Your unpublished changes are kept on this device if you close the page by accident.

## What the editor can and cannot change
It can change every piece of text, the main photo, the band logo, the sharing picture, the Tribute Committee levels and digital tributes (add, remove, reorder), the host names, the ticket form address, and the search and sharing text.
It cannot change colors, fonts, layout, or the ticket form itself. The ticket form is edited inside TicketSpice.

## How it works (for whoever maintains it)
- `src/render.js` turns `content/site.json` into HTML. The same file runs in the editor (preview and publish) and in `build.js` (the GitHub Action), so both produce identical output.
- Publishing commits `content/site.json`, `index.html`, `llms.txt`, `sitemap.xml` (and any new picture under `uploads/`) in one commit to `main`.
- Before publishing, the editor checks that nobody else changed `content/site.json` since it was opened, and refuses to overwrite if they did.
- After publishing, it checks the live page for the `content-version` marker to tell when the change is live.
- To change the design, edit `src/template.html`, then run `node build.js`.
- Local rebuild: `node build.js` (no dependencies).
