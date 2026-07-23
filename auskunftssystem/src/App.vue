<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useContacts } from './composables/useContacts.js'
import { useUpdateCheck } from './composables/useUpdateCheck.js'
import UpdatePrompt from './components/UpdatePrompt.vue'

const { loading, error, offline, categories, loadContacts, search } = useContacts()
const { updateState, appVersion, dataVersion, initVersionTracking, dismissUpdate } = useUpdateCheck()

const query = ref('')
const selectedCategory = ref('Alle')
const selectedContact = ref(null)
const showSuggestions = ref(false)
const activeIndex = ref(-1)
const inputEl = ref(null)
const copied = ref(false)

const suggestions = computed(() => {
  if (!query.value.trim()) return []
  return search(query.value, selectedCategory.value).slice(0, 10)
})

function selectContact(contact) {
  selectedContact.value = contact
  query.value = contact.name
  showSuggestions.value = false
  activeIndex.value = -1
}

function onInput() {
  selectedContact.value = null
  showSuggestions.value = true
  activeIndex.value = -1
}

function onKeydown(e) {
  if (!showSuggestions.value || suggestions.value.length === 0) return
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    activeIndex.value = Math.min(activeIndex.value + 1, suggestions.value.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    activeIndex.value = Math.max(activeIndex.value - 1, 0)
  } else if (e.key === 'Enter' && activeIndex.value >= 0) {
    e.preventDefault()
    selectContact(suggestions.value[activeIndex.value])
  } else if (e.key === 'Escape') {
    showSuggestions.value = false
  }
}

function onClickOutside(e) {
  if (!e.target.closest('.search-container')) {
    showSuggestions.value = false
  }
}

function clearSelection() {
  selectedContact.value = null
  query.value = ''
  showSuggestions.value = false
  inputEl.value?.focus()
}

async function copyValue(val) {
  try {
    await navigator.clipboard.writeText(String(val))
    copied.value = true
    setTimeout(() => (copied.value = false), 1500)
  } catch {}
}

const canShare = computed(() => 'share' in navigator)

async function shareContact(contact) {
  const lines = [`${contact.name} (Gruppe ${contact.value})`]
  if (contact.scope) lines.push(contact.scope)
  if (contact.flags.length) lines.push(contact.flags.join(' · '))
  if (contact.polKW) lines.push(`Pol-KW: ${contact.polKW}`)
  try {
    await navigator.share({ title: contact.name, text: lines.join('\n') })
  } catch {}
}

function whatsappUrl(contact) {
  const lines = [
    `*${contact.name}*`,
    `_Gruppe ${contact.value}_`,
  ]
  if (contact.scope) lines.push(contact.scope)
  if (contact.flags.length) lines.push(contact.flags.map(f => flagEmoji(f) + ' ' + f).join('  '))
  if (contact.polKW) lines.push(`Pol-KW: ${contact.polKW}`)
  if (contact.zusatztext) lines.push(`ℹ️ ${contact.zusatztext}`)
  return `https://wa.me/?text=${encodeURIComponent(lines.join('\n'))}`
}

const FLAG_CONFIG = {
  RTH: { label: 'RTH', color: 'bg-red-100 text-red-700', emoji: '🚁' },
  THW: { label: 'THW', color: 'bg-blue-100 text-blue-800', emoji: '🏗️' },
  Pol: { label: 'Pol', color: 'bg-green-100 text-green-700', emoji: '👮' },
  nPol: { label: 'nPol', color: 'bg-gray-100 text-gray-600', emoji: '🚒' },
  ÖA: { label: 'ÖA', color: 'bg-orange-100 text-orange-700', emoji: '⚡' },
}

function flagEmoji(flag) {
  return FLAG_CONFIG[flag]?.emoji ?? '•'
}

