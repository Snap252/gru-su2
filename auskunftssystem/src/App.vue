<script setup>
import { ref, computed, onMounted } from 'vue'
import { useContacts } from './composables/useContacts.js'

const { loading, error, offline, categories, loadContacts, search } = useContacts()

const query = ref('')
const selectedCategory = ref('Alle')

const results = computed(() => search(query.value, selectedCategory.value))

onMounted(() => loadContacts())
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">

    <!-- Header -->
    <header class="bg-blue-800 text-white px-4 py-4 shadow-md">
      <h1 class="text-xl font-semibold tracking-tight">Auskunftssystem</h1>
      <p v-if="offline" class="text-xs text-yellow-300 mt-1">Offline – Daten aus Cache</p>
    </header>

    <!-- Search + Filter -->
    <div class="px-4 pt-4 pb-2 bg-white shadow-sm sticky top-0 z-10">
      <input
        v-model="query"
        type="search"
        placeholder="Name suchen..."
        autofocus
        class="w-full rounded-xl border border-gray-300 px-4 py-3 text-base outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
      />
      <div class="flex gap-2 mt-2 overflow-x-auto pb-1">
        <button
          v-for="cat in categories"
          :key="cat"
          @click="selectedCategory = cat"
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
    </div>

    <!-- Content -->
    <main class="flex-1 px-4 py-3">

      <div v-if="loading" class="text-center text-gray-400 mt-12">Laden...</div>
      <div v-else-if="error" class="text-center text-red-500 mt-12">{{ error }}</div>

      <div v-else-if="results.length === 0" class="text-center text-gray-400 mt-12">
        Keine Einträge gefunden.
      </div>

      <ul v-else class="divide-y divide-gray-100 bg-white rounded-xl shadow-sm overflow-hidden">
        <li
          v-for="contact in results"
          :key="contact.id"
          class="flex items-center justify-between px-4 py-3 hover:bg-blue-50 transition-colors"
        >
          <div>
            <p class="font-medium text-gray-900">{{ contact.name }}</p>
            <p class="text-xs text-gray-400 mt-0.5">{{ contact.category }}</p>
          </div>
          <a
            :href="`tel:${contact.phone}`"
            class="text-blue-700 font-mono text-sm hover:underline"
          >
            {{ contact.phone }}
          </a>
        </li>
      </ul>

      <p class="text-center text-xs text-gray-300 mt-4">{{ results.length }} Einträge</p>
    </main>
  </div>
</template>
