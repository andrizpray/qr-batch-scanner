<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api, { type Batch, type Scan } from '../../composables/useApi'

const route = useRoute()
const router = useRouter()

const batchId = route.params.id as string

const batch = ref<Batch | null>(null)
const scans = ref<Scan[]>([])
const loading = ref(true)
const deleting = ref(false)
const error = ref('')

async function fetchData() {
  try {
    const [batchRes, scansRes] = await Promise.all([
      api.get<Batch>(`/batches/${batchId}`),
      api.get<Scan[]>(`/scans/batch/${batchId}`),
    ])
    batch.value = batchRes.data
    scans.value = scansRes.data
  } catch (e: any) {
    error.value = e.response?.data?.error || 'Failed to load batch'
  } finally {
    loading.value = false
  }
}

function downloadExcel() {
  window.open(`/api/exports/${batchId}`, '_blank')
}

async function deleteBatch() {
  if (!confirm('Delete this batch and all its scans? This cannot be undone.')) return
  deleting.value = true
  try {
    await api.delete(`/batches/${batchId}`)
    router.push({ name: 'Dashboard' })
  } catch (e: any) {
    error.value = e.response?.data?.error || 'Failed to delete batch'
    deleting.value = false
  }
}

onMounted(fetchData)
</script>

<template>
  <div class="min-h-screen bg-gray-100 p-6">
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between">
      <button
        @click="router.push({ name: 'Dashboard' })"
        class="text-gray-600 hover:text-gray-900 text-sm font-medium"
      >
        &larr; Back to Dashboard
      </button>
      <div class="flex gap-3">
        <button
          @click="downloadExcel"
          class="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 disabled:opacity-50"
        >
          Download Excel
        </button>
        <button
          @click="deleteBatch"
          :disabled="deleting"
          class="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700 disabled:opacity-50"
        >
          {{ deleting ? 'Deleting...' : 'Delete Batch' }}
        </button>
      </div>
    </div>

    <!-- Error -->
    <div v-if="error" class="mb-4 p-4 bg-red-100 text-red-700 rounded text-sm">
      {{ error }}
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-12 text-gray-500">Loading...</div>

    <!-- Content -->
    <template v-else-if="batch">
      <!-- Batch Info Card -->
      <div class="bg-white rounded shadow p-6 mb-6">
        <h1 class="text-2xl font-bold text-gray-900 mb-1">{{ batch.name }}</h1>
        <p class="text-gray-500 text-sm">
          Created {{ new Date(batch.created_at).toLocaleDateString() }} &bull;
          <span class="font-medium text-gray-700">{{ batch.scan_count }}</span> total scans
        </p>
      </div>

      <!-- Scans Table -->
      <div class="bg-white rounded shadow overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-800">Scanned Lot IDs</h2>
        </div>
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lot ID</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scanned At</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="scan in scans" :key="scan.id">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ scan.lot_id }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ new Date(scan.scanned_at).toLocaleString() }}
              </td>
            </tr>
            <tr v-if="scans.length === 0">
              <td colspan="2" class="px-6 py-8 text-center text-gray-400 text-sm">No scans yet</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>
