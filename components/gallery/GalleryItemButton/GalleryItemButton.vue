<template>
  <div class="buttons content-start gallery-button">
    <div data-testid="gallery-item-share-button">
      <ShareDropdown
        :sharing-content="customSharingContent"
      />
    </div>

    <GalleryItemMoreActionBtn
      :nft="nft"
      :abi="abi"
      :nft-animation-mime-type="getNftAnimationMimeType"
    />
  </div>
</template>

<script setup lang="ts">
import GalleryItemMoreActionBtn from './GalleryItemMoreActionBtn.vue'
import { extractTwitterIdFromDescription } from '@/utils/parse'

const { $i18n } = useNuxtApp()

const { getNft: nft, getAbi: abi, getNftAnimationMimeType } = storeToRefs(useNftStore())

const customSharingContent = computed(() => {
  const twitterId = nft.value?.meta?.description
    ? extractTwitterIdFromDescription(nft.value?.meta?.description)
    : ''

  return twitterId ? $i18n.t('sharing.nftWithArtist', [twitterId]) : ''
})
</script>

<style scoped>
@reference '@/assets/css/tailwind.css';

.gallery-button {
  display: flex;
  gap: 1rem;
  @apply bulma-mobile:flex-col-reverse;
}
</style>
