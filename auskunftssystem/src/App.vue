<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useContacts } from './composables/useContacts'
import { useUpdateCheck } from './composables/useUpdateCheck'
import UpdatePrompt from './components/UpdatePrompt.vue'
import type { Gruppe } from './types'

const { loading, error, offline, categories, loadContacts, search } = useContacts()
const { updateState, appVersion, dataVersion, initVersionTracking, dismissUpdate } = useUpdateCheck()

const query = ref('')
const selectedCategory = ref('Alle')
const selectedContact = ref<Gruppe | null>(null)
const showSuggestions = ref(false)
const activeIndex = ref(-1)
const inputEl = ref<HTMLInputElement | null>(null)
const copied = ref(false)

const suggestions = computed<Gruppe[]>(() => {
  if (!query.value.trim()) return []
  return search(query.value, selectedCategory.value).slice(0, 5)
})

interface FlagConfig {
  bg: string
  textClass: string
}

const FLAG_CONFIG: Record<string, FlagConfig> = {
  RTH:  { bg: 'background-color: lightgrey',                                                          textClass: 'text-gray-800' },
  THW:  { bg: 'background-color: lightblue',                                                           textClass: 'text-blue-900' },
  Pol:  { bg: 'background-color: green',                                                               textClass: 'text-white'    },
  nPol: { bg: 'background: linear-gradient(90deg, red 33.3%, white 33.3%, white 66.6%, orange 66.6%)', textClass: 'text-gray-900' },
  OA:   { bg: 'background-color: black',                                                               textClass: 'text-white'    },
}

interface ScopeConfig extends FlagConfig {
  label: string
}

// Short label + tricolor gradient per scope, matching the legacy gru-su
// "Gebiet" badges (Bundesweit uses the German flag colors black-red-gold).
const SCOPE_CONFIG: Record<string, ScopeConfig> = {
  Kreisweit:  { label: 'Kreis', bg: 'background-image: linear-gradient(-225deg, #00008077 33%, #de572877 33%, #de572877 66%, #4d81bc77 66%)', textClass: 'text-gray-900' },
  Landesweit: { label: 'Land',  bg: 'background-image: linear-gradient(-225deg, #00923377 33%, #ffffff77 33%, #ffffff77 66%, #e4001477 66%)', textClass: 'text-gray-900' },
  Bundesweit: { label: 'Bund',  bg: 'background-image: linear-gradient(-225deg, #00000077 33%, #dd000077 33%, #dd000077 66%, #ffcc0077 66%)', textClass: 'text-white'    },
}

const FLAG_KEYS: Array<keyof Gruppe> = ['RTH', 'nPol', 'THW', 'Pol', 'OA']
const SCOPE_KEYS: Array<keyof Gruppe> = ['Kreisweit', 'Landesweit', 'Bundesweit']

// Zusatztext can hold one of these known keys instead of free text — mapped
// to a richer HTML notice shown at the top of the card.
const HINWEIS_MAP: Record<string, string> = {
  text_adhoc_bund: '<div>Für Ad-hoc-Einsatzlagen;</div><div>Abstimmung mit TTB,</div><div>Freischaltung für alle BOS möglich</div>',
  text_adhoc_land: '<div>Für Ad-hoc-Einsatzlagen;</div><div>Abstimmung mit TTB</div>',
  text_plan_bund:  '<div>Für planbare Einsatzlagen;</div><div>Abstimmung mit TTB,</div><div>Freischaltung für alle BOS möglich</div>',
  text_plan_land:  '<div>Für planbare Einsatzlagen;</div><div>Abstimmung mit TTB</div>',
}

function hinweisHtml(contact: Gruppe): string | null {
  return (contact.Zusatztext && HINWEIS_MAP[contact.Zusatztext]) ?? null
}

function hinweisText(contact: Gruppe): string | null {
  const html = hinweisHtml(contact)
  return html ? html.replace(/<div>/g, '').replace(/<\/div>/g, ' ').trim() : null
}

function activeFlags(contact: Gruppe): string[] {
  return FLAG_KEYS.filter(f => contact[f]).map(f => f as string)
}

