<template>
  <n-config-provider :theme="darkTheme">
    <div>
      <n-form
        ref="formRef"
        class="form"
        label-width="auto"
        label-placement="top"
        :model="formValue"
        :rules="rules"
      >
        <div class="form-items">
          <n-form-item label="APP ID" path="appid">
            <n-input v-model:value="formValue.appid" placeholder="默认群侠传，启动Id" />
          </n-form-item>
          <n-form-item label="Publishedfile Id">
            <n-input
              v-model:value="formValue.publishedfileid"
              placeholder="创建新Mod可以不设，更新Mod则用原Id"
            />
          </n-form-item>
          <n-form-item label="标题" path="title">
            <n-input v-model:value="formValue.title" placeholder="" />
          </n-form-item>
          <n-form-item label="内容简介">
            <n-input v-model:value="formValue.description" type="textarea" placeholder="" />
          </n-form-item>
          <n-form-item label="更新日志">
            <n-input v-model:value="formValue.changenote" type="textarea" placeholder="" />
          </n-form-item>
          <n-form-item label="可见性">
            <n-radio-group v-model:value="formValue.visibility" name="radiogroup">
              <n-space>
                <n-radio
                  v-for="visibility in visibilities"
                  :key="visibility.value"
                  :value="visibility.value"
                >
                  {{ visibility.label }}
                </n-radio>
              </n-space>
            </n-radio-group>
          </n-form-item>
        </div>
        <div class="form-items">
          <n-form-item label="Steam LoginName" path="loginName">
            <n-input v-model:value="formValue.loginName" placeholder="账户名称" />
          </n-form-item>
          <n-form-item label="Steam Password" path="password">
            <n-input v-model:value="formValue.password" type="password" placeholder="密码" />
          </n-form-item>
          <n-form-item label="Steam Guard">
            <n-input v-model:value="formValue.guard" placeholder="有令牌则输入，无则不用" />
          </n-form-item>
          <n-form-item label="内容文件夹" path="contentfolder">
            <n-input v-model:value="formValue.contentfolder" placeholder="" />
            <n-button style="margin-left: 12px" @click="handleContentfolderClick">浏览</n-button>
          </n-form-item>
          <n-form-item label="预览图" path="previewfile">
            <n-input v-model:value="formValue.previewfile" placeholder="" />
            <n-button style="margin-left: 12px" @click="handlePreviewfileClick">浏览</n-button>
          </n-form-item>
          <n-form-item>
            <n-button size="large" :loading="loading" @click="handleValidateClick">上传</n-button>
          </n-form-item>
        </div>
      </n-form>
    </div>
    <n-modal v-model:show="active" :mask-closable="false">
      <n-card
        style="width: 600px"
        title="日志"
        :bordered="false"
        size="huge"
        role="dialog"
        aria-modal="true"
      >
        <n-log ref="logRef" :log="log" trim />
      </n-card>
    </n-modal>
  </n-config-provider>
</template>

<script setup lang="ts">
import { ref, onMounted, watchEffect, nextTick } from 'vue'
import {
  NConfigProvider,
  darkTheme,
  FormInst,
  NForm,
  NFormItem,
  NButton,
  NInput,
  NRadioGroup,
  NRadio,
  NSpace,
  NModal,
  NCard,
  NLog,
  LogInst
} from 'naive-ui'
const formRef = ref<FormInst | null>(null)
const initVal = {
  appid: '2098790',
  publishedfileid: '',
  title: '',
  description: '',
  changenote: '',
  visibility: '0',
  loginName: '',
  password: '',
  guard: '',
  contentfolder: '',
  previewfile: ''
}
const formValue = ref({ ...initVal })
const visibilities = [
  {
    label: '所有人可见',
    value: '0'
  },
  {
    label: '仅好友可见',
    value: '1'
  },
  {
    label: '仅创建者',
    value: '2'
  }
]
const rules = ref({
  appid: {
    required: true,
    message: '请APP ID',
    trigger: ['blur']
  },
  title: {
    required: true,
    message: '请输入标题',
    trigger: ['blur']
  },
  loginName: {
    required: true,
    message: '请输入账户名称',
    trigger: ['blur']
  },
  password: {
    required: true,
    message: '请输入密码',
    trigger: ['blur']
  },
  contentfolder: {
    required: true,
    message: '请选择内容文件夹',
    trigger: ['blur']
  },
  previewfile: {
    required: true,
    message: '请选择预览图',
    trigger: ['blur']
  }
})
const loading = ref(false)
const active = ref(false)
const log = ref('')
const logRef = ref<LogInst | null>(null)

onMounted(async () => {
  try {
    // eslint-disable-next-line no-undef
    const string = await ipcRenderer.invoke('get-store')
    // eslint-disable-next-line no-undef
    const value = await ipcRenderer.invoke('get-vdf')
    formValue.value = { ...JSON.parse(string), ...JSON.parse(value) }
  } catch (error) {
    console.log(error)
  }
  watchEffect(() => {
    if (log.value) {
      nextTick(() => {
        logRef.value?.scrollTo({ position: 'bottom', slient: true })
      })
    }
  })
})

const handleContentfolderClick = async () => {
  // eslint-disable-next-line no-undef
  const result = await ipcRenderer.invoke('open-directory')
  formValue.value.contentfolder = result[0]
}

const handlePreviewfileClick = async () => {
  // eslint-disable-next-line no-undef
  const result = await ipcRenderer.invoke('open-file')
  formValue.value.previewfile = result[0]
}

const handleValidateClick = (e: MouseEvent) => {
  e.preventDefault()
  formRef.value?.validate(async (errors) => {
    if (!errors) {
      loading.value = true
      active.value = true
      const {
        appid,
        publishedfileid,
        title,
        description,
        changenote,
        visibility,
        loginName,
        password,
        guard,
        contentfolder,
        previewfile
      } = formValue.value
      const value = {
        appid,
        publishedfileid,
        title,
        description,
        changenote,
        visibility,
        contentfolder,
        previewfile
      }
      const auth = {
        loginName,
        password,
        guard
      }
      // eslint-disable-next-line no-undef
      await ipcRenderer.invoke('set-store', JSON.stringify(auth, null, 2))
      // eslint-disable-next-line no-undef
      await ipcRenderer.invoke('write-file', JSON.stringify(value, null, 2))
      // eslint-disable-next-line no-undef
      log.value += await ipcRenderer.invoke('download-file')
      // eslint-disable-next-line no-undef
      await ipcRenderer.invoke('cmd', JSON.stringify(auth))
      // eslint-disable-next-line no-undef
      ipcRenderer.on('stdout', (_event, result) => {
        log.value += result
      })
      // eslint-disable-next-line no-undef
      ipcRenderer.on('close', () => {
        loading.value = false
      })
    } else {
      console.error(errors)
    }
  })
}
</script>

<style lang="less">
@import './assets/css/styles.less';
.form {
  display: flex;
}
.form-items {
  width: 50%;
  padding: 20px;
}
</style>
