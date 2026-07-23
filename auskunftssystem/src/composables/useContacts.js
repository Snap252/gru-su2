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
      contacts.value = await res.json()
    } catch (e) {
      error.value = 'Daten konnten nicht geladen werden.'
    } finally {
      loading.value = false
    }
  }

  const categories = computed(() => {
    const cats = new Set(contacts.value.map((c) => c.category))
    return ['Alle', ...Array.from(cats).sort()]
  })

  function search(query, category) {
    let list = contacts.value

    if (category && category !== 'Alle') {
      list = list.filter((c) => c.category === category)
    }

    if (!query.trim()) return list.slice().sort((a, b) => a.name.localeCompare(b.name))

    const fuse = new Fuse(list, { keys: ['name', 'valueStr'], threshold: 0.35 })
    return fuse.search(query).map((r) => r.item)
  }

  return { contacts, loading, error, offline, categories, loadContacts, search }
}
