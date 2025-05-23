<template>
  <div class="w-full">
    <div class="flex flex-col">
      <div
        v-if="showAutoTeleport && !hideTop"
        class="flex justify-between w-full mb-4"
      >
        <div class="flex">
          <div class="has-accent-blur">
            <img
              :src="autoTeleportIcon"
              class="mr-2"
              alt="teleport arrow"
            >
            <img
              v-if="isTelportIconActive"
              src="~/assets/svg/accent-blur.svg"
              alt="blur-sm"
              class="blur-sm autotelport-blur"
            >
          </div>

          <p
            class="font-bold"
            :class="{ 'text-k-grey': !hasAvailableTeleportTransition }"
          >
            {{ $t('autoTeleport.autoTeleport') }}
          </p>

          <AutoTeleportPopover
            v-if="hasAvailableTeleportTransition"
            position="top"
            :transition="optimalTransition"
          />
        </div>

        <div
          v-if="!hasAvailableTeleportTransition"
          class="flex items-center"
          :class="{ 'text-k-grey': !hasAvailableTeleportTransition }"
        >
          <span class="text-xs">{{ $t('autoTeleport.notAvailable') }}</span>

          <AutoTeleportPopover
            position="left"
            :transition="optimalTransition"
          />
        </div>

        <NeoSwitch
          v-else
          v-model="autoTeleport"
          data-testid="auto-teleport-switch"
        />
      </div>

      <NeoButton
        :label="autoTeleportLabel"
        :variant="buttonVariant"
        no-shadow
        :shiny="shiny"
        :disabled="isDisabled"
        :loading="loading"
        :loading-with-label="loading"
        with-shortcut
        class="flex grow btn-height capitalize"
        @click="handleSubmit"
      />
    </div>

    <AutoTeleportModal
      v-model="isModalOpen"
      :transition="optimalTransition"
      :can-do-action="hasEnoughInCurrentChain"
      :transactions="transactions"
      :auto-close="autoCloseModal"
      :auto-close-delay="autoCloseModalDelayModal"
      :interaction="interaction"
      :early-success="earlySuccess"
      @close="handleAutoTeleportModalClose"
      @telport:retry="teleport"
      @action:start="(i) => actionRun(i)"
      @action:retry="(i) => actionRun(i, true)"
      @completed="$emit('actions:completed')"
    />

    <AutoTeleportWelcomeModal
      :model-value="showFirstTimeTeleport"
      @close="preferencesStore.setFirstTimeAutoTeleport(false)"
    />

    <OnRampModal
      v-model="onRampActive"
      no-overlap
      @close="onRampActive = false"
    />
  </div>
</template>

<script setup lang="ts">
import { NeoButton, NeoSwitch, type NeoButtonVariant } from '@kodadot1/brick'
import AutoTeleportWelcomeModal from './AutoTeleportWelcomeModal.vue'
import type { ActionlessInteraction } from './utils'
import { getActionDetails } from './utils'
import useAutoTeleport from '@/composables/autoTeleport/useAutoTeleport'
import useAutoTeleportModal from '@/composables/autoTeleport/useAutoTeleportModal'
import type {
  AutoTeleportAction,
  AutoTeleportFeeParams,
} from '@/composables/autoTeleport/types'
import { getAutoTeleportActionInteraction } from '@/composables/autoTeleport/useAutoTeleportTransactionActions'

export type AutoTeleportActionButtonConfirmEvent = {
  autoteleport: boolean
}

const emit = defineEmits([
  'confirm',
  'teleport:completed',
  'actions:completed',
  'action:run',
  'modal:close',
])
const props = withDefaults(
  defineProps<{
    amount?: number | bigint
    label?: string
    disabled?: boolean
    actions?: AutoTeleportAction[]
    fees?: AutoTeleportFeeParams
    autoCloseModal?: boolean
    autoCloseModalDelayModal?: number
    interaction?: ActionlessInteraction
    hideTop?: boolean
    loading?: boolean
    shiny?: boolean
    earlySuccess?: boolean
    buttonVariant?: NeoButtonVariant
  }>(),
  {
    autoCloseModalDelayModal: undefined,
    fees: () => ({ actions: 0, actionAutoFees: true }),
    disabled: false,
    amount: 0,
    autoCloseModal: false,
    actions: () => [],
    label: '',
    hideTop: false,
    loading: false,
    shiny: false,
    earlySuccess: true,
    buttonVariant: 'primary',
  },
)

const preferencesStore = usePreferencesStore()
const { $i18n } = useNuxtApp()
const { chainSymbol, name } = useChain()
const { isModalOpen } = useAutoTeleportModal()

const amounts = ref()