onMounted(() => {
  loadContacts()
  initVersionTracking()
  document.addEventListener('click', onClickOutside)
})
onBeforeUnmount(() => document.removeEventListener('click', onClickOutside))
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">

    <!-- Header -->
    <header class="bg-blue-800 text-white px-4 py-4 shadow-md">
      <h1 class="text-xl font-semibold tracking-tight">Auskunftssystem</h1>
      <div class="flex items-center gap-3 mt-1">
        <p v-if="offline" class="text-xs text-yellow-300">Offline – Daten aus Cache</p>
        <p class="text-xs text-blue-300">App {{ appVersion }} · Daten {{ dataVersion }}</p>
      </div>
    </header>

    <!-- Search -->
    <div class="px-4 pt-4 pb-3 bg-white shadow-sm sticky top-0 z-10">

      <!-- Kategorie-Filter -->
      <div class="flex gap-2 mb-3 overflow-x-auto pb-1">
        <button
          v-for="cat in categories"
          :key="cat"
          @click="selectedCategory = cat; selectedContact = null"
          :class="[
            'shrink-0 rounded-full px-3 py-1 text-sm font-medium transition-colors cursor-pointer',
            selectedCategory === cat
              ? 'bg-blue-700 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          ]"
        >
          {{ cat }}
        </button>
      </div>

      <!-- Suggest-Suchfeld -->
      <div class="search-container relative">
        <input
          ref="inputEl"
          v-model="query"
          type="search"
          placeholder="Gruppe suchen (Name oder Nummer)…"
          autofocus
          autocomplete="off"
          class="w-full rounded-xl border border-gray-300 px-4 py-3 text-base outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          @input="onInput"
          @keydown="onKeydown"
          @focus="showSuggestions = true"
        />

        <!-- Dropdown -->
        <ul
          v-if="showSuggestions && suggestions.length > 0"
          class="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-20"
        >
          <li
            v-for="(contact, i) in suggestions"
            :key="contact.id"
            @mousedown.prevent="selectContact(contact)"
            :class="[
              'flex items-center justify-between px-4 py-3 cursor-pointer transition-colors',
              i === activeIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
            ]"
          >
            <span class="font-medium text-gray-900">{{ contact.name }}</span>
            <span class="text-xs text-gray-400 ml-2 tabular-nums">{{ contact.value }}</span>
          </li>
        </ul>

        <p
          v-else-if="showSuggestions && query.trim() && !loading"
          class="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-sm text-gray-400 z-20"
        >
          Keine Gruppen gefunden.
        </p>
      </div>
    </div>

    <!-- Detail-Ansicht -->
    <main class="flex-1 px-4 py-6">
      <div v-if="loading" class="text-center text-gray-400 mt-12">Laden…</div>
      <div v-else-if="error" class="text-center text-red-500 mt-12">{{ error }}</div>

      <div v-else-if="selectedContact" class="bg-white rounded-2xl shadow-sm p-6 max-w-sm mx-auto">
        <!-- Header row -->
        <div class="flex items-start justify-between mb-4">
          <div class="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg shrink-0">
            📻
          </div>
          <button @click="clearSelection" class="text-gray-400 hover:text-gray-600 text-sm cursor-pointer">
            ✕ Schließen
          </button>
        </div>

        <!-- Name & category -->
        <h2 class="text-xl font-semibold text-gray-900 leading-tight">{{ selectedContact.name }}</h2>
        <div class="flex flex-wrap items-center gap-2 mt-1.5 mb-4">
          <span class="text-sm text-gray-500">{{ selectedContact.category }}</span>
          <span v-if="selectedContact.scope" class="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
            {{ selectedContact.scope }}
          </span>
        </div>

        <!-- Group value (copyable) -->
        <button
          @click="copyValue(selectedContact.value)"
          class="w-full flex items-center justify-between bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white rounded-xl px-5 py-3 transition-colors mb-3 cursor-pointer"
        >
          <span class="text-sm opacity-80">Gruppe</span>
          <span class="text-2xl font-bold tabular-nums tracking-wide">{{ selectedContact.value }}</span>
          <span class="text-sm opacity-70">{{ copied ? '✓ Kopiert' : 'Kopieren' }}</span>
        </button>

        <!-- PolKW -->
        <div v-if="selectedContact.polKW" class="flex items-center justify-between bg-gray-50 rounded-xl px-5 py-3 mb-3 text-sm">
          <span class="text-gray-500">Pol-Kurzwahl</span>
          <span class="font-semibold tabular-nums text-gray-800">{{ selectedContact.polKW }}</span>
        </div>

        <!-- Flags -->
        <div v-if="selectedContact.flags.length > 0" class="flex flex-wrap gap-1.5 mb-4">
          <span
            v-for="flag in selectedContact.flags"
            :key="flag"
            :class="['rounded-full px-2.5 py-0.5 text-xs font-medium', FLAG_CONFIG[flag]?.color ?? 'bg-gray-100 text-gray-600']"
          >
            {{ FLAG_CONFIG[flag]?.emoji ?? '' }} {{ flag }}
          </span>
        </div>

        <!-- Zusatztext -->
        <p v-if="selectedContact.zusatztext" class="text-xs text-gray-500 italic mb-4">
          ℹ️ {{ selectedContact.zusatztext }}
        </p>

        <!-- Share buttons -->
        <div class="flex gap-2">
          <button
            v-if="canShare"
            @click="shareContact(selectedContact)"
            class="flex-1 flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
              <polyline points="16 6 12 2 8 6"/>
              <line x1="12" y1="2" x2="12" y2="15"/>
            </svg>
            Teilen
          </button>

          <a
            :href="whatsappUrl(selectedContact)"
            target="_blank"
            rel="noopener noreferrer"
            class="flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-colors"
            style="background-color: #25D366;"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
            </svg>
            WhatsApp
          </a>
        </div>
      </div>

      <div v-else class="text-center text-gray-300 mt-16 text-sm">
        Namen oder Gruppennummer eingeben und auswählen
      </div>
    </main>

    <!-- Update-Prompt -->
    <UpdatePrompt
      v-if="updateState"
      :state="updateState"
      @apply="updateState.applyUpdate()"
      @dismiss="dismissUpdate()"
    />
  </div>
</template>
