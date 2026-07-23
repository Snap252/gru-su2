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
            'shrink-0 rounded-full px-3 py-1 text-sm font-medium transition-colors',
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
          placeholder="Name suchen..."
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
            <span class="text-xs text-gray-400 ml-2">{{ contact.category }}</span>
          </li>
        </ul>

        <p
          v-else-if="showSuggestions && query.trim() && !loading"
          class="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-sm text-gray-400 z-20"
        >
          Keine Einträge gefunden.
        </p>
      </div>
    </div>

    <!-- Detail-Ansicht nach Auswahl -->
    <main class="flex-1 px-4 py-6">
      <div v-if="loading" class="text-center text-gray-400 mt-12">Laden...</div>
      <div v-else-if="error" class="text-center text-red-500 mt-12">{{ error }}</div>

      <div v-else-if="selectedContact" class="bg-white rounded-2xl shadow-sm p-6 max-w-sm mx-auto">
        <div class="flex items-center justify-between mb-4">
          <div class="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">
            {{ selectedContact.name.charAt(0) }}
          </div>
          <button @click="clearSelection" class="text-gray-400 hover:text-gray-600 text-sm">
            ✕ Schließen
          </button>
        </div>
        <h2 class="text-xl font-semibold text-gray-900">{{ selectedContact.name }}</h2>
        <p class="text-sm text-gray-400 mt-0.5 mb-4">{{ selectedContact.category }}</p>
        <a
          :href="`tel:${selectedContact.phone}`"
          class="flex items-center gap-3 bg-blue-700 text-white rounded-xl px-5 py-3 text-base font-medium hover:bg-blue-800 transition-colors"
        >
          <span>📞</span>
          <span>{{ selectedContact.phone }}</span>
        </a>
      </div>

      <div v-else class="text-center text-gray-300 mt-16 text-sm">
        Namen eingeben und aus der Liste auswählen
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