const {
  isAvailable: isAutoTeleportAvailable,
  isReady: isAutoTeleportReady,
  hasEnoughInCurrentChain,
  hasEnoughInRichestChain,
  optimalTransition,
  transactions,
  teleport,
  clear,
} = useAutoTeleport(
  computed<AutoTeleportAction[]>(() => props.actions),
  computed(() => amounts.value),
  props.fees,
)

const onRampActive = ref(false)
const autoTeleport = ref(false)
const showFirstTimeTeleport = computed(
  () =>
    preferencesStore.firstTimeAutoTeleport
    && autoTeleport.value
    && !props.disabled,
)

const isReady = computed(() =>
  isAutoTeleportAvailable.value ? isAutoTeleportReady.value : true,
)

const isTelportIconActive = computed(() => {
  if (!hasAvailableTeleportTransition.value) {
    return false
  }

  return autoTeleport.value
})

const autoTeleportIcon = computed(
  () =>
    `/auto-teleport-arrow${!isTelportIconActive.value ? '-disabled' : ''}.svg`,
)

const hasAvailableTeleportTransition = computed(
  () => isAutoTeleportAvailable.value && optimalTransition.value.source,
)

const needsAutoTelport = computed(
  () => !hasEnoughInCurrentChain.value && hasEnoughInRichestChain.value,
)

const canAutoTeleport = computed(
  () => optimalTransition.value.source && isAutoTeleportAvailable.value,
)

const showAutoTeleport = computed(
  () =>
    !hasEnoughInCurrentChain.value
    && isAutoTeleportAvailable.value
    && isReady.value
    && !props.disabled,
)

const allowAutoTeleport = computed(
  () => needsAutoTelport.value && canAutoTeleport.value && isReady.value,
)

const hasNoFundsAtAll = computed(
  () => !hasEnoughInCurrentChain.value && !hasEnoughInRichestChain.value,
)

const confirmButtonTitle = computed<string>(() => {
  const interaction = props.interaction || transactions.value.actions[0]?.interaction

  return interaction ? getActionDetails(interaction).confirm : ''
})

const showAddFunds = computed(() => isReady.value && hasNoFundsAtAll.value)

const autoTeleportLabel = computed(() => {
  if (hasEnoughInCurrentChain.value || props.disabled) {
    return props.label || confirmButtonTitle.value
  }

  if (!isReady.value) {
    return $i18n.t('autoTeleport.checking')
  }

  if (showAddFunds.value) {
    return `+ ${$i18n.t('autoTeleport.addFundsViaOnramp')}`
  }

  if (allowAutoTeleport.value) {
    if (!autoTeleport.value) {
      return $i18n.t('autoTeleport.notEnoughTokenInChain', [
        chainSymbol.value,
        name.value,
      ])
    }
    else {
      return confirmButtonTitle.value
    }
  }

  return $i18n.t('autoTeleport.checking')
})

const isDisabled = computed(() => {
  if (props.disabled || !isReady.value) {
    return true
  }

  if (showAddFunds.value) {
    return false
  }

  if (hasEnoughInCurrentChain.value) {
    return false
  }

  if (needsAutoTelport.value) {
    return !autoTeleport.value
  }

  return true
})

const openAutoTeleportModal = () => {
  isModalOpen.value = true

  teleport()
}

const actionRun = async (interaction, isRetry = false) => {
  const autoTeleportAction = props.actions.find(
    action => getAutoTeleportActionInteraction(action) === interaction,
  )

  if (!autoTeleportAction) {
    return
  }

  if (autoTeleportAction.transaction && autoTeleportAction.action) {
    await autoTeleportAction.transaction(
      autoTeleportAction.action,
      autoTeleportAction.prefix || '',
    )
  }
  else if (autoTeleportAction.handler) {
    await autoTeleportAction.handler({ isRetry })
  }
}

const handleSubmit = () => {
  if (showAddFunds.value) {
    onRampActive.value = true
  }
  else {
    submit()
  }
}

const submit = () => {
  emit('confirm', {
    autoteleport: allowAutoTeleport.value && autoTeleport.value,
  } as AutoTeleportActionButtonConfirmEvent)

  if (allowAutoTeleport.value) {
    openAutoTeleportModal()
  }
}

const handleAutoTeleportModalClose = (completed: boolean) => {
  isModalOpen.value = false
  clear()
  emit('modal:close', completed)
}

watch(allowAutoTeleport, (allow) => {
  if (allow) {
    autoTeleport.value = true
  }
})

watchSyncEffect(() => {
  if (!isModalOpen.value) {
    amounts.value = props.amount
  }
})

defineExpose({
  isReady,
  optimalTransition,
  canAutoTeleport,
})
</script>

<style lang="scss" scoped>
.btn-height {
  height: 3.5rem;
}

.autotelport-blur {
  top: -3px !important;
  left: -4px !important;
  transform: scale(1.5);
}
</style>
