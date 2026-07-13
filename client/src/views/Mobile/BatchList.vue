<template>
  <div class="min-h-screen bg-light text-dark">

    <!-- Header -->
    <header class="bg-primary text-white py-4 px-4 shadow">
      <h1 class="text-xl font-bold">QR Batch Scanner</h1>
    </header>

    <div class="p-4">

      <!-- PIN Setup -->
      <div v-if="!hasPin" class="card bg-white shadow-sm mb-4">
        <div class="card-body">
          <h2 class="card-title text-base font-semibold mb-3">Set Device PIN</h2>
          <p class="text-muted text-sm mb-3">Create a 4-digit PIN to secure your device.</p>
          <div class="flex gap-2 mb-3">
            <input
              v-model="pinInput"
              type="password"
              maxlength="4"
              inputmode="numeric"
              pattern="[0-9]*"
              class="input input-bordered w-24 text-center text-lg tracking-widest"
              placeholder="••••"
            />
            <input
              v-model="pinConfirm"
              type="password"
              maxlength="4"
              inputmode="numeric"
              pattern="[0-9]*"
              class="input input-bordered w-24 text-center text-lg tracking-widest"
              placeholder="Confirm"
            />
          </div>
          <p v-if="pinError" class="text-error text-sm mb-2">{{ pinError }}</p>
          <button class="btn btn-primary w-full" :disabled="pinInput.length < 4 || pinConfirm.length < 4" @click="savePin">
            Save PIN
          </button>
        </div>
      </div>

      <!-- Error Alert -->
      <div v-if="error" class="alert alert-error mb-4">
        <span>{{ error }}</span>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-8 text-muted">
        <span class="loading loading-spinner loading-lg"></span>
        <p class="mt-2 text-sm">Loading batches…</p>
      </div>

      <!-- Batch List -->
      <div v-else>

        <!-- Empty State -->
        <div v-if="batches.length === 0" class="text-center py-12 text-muted">
          <p class="text-lg mb-2">No batches yet</p>
          <p class="text-sm">Create your first batch below.</p>
        </div>

        <!-- Batch Cards -->
        <div v-else class="space-y-3">
          <router-link
            v-for="batch in batches"
            :key="batch.id"
            :to="`/mobile/scanner/${batch.id}`"
            class="card bg-white shadow-sm block hover:shadow-md transition-shadow"
          >
            <div class="card-body p-4">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="font-semibold text-base">{{ batch.name }}</h3>
                  <p class="text-muted text-xs mt-0.5">
                    {{ batch.scan_count }} scan{{ batch.scan_count !== 1 ? 's' : '' }} &bull;
                    {{ formatDate(batch.created_at) }}
                  </p>
                </div>
                <div @click.stop>
                  <router-link
                    :to="`/mobile/history/${batch.id}`"
                    class="btn btn-ghost btn-sm btn-circle"
                    title="Scan history"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </router-link>
                </div>
              </div>
            </div>
          </router-link>
        </div>

      </div>

      <!-- Create New Batch -->
      <div class="card bg-white shadow-sm mt-4">
        <div class="card-body p-4">
          <h2 class="card-title text-base font-semibold mb-3">New Batch</h2>
          <div class="flex gap-2">
            <input
              v-model="newBatchName"
              type="text"
              class="input input-bordered flex-1"
              placeholder="Batch name (e.g. Jan-2025-A)"
              @keyup.enter="createBatch"
            />
            <button
              class="btn btn-success"
              :disabled="!newBatchName.trim() || creating"
              @click="createBatch"
            >
              <span v-if="creating" class="loading loading-spinner loading-xs"></span>
              <span v-else>Create</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api, { type Batch, setMobilePin } from '../../composables/useApi'

// ─── State ────────────────────────────────────────────────────────────────────

const PIN_KEY = 'mobile_pin'
const batches = ref<Batch[]>([])
const loading = ref(false)
const error = ref('')
const hasPin = ref(false)
const pinInput = ref('')
const pinConfirm = ref('')
const pinError = ref('')
const newBatchName = ref('')
const creating = ref(false)

// ─── Lifecycle ────────────────────────────────────────────────────────────────

onMounted(() => {
  hasPin.value = !!localStorage.getItem(PIN_KEY)
  loadBatches()
  restorePin()
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function restorePin(): void {
  const saved = localStorage.getItem(PIN_KEY)
  if (saved) setMobilePin(saved)
}

async function loadBatches(): Promise<void> {
  loading.value = true
  error.value = ''
  try {
    const res = await api.get<Batch[]>('/batches')
    batches.value = res.data
  } catch (e: any) {
    error.value = e?.response?.data?.error || 'Failed to load batches.'
  } finally {
    loading.value = false
  }
}

async function createBatch(): Promise<void> {
  const name = newBatchName.value.trim()
  if (!name) return
  creating.value = true
  error.value = ''
  try {
    const res = await api.post<Batch>('/batches', { name })
    batches.value.unshift(res.data)
    newBatchName.value = ''
  } catch (e: any) {
    error.value = e?.response?.data?.error || 'Failed to create batch.'
  } finally {
    creating.value = false
  }
}

function savePin(): void {
  pinError.value = ''
  if (pinInput.value.length !== 4 || !/^\d+$/.test(pinInput.value)) {
    pinError.value = 'PIN must be exactly 4 numeric digits.'
    return
  }
  if (pinInput.value !== pinConfirm.value) {
    pinError.value = 'PINs do not match.'
    return
  }
  localStorage.setItem(PIN_KEY, pinInput.value)
  setMobilePin(pinInput.value)
  hasPin.value = true
  pinInput.value = ''
  pinConfirm.value = ''
}
</script>
