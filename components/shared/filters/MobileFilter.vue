<template>
  <NeoSidebar
    fullheight
    fullwidth
    overlay
    position="fixed"
    :open="open"
    :can-cancel="['escape']"
    :on-cancel="onClose"
    class="z-1000 absolute"
    content-class="bg-background-color!"
    overlay-class="bg-background-color! opacity-[0.86]"
  >
    <div class="flex flex-col h-full">
      <div class="grow">
        <NeoCommonHead
          :title="$t('general.filters')"
          @close="onClose"
        />

        <Filters v-if="open" />
      </div>

      <div class="buttons-container px-4 py-3 border-t bg-background-color">
        <NeoButton
          label="Reset All"
          variant="text"
          class="grow min-w-36 h-14! shadow-none!"
          @click="resetFilters"
        >
          {{ $t('general.resetAll') }}
        </NeoButton>
        <NeoButton
          variant="primary"
          no-shadow
          class="grow min-w-36 h-14"
          @click="applyFilters"
        >
          {{ $t('general.apply') }}
        </NeoButton>
      </div>
    </div>
  </NeoSidebar>
</template>

<script lang="ts" setup>
import { NeoButton, NeoCommonHead, NeoSidebar } from '@kodadot1/brick'
import { useExploreFiltersStore } from '@/stores/exploreFilters'
import { useAcivityFiltersStore } from '@/stores/activityFilters'
import { usePreferencesStore } from '@/stores/preferences'

import Filters from '@/components/shared/filters/Filters.vue'

import { getCollectionIds } from '@/utils/queryParams'

const route = useRoute()
const preferencesStore = usePreferencesStore()
const exploreFiltersStore = useExploreFiltersStore()
const activityFiltersStore = useAcivityFiltersStore()

const isCollectionActivityTab = computed(
  () => route.name === 'prefix-collection-id-activity',
)

const { replaceUrl } = useReplaceUrl({
  resetPage: !isCollectionActivityTab.value,
})

const emit = defineEmits(['resetPage'])

const open = computed(() => preferencesStore.getMobileFilterCollapse)

const onClose = () => {
  syncFromUrl()
  closeFilterModal()
}

const closeFilterModal = () => preferencesStore.setMobileFilterCollapse(false)

const syncFromUrlOnActivityTab = () => {
  const sale = is(route.query?.sale?.toString()),
    offer = is(route.query?.offer?.toString()),
    listing = is(route.query?.listing?.toString()),
    mint = is(route.query?.mint?.toString()),
    transfer = is(route.query?.transfer?.toString())

  activityFiltersStore.setFilters({ sale, offer, listing, mint, transfer })
}
const syncFromUrlOnGrid = () => {
  const listed = route.query?.listed?.toString() === 'true',
    owned = route.query?.owned?.toString() === 'true',
    artView = route.query?.art_view?.toString() === 'true',
    collections = getCollectionIds()

  exploreFiltersStore.setListed(listed)
  exploreFiltersStore.setOwned(owned)
  exploreFiltersStore.setArtView(artView)
  exploreFiltersStore.setCollections(collections)
}

const syncFromUrl = () => {
  const min = Number(route.query?.min) || undefined,
    max = Number(route.query?.max) || undefined

  if (isCollectionActivityTab.value) {
    syncFromUrlOnActivityTab()
    activityFiltersStore.setPriceRange({ min, max })
  }
  else {
    syncFromUrlOnGrid()
    exploreFiltersStore.setPriceRange({ min, max })
  }
}

const resetFilterOnAcivityTab = () => {
  const statusDefaults = {
    sale: undefined,
    offer: undefined,
    listing: undefined,
    mint: undefined,
    transfer: undefined,
  }

  const priceDefaults = {
    min: undefined,
    max: undefined,
  }
  activityFiltersStore.setFilters(statusDefaults)

  activityFiltersStore.setPriceRange(priceDefaults)
  replaceUrl({
    ...statusDefaults,
    ...priceDefaults,
  })
}
const resetFilters = () => {
  if (isCollectionActivityTab.value) {
    resetFilterOnAcivityTab()
  }
  else {
    const statusDefaults = {
      listed: false,
      owned: false,
      artView: false,
      collections: undefined,
    }

    exploreFiltersStore.setListed(statusDefaults.listed)
    exploreFiltersStore.setOwned(statusDefaults.owned)
    exploreFiltersStore.setArtView(statusDefaults.artView)
    exploreFiltersStore.setCollections(statusDefaults.collections)

    // price
    const priceDefaults = {
      min: undefined,
      max: undefined,
    }
    exploreFiltersStore.setPriceRange(priceDefaults)

    replaceUrl({
      ...statusDefaults,
      ...priceDefaults,
    })
  }

  emit('resetPage')
  closeFilterModal()
}

const applyFilters = () => {
  // status filters
  const { artView, ...restStatusFilters } = exploreFiltersStore.getStatusFilters
  const priceRangeFilter = exploreFiltersStore.getPriceRange
  const eventTypeFilter = activityFiltersStore.getEventTypeFilters

  // apply to URL
  if (isCollectionActivityTab.value) {
    replaceUrl({ ...eventTypeFilter, ...priceRangeFilter })
  }
  else {
    replaceUrl({ art_view: artView, ...restStatusFilters, ...priceRangeFilter })
  }
  emit('resetPage')
  closeFilterModal()
}

watch(() => route.query, syncFromUrl, { immediate: true })
</script>

<style scoped>
@reference '@/assets/css/tailwind.css';

.buttons-container {
  position: sticky;
  bottom: 0;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.filters-header {
  @apply min-h-navbar-mobile;
}
</style>
