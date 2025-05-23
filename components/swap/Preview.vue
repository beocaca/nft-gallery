<template>
  <div class="md:w-[380px] relative">
    <span
      ref="target"
      class="md:relative md:top-[-100px]"
    />

    <div
      class="border bg-background-color shadow-primary h-min"
      :class="{
        'md:fixed md:top-[100px]': !isTargetVisible,
      }"
    >
      <div class="px-6 py-4 flex justify-between border-b items-center">
        <div class="text-base font-bold line-height">
          {{ title }}
        </div>
      </div>

      <div class="px-6! pb-6! pt-4! min-h-[40vh] overflow-y-auto">
        <div class="flex justify-between items-center">
          <span>
            {{ count }} {{ $t('items') }}
          </span>

          <a
            v-if="count && !isCollectionSwapDesired"
            @click="clearAll"
          >
            {{ $t('shoppingCart.clearAll') }}
          </a>
        </div>

        <hr
          v-if="count"
          class="my-6!"
        >

        <div
          ref="itemsContainer"
          class="flex flex-col gap-3 max-h-[300px] overflow-y-auto"
        >
          <SwapPreviewItem
            v-for="nft in stepItems"
            :key="nft.id"
            :name="nft.name"
            :image="sanitizeIpfsUrl(nft.meta.image)"
            image-class="border border-k-shade"
            :removable="!(isCollectionSwap && nft.id === null)"
            @remove="swapStore.removeStepItem(nft.id)"
          />

          <SwapPreviewItem
            v-if="stepHasSurcharge"
            :image="getChainIcon(urlPrefix) || ''"
            @remove="swap.surcharge = undefined"
          >
            <template #name>
              <Money
                :value="swap.surcharge?.amount"
                inline
              />
            </template>
          </SwapPreviewItem>
        </div>

        <hr class="my-6!">

        <div class="flex flex-col gap-4">
          <div class="font-bold flex items-center gap-2">
            <span> {{ surchargeTitle }}  </span>
            <span class="text-k-grey text-xs">({{ $t('massmint.optional') }})</span>
          </div>

          <div class="flex items-center gap-2">
            <ListingCartPriceInput
              v-model="amount"
              class="w-[200px]"
              :placeholder="$t('amount')"
              :disabled="surchargeDisabled"
              full-width
            />

            <NeoButton
              class="h-10 w-[120px]"
              icon-pack="fas"
              icon-left="plus"
              no-shadow
              :label="$t('add')"
              :disabled="surchargeDisabled || !amount || insufficientBalance"
              @click="addSurcharge"
            />
          </div>
          <div
            v-if="isOfferedSwapStep"
            class="flex align-center text-xs"
            :class="{ 'text-k-red': insufficientBalance }"
          >
            <div class="flex gap-1">
              {{ $t('general.balance') }}:
              <span>
                {{ balance }} {{ chainSymbol }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="py-6 px-6">
        <div class="flex gap-4">
          <NeoButton
            size="large"
            label="Back"
            variant="text"
            no-shadow
            expanded
            @click="onBack"
          />
          <NeoButton
            size="large"
            label="Next"
            variant="primary"
            :disabled="disabled"
            no-shadow
            expanded
            @click="onNext"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { NeoButton } from '@kodadot1/brick'
import { useElementVisibility } from '@vueuse/core'
import { teleportExistentialDeposit } from '@kodadot1/static'
import { sanitizeIpfsUrl } from '@/utils/ipfs'
import { type SwapSurchargeDirection } from '@/composables/transaction/types'
import { SwapStep } from '@/components/swap/types'

type StepDetails = {
  title: string
  surchargeTitle: string
  nextRouteName: string
  backRouteName: string
  surchargeDirection: SwapSurchargeDirection
}

const props = defineProps<{
  step: SwapStep
}>()

const swapStore = useAtomicSwapStore()
const { swap } = storeToRefs(swapStore)
const { $i18n } = useNuxtApp()
const { accountId } = useAuth()
const { decimals, chainSymbol } = useChain()
const { urlPrefix } = usePrefix()
const { getChainIcon } = useIcon()
const isCollectionSwap = computed(() => swap.value.isCollectionSwap)
const { balance } = useDeposit(urlPrefix)

const stepDetailsMap: ComputedRef<Partial<Record<SwapStep, StepDetails>>> = computed(() => ({
  [SwapStep.DESIRED]: {
    title: 'swap.yourSwapList',
    surchargeTitle: 'swap.requestToken',
    nextRouteName: getSwapStepRouteName(SwapStep.OFFERED, isCollectionSwap.value),
    backRouteName: getSwapStepRouteName(SwapStep.COUNTERPARTY, isCollectionSwap.value),
    surchargeDirection: 'Receive',
  },
  [SwapStep.OFFERED]: {
    title: 'swap.yourOffer',
    surchargeTitle: 'swap.addToken',
    nextRouteName: getSwapStepRouteName(SwapStep.REVIEW, isCollectionSwap.value),
    backRouteName: getSwapStepRouteName(SwapStep.DESIRED, isCollectionSwap.value),
    surchargeDirection: 'Send',
  },
}))

const target = ref()
const amount = ref()
const itemsContainer = ref()

const isTargetVisible = useElementVisibility(target)
const stepItems = computed(() => swapStore.getStepItems(props.step))
const stepDetails = computed(() => stepDetailsMap.value[props.step] as StepDetails)
const title = computed(() => $i18n.t(stepDetails.value.title))
const surchargeTitle = computed(() => $i18n.t(stepDetails.value.surchargeTitle))
const surchargeDisabled = computed(() => Boolean(swap.value.surcharge))
const stepHasSurcharge = computed(() => swap.value.surcharge?.direction === stepDetails.value.surchargeDirection)
const count = computed(() => stepItems.value.length + (stepHasSurcharge.value ? 1 : 0))
const isOverOneToOneSwap = computed(() => swap.value.offered.length > swap.value.desired.length && props.step === SwapStep.OFFERED)
const isCollectionSwapDesired = computed(() => isCollectionSwap.value && props.step === SwapStep.DESIRED)
const isOfferedSwapStep = computed(() => props.step === SwapStep.OFFERED)
const insufficientBalance = computed(() => isOfferedSwapStep.value && balance.value < Number(amount.value) + teleportExistentialDeposit[urlPrefix.value] / Math.pow(10, decimals.value))

const disabled = computed(() => {
  if ((!accountId.value && props.step === SwapStep.OFFERED) || isOverOneToOneSwap.value) {
    return true
  }

  if (props.step === SwapStep.DESIRED) {
    return !swap.value.desired.length
  }

  return swap.value.desired.length !== swap.value.offered.length
})

const goTo = (name: string) => {
  return navigateTo({ name, params: { id: swap.value.counterparty }, query: { swapId: swap.value.id } })
}

const onNext = async () => {
  await goTo(stepDetails.value.nextRouteName)
}

const onBack = async () => {
  await goTo(stepDetails.value.backRouteName)
}

const clearAll = () => {
  swapStore.updateStepItems([])
  swapStore.updateSwap({ surcharge: undefined })
}

const addSurcharge = () => {
  swapStore.updateSwap({ surcharge: { amount: String(Number(amount.value) * Math.pow(10, decimals.value)), direction: stepDetails.value.surchargeDirection } })
  amount.value = ''
}

watch(() => stepItems.value.length, () => {
  nextTick().then(() => {
    // scroll to bottom
    itemsContainer.value.scrollTo({
      top: itemsContainer.value.scrollHeight,
      behavior: 'smooth',
    })
  })
})

watchEffect(() => {
  if (isOverOneToOneSwap.value) {
    swap.value.offered = []
  }
})
</script>
