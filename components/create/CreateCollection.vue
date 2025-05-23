<template>
  <div
    :class="{
      'lg:py-[4.5rem] flex flex-col md:flex-row justify-center gap-3 lg:bg-k-primary-light':
        classColumn,
    }"
  >
    <SigningModal
      v-if="!autoTeleport"
      :title="$t('mint.collection.minting')"
      :is-loading="isLoading"
      :status="status"
      close-in-block
      @try-again="createCollection"
    />

    <MintConfirmModal
      v-model="confirmModal"
      :auto-teleport-actions="actions"
      :nft-information="collectionInformation"
      @confirm="handleCreateCollectionConfirmation"
    />
    <form
      ref="formRef"
      :class="{
        'px-[1.2rem] md:px-8 lg:px-16 py-[3.1rem] sm:py-16 w-full sm:w-1/2 max-w-[40rem] shadow-none lg:shadow-primary lg:border-[1px] lg:border-border-color lg:bg-background-color':
          classColumn,
      }"
    >
      <h1 class="title text-3xl mb-7">
        {{ $t('mint.collection.create') }}
      </h1>

      <!-- collection logo -->
      <NeoField :label="`${$t('mint.collection.logo.image')} *`">
        <div>
          <p>{{ $t('mint.collection.logo.message') }}</p>
          <DropUpload
            v-model="logo"
            required
            expanded
            preview
            :label="$t('mint.collection.drop')"
          />
        </div>
      </NeoField>

      <!-- collection name -->
      <NeoField
        :label="`${$t('mint.collection.name.label')} *`"
        required
        data-testid="collection-name"
        :error="!name"
      >
        <NeoInput
          v-model="name"
          required
          :placeholder="$t('mint.collection.name.placeholder')"
        />
      </NeoField>

      <!-- collection description -->
      <NeoField
        :label="`${$t('mint.collection.description.label')} (optional)`"
      >
        <NeoInput
          v-model="description"
          type="textarea"
          has-counter
          maxlength="1000"
          height="10rem"
          :placeholder="$t('mint.collection.description.placeholder')"
          data-testid="collection-desc"
        />
      </NeoField>

      <!-- collection max nfts -->
      <NeoField
        :label="$t('Maximum NFTs in collection')"
        data-testid="collection-maxAmount"
        required
      >
        <div class="w-full">
          <div class="flex justify-between">
            <p>{{ $t('mint.unlimited') }}</p>
            <NeoSwitch
              v-model="unlimited"
              position="left"
            />
          </div>
          <NeoInput
            v-if="!unlimited"
            v-model="max"
            class="mt-3"
            type="number"
            data-testid="collection-input-maximum-nfts"
            placeholder="1 is the minimum"
            :min="1"
          />
        </div>
      </NeoField>

      <!-- select blockchain -->
      <NeoField :label="`${$t('mint.blockchain.label')} *`">
        <div class="w-full">
          <p>{{ $t('mint.blockchain.message') }}</p>
          <NeoSelect
            v-model="selectBlockchain"
            class="mt-3"
            data-testid="collection-chain"
            expanded
          >
            <option
              v-for="menu in menus"
              :key="menu.value"
              :value="menu.value"
            >
              {{ menu.text }}
            </option>
          </NeoSelect>
        </div>
      </NeoField>

      <!-- royalty -->
      <NeoField v-if="isAssetHub">
        <RoyaltyForm
          v-model:amount="royalty.amount"
          v-model:address="royalty.address"
          data-testid="create-nft-royalty"
        />
      </NeoField>

      <hr class="my-6">

      <!-- deposit and balance -->
      <div>
        <div class="flex font-medium text-k-blue hover:text-k-blue-hover">
          <div>{{ $t('mint.deposit') }}:&nbsp;</div>
          <div data-testid="collection-deposit">
            {{ totalCollectionDeposit }} {{ chainSymbol }}
          </div>
        </div>
        <div class="flex">
          <div>{{ $t('general.balance') }}:&nbsp;</div>
          <div data-testid="collection-balance">
            {{ balance }} {{ chainSymbol }}
          </div>
        </div>
      </div>

      <hr class="my-6">

      <!-- create collection button -->
      <NeoButton
        class="text-base"
        expanded
        :label="submitButtonLabel"
        size="medium"
        data-testid="collection-create"
        :loading="isLoading"
        @click="showConfirm"
      />
      <div class="p-4 flex">
        <KIcon
          name="i-mdi:information-slab-circle-outline"
          size="medium"
          class="mr-4"
        />
        <p class="text-xs">
          <span
            v-dompurify-html="
              $t('mint.requiredDeposit', [
                `${totalCollectionDeposit} ${chainSymbol}`,
                'collection',
              ])
            "
          />
          <a
            href="https://hello.kodadot.xyz/information/fees"
            target="_blank"
            class="text-k-blue hover:text-k-blue-hover"
            rel="nofollow noopener noreferrer"
          >
            {{ $t('helper.learnMore') }}
          </a>
        </p>
      </div>
    </form>
    <CreateModalsCollectionSuccessModal
      v-model="displaySuccessModal"
      :tx-hash="txHash || ''"
      :status="status"
      :collection="mintedCollectionInfo"
    />
  </div>
