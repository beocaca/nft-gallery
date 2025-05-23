<template>
  <div class="md:flex justify-between">
    <div class="max-w-(--breakpoint-sm)">
      <CollectionHeroButtons class="is-hidden-tablet" />
      <div
        v-if="address"
        class="flex mb-4"
      >
        <div
          class="rounded-full w-full md:w-auto border border-k-shade flex justify-start px-3"
        >
          <IdentityItem
            :label="$t('activity.creator')"
            :prefix="urlPrefix"
            :account="address"
            class="identity-name-font-weight-regular"
            data-testid="collection-creator-address"
          />
        </div>
      </div>

      <div class="mb-4">
        <span
          v-if="recipient"
          class="inline"
        >
          <span class="capitalize text-neutral-7">{{ $t('royalty') }}</span>
          &nbsp;{{ royalty }}%
          <tippy
            :arrow="true"
            placement="bottom"
            class="text-neutral-7"
            :append-to="body"
          >
            <KIcon
              class="w-4 h-4"
              name="i-mdi:information-variant-circle-outline"
            />

            <template #content>
              <div class="bg-background-color border py-2 px-4 text-xs">
                Recipient Address:
                <nuxt-link
                  :to="`/${urlPrefix}/u/${recipient}`"
                  class="text-k-blue hover:text-k-blue-hover"
                >
                  <IdentityIndex
                    ref="identity"
                    :address="recipient"
                    show-clipboard
                  />
                </nuxt-link>
              </div>
            </template>
          </tippy>
          <span class="text-neutral-5 mx-2">•</span>
        </span>
        <span>
          <span class="capitalize text-neutral-7">{{ $t('created') }}</span>&nbsp;{{ new Date(createdAt).toLocaleDateString() }}
          <span class="text-neutral-5 mx-2">•</span>
        </span>
        <span>
          <span class="capitalize text-neutral-7">{{
            $t('activity.network')
          }}</span>&nbsp;{{ chain }}
          <span class="text-neutral-5 mx-2">•</span>
        </span>
        <span>
          <span class="capitalize text-neutral-7">{{ $t('supply') }}</span>&nbsp;{{ stats.maxSupply || $t('helper.unlimited') }}
        </span>
      </div>
      <div class="break-words">
        <Markdown
          :source="visibleDescription"
          data-testid="collection-description"
        />
      </div>
      <NeoButton
        v-if="hasSeeAllDescriptionOption"
        class="no-shadow is-text underline text-left p-0"
        :label="seeAllDescription ? $t('showLess') : $t('showMore')"
        data-testid="description-show-less-more-button"
        @click="toggleSeeAllDescription"
      />
    </div>

    <div class="w-full lg:w-72 pt-4">
      <CollectionInfoLine :title="$t('activity.floor')">
        <CommonTokenMoney
          :value="stats.collectionFloorPrice"
          inline
          :round="2"
        />
      </CollectionInfoLine>
      <CollectionInfoLine :title="$t('activity.volume')">
        <CommonTokenMoney
          :value="stats.collectionTradedVolumeNumber"
          inline
          :round="2"
        />
      </CollectionInfoLine>
      <CollectionInfoLine
        :title="$t('series.owners')"
        :value="stats.uniqueOwners"
      />
      <CollectionInfoLine :title="$t('activity.listedAndMinted')">
        <span class="text-xs text-neutral-7 leading-6 font-normal mr-2">{{
          Boolean(stats.collectionLength)
            ? Math.floor(
              (Number(stats.listedCount) / Number(stats.collectionLength))
                * 100,
            ) + '%'
            : '-'
        }}</span>
        {{ stats.listedCount }} /
        {{ stats.collectionLength }}
      </CollectionInfoLine>
    </div>
  </div>
</template>

<script setup lang="ts">
import { NeoButton } from '@kodadot1/brick'
import { useCollectionDetails } from './utils/useCollectionDetails'
import {
  DESCRIPTION_MAX_LENGTH,
  generatePreviewDescription,
} from '@/components/collection/utils/description'

const props = defineProps<{
  collectionId: string
  collection?: unknown
}>()

const body = ref(document.body)
const route = useRoute()
const { urlPrefix } = usePrefix()
const { availableChains } = useChain()

const chain = computed(
  () =>
    availableChains.value.find(chain => chain.value === route.params.prefix)
      ?.text,
)
const address = computed(() => props.collection?.displayCreator)
const recipient = computed(() => props.collection?.recipient)
const royalty = computed(() => props.collection?.royalty)
const createdAt = computed(() => props.collection?.createdAt)
const seeAllDescription = ref(false)

const toggleSeeAllDescription = () => {
  seeAllDescription.value = !seeAllDescription.value
}

const hasSeeAllDescriptionOption = computed(() => {
  return (
    (props.collection?.meta?.description?.length || 0)
    > DESCRIPTION_MAX_LENGTH
  )
})

const visibleDescription = computed(() => {
  const desc = props.collection?.meta?.description

  return (
    (!hasSeeAllDescriptionOption.value || seeAllDescription.value
      ? desc
      : generatePreviewDescription(desc)) || ''
  )
})

const { stats, refetch } = useCollectionDetails({
  collectionId: computed(() => props.collectionId),
})

defineExpose({ refetch })
</script>
