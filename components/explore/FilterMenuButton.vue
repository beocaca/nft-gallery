<template>
  <div
    class="has-addons flex items-center"
    data-testid="tabs"
  >
    <a
      :class="[{ disabled: disabled }, 'hidden lg:flex items-center']"
      @click="toggleSidebarFilters"
    >
      <NeoIcon
        :icon="isSidebarFiltersOpen && !disabled ? 'times' : 'bars'"
        size="medium"
      />
    </a>
    <div class="block lg:hidden relative">
      <NeoButton
        :disabled="disabled"
        icon="bars"
        @click="openMobileFilters"
      />
      <ActiveCount
        v-if="numOfActiveFilters"
        :count="numOfActiveFilters"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { NeoButton, NeoIcon } from '@kodadot1/brick'
import ActiveCount from './ActiveCount.vue'
import { usePreferencesStore } from '@/stores/preferences'
import useActiveRouterFilters from '@/composables/useActiveRouterFilters'

const route = useRoute()
const preferencesStore = usePreferencesStore()
const activeFilters = useActiveRouterFilters()

const disabled = computed(() => {
  const allowedList = [
    'prefix-explore-items',
    'prefix-collection-id',
    'prefix-collection-id-activity',
    'prefix-collection-id-swaps',
  ]

  return !allowedList.includes(route.name?.toString() || '')
})

const isSidebarFiltersOpen = computed(
  () => preferencesStore.getsidebarFilterCollapse,
)

const numOfActiveFilters = computed(
  () => Object.keys(activeFilters.value).length,
)

const toggleSidebarFilters = () =>
  preferencesStore.setSidebarFilterCollapse(!isSidebarFiltersOpen.value)

const openMobileFilters = () => preferencesStore.setMobileFilterCollapse(true)
</script>
