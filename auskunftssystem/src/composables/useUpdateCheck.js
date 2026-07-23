import { ref } from 'vue'
import { useRegisterSW } from 'virtual:pwa-register/vue'

const DATA_VERSION_KEY = 'contacts_data_version'
const APP_VERSION_KEY = 'contacts_app_version'

export const updateState = ref(null)
export const appVersion = ref(localStorage.getItem(APP_VERSION_KEY) ?? '—')
export const dataVersion = ref(localStorage.getItem(DATA_VERSION_KEY) ?? '—')

function setAppVersion(v) {
  localStorage.setItem(APP_VERSION_KEY, v)
  appVersion.value = v
}

function setDataVersion(v) {
  localStorage.setItem(DATA_VERSION_KEY, v)
  dataVersion.value = v
}

export function useUpdateCheck() {
  const { needRefresh, updateServiceWorker } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      if (!registration) return
      setInterval(() => {
        if (!navigator.onLine) return
        registration.update()
        checkDataVersion()
      }, 60 * 60 * 1000) // stündlich prüfen
    },
    onNeedRefresh() {
      triggerCheck(true)
    },
  })

  async function checkDataVersion() {
    try {
      const res = await fetch('/version.json', { cache: 'no-store' })
      if (!res.ok) return
      const remote = await res.json()
      const localApp = localStorage.getItem(APP_VERSION_KEY)
      const localData = localStorage.getItem(DATA_VERSION_KEY)

      const appUpdate = needRefresh.value || (localApp !== null && localApp !== remote.appVersion)
      const dataUpdate = localData !== null && localData !== remote.dataVersion

      if (appUpdate || dataUpdate) {
        updateState.value = {
          appUpdate,
          dataUpdate,
          remoteAppVersion: remote.appVersion,
          remoteDataVersion: remote.dataVersion,
          localAppVersion: localApp,
          localDataVersion: localData,
          applyUpdate: () => applyUpdate(remote, appUpdate),
        }
      }
    } catch {
      // offline oder Fehler — still ignorieren
    }
  }

  async function triggerCheck(appUpdateReady = false) {
    try {
      const res = await fetch('/version.json', { cache: 'no-store' })
      if (!res.ok) return
      const remote = await res.json()
      const localApp = localStorage.getItem(APP_VERSION_KEY)
      const localData = localStorage.getItem(DATA_VERSION_KEY)

      const dataUpdate = localData !== null && localData !== remote.dataVersion

      if (appUpdateReady || dataUpdate) {
        updateState.value = {
          appUpdate: appUpdateReady,
          dataUpdate,
          remoteAppVersion: remote.appVersion,
          remoteDataVersion: remote.dataVersion,
          localAppVersion: localApp,
          localDataVersion: localData,
          applyUpdate: () => applyUpdate(remote, appUpdateReady),
        }
      }
    } catch {
      // still
    }
  }

  async function applyUpdate(remote, appUpdate) {
    setDataVersion(remote.dataVersion)
    setAppVersion(remote.appVersion)
    updateState.value = null
    // Only use SW update path when a waiting SW is actually ready
    if (appUpdate && needRefresh.value) {
      await updateServiceWorker(true)
    } else {
      window.location.reload()
    }
  }

  function dismissUpdate() {
    updateState.value = null
  }

  async function initVersionTracking() {
    try {
      const res = await fetch('/version.json', { cache: 'no-store' })
      if (!res.ok) return
      const remote = await res.json()
      const localApp = localStorage.getItem(APP_VERSION_KEY)
      const localData = localStorage.getItem(DATA_VERSION_KEY)

      if (!localApp) setAppVersion(remote.appVersion)
      if (!localData) setDataVersion(remote.dataVersion)

      if (navigator.onLine) await checkDataVersion()
    } catch {
      // still
    }
  }

  return { updateState, appVersion, dataVersion, initVersionTracking, dismissUpdate }
}
