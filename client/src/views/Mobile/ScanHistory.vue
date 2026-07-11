<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api, { Scan } from '../../composables/useApi'

const route = useRoute()
const batchId = route.params.batchId as string

const scans = ref<Scan[]>([])
const loading = ref(true)
const error = ref('')

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

onMounted(async () => {
  try {
    const { data } = await api.get<Scan[]>(`/batches/${batchId}/scans`)
    scans.value = data
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to load scans'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 px-4 py-6">
    <!-- Header -->
    <header class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Scan History</h1>
      <p class="text-sm text-gray-500 mt-1">Batch #{{ batchId }}</p>
    </header>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <span class="text-gray-400">Loading scans…</span>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="rounded-lg bg-red-50 p-4 text-red-700 text-sm">
      {{ error }}
    </div>

    <!-- Empty -->
    <div v-else-if="scans.length === 0" class="rounded-lg bg-white p-8 text-center text-gray-400 shadow-sm">
      No scans found for this batch.
    </div>

    <!-- List -->
    <ul v-else class="space-y-3">
      <li
        v-for="scan in scans"
        :key="scan.id"
        class="rounded-lg bg-white p-4 shadow-sm"
      >
        <div class="flex items-center justify-between">
          <span class="font-mono text-base font-semibold text-gray-800">{{ scan.lot_id }}</span>
          <span class="text-xs text-gray-400">{{ scan.id }}</span>
        </div>
        <div class="mt-1 flex items-center gap-2 text-sm text-gray-500">
          <span>{{ formatDate(scan.scanned_at) }}</span>
          <span>·</span>
          <span>{{ formatTime(scan.scanned_at) }}</span>
        </div>
      </li>
    </ul>
  </div>
</template>
