<template>
  <div class="flex justify-between max-sm:flex-col">
    <div class="flex flex-col grow max-w-full">
      <div class="flex justify-between mb-2">
        <div class="mr-2 font-bold text-xl mb-1">
          About Collection
        </div>
      </div>
      <div class="break-words">
        <Markdown
          :source="visibleDescription"
          data-testid="drops-text-description-container"
        />
      </div>
      <div class="flex justify-between items-center mb-6 md:mb-4!">
        <NeoButton
          v-if="hasSeeAllDescriptionOption"
          class="no-shadow is-text underline text-left p-0"
          :label="seeAllDescription ? $t('showLess') : $t('showMore')"
          data-testid="drops-text-description-button"
          @click="toggleSeeAllDescription"
        />
        <NeoButton
          variant="outlined-rounded"
          rounded
          :tag="NuxtLink"
          :to="`/${urlPrefix}/collection/${collectionId}`"
          icon="arrow-right"
          data-testid="drops-view-collection-button"
        >
          <span>View Collection</span>
        </NeoButton>
      </div>
    </div>
    <div>
      <div class="flex gap-4 max-sm:flex-col max-sm:gap-0" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { NeoButton } from '@kodadot1/brick'
import { resolveComponent } from 'vue'
import {
  DESCRIPTION_MAX_LENGTH,
  generatePreviewDescription,
} from '@/components/collection/utils/description'

const NuxtLink = resolveComponent('NuxtLink')
const props = defineProps<{ collectionId: string, description?: string }>()

const seeAllDescription = ref(false)
const { urlPrefix } = usePrefix()
const toggleSeeAllDescription = () => {
  seeAllDescription.value = !seeAllDescription.value
}
const source = computed(() => {
  return props.description
})
const hasSeeAllDescriptionOption = computed(() => {
  return (source.value?.length || 0) > DESCRIPTION_MAX_LENGTH
})

const visibleDescription = computed(() => {
  return (
    (!hasSeeAllDescriptionOption.value || seeAllDescription.value
      ? source.value
      : generatePreviewDescription(source.value)) || ''
  )
})
</script>
