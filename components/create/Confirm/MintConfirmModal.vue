<template>
  <NeoModal
    :value="modelValue"
    :can-cancel="['outside', 'escape']"
    class="z-1000"
    max-height="calc(100vh - 180px)"
    content-class="w-[unset]!"
    @close="onClose"
  >
    <ModalBody
      :title="$t('mint.nft.modal.action')"
      :loading="loading"
      @close="onClose"
    >
      <ModalIdentityItem />
      <div class="mt-4 font-bold">
        {{ title }}
      </div>
      <div class="mt-4">
        <ConfirmMintItem :nft="extendedInformation" />
      </div>
      <hr class="my-4">
      <PriceItem :nft="extendedInformation" />
      <div class="pt-5">
        <div class="flex justify-between">
          <AutoTeleportActionButton
            ref="autoteleport"
            :amount="totalFee"
            :actions="autoTeleportActions"
            :label="btnLabel"
            :disabled="disabled"
            :fees="{
              actions: networkFee,
              actionAutoFees: false,
            }"
            auto-close-modal
            :auto-close-modal-delay-modal="0"
            :early-success="!isNFT"
            @confirm="confirm"
          />
        </div>
      </div>
    </ModalBody>
  </NeoModal>
</template>

<script setup lang="ts">
import { NeoModal } from '@kodadot1/brick'
import type { ChainProperties, Option } from '@kodadot1/static'
import ConfirmMintItem from './ConfirmMintItem.vue'
import PriceItem from './PriceItem.vue'
import ModalBody from '@/components/shared/modals/ModalBody.vue'
import type { BaseMintedCollection } from '@/components/base/types'
import { CreateComponent } from '@/composables/useCreate'
import { useFiatStore } from '@/stores/fiat'
import { availablePrefixes } from '@/utils/chain'
import { calculateBalanceUsdValue } from '@/utils/format/balance'
import type { AutoTeleportAction } from '@/composables/autoTeleport/types'
import { calculateFees } from '@/composables/transaction/mintToken/utils'

export type NftInformation = {
  file: Blob | null
  selectedCollection?: BaseMintedCollection
  name: string
  listForSale?: boolean
  hasRoyalty?: boolean
  hasCappedMaxSupply?: boolean
  price?: string
  mintType: CreateComponent
  paidToken: ChainProperties
}

export type ExtendedInformation = NftInformation & {
  blockchain: Option
  networkFee: number
  existentialDeposit: number
  kodadotFee: number
  kodaUSDFee: number
  carbonlessFee: number
  carbonlessUSDFee: number
  totalFee: number
  totalUSDFee: number
}

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    nftInformation: NftInformation
    autoTeleportActions: AutoTeleportAction[]
  }>(),
  {
    modelValue: false,
  },
)

const { isLogIn, accountId } = useAuth()
const { urlPrefix } = usePrefix()
const { $i18n } = useNuxtApp()
const fiatStore = useFiatStore()

const { metadataDeposit, collectionDeposit, existentialDeposit, itemDeposit, attributeDeposit } = useDeposit(urlPrefix)

const emit = defineEmits(['confirm', 'update:modelValue'])

const baseNetworkFee = ref(0)
const autoteleport = ref()

const loading = computed(() => !autoteleport.value?.isReady)

const isNFT = computed(
  () => props.nftInformation.mintType === CreateComponent.NFT,
)
const blockchain = computed(() =>
  availablePrefixes().find(prefix => prefix.value === urlPrefix.value),
)
const chainSymbol = computed(() => props.nftInformation.paidToken?.tokenSymbol)
const decimals = computed(() => props.nftInformation.paidToken?.tokenDecimals)
const tokenPrice = computed(() =>
  Number(fiatStore.getCurrentTokenValue(chainSymbol.value) ?? 0),
)
const { kodaUSDFee, carbonlessUSDFee: carbonlessUSDFeeValue } = calculateFees()

const carbonlessUSDFee = computed(() => isNFT.value ? carbonlessUSDFeeValue : 0)

const convertUSDFeeToToken = (fee: number) => (fee / tokenPrice.value) * Math.pow(10, decimals.value)
const kodadotFee = computed(() => convertUSDFeeToToken(kodaUSDFee))
const carbonlessFee = computed(() => convertUSDFeeToToken(carbonlessUSDFee.value))

const totalFee = computed(() =>
  deposit.value + carbonlessFee.value + kodadotFee.value + networkFee.value,
)

const extendedInformation = computed(() => ({
  ...props.nftInformation,
  networkFee: networkFee.value,
  existentialDeposit: deposit.value,
  kodadotFee: kodadotFee.value,
  kodaUSDFee: kodaUSDFee,
  carbonlessFee: carbonlessFee.value,
  carbonlessUSDFee: carbonlessUSDFee,
  totalFee: totalFee.value,
  totalUSDFee: totalUSDFee.value,
  blockchain: blockchain.value,
}))

const deposit = computed(
  () =>
    metadataDeposit.value
    + existentialDeposit.value
    + (isNFT.value ? itemDeposit.value : collectionDeposit.value)
    + (props.nftInformation.hasRoyalty ? attributeDeposit.value * 2 : 0),
)
const totalUSDFee = computed(() =>
  calculateBalanceUsdValue(totalFee.value * tokenPrice.value, decimals.value),
)
const title = computed(() =>
  isNFT.value
    ? $i18n.t('mint.nft.modal.title')
    : $i18n.t('mint.collection.modal.title'),
)

const btnLabel = computed(() => {
  if (!isLogIn.value) {
    return $i18n.t('mint.nft.modal.login')
  }
  return $i18n.t('mint.nft.modal.process')
})
const disabled = computed(() => !isLogIn.value)

const networkFee = computed(() => {
  const extraCallsMultiplier = [
    props.nftInformation.listForSale,
    props.nftInformation.hasCappedMaxSupply,
    props.nftInformation.hasRoyalty,
  ].filter(Boolean).length

  // remove once mint action tx fee calculation is implemented
  return baseNetworkFee.value * (1 + extraCallsMultiplier)
})

const onClose = () => {
  emit('update:modelValue', false)
}

const confirm = (params) => {
  emit('confirm', params)
}

watchEffect(async () => {
  baseNetworkFee.value = 0

  const fee = await estimateTransactionFee(accountId.value, decimals.value)

  baseNetworkFee.value = Number(fee)
})
</script>

<style lang="scss" scoped>
.btn-height {
  height: 3.5rem;
}
:deep(.identity-name-font-weight-regular) {
  .identity-name {
    font-weight: unset !important;
  }
}
:deep(.o-modal__content) {
  width: unset;
}
</style>
