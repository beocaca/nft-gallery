<template>
  <div class="h-full z-10 min-w-0 relative">
    <div class="h-0 w-full pb-[100%]" />
    <video
      ref="video"
      class="absolute inset-0 min-w-0 w-full h-full flex items-center justify-center"
      :controls="controls"
      playsinline
      loop
      :autoplay="autoPlay"
      muted
      :poster="src"
      :src="animationSrc || src"
      controlslist="nodownload"
      data-testid="type-video"
      :title="alt"
    />
  </div>
</template>

<script lang="ts" setup>
import { useEventListener } from '@vueuse/core'

const props = withDefaults(
  defineProps<{
    animationSrc?: string
    src?: string
    alt?: string
    preview?: boolean
    autoplay?: boolean
  }>(),
  {
    animationSrc: '',
    src: '',
    alt: '',
    preview: false,
    autoplay: undefined,
  },
)

const video = ref()
const { toggle: toggleFullscreen } = useFullscreen(video)

const autoPlay = computed(() =>
  props.autoplay === undefined ? props.preview : props.autoplay,
)
const controls = computed(() => !props.preview)

if (!autoPlay.value && props.src) {
  useEventListener(video, 'loadeddata', () => {
    video.value.play()
    video.value.pause()
  })
}

defineExpose({ toggleFullscreen })
</script>
