<template>
  <tippy
    :placement="position"
    :append-to="body"
  >
    <KIcon
      name="i-mdi:information-slab-circle"
      class="ml-2 text-k-grey"
    />

    <template #content>
      <div class="w-[16rem] bg-background-color text-sm border p-4">
        <div class="flex text-base mb-3">
          <KIcon
            name="i-mdi:information-slab-circle"
            class="mr-2"
          />

          <span class="font-bold">{{ $t('autoTeleport.autoTeleport') }}</span>
        </div>

        <p class="text-left mb-2">
          {{ $t('autoTeleport.tooltip.first') }}
        </p>
        <p class="text-left mb-3">
          {{ $t('autoTeleport.tooltip.second') }}
        </p>

        <p class="font-bold text-left mb-3">
          {{ $t('autoTeleport.tooltip.optimalTransferPath') }}
        </p>

        <div
          v-if="transition.source"
          class="w-full"
        >
          <div class="flex justify-between mb-2">
            <span>{{ transition.source.name }}</span>

            <span> -> </span>

            <span>
              <span>{{ transition.destination.name }} </span>
              <span class="text-k-grey"> ({{ transition.token }}) </span>
            </span>
          </div>

          <div class="flex justify-between">
            <span class="text-k-grey">{{ $t('amount') }}</span>

            <span>{{ transition.amountFormatted }} ~
              {{ transition.amountUsd }}</span>
          </div>
        </div>
        <div v-else>
          <p class="mb-2 text-k-grey text-left">
            {{ $t('autoTeleport.tooltip.noRouteFound') }}
          </p>
        </div>

        <div class="flex justify-start mt-5">
          <a
            href="https://hello.kodadot.xyz/tutorial/teleport/auto-teleport"
            class="text-k-blue hover:text-k-blue-hover text-sm"
            target="_blank"
            rel="nofollow noopener noreferrer"
          >{{ $t('helper.learnMore') }}</a>
        </div>
      </div>
    </template>
  </tippy>
</template>

<script setup lang="ts">
defineProps<{
  transition: TeleportTransition
  position: 'top' | 'left'
}>()

const body = ref(document.body)
</script>
