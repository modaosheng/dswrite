import { ref } from 'vue'

// 开发模式标志
export const isDev = ref(process.env.NODE_ENV === 'development')
export const showDebugInfo = ref(false)

// 日志工具
export const logger = {
  log: (...args: any[]) => {
    if (isDev.value) {
      console.log('[App]', ...args)
    }
  },
  error: (...args: any[]) => {
    if (isDev.value) {
      console.error('[App]', ...args)
    }
  },
  info: (...args: any[]) => {
    if (isDev.value) {
      console.info('[App]', ...args)
    }
  },
  debug: (...args: any[]) => {
    if (isDev.value) {
      console.debug('[App]', ...args)
    }
  },
  // 创建带有特定标签的日志器
  createLogger: (tag: string) => ({
    log: (...args: any[]) => {
      if (isDev.value) {
        console.log(`[${tag}]`, ...args)
      }
    },
    error: (...args: any[]) => {
      if (isDev.value) {
        console.error(`[${tag}]`, ...args)
      }
    },
    info: (...args: any[]) => {
      if (isDev.value) {
        console.info(`[${tag}]`, ...args)
      }
    },
    debug: (...args: any[]) => {
      if (isDev.value) {
        console.debug(`[${tag}]`, ...args)
      }
    }
  })
}

// 调试面板组件
export const DebugPanel = {
  name: 'DebugPanel',
  props: {
    data: {
      type: Object,
      required: true
    },
    title: {
      type: String,
      default: '调试信息'
    }
  }
} 