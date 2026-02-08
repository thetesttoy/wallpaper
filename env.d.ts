/// <reference types="vite/client" />

// 为import.meta.env添加类型定义
interface ImportMeta {
  readonly env: {
    readonly BASE_URL: string
    readonly MODE: string
    readonly DEV: boolean
    readonly PROD: boolean
    readonly SSR: boolean
  }
}
