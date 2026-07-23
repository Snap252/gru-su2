<script setup>
defineProps({
  state: { type: Object, required: true },
})
defineEmits(['apply', 'dismiss'])

function headline(state) {
  if (state.appUpdate && state.dataUpdate) return 'App & Daten aktualisiert'
  if (state.appUpdate) return 'Neue App-Version verfügbar'
  return 'Neue Daten verfügbar'
}

function body(state) {
  if (state.appUpdate && state.dataUpdate)
    return 'Es sind sowohl eine neue Anwendungsversion als auch aktualisierte Daten verfügbar.'
  if (state.appUpdate)
    return 'Es steht eine neue Version der Anwendung bereit.'
  return 'Das Telefonbuch-Verzeichnis wurde aktualisiert.'
}
</script>

<template>
  <div class="fixed bottom-0 left-0 right-0 z-50 p-4 flex justify-center">
    <div class="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-gray-200 p-5">

      <div class="flex items-start gap-3 mb-3">
        <span class="text-2xl mt-0.5">
          {{ state.appUpdate && state.dataUpdate ? '🔄' : state.appUpdate ? '⬆️' : '📋' }}
        </span>
        <div>
          <p class="font-semibold text-gray-900">{{ headline(state) }}</p>
          <p class="text-sm text-gray-500 mt-0.5">{{ body(state) }}</p>
        </div>
      </div>

      <!-- Versionsinfo -->
      <div class="bg-gray-50 rounded-xl px-4 py-3 text-xs text-gray-500 mb-4 space-y-1">
        <div v-if="state.appUpdate" class="flex justify-between">
          <span>App-Version</span>
          <span>
            <span class="line-through text-gray-400 mr-1">{{ state.localAppVersion }}</span>
            <span class="text-blue-700 font-medium">{{ state.remoteAppVersion }}</span>
          </span>
        </div>
        <div v-if="state.dataUpdate" class="flex justify-between">
          <span>Daten-Stand</span>
          <span>
            <span class="line-through text-gray-400 mr-1">{{ state.localDataVersion }}</span>
            <span class="text-blue-700 font-medium">{{ state.remoteDataVersion }}</span>
          </span>
        </div>
      </div>

      <div class="flex gap-2">
        <button
          @click="$emit('dismiss')"
          class="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Später
        </button>
        <button
          @click="$emit('apply')"
          class="flex-1 rounded-xl bg-blue-700 text-white px-4 py-2.5 text-sm font-medium hover:bg-blue-800 transition-colors"
        >
          Jetzt aktualisieren
        </button>
      </div>
    </div>
  </div>
</template>