</template>

<script setup lang="ts">
import type { Prefix } from '@kodadot1/static'
import {
  NeoButton,
  NeoField,
  NeoInput,
  NeoSelect,
  NeoSwitch,
} from '@kodadot1/brick'
import { Interaction } from '@/utils/shoppingActions'
import type {
  ActionMintCollection,
  BaseCollectionType,
  CollectionToMintBasilisk,
  CollectionToMintKusama,
  CollectionToMintStatmine,
} from '@/composables/transaction/types'

import RoyaltyForm from '@/components/create/RoyaltyForm.vue'
import type { AutoTeleportActionButtonConfirmEvent } from '@/components/common/autoTeleport/AutoTeleportActionButton.vue'
import MintConfirmModal from '@/components/create/Confirm/MintConfirmModal.vue'
import type { AutoTeleportAction } from '@/composables/autoTeleport/types'
import { availablePrefixes } from '@/utils/chain'
import { doAfterCheckCurrentChainVM, openReconnectWalletModal } from '@/components/common/ConnectWallet/openReconnectWalletModal'

export type MintedCollectionInfo = {
  id?: string
  name: string
  image: string
}

// props
withDefaults(
  defineProps<{
    classColumn?: boolean
  }>(),
  {
    classColumn: true,
  },
)

// refs

const mintedCollectionInfo = ref<MintedCollectionInfo>()
const collectionSubscription = ref(() => {})
const displaySuccessModal = ref(false)
const formRef = ref<HTMLFormElement>()

// composables
const { transaction, status, isLoading, isError, blockNumber, txHash }
  = useTransaction()
const { isTransactionSuccessful } = useTransactionSuccessful({
  status,
  isError,
  isLoading,
})
const { urlPrefix, setUrlPrefix } = usePrefix()
const { $consola, $i18n } = useNuxtApp()
const { isLogIn, accountId } = useAuth()
const { doAfterLogin } = useDoAfterlogin()

// form state
const logo = ref<File | null>(null)
const name = ref('')
const description = ref('')
const unlimited = ref(true)
const max = ref(1)
const confirmModal = ref(false)
const autoTeleport = ref(false)
const royalty = ref({
  amount: 0,
  address: accountId.value,
})

const menus = availablePrefixes().filter(
  (menu) => {
    const { isEvm } = useIsChain(computed(() => menu.value as Prefix))
    return !isEvm.value
  })

const chainByPrefix = menus.find(menu => menu.value === urlPrefix.value)
const selectBlockchain = ref(chainByPrefix?.value || menus[0].value)

watch(urlPrefix, (value) => {
  selectBlockchain.value = value
})

const submitButtonLabel = computed(() => {
  return !isLogIn.value
    ? $i18n.t('mint.nft.connect')
    : canDeposit.value
      ? $i18n.t('mint.collection.create')
      : $i18n.t('confirmPurchase.notEnoughFunds')
})

const currentChain = computed(() => {
  return selectBlockchain.value as Prefix
})

