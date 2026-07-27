import { ref, computed } from 'vue'
import Fuse from 'fuse.js'
import type { Gruppe } from '../types'

const contacts = ref<Gruppe[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const offline = ref(!navigator.onLine)

window.addEventListener('online', () => (offline.value = false))
window.addEventListener('offline', () => (offline.value = true))

const FLAG_KEYS: Array<keyof Gruppe> = ['RTH', 'nPol', 'THW', 'Pol', 'OA']

export function useContacts() {
  async function loadContacts(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const res = await fetch('/data/contacts.json')
      const ct = res.headers.get('content-type') ?? ''
      // Auth redirects (SSO/VPN) yield a 200 HTML page — not JSON
      if (res.redirected || !ct.includes('json')) throw new Error('auth-redirect')
      contacts.value = await res.json() as Gruppe[]
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

  async function loadFromCache(): Promise<Gruppe[] | null> {
    try {
      const cache = await caches.open('contacts-data')
      const res = await cache.match('/data/contacts.json')
      if (!res) return null
      const ct = res.headers.get('content-type') ?? ''
      if (!ct.includes('json')) return null
      return await res.json() as Gruppe[]
    } catch {
      return null
    }
  }

  const categories = computed<string[]>(() => {
    const cats = new Set<string>()
    for (const c of contacts.value) {
      for (const f of FLAG_KEYS) if (c[f]) cats.add(f as string)
    }
    return ['Alle', ...Array.from(cats).sort()]
  })

  function search(query: string, category: string): Gruppe[] {
    let list = contacts.value

    if (category && category !== 'Alle') {
      list = list.filter((c) => c[category as keyof Gruppe] === true)
    }

    if (!query.trim()) return list.slice().sort((a, b) => a.label.localeCompare(b.label))

    const fuse = new Fuse(list, { keys: ['label', 'value'], threshold: 0.35 })
    return fuse.search(query).map((r) => r.item)
  }

  return { contacts, loading, error, offline, categories, loadContacts, search }
}
