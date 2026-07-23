---
description: Bump the app version (patch/minor/major) and stage version files
---

Bump the version for the Auskunftssystem app. Steps:

1. Determine the bump type from the user's arguments (patch | minor | major). Default to `patch` if not specified.
2. In `auskunftssystem/`, run: `npm version <type> --no-git-tag-version`
3. Read the new version from `auskunftssystem/package.json`
4. Update `auskunftssystem/public/version.json` → set `appVersion` to the new version. Do NOT change `dataVersion`.
5. Stage the changed files: `auskunftssystem/package.json`, `auskunftssystem/package-lock.json`, `auskunftssystem/public/version.json`
6. Report the new version to the user.

Notes:
- The pre-commit hook (`.githooks/pre-commit`) auto-bumps patch on every commit, so manual use is mainly for minor/major releases.
- To also update the data version, run `node auskunftssystem/scripts/fetch-contacts.js` first.
