import { ref } from 'vue'
import { useRegisterSW } from 'virtual:pwa-register/vue'
import type { UpdateState } from '../types'

const DATA_VERSION_KEY = 'contacts_data_version'
const APP_VERSION_KEY = 'contacts_app_version'

// Module-level refs so values persist across hot-reloads and are shared
export const updateState = ref<UpdateState | null>(null)
export const appVersion = ref<string>(localStorage.getItem(APP_VERSION_KEY) ?? '—')
export const dataVersion = ref<string>(localStorage.getItem(DATA_VERSION_KEY) ?? '—')

// Remote versions the user has already dismissed a prompt for, so a second
// trigger (SW onNeedRefresh vs. version.json poll) doesn't re-open the
// dialog for the same update.
let dismissedAppVersion: string | null = null
let dismissedDataVersion: string | null = null

interface VersionJson {
  appVersion: string
  dataVersion: string
}

function setAppVersion(v: string): void {
  localStorage.setItem(APP_VERSION_KEY, v)
  appVersion.value = v
}

function setDataVersion(v: string): void {
  localStorage.setItem(DATA_VERSION_KEY, v)
  dataVersion.value = v
}

async function fetchVersionJson(): Promise<VersionJson | null> {
  try {
    const res = await fetch('/version.json', { cache: 'no-store' })
    if (!res.ok) return null
    return await res.json() as VersionJson
  } catch {
    return null
  }
}

export function useUpdateCheck() {
  const { needRefresh, offlineReady, updateServiceWorker } = useRegisterSW({
    onRegisteredSW(_swUrl: string, registration: ServiceWorkerRegistration | undefined) {
      if (!registration) return
      // Check every 10 minutes for updates
      setInterval(() => {
        if (!navigator.onLine) return
        registration.update()
        void checkForUpdates()
      }, 10 * 60 * 1000)
    },
    onNeedRefresh() {
      void checkForUpdates(true)
    },
    onOfflineReady() {
      // SW installed and ready — app can work offline
    },
  })

  async function checkForUpdates(appUpdateReady = false): Promise<void> {
    const remote = await fetchVersionJson()
    const localApp = localStorage.getItem(APP_VERSION_KEY)
    const localData = localStorage.getItem(DATA_VERSION_KEY)
    // Fall back the same way the dialog displays these, so a transient
    // fetch failure (remote === null) can't desync the dismissal check below.
    const remoteAppVersion = remote?.appVersion ?? localApp ?? '—'
    const remoteDataVersion = remote?.dataVersion ?? localData ?? '—'

    // Require a successful fetch for the version-diff signal — otherwise a
    // transient /version.json failure makes remote.appVersion undefined,
    // which never equals localApp and falsely looks like a new version.
    let appUpdate = appUpdateReady || needRefresh.value ||
      (remote !== null && localApp !== null && localApp !== remote.appVersion)
    let dataUpdate = remote !== null && localData !== null && localData !== remote.dataVersion

    // Don't re-surface a prompt for a version the user already dismissed —
    // this composable is triggered independently from mount (version.json
    // diff), the hourly poll, and the service worker's onNeedRefresh, and
    // without this guard a dismissed update reappears as soon as the next
    // trigger fires.
    if (appUpdate && remoteAppVersion === dismissedAppVersion) appUpdate = false
    if (dataUpdate && remoteDataVersion === dismissedDataVersion) dataUpdate = false

    if (appUpdate || dataUpdate) {
      // Merge with any already-visible prompt instead of replacing it, so
      // two triggers firing close together (e.g. version.json check on
      // mount, then SW onNeedRefresh moments later) combine into a single
      // dialog rather than the second overwriting/reopening the first.
      appUpdate = appUpdate || updateState.value?.appUpdate === true
      dataUpdate = dataUpdate || updateState.value?.dataUpdate === true

      updateState.value = {
        appUpdate,
        dataUpdate,
        remoteAppVersion,
        remoteDataVersion,
        localAppVersion: localApp,
        localDataVersion: localData,
        applyUpdate: () => void applyUpdate(remote, appUpdate),
      }
    }
  }

  async function applyUpdate(remote: VersionJson | null, appUpdate: boolean): Promise<void> {
    if (remote) {
      setDataVersion(remote.dataVersion)
      setAppVersion(remote.appVersion)
    }
    updateState.value = null
    if (appUpdate && needRefresh.value) {
      await updateServiceWorker(true)
    } else {
      window.location.reload()
    }
  }

  function dismissUpdate(): void {
    if (updateState.value?.appUpdate) dismissedAppVersion = updateState.value.remoteAppVersion
    if (updateState.value?.dataUpdate) dismissedDataVersion = updateState.value.remoteDataVersion
    updateState.value = null
  }

  async function initVersionTracking(): Promise<void> {
    const remote = await fetchVersionJson()

    if (remote) {
      const localApp = localStorage.getItem(APP_VERSION_KEY)
      const localData = localStorage.getItem(DATA_VERSION_KEY)

      // First visit — seed localStorage so versions display immediately
      if (!localApp) setAppVersion(remote.appVersion)
      if (!localData) setDataVersion(remote.dataVersion)

      // Check if stale
      if (navigator.onLine) await checkForUpdates()
    }
    // If offline and localStorage has values, appVersion/dataVersion refs already show them
  }

  return { updateState, appVersion, dataVersion, offlineReady, initVersionTracking, dismissUpdate }
}
