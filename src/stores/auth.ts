import { defineStore } from 'pinia'
import { ref, computed, markRaw } from 'vue'
import axios from 'axios'
import type { AxiosError } from 'axios'
import type { AxiosInstance } from 'axios'

// API基础URL - 从 Vite 环境变量读取（推荐），否则回退到本地默认
// 你可以在 `vue-wallpaper-app/.env` 中配置：VITE_API_BASE_URL=http://8.130.32.230:8000/
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

// 用户信息接口
export interface UserInfo {
  id: number
  username: string
  avatar?: string
  gender?: string
  bio?: string
}

// 登录请求接口
export interface LoginRequest {
  username: string
  password: string
}

// 注册请求接口
export interface RegisterRequest {
  username: string
  password: string
  avatar?: string
}

// 登录响应接口
export interface LoginResponse {
  code: number
  message: string
  data: {
    token: string
    userInfo: UserInfo
  }
}

// 用户信息响应接口
export interface UserInfoResponse {
  code: number
  message: string
  data: UserInfo
}

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const token = ref<string | null>(localStorage.getItem('token'))
  const userInfo = ref<UserInfo | null>(null)
  const isLoading = ref(false)

  // 计算属性
  const isAuthenticated = computed(() => !!token.value)

  // 配置axios默认值
  // 关键：axios.create() 返回的是“可调用函数”(typeof === 'function')，Pinia 会把函数当 action 包装，
  // 从而出现 “authStore.api.get is not a function”。
  // 所以这里保留真正的 axios 实例为内部变量 `rawApi`，对外只暴露一个普通对象（非函数）形式的客户端。
  const rawApi: AxiosInstance = markRaw(axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json'
    }
  }))

  const api = markRaw({
    request: rawApi.request.bind(rawApi),
    get: rawApi.get.bind(rawApi),
    post: rawApi.post.bind(rawApi),
    put: rawApi.put.bind(rawApi),
    delete: rawApi.delete.bind(rawApi)
  })

  // 请求拦截器 - 添加token
  rawApi.interceptors.request.use(
    (config) => {
      if (token.value) {
        config.headers.Authorization = `Bearer ${token.value}`
      }
      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  // 响应拦截器 - 处理错误
  rawApi.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (error.response?.status === 401) {
        // token过期或无效
        logout()
      }
      return Promise.reject(error)
    }
  )

  // 登录
  const login = async (credentials: LoginRequest) => {
    try {
      isLoading.value = true
      const response = await rawApi.post<LoginResponse>('/api/user/login', credentials)
      
      if (response.data.code === 200) {
        const { token: newToken, userInfo: userData } = response.data.data
        
        // 保存token和用户信息
        token.value = newToken
        userInfo.value = userData
        localStorage.setItem('token', newToken)
        localStorage.setItem('userInfo', JSON.stringify(userData))
        
        return userData
      } else {
        throw new Error(response.data.message || '登录失败')
      }
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || '登录失败'
      throw new Error(message)
    } finally {
      isLoading.value = false
    }
  }

  // 注册
  const register = async (userData: RegisterRequest) => {
    try {
      isLoading.value = true
      const response = await rawApi.post<LoginResponse>('/api/user/register', userData)
      
      if (response.data.code === 200) {
        const { token: newToken, userInfo: userInfoData } = response.data.data
        
        // 保存token和用户信息
        token.value = newToken
        userInfo.value = userInfoData
        localStorage.setItem('token', newToken)
        localStorage.setItem('userInfo', JSON.stringify(userInfoData))
        
        return userInfoData
      } else {
        throw new Error(response.data.message || '注册失败')
      }
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || '注册失败'
      throw new Error(message)
    } finally {
      isLoading.value = false
    }
  }

  // 获取用户信息
  const fetchUserInfo = async () => {
    try {
      if (!token.value) return null
      
      isLoading.value = true
      const response = await rawApi.get<UserInfoResponse>('/api/user/info')
      
      if (response.data.code === 200) {
        userInfo.value = response.data.data
        localStorage.setItem('userInfo', JSON.stringify(response.data.data))
        return response.data.data
      } else {
        throw new Error(response.data.message || '获取用户信息失败')
      }
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || '获取用户信息失败'
      console.error('获取用户信息失败:', message)
      // 获取失败时不清除token，可能是网络问题
      return null
    } finally {
      isLoading.value = false
    }
  }

  // 检查认证状态
  const checkAuth = async () => {
    const savedToken = localStorage.getItem('token')
    const savedUserInfo = localStorage.getItem('userInfo')
    
    if (savedToken) {
      token.value = savedToken
      
      if (savedUserInfo) {
        try {
          userInfo.value = JSON.parse(savedUserInfo)
        } catch {
          // 解析失败，清除本地存储
          localStorage.removeItem('userInfo')
        }
      }
      
      // 验证token有效性
      try {
        await fetchUserInfo()
      } catch {
        // token无效，清除状态
        logout()
      }
    }
  }

  // 退出登录
  const logout = () => {
    token.value = null
    userInfo.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
  }

  // 更新用户信息
  const updateUserInfo = (info: Partial<UserInfo>) => {
    if (userInfo.value) {
      userInfo.value = { ...userInfo.value, ...info }
      localStorage.setItem('userInfo', JSON.stringify(userInfo.value))
    }
  }

  return {
    // 状态
    token,
    userInfo,
    isLoading,
    
    // 计算属性
    isAuthenticated,
    
    // API实例
    api,
    
    // 方法
    login,
    register,
    fetchUserInfo,
    checkAuth,
    logout,
    updateUserInfo
  }
})
