import { ref, computed } from 'vue'
import Fuse from 'fuse.js'

const contacts = ref([])
const loading = ref(false)
const error = ref(null)
const offline = ref(!navigator.onLine)

window.addEventListener('online', () => (offline.value = false))
window.addEventListener('offline', () => (offline.value = true))

export function useContacts() {
  async function loadContacts() {
    loading.value = true
    error.value = null
    try {
      const res = await fetch('/data/contacts.json')
      const ct = res.headers.get('content-type') ?? ''
      // Auth redirects (SSO/VPN) yield a 200 HTML page — not JSON
      if (res.redirected || !ct.includes('json')) throw new Error('auth-redirect')
      contacts.value = await res.json()
    } catch {
      // Network failure or auth redirect → try SW cache before showing error
      const cached = await loadFromCache()
      if (cached) {
        contacts.value = cached
        offline.value = true
      } else {
        error.value = 'Daten konnten nicht geladen werden.'
      }
    } finally {
      loading.value = false
    }
  }

  async function loadFromCache() {
    try {
      const cache = await caches.open('contacts-data')
      const res = await cache.match('/data/contacts.json')
      if (!res) return null
      const ct = res.headers.get('content-type') ?? ''
      if (!ct.includes('json')) return null
      return await res.json()
    } catch {
      return null
    }
  }

  const FLAG_KEYS = ['RTH', 'nPol', 'THW', 'Pol', 'OA']
  const SCOPE_KEYS = ['Kreisweit', 'Landesweit', 'Bundesweit']

  const categories = computed(() => {
    const cats = new Set()
    for (const c of contacts.value) {
      for (const f of FLAG_KEYS) if (c[f]) cats.add(f)
    }
    return ['Alle', ...Array.from(cats).sort()]
  })

  function search(query, category) {
    let list = contacts.value

    if (category && category !== 'Alle') {
      list = list.filter((c) => c[category] === true)
    }

    if (!query.trim()) return list.slice().sort((a, b) => a.label.localeCompare(b.label))

    const fuse = new Fuse(list, { keys: ['label', 'value'], threshold: 0.35 })
    return fuse.search(query).map((r) => r.item)
  }

  return { contacts, loading, error, offline, categories, loadContacts, search }
}
