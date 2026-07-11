<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import api, { Batch, setAdminAuth, clearAuth } from '../../composables/useApi'

// ─── Auth State ───────────────────────────────────────────────────────────────
const ADMIN_CREDS_KEY = 'admin_credentials'

const storedCreds = localStorage.getItem(ADMIN_CREDS_KEY)
const isAuthenticated = ref(!!storedCreds)
const authError = ref('')

// Auth form
const username = ref('')
const password = ref('')

// ─── Table State ─────────────────────────────────────────────────────────────
const batches = ref<Batch[]>([])
const loading = ref(false)
const error = ref('')

// Search & Filter
const searchQuery = ref('')
const dateFilter = ref('')

// Pagination
const currentPage = ref(1)
const pageSize = ref(10)

// Edit Modal
const editModalOpen = ref(false)
const editingBatch = ref<Batch | null>(null)
const editName = ref('')
const editLoading = ref(false)
const editError = ref('')

// Delete Confirmation
const deleteBatchId = ref<number | null>(null)
const deleteLoading = ref(false)

// ─── Computed ────────────────────────────────────────────────────────────────
const filteredBatches = computed(() => {
  let result = [...batches.value]

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(b => b.name.toLowerCase().includes(q))
  }

  if (dateFilter.value) {
    result = result.filter(b => b.created_at.startsWith(dateFilter.value))
  }

  return result
})

const totalBatches = computed(() => filteredBatches.value.length)

const totalPages = computed(() => Math.ceil(totalBatches.value / pageSize.value))

const paginatedBatches = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredBatches.value.slice(start, start + pageSize.value)
})

// ─── Auth ────────────────────────────────────────────────────────────────────
async function login() {
  if (!username.value || !password.value) {
    authError.value = 'Please enter username and password'
    return
  }
  authError.value = ''

  // Validate credentials by calling the batches endpoint
  setAdminAuth(username.value, password.value)
  try {
    await api.get('/batches')
    isAuthenticated.value = true
    localStorage.setItem(ADMIN_CREDS_KEY, JSON.stringify({ username: username.value, password: password.value }))
    fetchBatches()
  } catch (e: any) {
    clearAuth()
    authError.value = e.response?.status === 401 ? 'Invalid credentials' : 'Login failed'
  }
}

function logout() {
  clearAuth()
  isAuthenticated.value = false
  localStorage.removeItem(ADMIN_CREDS_KEY)
  batches.value = []
  username.value = ''
  password.value = ''
}

// ─── Fetch Batches ───────────────────────────────────────────────────────────
async function fetchBatches() {
  loading.value = true
  error.value = ''
  try {
    const res = await api.get<Batch[]>('/batches')
    batches.value = res.data
  } catch (e: any) {
    error.value = e.response?.status === 401 ? 'Session expired' : 'Failed to load batches'
    if (e.response?.status === 401) {
      logout()
    }
  } finally {
    loading.value = false
  }
}

// ─── Edit Batch ─────────────────────────────────────────────────────────────
function openEditModal(batch: Batch) {
  editingBatch.value = batch
  editName.value = batch.name
  editModalOpen.value = true
  editError.value = ''
}

function closeEditModal() {
  editModalOpen.value = false
  editingBatch.value = null
  editName.value = ''
  editError.value = ''
}

async function saveEdit() {
  if (!editingBatch.value || !editName.value.trim()) {
    editError.value = 'Name is required'
    return
  }
  editLoading.value = true
  editError.value = ''
  try {
    const res = await api.put<Batch>(`/batches/${editingBatch.value.id}`, { name: editName.value.trim() })
    const idx = batches.value.findIndex(b => b.id === editingBatch.value!.id)
    if (idx !== -1) batches.value[idx] = res.data
    closeEditModal()
  } catch (e: any) {
    editError.value = e.response?.data?.error || 'Failed to update batch'
  } finally {
    editLoading.value = false
  }
}

// ─── Delete Batch ────────────────────────────────────────────────────────────
async function deleteBatch() {
  if (deleteBatchId.value === null) return
  deleteLoading.value = true
  try {
    await api.delete(`/batches/${deleteBatchId.value}`)
    batches.value = batches.value.filter(b => b.id !== deleteBatchId.value)
    deleteBatchId.value = null
    // Adjust page if needed
    if (paginatedBatches.value.length === 0 && currentPage.value > 1) {
      currentPage.value--
    }
  } catch (e: any) {
    alert(e.response?.data?.error || 'Failed to delete batch')
  } finally {
    deleteLoading.value = false
  }
}