const { isAssetHub } = useIsChain(currentChain)
const { balance, totalCollectionDeposit, chainSymbol, chain }
  = useDeposit(currentChain)

// balance state
const canDeposit = computed(() => {
  return (
    isLogIn.value
    && parseFloat(balance.value) >= parseFloat(totalCollectionDeposit.value)
  )
})

const collectionInformation = computed(() => ({
  file: logo.value,
  name: name.value,
  paidToken: chain.value,
  mintType: CreateComponent.Collection,
  hasCappedMaxSupply: unlimited.value ? false : max.value > 0,
  hasRoyalty: Boolean(royalty.value.amount),
}))

watch(currentChain, () => {
  royalty.value.amount = 0
  if (currentChain.value !== urlPrefix.value) {
    setUrlPrefix(currentChain.value as Prefix)
  }
})

const showConfirm = () => {
  doAfterLogin({
    onLoginSuccess: () => {
      if (formRef.value && !formRef.value.checkValidity()) {
        formRef.value.reportValidity()
        return
      }
      if (!menus.find(menu => menu.value === currentChain.value)) {
        openReconnectWalletModal()
        return
      }
      doAfterCheckCurrentChainVM(() => {
        confirmModal.value = true
      })
    },

  })
}

const collection = computed(() => {
  const collection: BaseCollectionType = {
    file: logo.value,
    name: name.value,
    description: description.value,
    hasRoyalty: Boolean(royalty.value.amount),
    royalty: royalty.value,
  }

  if (isAssetHub.value) {
    collection['nftCount'] = unlimited.value ? 0 : max.value
  }

  return collection
})

const mintCollectionAction = computed<ActionMintCollection>(() => ({
  interaction: Interaction.MINT,
  urlPrefix: currentChain.value,
  collection: collection.value as
  | CollectionToMintBasilisk
  | CollectionToMintKusama
  | CollectionToMintStatmine,
}))

const handleCreateCollectionConfirmation = async ({
  autoteleport,
}: AutoTeleportActionButtonConfirmEvent) => {
  confirmModal.value = false
  autoTeleport.value = autoteleport

  if (autoteleport) {
    return
  }

  if (totalCollectionDeposit.value && canDeposit.value === false) {
    return
  }

  await createCollection()
}

const createCollection = async () => {
  try {
    isLoading.value = true
    await transaction(mintCollectionAction.value, currentChain.value)
  }
  catch (error) {
    warningMessage(`${error}`)
    $consola.error(error)
  }
}

watch(isTransactionSuccessful, (success) => {
  if (success) {
    mintedCollectionInfo.value = {
      name: name.value,
      image: logo.value ? URL.createObjectURL(logo.value) : '',
    }

    displaySuccessModal.value = true
    subscribeToCollectionInfo()
  }
})

const subscribeToCollectionInfo = () => {
  const query = `  collectionEntities(
    orderBy: blockNumber_DESC,
    limit: 1,
    where: {
        issuer_eq: "${accountId.value}",
        burned_eq: false
        }
    ) {
    id
    blockNumber
    name
  }`

  collectionSubscription.value = useSubscriptionGraphql({
    query,
    onChange: ({ data }) => {
      if (data.collectionEntities) {
        const collection = data.collectionEntities[0]

        if (
          collection
          && collection.blockNumber == blockNumber.value
          && collection.name === name.value
        ) {
          mintedCollectionInfo.value = {
            id: collection.id,
            name: collection.name,
            image: mintedCollectionInfo.value?.image as string,
          }

          collectionSubscription.value()
        }
      }
    },
  })
}

onBeforeUnmount(collectionSubscription.value)

// autoteleport
const actions = computed<AutoTeleportAction[]>(() => [
  {
    action: mintCollectionAction.value,
    prefix: currentChain.value,
    handler: createCollection,
    details: {
      isLoading: isLoading.value,
      isError: isError.value,
      status: status.value,
      blockNumber: blockNumber.value,
    },
  },
])
</script>

<style lang="scss" scoped src="@/assets/styles/pages/create.scss"></style>
