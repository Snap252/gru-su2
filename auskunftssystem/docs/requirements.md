# Requirements

## Update notification

The app checks `/version.json` for a newer app build and/or newer contact
data, and prompts the user to update. Checks are triggered independently
from three places:

- on mount (`initVersionTracking`, compares `version.json` against
  `localStorage`)
- the service worker's `onNeedRefresh` callback (fires when a waiting SW
  is detected)
- an hourly poll while the SW registration is active

Requirements:

- The update prompt MUST be shown at most once per detected app/data
  version. If the user dismisses it, it must not reappear for the same
  version — only a subsequent, genuinely newer `version.json` may trigger
  it again.
- If multiple triggers fire before the user dismisses, their results MUST
  merge into a single dialog (e.g. an app update detected on mount and a
  data update detected moments later by the SW callback should be shown
  together as one prompt), not as two separate/sequential dialogs.

Implemented in `src/composables/useUpdateCheck.ts` (`checkForUpdates`,
`dismissUpdate`).