// ─── Excel Downloads ─────────────────────────────────────────────────────────
function downloadBatchExcel(batchId: number, filename: string) {
  const creds = JSON.parse(localStorage.getItem(ADMIN_CREDS_KEY) || '{}')
  if (!creds.username) return

  const url = `/api/exports/${batchId}`
  const a = document.createElement('a')
  a.href = `${url}?auth=${btoa(creds.username + ':' + creds.password)}`
  a.download = `${filename}.xlsx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

function downloadAllExcel() {
  const creds = JSON.parse(localStorage.getItem(ADMIN_CREDS_KEY) || '{}')
  if (!creds.username) return

  const url = `/api/exports/all`
  const a = document.createElement('a')
  a.href = `${url}?auth=${btoa(creds.username + ':' + creds.password)}`
  a.download = `all-scans.xlsx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

// ─── Filter helpers ─────────────────────────────────────────────────────────
function clearFilters() {
  searchQuery.value = ''
  dateFilter.value = ''
  currentPage.value = 1
}

// ─── Lifecycle ──────────────────────────────────────────────────────────────
onMounted(() => {
  if (isAuthenticated.value) {
    const creds = JSON.parse(localStorage.getItem(ADMIN_CREDS_KEY) || '{}')
    if (creds.username && creds.password) {
      setAdminAuth(creds.username, creds.password)
      fetchBatches()
    }
  }
})
</script>

<template>
  <div class="min-h-screen bg-gray-100">
    <!-- Header -->
    <header class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <h1 class="text-xl font-bold text-gray-900">Admin Dashboard</h1>
        <button
          v-if="isAuthenticated"
          @click="logout"
          class="text-sm text-red-600 hover:text-red-800 font-medium"
        >
          Logout
        </button>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 py-6">
      <!-- ── Login Form ─────────────────────────────────────────────── -->
      <div v-if="!isAuthenticated" class="max-w-sm mx-auto mt-20">
        <div class="bg-white rounded-lg shadow-md p-8">
          <h2 class="text-2xl font-bold mb-6 text-center text-gray-900">Admin Login</h2>
          <form @submit.prevent="login" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                v-model="username"
                type="text"
                autocomplete="username"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="admin"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                v-model="password"
                type="password"
                autocomplete="current-password"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••"
              />
            </div>
            <p v-if="authError" class="text-sm text-red-600">{{ authError }}</p>
            <button
              type="submit"
              class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition font-medium"
            >
              Login
            </button>
          </form>
        </div>
      </div>

      <!-- ── Dashboard ──────────────────────────────────────────────── -->
      <div v-else>
        <!-- Controls: Search + Filter + Download All -->
        <div class="bg-white rounded-lg shadow p-4 mb-6">
          <div class="flex flex-wrap gap-4 items-end">
            <div class="flex-1 min-w-48">
              <label class="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                v-model="searchQuery"
                @input="currentPage = 1"
                type="text"
                placeholder="Search by name..."
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div class="w-48">
              <label class="block text-sm font-medium text-gray-700 mb-1">Date Filter</label>
              <input
                v-model="dateFilter"
                @input="currentPage = 1"
                type="date"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div class="flex gap-2">
              <button
                v-if="searchQuery || dateFilter"
                @click="clearFilters"
                class="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition"
              >
                Clear
              </button>
              <button
                @click="downloadAllExcel"
                class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition font-medium"
              >
                Download All Excel
              </button>
            </div>
          </div>
        </div>

        <!-- Batch Table -->
        <div class="bg-white rounded-lg shadow overflow-hidden">
          <div v-if="loading" class="p-8 text-center text-gray-500">Loading batches...</div>
          <div v-else-if="error" class="p-8 text-center text-red-500">{{ error }}</div>
          <div v-else-if="batches.length === 0" class="p-8 text-center text-gray-500">No batches found.</div>
          <div v-else>
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scan Count</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="batch in paginatedBatches" :key="batch.id" class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {{ batch.name }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ batch.scan_count }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ new Date(batch.created_at).toLocaleString() }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      @click="downloadBatchExcel(batch.id, batch.name)"
                      class="text-green-600 hover:text-green-800"
                    >
                      Excel
                    </button>
                    <button
                      @click="openEditModal(batch)"
                      class="text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </button>
                    <button
                      @click="deleteBatchId = batch.id"
                      class="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- Pagination -->
            <div v-if="totalPages > 1" class="px-6 py-4 flex items-center justify-between border-t border-gray-200">
              <p class="text-sm text-gray-500">
                Showing {{ (currentPage - 1) * pageSize + 1 }}–{{ Math.min(currentPage * pageSize, totalBatches) }} of {{ totalBatches }}
              </p>
              <div class="flex gap-1">
                <button
                  @click="currentPage--"
                  :disabled="currentPage === 1"
                  class="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Prev
                </button>
                <button
                  v-for="p in totalPages"
                  :key="p"
                  @click="currentPage = p"
                  :class="['px-3 py-1 text-sm border rounded', p === currentPage ? 'bg-blue-600 text-white' : 'hover:bg-gray-50']"
                >
                  {{ p }}
                </button>
                <button
                  @click="currentPage++"
                  :disabled="currentPage === totalPages"
                  class="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- ── Edit Modal ──────────────────────────────────────────────── -->
    <div
      v-if="editModalOpen"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="closeEditModal"
    >
      <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 class="text-lg font-bold mb-4">Edit Batch Name</h3>
        <form @submit.prevent="saveEdit">
          <input
            v-model="editName"
            type="text"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
          />
          <p v-if="editError" class="text-sm text-red-600 mb-2">{{ editError }}</p>
          <div class="flex justify-end gap-2">
            <button
              type="button"
              @click="closeEditModal"
              class="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="editLoading"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {{ editLoading ? 'Saving...' : 'Save' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ── Delete Confirmation Modal ───────────────────────────────── -->
    <div
      v-if="deleteBatchId !== null"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="deleteBatchId = null"
    >
      <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
        <h3 class="text-lg font-bold mb-2">Delete Batch?</h3>
        <p class="text-gray-600 mb-4">This action cannot be undone. All scans in this batch will be permanently deleted.</p>
        <div class="flex justify-end gap-2">
          <button
            @click="deleteBatchId = null"
            class="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            @click="deleteBatch"
            :disabled="deleteLoading"
            class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            {{ deleteLoading ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
