<template>
  <div
    v-if="count"
    class="count absolute h-5 w-5 leading-6 text-center flex justify-center items-center"
    :class="[`count--${position}`, { 'rounded-full': rounded-sm }]"
  >
    {{ count }}
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    count?: number
    rounded?: boolean
    position?: string
  }>(),
  {
    rounded: false,
    count: 0,
    position: 'top-left' as 'top-left' | 'top-right',
  },
)
</script>

<style lang="scss" scoped>
.count {
  &--top-left {
    bottom: 1.5rem;
    left: -0.75rem;
  }

  &--top-right {
    bottom: 1.5rem;
    right: -0.75rem;
  }

  border: 1px solid var(--border-color);
  background: var(--k-primary);
  color: var(--black);
}
</style>
