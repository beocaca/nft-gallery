<template>
  <div class="flex flex-wrap pb-44 gap-10 lg:gap-0">
    <div class="lg:w-1/2 flex flex-col gap-10">
      <!-- Content of the first column -->
      <div class="">
        <h1 class="title is-3 mb-4">
          {{ $t('codeChecker.title') }}
        </h1>
        <div class="w-2/3">
          {{ $t('codeChecker.description') }}
        </div>
      </div>

      <div class="py-4 px-5 border border-neutral-5">
        <h2 class="mb-3">
          {{ $t('codeChecker.resources') }}:
        </h2>
        <div class="pl-3 flex flex-col gap-3">
          <a
            v-for="item in RESOURCES_LIST"
            :key="item.title"
            v-safe-href="item.url"
            class="flex items-center w-fit"
            target="_blank"
            rel="nofollow noopener noreferrer"
          >
            <div
              class="text-k-blue hover:text-k-blue-hover flex items-center mr-2"
            >
              <KIcon
                name="i-mdi:circle"
                class="size-[6px] mr-2"
              />
              {{ $t(item.title) }}
            </div>
            <KIcon
              name="i-mdi:arrow-top-right"
              class="text-neutral-7 text-sm"
            />
          </a>
        </div>
      </div>

      <div class="">
        <h2 class="mb-3 title is-4">
          {{ $t('codeChecker.upload') }}
        </h2>
        <p class="mb-4">
          {{ $t('codeChecker.uploadInstructions') }}
        </p>
        <CodeCheckerFileUploader
          v-model="selectedFile"
          :file-name="fileName"
          @file-selected="onFileSelected"
          @clear="clear"
        />
      </div>

      <div class="">
        <h2 class="mb-3 title is-4">
          {{ $t('codeChecker.codeValidation') }}
        </h2>
        <p
          v-if="!selectedFile"
          class="text-neutral-7"
        >
          {{ $t('codeChecker.uploadPrompt') }}
        </p>
        <div v-else>
          <div
            v-if="errorMessage"
            class="text-red-500"
          >
            {{ $t('error') }}: {{ errorMessage }}
          </div>
          <div v-else>
            <div class="flex justify-between items-center">
              <span class="text-neutral-7">{{
                $t('codeChecker.canvasSize')
              }}</span>
              <span>{{ fileValidity.canvasSize }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-neutral-7">
                {{ $t('codeChecker.artName') }}
              </span>
              <span>{{ fileValidity.title }}</span>
            </div>

            <div class="flex justify-between items-center">
              <span class="text-neutral-7">{{ $t('codeChecker.local') }} p5js</span>
              <span>{{ fileValidity.localP5jsUsed ? 'Yes' : 'No' }}</span>
            </div>
          </div>
        </div>
      </div>
      <div
        v-if="selectedFile && !errorMessage"
        class="border-t border-k-shade pt-5 flex flex-col gap-5"
      >
        <CodeCheckerTestItem
          :passed="fileValidity.validTitle"
          :description="$t('codeChecker.correctHTMLName')"
        >
          <template #modalContent>
            <CodeCheckerIssueHintCorrectHTMLName />
          </template>
        </CodeCheckerTestItem>
        <CodeCheckerTestItem
          :passed="fileValidity.kodaRendererUsed"
          :description="$t('codeChecker.usingKodaHash')"
        >
          <template #modalContent>
            <CodeCheckerIssueHintUsingKodaHash />
          </template>
        </CodeCheckerTestItem>
        <CodeCheckerTestItem
          :passed="fileValidity.kodaRendererCalledOnce"
          :description="$t('codeChecker.kodaHashCalledOnce')"
        >
          <template #modalContent>
            <CodeCheckerIssueHintKodaHashCalledOnce />
          </template>
        </CodeCheckerTestItem>
        <CodeCheckerTestItem
          :passed="fileValidity.externalResourcesNotUsed"
          :description="$t('codeChecker.notUsingExternalResources')"
        >
          <template #modalContent>
            <CodeCheckerIssueHintNotUsingExternalResources />
          </template>
        </CodeCheckerTestItem>
        <CodeCheckerTestItem
          :passed="fileValidity.usesHashParam"
          :description="$t('codeChecker.usingParamHash')"
        >
          <template #modalContent>
            <CodeCheckerIssueHintUsingParamHash />
          </template>
        </CodeCheckerTestItem>

        <CodeCheckerTestItem
          :passed="fileValidity.validKodaRenderPayload"
          :description="$t('codeChecker.validImage')"
        >
          <template #modalContent>
            <CodeCheckerIssueHintValidImage />
          </template>
        </CodeCheckerTestItem>
        <CodeCheckerTestItem
          :passed="fileValidity.consistent"
          :description="$t('codeChecker.consistentArt')"
        >
          <template #modalContent>
            <CodeCheckerIssueHintConsistentArt />
          </template>
        </CodeCheckerTestItem>
        <CodeCheckerTestItem
          :passed="fileValidity.resizerUsed"
          :description="$t('codeChecker.automaticResize')"
          optional
        >
          <template #modalContent>
            <CodeCheckerIssueHintAutomaticResize />
          </template>
        </CodeCheckerTestItem>
        <CodeCheckerTestItem
          :passed="fileValidity.renderDurationValid"
          :description="
            $t('codeChecker.variationLoadingTime')
          "
          optional
        >
          <template #modalContent>
            <CodeCheckerIssueHintVariationLoadingTime />
          </template>
        </CodeCheckerTestItem>
      </div>
    </div>

    <div
      class="w-full lg:w-1/2 flex flex-col items-center lg:mt-4 lg:items-end"
    >
      <!-- Content of the second column -->
      <CodeCheckerPreviewCard
        :selected-file="selectedFile"
        :file-name="fileName"
        :assets="assets"
        :render="Boolean(selectedFile)"
        :koda-renderer-used="fileValidity.kodaRendererUsed"
        :reload-trigger="reloadTrigger"
        :index-url="indexUrl ?? ''"
        @reload="startClock"
        @hash:update="(hash) => (previewHash = hash)"
      />

      <CodeCheckerMassPreview
        v-if="selectedFile && indexContent"
        class="mt-11!"
        :assets="assets"
        :index-content="indexContent"
        @upload="(value) => (indexUrl = value)"
      />

      <div class="max-w-[490px] mt-11">
        <hr
          v-if="selectedFile"
          class="my-2 bg-k-shade2 w-full mb-11!"
        >

        <div class="flex items-center gap-5">
          <div>
            <KIcon
              name="i-mdi:shield-outline"
              class="text-k-grey"
              size="large"
            />
          </div>
          <p class="capitalize text-k-grey">
            {{ $t('codeChecker.confidentialCode') }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { validate } from './validate'
import { createSandboxAssets, extractAssetsFromZip } from './utils'
import config from './codechecker.config'
import type { AssetMessage, Validity } from './types'

const RESOURCES_LIST = [
  {
    title: 'codeChecker.kodahashTemplate',
    url: 'https://github.com/vikiival/kodahash',
  },
  {
    title: 'codeChecker.learnAboutGenArt',
    url: 'https://hello.kodadot.xyz/tutorial/generative-art',
  },
  {
    title: 'codeChecker.codeChecker',
    url: 'https://hello.kodadot.xyz/tutorial/generative-art/code-checker',
  },
]

const validtyDefault: Validity = {
  canvasSize: '',
  localP5jsUsed: false,
  kodaRendererUsed: 'unknown',
  kodaRendererCalledOnce: 'unknown',
  resizerUsed: 'unknown',
  usesHashParam: 'unknown',
  validTitle: 'unknown',
  renderDurationValid: 'loading',
  title: '-',
  validKodaRenderPayload: 'loading',
  consistent: 'loading',
  externalResourcesNotUsed: 'unknown',
}

const selectedFile = ref<File | null>(null)
const assets = ref<AssetMessage[]>([])
const indexContent = ref<string>()
const indexUrl = ref<string>()
const fileName = computed(() => selectedFile.value?.name)
const fileValidity = reactive<Validity>({ ...validtyDefault })
const errorMessage = ref('')
const renderStartTime = ref(0)
const renderEndTime = ref(0)
const renderCount = ref(0)
const reloadTrigger = ref(0)
const firstImage = ref<string>()
const previewHash = ref()

const onFileSelected = async (file: File) => {
  clear()
  startClock()
  selectedFile.value = file
  const { indexFile, sketchFile, p5File, entries } = await extractAssetsFromZip(file)

  if (!indexFile) {
    errorMessage.value = `Index file not found: Please make sure that “index.html” is in the root directory`
    return
  }

  if (!sketchFile) {
    errorMessage.value = `Sketch file not found: ${config.sketchFile}`
    return
  }

  if (!p5File) {
    errorMessage.value = `p5 file not found: Please make sure that “p5.min.js” is in the root directory`
    return
  }

  const valid = validate(indexFile.content, sketchFile.content)
  if (!valid.isSuccess) {
    errorMessage.value = valid.error ?? 'Unknown error'
  }
  else {
    Object.assign(fileValidity, valid.value)
  }

  if (!fileValidity.kodaRendererUsed) {
    fileValidity.renderDurationValid = 'unknown'
    fileValidity.validKodaRenderPayload = 'unknown'
    fileValidity.consistent = 'unknown'
  }

  indexContent.value = indexFile.content
  assets.value = await createSandboxAssets(indexFile, entries)
}

const clear = () => {
  selectedFile.value = null
  assets.value = []
  errorMessage.value = ''
  reloadTrigger.value = 0
  renderCount.value = 0
  indexUrl.value = undefined
  indexContent.value = undefined
  Object.assign(fileValidity, validtyDefault)
}

const startClock = () => {
  renderCount.value = 0
  renderStartTime.value = performance.now()
  fileValidity.renderDurationValid = 'loading'
}

function hasImage(dataURL: string): boolean {
  const regex = /^data:image\/png;base64,([A-Za-z0-9+/]+={0,2})$/
  return regex.test(dataURL)
}

const consistencyField = (payload) => {
  const version: number = parseFloat(payload?.version ?? '0')
  return version >= 1.0 ? payload.base64Details : payload.image
}

useEventListener(window, 'message', async (res) => {
  if (
    res.data?.type === 'kodahash/render/completed'
    && previewHash.value === res.data.payload.hash
  ) {
    renderCount.value++
    fileValidity.kodaRendererCalledOnce = renderCount.value === 1

    const payload = res.data?.payload
    renderEndTime.value = performance.now()
    const duration = renderEndTime.value - renderStartTime.value
    fileValidity.renderDurationValid = duration < config.maxAllowedLoadTime
    fileValidity.validKodaRenderPayload
      = Boolean(payload?.image) && hasImage(payload.image)
    if (fileValidity.validKodaRenderPayload) {
      if (reloadTrigger.value === 0) {
        firstImage.value = consistencyField(payload)
        reloadTrigger.value = 1
      }
      else if (
        fileValidity.consistent === 'loading'
        || fileValidity.consistent === 'unknown'
      ) {
        fileValidity.consistent = firstImage.value === consistencyField(payload)
      }
    }
    else {
      fileValidity.consistent = 'unknown'
    }
  }
})
</script>
