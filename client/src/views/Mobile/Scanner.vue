<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import api, { setMobilePin } from '../../composables/useApi'

// ─── Route & Auth ────────────────────────────────────────────────────────────

const route = useRoute()
const router = useRouter()

const batchId = route.params.batchId as string

// PIN is stored in sessionStorage (set by BatchList before navigating here)
const pin = sessionStorage.getItem('mobile_pin') || ''
setMobilePin(pin)

// ─── State ────────────────────────────────────────────────────────────────────

const scanCount = ref(0)
const lastLotId = ref<string | null>(null)
const lastResult = ref<'ok' | 'error' | null>(null)
const errorMessage = ref<string | null>(null)
const isScanning = ref(false)

// ─── Scanner ──────────────────────────────────────────────────────────────────

let html5Qrcode: Html5Qrcode | null = null

const startScanner = async () => {
  errorMessage.value = null

  html5Qrcode = new Html5Qrcode('scanner-region', {
    formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
    verbose: false,
  })

  try {
    await html5Qrcode.start(
      { facingMode: 'environment' },
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      },
      onScanSuccess,
      () => {} // ignore scan failures (no QR code in frame)
    )
    isScanning.value = true
  } catch (err) {
    errorMessage.value = 'Camera not available or permission denied.'
    isScanning.value = false
  }
}

const stopScanner = async () => {
  if (html5Qrcode && isScanning.value) {
    try {
      await html5Qrcode.stop()
    } catch {
      // ignore stop errors
    }
    isScanning.value = false
  }
}

// ─── Scan Handler ─────────────────────────────────────────────────────────────

const onScanSuccess = async (decodedText: string) => {
  errorMessage.value = null

  try {
    await api.post('/scans', {
      batch_id: Number(batchId),
      lot_id: decodedText,
    })
    scanCount.value++
    lastLotId.value = decodedText
    lastResult.value = 'ok'
  } catch (err: any) {
    lastLotId.value = decodedText
    lastResult.value = 'error'
    const msg = err?.response?.data?.error ?? 'Scan failed'
    errorMessage.value = typeof msg === 'string' ? msg : JSON.stringify(msg)
  }

  // Brief visual reset after 2 s
  setTimeout(() => {
    lastResult.value = null
  }, 2000)
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────

onMounted(() => {
  startScanner()
})

onUnmounted(async () => {
  await stopScanner()
})
</script>

<template>
  <div class="min-h-screen bg-gray-900 text-white flex flex-col">

    <!-- Header -->
    <header class="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
      <button
        @click="router.push('/mobile')"
        class="text-gray-400 hover:text-white transition-colors"
        aria-label="Back"
      >
        ← Back
      </button>
      <h1 class="text-base font-semibold text-gray-100">Scanner</h1>
      <span class="text-sm text-gray-400">Batch #{{ batchId }}</span>
    </header>

    <!-- Scanner region -->
    <div class="flex-1 flex flex-col items-center justify-center p-4 gap-4">

      <div class="relative">
        <div id="scanner-region" class="w-64 h-64 rounded-xl overflow-hidden" />
      </div>

      <!-- Status indicators -->
      <div class="flex flex-col items-center gap-2 w-full max-w-xs">

        <!-- Scan count -->
        <div class="flex items-center gap-2 text-sm text-gray-300">
          <span class="font-medium">Scans:</span>
          <span class="font-bold text-white">{{ scanCount }}</span>
        </div>

        <!-- Last result -->
        <div
          v-if="lastLotId"
          class="w-full rounded-lg px-4 py-3 text-center text-sm"
          :class="{
            'bg-green-900/60 text-green-300 border border-green-700': lastResult === 'ok',
            'bg-red-900/60 text-red-300 border border-red-700': lastResult === 'error',
            'bg-gray-800 text-gray-300 border border-gray-600': lastResult === null,
          }"
        >
          <p class="font-semibold truncate">Lot: {{ lastLotId }}</p>
          <p v-if="lastResult === 'ok'" class="text-xs mt-0.5 text-green-400">✓ Saved</p>
          <p v-else-if="lastResult === 'error'" class="text-xs mt-0.5 text-red-400">
            ✗ {{ errorMessage }}
          </p>
        </div>

        <!-- Error message (non-scan errors) -->
        <div
          v-if="errorMessage && lastResult !== 'error'"
          class="w-full rounded-lg bg-red-900/60 border border-red-700 px-4 py-3 text-center text-sm text-red-300"
        >
          {{ errorMessage }}
        </div>

      </div>
    </div>

    <!-- Stop button -->
    <div class="p-4 border-t border-gray-700 bg-gray-800">
      <button
        v-if="isScanning"
        @click="stopScanner(); router.push('/mobile')"
        class="w-full rounded-lg bg-red-600 hover:bg-red-700 active:bg-red-800
               px-4 py-3 text-sm font-semibold text-white transition-colors"
      >
        Stop & Exit
      </button>
      <button
        v-else
        @click="startScanner"
        class="w-full rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800
               px-4 py-3 text-sm font-semibold text-white transition-colors"
      >
        Resume Scanning
      </button>
    </div>

  </div>
</template>