function activeScopes(contact: Gruppe): string[] {
  return SCOPE_KEYS.filter(s => contact[s]).map(s => s as string)
}

function selectContact(contact: Gruppe): void {
  selectedContact.value = contact
  query.value = contact.label
  showSuggestions.value = false
  activeIndex.value = -1
  inputEl.value?.blur()
}

function onInput(): void {
  selectedContact.value = null
  showSuggestions.value = true
  activeIndex.value = -1
}

function onKeydown(e: KeyboardEvent): void {
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

function onClickOutside(e: MouseEvent): void {
  if (!(e.target as Element).closest('.search-container')) {
    showSuggestions.value = false
  }
}

function clearSelection(): void {
  selectedContact.value = null
  query.value = ''
  showSuggestions.value = false
  inputEl.value?.focus()
}

async function copyValue(val: number): Promise<void> {
  try {
    await navigator.clipboard.writeText(String(val))
    copied.value = true
    setTimeout(() => (copied.value = false), 1500)
  } catch { /* clipboard not available */ }
}

const canShare = computed<boolean>(() => 'share' in navigator)

// Sharing text options
const sharingOption = ref<'Motorola' | 'Sepura'>('Motorola')

function getSharingText(contact: Gruppe, format: 'Motorola' | 'Sepura' = 'Motorola'): string {
  const flags = activeFlags(contact)
  const scopes = activeScopes(contact)

  if (format === 'Motorola') {
    const lines = [`${contact.label} (Gruppe ${contact.value})`]
    if (scopes.length) lines.push(scopes.join(', '))
    if (flags.length) lines.push(flags.join(' · '))
    if (contact.PolKW) lines.push(`Pol-KW: ${contact.PolKW}`)
    const hinweis = hinweisText(contact) ?? contact.Zusatztext
    if (hinweis) lines.push(`Hinweis: ${hinweis}`)
    return lines.join('\n')
  } else {
    // Detailed format - more comprehensive information
    const lines = [`Kontaktinformation für ${contact.label}`]
    lines.push(`========================`)
    lines.push(`Gruppe: ${contact.value}`)
    if (scopes.length) lines.push(`Geltungsbereich: ${scopes.join(', ')}`)
    if (flags.length) lines.push(`Organisationen: ${flags.join(', ')}`)
    if (contact.PolKW) lines.push(`Polizei-Kurzwahl: ${contact.PolKW}`)
    const hinweis = hinweisText(contact) ?? contact.Zusatztext
    if (hinweis) lines.push(`Zusätzliche Information: ${hinweis}`)
    lines.push(`========================`)
    lines.push(`Gesendet über BOS-Kurzwahlen App`)
    return lines.join('\n')
  }
}

async function shareContact(contact: Gruppe): Promise<void> {
  try {
    await navigator.share({
      title: contact.label,
      text: getSharingText(contact, sharingOption.value)
    })
  } catch { /* share cancelled or not available */ }
}

function whatsappUrl(contact: Gruppe): string {
  const flags = activeFlags(contact)
  const scopes = activeScopes(contact)

  // Apply the same sharing option to WhatsApp
  let lines: string[] = []
  if (sharingOption.value === 'Motorola') {
    lines = [
      `*${contact.label}*`,
      `_Gruppe ${contact.value}_`,
    ]
    if (scopes.length) lines.push(scopes.join(', '))
    if (flags.length) lines.push(flags.join(' · '))
    if (contact.PolKW) lines.push(`Pol-KW: ${contact.PolKW}`)
    const hinweis = hinweisText(contact) ?? contact.Zusatztext
    if (hinweis) lines.push(`ℹ️ ${hinweis}`)
  } else {
    // Detailed format for WhatsApp
    lines = [
      `_*Kontaktinformation*_`,
      `*${contact.label}*`,
      ``,
      `● Gruppe: _${contact.value}_`,
    ]
    if (scopes.length) lines.push(`● Geltungsbereich: ${scopes.join(', ')}`)
    if (flags.length) lines.push(`● Organisationen: ${flags.join(', ')}`)
    if (contact.PolKW) lines.push(`● Polizei-Kurzwahl: ${contact.PolKW}`)
    const hinweis = hinweisText(contact) ?? contact.Zusatztext
    if (hinweis) lines.push(`ℹ️ ${hinweis}`)
    lines.push(``, `_Gesendet über BOS-Kurzwahlen App_`)
  }

  return `https://wa.me/?text=${encodeURIComponent(lines.join('\n'))}`
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
    <header
      class="text-gray-900 px-4 shadow-md"
      style="background-color:#50e3c2; padding-top: calc(max(env(safe-area-inset-top), 1rem)); padding-bottom: 1rem;"
    >
      <h1 class="text-xl font-semibold tracking-tight">
        BOS-Kurzwahlen
      </h1>
      <div class="flex items-center gap-3 mt-1">
        <p
          v-if="offline"
          class="text-xs text-red-700"
        >
          Offline – Daten aus Cache
        </p>
        <p
          class="text-xs"
          style="color:#1a6b5a"
        >
          App: <code id="appVersion">{{ appVersion }}</code> · Daten: <code id="dataVersion">{{ dataVersion }}</code>
        </p>
      </div>
    </header>

    <!-- Search -->
    <div class="px-4 pt-4 pb-3 bg-white shadow-sm sticky top-0 z-10">
      <!-- Kategorie-Filter -->
      <div class="flex gap-2 mb-3 overflow-x-auto pb-1">
        <button
          v-for="cat in categories"
          :key="cat"
          :class="[
            'shrink-0 rounded-full px-3 py-1 text-sm font-medium transition-colors cursor-pointer',
            selectedCategory === cat
              ? 'bg-blue-700 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          ]"
          @click="selectedCategory = cat; selectedContact = null"
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
          placeholder="Gruppenname suchen…"
          autofocus
          autocomplete="off"
          class="w-full rounded-xl border border-gray-300 px-4 py-3 text-base outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          @input="onInput"
          @keydown="onKeydown"
          @focus="showSuggestions = true"
        >

        <!-- Dropdown -->
        <ul
          v-if="showSuggestions && suggestions.length > 0"
          class="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-20"
        >
          <li
            v-for="(contact, i) in suggestions"
            :key="contact.value"
            :class="[
              'flex items-center justify-between px-4 py-3 cursor-pointer transition-colors',
              i === activeIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
            ]"
            @mousedown.prevent="selectContact(contact)"
          >
            <span class="font-medium text-gray-900">{{ contact.label }}</span>
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
    <main
      id="detail-view"
      class="flex-1 px-4 py-6"
    >
      <div
        v-if="loading"
        id="loading-state"
        class="text-center text-gray-400 mt-12"
      >
        Laden…
      </div>
      <div
        v-else-if="error"
        id="error-state"
        class="text-center text-red-500 mt-12"
      >
        {{ error }}
      </div>

      <div
        v-else-if="selectedContact"
        id="contact-card"
        class="bg-white rounded-2xl shadow-sm p-6 max-w-sm mx-auto"
      >
        <!-- Header row: name & close button -->
        <div class="flex items-start justify-between gap-3">
          <h2
            id="contact-label"
            class="text-xl font-semibold text-gray-900 leading-tight"
          >
            {{ selectedContact.label }}
          </h2>
          <button
            id="contact-close-button"
            class="text-gray-400 hover:text-gray-600 text-sm cursor-pointer shrink-0"
            @click="clearSelection"
          >
            ✕ Schließen
          </button>
        </div>

        <!-- Hinweis (mapped Zusatztext) -->
        <div
          v-if="hinweisHtml(selectedContact)"
          id="contact-hinweis"
          class="border-2 border-red-600 rounded-xl px-4 py-3 mt-3 mb-4 text-sm text-red-800"
        >
          <p class="font-semibold text-red-700 mb-1">
            ⚠️ Hinweis
          </p>
          <div v-html="hinweisHtml(selectedContact)" />
        </div>

        <div
          id="contact-scopes"
          class="flex flex-wrap items-center gap-2 mt-1.5 mb-4"
        >
          <span
            v-for="scope in activeScopes(selectedContact)"
            :key="scope"
            :class="['rounded-full px-2.5 py-0.5 text-xs font-medium border border-gray-400', SCOPE_CONFIG[scope]?.textClass ?? 'text-gray-600']"
            :style="SCOPE_CONFIG[scope]?.bg ?? 'background-color: #e5e7eb'"
          >{{ SCOPE_CONFIG[scope]?.label ?? scope }}</span>
        </div>

        <!-- Group value (copyable) -->
        <button
          id="contact-group-value"
          class="w-full flex items-center justify-between bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white rounded-xl px-5 py-3 transition-colors mb-3 cursor-pointer"
          @click="copyValue(selectedContact.value)"
        >
          <span class="text-sm opacity-80">Gruppe</span>
          <span class="text-2xl font-bold tabular-nums tracking-wide">{{ selectedContact.value }}</span>
          <span class="text-sm opacity-70">{{ copied ? '✓ Kopiert' : 'Kopieren' }}</span>
        </button>

        <!-- PolKW -->
        <div
          v-if="selectedContact.PolKW"
          id="contact-polkw"
          class="flex items-center justify-between bg-gray-50 rounded-xl px-5 py-3 mb-3 text-sm"
        >
          <span class="text-gray-500">Pol-Kurzwahl</span>
          <span class="font-semibold tabular-nums text-gray-800">{{ selectedContact.PolKW }}</span>
        </div>

        <!-- Flags -->
        <div
          v-if="activeFlags(selectedContact).length > 0"
          id="contact-flags"
          class="flex flex-wrap gap-1.5 mb-4"
        >
          <span
            v-for="flag in activeFlags(selectedContact)"
            :key="flag"
            :class="['rounded-full px-2.5 py-0.5 text-xs font-medium', FLAG_CONFIG[flag]?.textClass ?? 'text-gray-600']"
            :style="FLAG_CONFIG[flag]?.bg ?? 'background-color: #e5e7eb'"
          >
            {{ flag }}
          </span>
        </div>

        <!-- Zusatztext (only when not already shown as a Hinweis above) -->
        <p
          v-if="selectedContact.Zusatztext && !hinweisHtml(selectedContact)"
          id="contact-zusatztext"
          class="text-xs text-gray-500 italic mb-4"
        >
          ℹ️ {{ selectedContact.Zusatztext }}
        </p>

        <!-- Sharing Options -->
        <div class="mb-4">
          <p class="text-sm font-medium text-gray-700 mb-2">Teilen als:</p>
          <div class="flex gap-4 mb-3">
            <label class="flex items-center flex-1/2">
              <input
                v-model="sharingOption"
                type="radio"
                value="Motorola"
                class="h-4 w-4 text-blue-600 focus:ring-blue-500"
              >
              <span class="ml-2 text-sm text-gray-700">Motorola</span>
            </label>
            <label class="flex items-center flex-1/2">
              <input
                v-model="sharingOption"
                type="radio"
                value="Sepura"
                class="h-4 w-4 text-blue-600 focus:ring-blue-500"
              >
              <span class="ml-2 text-sm text-gray-700">Sepura</span>
            </label>
          </div>
        </div>

        <!-- Share buttons -->
        <div class="flex gap-2">
          <button
            v-if="canShare"
            id="contact-share-button"
            class="flex-1 flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
            @click="shareContact(selectedContact)"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line
                x1="12"
                y1="2"
                x2="12"
                y2="15"
              />
            </svg>
            Teilen
          </button>

          <a
            id="contact-whatsapp-link"
            :href="whatsappUrl(selectedContact)"
            target="_blank"
            rel="noopener noreferrer"
            class="flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-colors"
            style="background-color: #25D366;"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
            </svg>
            WhatsApp
          </a>
        </div>
      </div>

      <div
        v-else
        id="empty-state"
        class="text-center text-gray-300 mt-16 text-sm"
      >
        Gruppenname eingeben und auswählen
      </div>
    </main>

    <!-- Update-Prompt -->
    <UpdatePrompt
      v-if="updateState"
      :state="updateState"
      @apply="updateState?.applyUpdate()"
      @dismiss="dismissUpdate()"
    />
  </div>
</template>
