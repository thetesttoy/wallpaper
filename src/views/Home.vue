<template>
  <div class="home-container">
    <!-- 顶部导航栏 -->
    <header class="home-header">
      <div class="header-content">
        <h1 class="logo">🎨 雪之下</h1>
        <nav class="nav">
          <router-link to="/" class="nav-link">首页</router-link>
          <router-link to="/favorites" v-if="isAuthenticated" class="nav-link">我的收藏</router-link>
          <div v-if="isAuthenticated" class="user-menu">
            <el-dropdown>
              <span class="user-info">
                <el-avatar :size="32" :src="userInfo?.avatar"></el-avatar>
                <span>{{ userInfo?.username }}</span>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="handleLogout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
          <div v-else class="auth-buttons">
            <el-button size="small" @click="showLogin = true">登录</el-button>
            <el-button type="primary" size="small" @click="showRegister = true">注册</el-button>
          </div>
        </nav>
      </div>
    </header>

    <!-- 搜索和筛选栏 -->
    <div class="filter-section">
      <div class="filter-card">
        <!-- 标题和高级模式 -->
        <div class="filter-header">
          <h2 class="filter-title">搜索壁纸</h2>
        </div>

        <!-- 主搜索栏 -->
        <div class="main-search">
          <el-input
            v-model="searchQuery"
            placeholder="搜索图片标题、作者、标签..."
            :prefix-icon="Search"
            clearable
            @clear="handleSearch"
            @keyup.enter="handleSearch"
            class="search-input-main"
            size="large"
          />
          <el-button 
            type="primary" 
            :icon="Search" 
            @click="handleSearch"
            class="search-button"
            size="large"
          >
            搜索
          </el-button>
        </div>

        <!-- 高级筛选已移除 -->
      </div>
    </div>

    <!-- 瀑布流壁纸展示 -->
    <div class="wallpaper-section">
      <!-- skeleton loading -->
      <div v-if="loading && wallpapers.length === 0" class="skeleton-grid">
        <div v-for="n in 8" :key="'s'+n" class="skeleton-card">
          <div class="skeleton-img"></div>
          <div class="skeleton-footer">
            <div class="skeleton-line short"></div>
            <div class="skeleton-line"></div>
          </div>
        </div>
      </div>
      
      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="6" animated></el-skeleton>
      </div>
      
      <div v-else-if="wallpapers.length === 0" class="empty-state">
        <el-empty description="暂无壁纸数据">
          <template #description>
            <p>暂无壁纸数据</p>
            <el-button type="primary" @click="fetchWallpapers(true)" style="margin-top: 20px;">
              刷新数据
            </el-button>
          </template>
        </el-empty>
      </div>

      <div v-else class="waterfall-container">
        
        <!-- 使用简单的网格布局替代瀑布流组件 -->
        <div class="wallpaper-grid">
          <div
            v-for="item in wallpapers"
            :key="item.id"
            class="wallpaper-card"
            @click="handleImageClick(item)"
          >
            <div class="wallpaper-image-container">
              <img
                :src="item.thumbnailUrl || item.imageUrl"
                :alt="item.title"
                class="wallpaper-image"
                loading="lazy"
                @error="(e) => handleImageError(e, item)"
              />
              <div class="wallpaper-overlay">
                <div class="overlay-content">
                  <div class="wallpaper-info">
                    <h3 class="wallpaper-title">{{ item.title }}</h3>
                    <p class="wallpaper-author">by {{ item.author || '匿名' }}</p>
                  </div>
                  <div class="wallpaper-actions">
                    <el-button
                      type="success"
                      :icon="Download"
                      circle
                      size="small"
                      @click.stop="handleDownload(item)"
                    ></el-button>
                  </div>
                </div>
              </div>
            </div>
            <div class="wallpaper-footer">
              <div class="footer-title">{{ item.title }}</div>
              <div class="wallpaper-stats">
                <span class="stat-item">
                  <el-icon :size="16"><View /></el-icon>
                  {{ item.views || 0 }}
                </span>
                <span class="stat-item">
                  <el-icon :size="16"><Star /></el-icon>
                  {{ item.likes || 0 }}
                </span>
              </div>
              <div class="wallpaper-tags">
                <el-tag
                  v-for="tag in item.tags?.slice(0, 2) || []"
                  :key="tag"
                  size="small"
                  type="info"
                  class="clickable-tag"
                  @click.stop="handleTagClick(tag)"
                >
                  {{ tag }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 加载更多 -->
        <div v-if="hasMore" class="load-more">
          <el-button
            :loading="loadingMore"
            type="primary"
            @click="loadMore"
          >
            {{ loadingMore ? '加载中...' : '加载更多' }}
          </el-button>
        </div>
      </div>
    </div>

    <!-- 图片详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="壁纸详情"
      width="80%"
      top="5vh"
      destroy-on-close
    >
      <div v-if="selectedWallpaper" class="wallpaper-detail">
        <div class="detail-image-container">
          <img
            :src="selectedWallpaper.imageUrl || '/placeholder-image.jpg'"
            :alt="selectedWallpaper.title"
            class="detail-image"
          />
        </div>
        <div class="detail-info">
          <h2>{{ selectedWallpaper.title }}</h2>
          <p class="detail-description">
            {{ selectedWallpaper.description || '暂无描述' }}
          </p>
          <div class="detail-meta">
            <div class="meta-item" v-if="selectedWallpaper.author">
              <strong>作者:</strong> 
              <span v-if="selectedWallpaper.authorUrl" class="pixiv-link">{{ selectedWallpaper.author }}</span>
              <span v-else>{{ selectedWallpaper.author }}</span>
            </div>
            <div class="meta-item">
              <strong>上传时间:</strong> {{ selectedWallpaper.uploadTime || '未知' }}
            </div>
          </div>
          <div class="detail-tags">
            <el-tag
              v-for="tag in selectedWallpaper.tags || []"
              :key="tag"
              type="primary"
              size="small"
            >
              {{ tag }}
            </el-tag>
          </div>
          <div class="detail-actions">
            <el-button type="primary" :icon="Download" @click="handleDownload(selectedWallpaper)">
              下载原图
            </el-button>
            <el-button :icon="Star" @click="handleFavorite(selectedWallpaper)">
              收藏
            </el-button>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 登录对话框 -->
    <el-dialog v-model="showLogin" title="登录" width="350px" @closed="resetForms">
      <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules" label-width="0px">
        <el-form-item prop="username">
          <el-input v-model="loginForm.username" placeholder="用户名" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="loginForm.password" type="password" placeholder="密码" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleLogin" style="width: 100%;">登录</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>

    <!-- 注册对话框 -->
    <el-dialog v-model="showRegister" title="注册" width="350px" @closed="resetForms">
      <el-form ref="registerFormRef" :model="registerForm" :rules="registerRules" label-width="0px">
        <el-form-item prop="username">
          <el-input v-model="registerForm.username" placeholder="用户名" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="registerForm.password" type="password" placeholder="密码" show-password />
        </el-form-item>
        <el-form-item prop="confirmPassword">
          <el-input v-model="registerForm.confirmPassword" type="password" placeholder="确认密码" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleRegister" style="width: 100%;">注册</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, reactive } from 'vue'
import { Star, Download, View, Share, Search, ArrowDown, ArrowUp } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import type { Wallpaper } from '@/types/wallpaper'
// @ts-ignore
import Waterfall from 'vue-waterfall-next'
import type { FormInstance, FormRules } from 'element-plus'

// 开发环境标识
const isDev = import.meta.env.DEV

// 全局占位图（内嵌 SVG，避免静态文件依赖）
const placeholderImg = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="100%" height="100%" fill="%23efefef"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23888" font-size="20">No Image</text></svg>'

// 认证相关
const authStore = useAuthStore()
const router = useRouter()
const isAuthenticated = computed(() => authStore.isAuthenticated)
const userInfo = computed(() => authStore.user)

const showLogin = ref(false)
const showRegister = ref(false)

const loginFormRef = ref<FormInstance>()
const registerFormRef = ref<FormInstance>()

const loginForm = reactive({
  username: '',
  password: ''
})

const registerForm = reactive({
  username: '',
  password: '',
  confirmPassword: ''
})

const validatePass = (rule: any, value: any, callback: any) => {
  if (value === '') {
    callback(new Error('请输入密码'))
  } else {
    if (registerForm.confirmPassword !== '') {
      if (!registerFormRef.value) return
      registerFormRef.value.validateField('confirmPassword', () => null)
    }
    callback()
  }
}
const validatePass2 = (rule: any, value: any, callback: any) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== registerForm.password) {
    callback(new Error("两次输入的密码不一致!"))
  } else {
    callback()
  }
}

const loginRules = reactive<FormRules>({
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
})

const registerRules = reactive<FormRules>({
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, validator: validatePass, trigger: 'blur' }],
  confirmPassword: [{ required: true, validator: validatePass2, trigger: 'blur' }]
})

const handleLogin = async () => {
  if (!loginFormRef.value) return
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await authStore.login({
          username: loginForm.username,
          password: loginForm.password
        })
        ElMessage.success('登录成功')
        showLogin.value = false
      } catch (error: any) {
        ElMessage.error(error.message || '登录失败')
      }
    }
  })
}

const handleRegister = async () => {
  if (!registerFormRef.value) return
  await registerFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await authStore.register({
          username: registerForm.username,
          password: registerForm.password
        })
        ElMessage.success('注册成功，请登录')
        showRegister.value = false
        showLogin.value = true // 注册成功后自动打开登录框
      } catch (error: any) {
        ElMessage.error(error.message || '注册失败')
      }
    }
  })
}

const handleLogout = () => {
  authStore.logout()
  ElMessage.success('已退出登录')
  router.push('/')
}

const resetForms = () => {
  loginFormRef.value?.resetFields()
  registerFormRef.value?.resetFields()
}

// 响应式数据
const loading = ref(true)
const loadingMore = ref(false)
const wallpapers = ref<Wallpaper[]>([])
// 跟踪每张图片的加载状态（用于渐变/占位）
const loadingImages = ref(new Set<string | number>())
const page = ref(1)
const pageSize = ref(20)
const hasMore = ref(true)
const detailDialogVisible = ref(false)
const selectedWallpaper = ref<Wallpaper | null>(null)
const searchQuery = ref('')
const selectedTag = ref<string | null>(null)
const availableTags = ref<string[]>(['all'])
const sortBy = ref('newest')
const sortOrder = ref<'asc' | 'desc'>('desc')
const tagTotal = ref(0)

// 瀑布流组件已通过 import 导入

// 瀑布流响应式断点
const breakpoints = {
  1200: { // 当屏幕宽度 <= 1200
    rowPerView: 4
  },
  800: { // 当屏幕宽度 <= 800
    rowPerView: 3
  },
  500: { // 当屏幕宽度 <= 500
    rowPerView: 2
  }
}

// 方法
const fetchWallpapers = async (reset = false) => {
  if (reset) {
    page.value = 1
    wallpapers.value = []
    loading.value = true
  } else {
    loadingMore.value = true
  }

  try {
    const params: any = {
      skip: page.value,
      limit: pageSize.value,
      sort_by: sortBy.value
    }
    
    // 添加搜索和筛选参数
    if (searchQuery.value) {
      params.search = searchQuery.value
    }
    if (selectedTag.value && selectedTag.value !== 'all') {
      params.tag = selectedTag.value
    }

    // 根据是否有搜索关键词选择接口
    let response;
    if (searchQuery.value) {
      const searchParams: any = { query: searchQuery.value, skip: page.value, limit: pageSize.value }
      response = await authStore.api.get('/api/images/search', { params: searchParams })
    } else {
      // ✅ 对齐后端真实接口：GET /api/images/page
      response = await authStore.api.get('/api/images/page', { params })
    }

    if (response.data.code === 200) {
      const apiData = response.data.data?.images || []
      
      // 调试：打印原始数据
      console.log('[调试] API返回的原始数据:', apiData)
      if (apiData.length > 0) {
        console.log('[调试] 第一张图片数据:', apiData[0])
        console.log('[调试] 第一张图片URL:', apiData[0]?.url)
      }

      // 使用后端返回的完整字段
      const formattedData: Wallpaper[] = apiData.map((item: any) => {
        // 处理tags：支持数组和字符串两种格式
        let tags: string[] = []
        if (Array.isArray(item.tags)) {
          tags = item.tags
        } else if (item.tags) {
          tags = item.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t)
        } else if (item.tag) {
          tags = [item.tag]
        }

        // 尝试从后端不同字段中获取URL和缩略图（兼容多种命名）
        const imageUrl = item.url || item.original_url || item.originalUrl || item.original || item.originalUrl || ''
        const thumbnailUrl = item.thumbnail || item.thumb_url || item.thumbUrl || item.thumbnailUrl || item.thumb || item.url || ''

        // 调试：打印URL信息
        if (!imageUrl && !thumbnailUrl) {
          console.warn('[警告] 图片URL为空（可能稍后可通过详情接口获取）:', item)
        }

        const wallpaper: Wallpaper = {
          id: String(item.id ?? item.pixiv_id ?? ''),
          title: item.name || item.title || item.name || '未命名图片',
          imageUrl: imageUrl,
          thumbnailUrl: thumbnailUrl,
          tags: tags,
          uploadTime: item.created_at || item.createdAt || undefined,
          addedDate: item.created_at || item.createdAt || undefined,
          category: item.tag || item.tags || undefined,
          // 新增字段
          pixivUrl: item.pixiv_url || item.pixivUrl || null,
          pixivId: item.pixiv_id ? String(item.pixiv_id) : (item.pixivId ? String(item.pixivId) : null),
          author: item.author || null,
          authorUrl: item.author_url || item.authorUrl || null,
          authorId: item.author_id ? String(item.author_id) : (item.authorId ? String(item.authorId) : null),
          viewCount: item.view_count || item.viewCount || 0,
          ratingCount: item.rating_count || item.ratingCount || 0,
          rank: item.rank || 0,
          views: item.view_count || item.viewCount || 0,
          likes: item.rating_count || item.ratingCount || 0,
          downloads: 0
        }
        return wallpaper
      })

      console.log('[调试] 格式化后的数据:', formattedData)
      if (formattedData.length > 0) {
        console.log('[调试] 第一张格式化后的图片URL:', formattedData[0]?.imageUrl)
        console.log('[调试] 第一张图片完整数据:', formattedData[0])
      } else {
        console.warn('[警告] API返回了空数据')
        console.log('[调试] API响应:', response.data)
      }

      // 过滤掉没有任何标识（id/pixivId）或 URL/缩略图的数据
      const validData = formattedData.filter(w => {
        const hasUrl = w.imageUrl && w.imageUrl.trim() !== ''
        const hasThumbnail = w.thumbnailUrl && w.thumbnailUrl.trim() !== ''
        const hasIdentifier = w.pixivId || w.id
        return hasUrl || hasThumbnail || hasIdentifier
      })
      
      if (validData.length < formattedData.length) {
        console.warn(`[警告] 过滤了 ${formattedData.length - validData.length} 条无效数据（图片URL为空）`)
      }

      if (reset) {
        wallpapers.value = validData
      } else {
        wallpapers.value.push(...validData)
      }

      // 标记这些图片为加载中（用于展示渐变和占位）
      validData.forEach(w => {
        try { loadingImages.value.add(String(w.id)) } catch (e) {}
      })

      hasMore.value = !!response.data.data?.has_more
      page.value++
      
      // 如果没有数据，给出提示
      if (validData.length === 0 && reset) {
        console.warn('[警告] 没有有效的图片数据')
        console.log('[调试] API响应数据:', response.data)
      }
    } else {
      ElMessage.error(response.data.message || '获取图片数据失败')
    }
  } catch (error: any) {
    console.error('获取图片失败:', error)
    ElMessage.error(error.response?.data?.detail || error.message || '获取图片数据失败')
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const loadMore = () => {
  if (!loadingMore.value && hasMore.value) {
    fetchWallpapers(false)
  }
}

const handleImageClick = async (wallpaper: Wallpaper) => {
  console.log('[交互] 点击图片：', wallpaper?.id || wallpaper?.pixivId || wallpaper?.title)
  try {
    // 如果没有可用图片 URL，尝试通过详情接口获取（后端可能在详情里有原图）
    if ((!wallpaper.imageUrl || wallpaper.imageUrl.trim() === '') && wallpaper.id) {
      try {
        const resp = await authStore.api.get(`/api/images/detail/${wallpaper.id}`)
        if (resp.data?.code === 200 && resp.data.data) {
          const d = resp.data.data
          wallpaper.imageUrl = d.url || d.original_url || d.originalUrl || wallpaper.imageUrl
          wallpaper.thumbnailUrl = wallpaper.thumbnailUrl || d.thumbnail || d.thumb_url || d.thumb
          wallpaper.title = wallpaper.title || d.name || d.title || wallpaper.title
        }
      } catch (e) {
        console.warn('尝试从详情接口获取图片失败:', e)
      }
    }

    selectedWallpaper.value = wallpaper
    detailDialogVisible.value = true
  } catch (e: any) {
    console.error('打开详情失败:', e)
    ElMessage.error('打开详情失败')
  }
}

const handleFavorite = async (wallpaper: Wallpaper) => {
  if (!isAuthenticated.value) {
    ElMessage.warning('请先登录后再收藏')
    return
  }
  
  try {
    const response = await authStore.api.post(`/api/favorite/add`, {
      image_id: Number(wallpaper.id)
    })
    
    if (response.data.code === 200) {
      ElMessage.success('收藏成功')
    } else {
      ElMessage.error(response.data.message || '收藏失败')
    }
  } catch (error: any) {
    console.error('收藏失败:', error)
    ElMessage.error(error.response?.data?.detail || error.message || '收藏失败')
  }
}

const handleDownload = async (wallpaper: Wallpaper) => {
  try {
    // 记录下载
    await authStore.api.post(`/api/images/download/${wallpaper.id}`)
    
    // 触发文件下载
    const link = document.createElement('a')
    link.href = wallpaper.imageUrl
    link.download = wallpaper.title + '.jpg'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    ElMessage.success('开始下载')
  } catch (error: any) {
    console.error('下载失败:', error)
    ElMessage.error(error.response?.data?.detail || error.message || '下载失败')
  }
}

const handleShare = (wallpaper: Wallpaper) => {
  ElMessage.info(`分享: ${wallpaper.title}`)
  // 实际项目中这里应该实现分享功能
}

const handleImageError = (event: Event, wallpaper: Wallpaper) => {
  console.error(`[错误] 图片加载失败!`)
  console.error(`  - 图片URL: ${wallpaper.imageUrl}`)
  console.error(`  - 缩略图URL: ${wallpaper.thumbnailUrl}`)
  console.error(`  - 图片ID: ${wallpaper.id}`)
  console.error(`  - 图片标题: ${wallpaper.title}`)
  console.error(`  - 错误事件:`, event)
  
  // 尝试使用备用URL
  const img = event.target as HTMLImageElement
  if (wallpaper.thumbnailUrl && img.src !== wallpaper.thumbnailUrl) {
    console.log(`[尝试] 使用缩略图URL: ${wallpaper.thumbnailUrl}`)
    img.src = wallpaper.thumbnailUrl
  } else if (wallpaper.imageUrl && img.src !== wallpaper.imageUrl) {
    console.log(`[尝试] 使用原图URL: ${wallpaper.imageUrl}`)
    img.src = wallpaper.imageUrl
  } else {
    // 如果所有URL都失败，显示占位图
    img.src = placeholderImg
    img.style.opacity = '0.5'
  }
  
  // 只在开发环境显示错误提示
  if (isDev) {
    ElMessage.warning(`图片加载失败: ${wallpaper.title || wallpaper.id}`)
  }

  // 移除加载状态标记
  loadingImages.value.delete(String(wallpaper.id))
}

// 图片加载回调
const onItemLoad = (id: string | number) => {
  loadingImages.value.delete(String(id))
}
const onItemError = (id: string | number) => {
  loadingImages.value.delete(String(id))
}

// 点击标签搜索
const handleTagClick = (tag: string) => {
  searchQuery.value = tag
  page.value = 1
  fetchWallpapers(true)
}

// 筛选和搜索方法
const handleSearch = () => {
  fetchWallpapers(true)
}

const handleTagFilter = () => {
  fetchWallpapers(true)
}

const selectTag = (tag: string) => {
  selectedTag.value = tag === 'all' ? null : tag
  handleTagFilter()
}

const clearTag = () => {
  selectedTag.value = null
  handleTagFilter()
}

// 计算显示的标签（限制显示数量）
const displayedTags = computed(() => {
  if (availableTags.value.length <= 30) {
    return availableTags.value
  }
  return availableTags.value.slice(0, 30)
})

// 获取可用标签（分批加载）
const tagOffset = ref(0)
const tagLimit = ref(20) // 每次加载20个标签
const tagHasMore = ref(true)
const tagLoading = ref(false)

const fetchTags = async (reset = false) => {
  if (tagLoading.value) return
  
  if (reset) {
    tagOffset.value = 0
    availableTags.value = ['all']
    tagHasMore.value = true
  }
  
  if (!tagHasMore.value) return
  
  tagLoading.value = true
  try {
    const response = await authStore.api.get('/api/images/categories', {
      params: {
        limit: tagLimit.value,
        offset: tagOffset.value
      }
    })
    if (response.data.code === 200) {
      const newTags: string[] = response.data.data?.categories || []
      const total = response.data.data?.total || 0
      tagTotal.value = total
      
      if (reset) {
        availableTags.value = newTags
      } else {
        // 合并标签，去重
        const existingTags = new Set(availableTags.value)
        newTags.forEach((tag) => {
          if (!existingTags.has(tag)) {
            availableTags.value.push(tag)
          }
        })
      }
      
      tagOffset.value += tagLimit.value
      tagHasMore.value = response.data.data?.has_more || false
    }
  } catch (error) {
    console.error('获取标签失败:', error)
  } finally {
    tagLoading.value = false
  }
}

// 加载更多标签
const loadMoreTags = () => {
  if (!tagLoading.value && tagHasMore.value) {
    fetchTags(false)
  }
}

// 生命周期
onMounted(() => {
  fetchTags(true) // 首次加载标签
  fetchWallpapers(true)
})
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  /* 背景由App.vue统一管理，这里不需要设置背景 */
}

/* 导航栏样式 */
.home-header {
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(88, 204, 255, 0.2);
  padding: 15px 20px;
  position: sticky;
  top: 0;
  z-index: 200;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-size: 1.8rem;
  font-weight: 700;
  background: var(--anime-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  text-shadow: 0 0 20px rgba(88, 204, 255, 0.3);
}

.nav {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.nav-link {
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  transition: all 0.3s ease;
  font-weight: 500;
}

.nav-link:hover,
.nav-link.router-link-active {
  background: var(--anime-gradient);
  color: white;
  box-shadow: 0 4px 15px rgba(88, 204, 255, 0.4);
  transform: translateY(-2px);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.9);
}

.auth-buttons {
  display: flex;
  gap: 10px;
}

.filter-section {
  padding: 20px;
  position: relative;
  z-index: 100;
}

.filter-card {
  max-width: 1200px;
  margin: 0 auto;
  background: var(--anime-card-bg);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 25px;
  border: 1px solid rgba(88, 204, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.filter-title {
  font-size: 1.5rem;
  font-weight: 700;
  background: var(--anime-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
}

.advanced-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.9rem;
}

.main-search {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
}

.search-input-main {
  flex: 1;
}

.search-input-main :deep(.el-input__wrapper) {
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(88, 204, 255, 0.2);
  border-left: 3px solid var(--anime-primary);
  box-shadow: none;
  transition: all 0.3s ease;
}

.search-input-main :deep(.el-input__wrapper:hover) {
  border-color: var(--anime-primary);
  box-shadow: 0 0 10px rgba(88, 204, 255, 0.2);
}

.search-input-main :deep(.el-input__inner) {
  color: rgba(255, 255, 255, 0.9);
}

.search-button {
  background: var(--anime-gradient);
  border: none;
  box-shadow: var(--anime-glow);
  font-weight: 600;
  padding: 0 30px;
}

.search-button:hover {
  box-shadow: var(--anime-glow-secondary);
  transform: translateY(-2px);
}

.advanced-filters {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 182, 193, 0.2);
}

.filter-tabs :deep(.el-tabs__header) {
  margin-bottom: 20px;
}

.filter-tabs :deep(.el-tabs__item) {
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
}

.filter-tabs :deep(.el-tabs__item.is-active) {
  color: var(--anime-primary);
}

.filter-tabs :deep(.el-tabs__active-bar) {
  background: var(--anime-primary);
}

.tag-filter-content {
  min-height: 100px;
}

.tag-display {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 15px;
}

.filter-tag {
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 20px;
  padding: 8px 16px;
  font-size: 0.9rem;
}

.filter-tag:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 107, 157, 0.3);
}

.load-more-tags-btn {
  margin-top: 10px;
}

.filter-options {
  padding: 10px 0;
}

.filter-row {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-item label {
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.9rem;
  white-space: nowrap;
}

.filter-select {
  min-width: 150px;
}

.filter-select :deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 182, 193, 0.3);
}

.wallpaper-section {
  padding: 20px;
}

.loading-container {
  max-width: 800px;
  margin: 40px auto;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: rgba(255, 255, 255, 0.9);
}

.waterfall-container {
  margin-top: 30px;
  min-height: 400px;
  position: relative;
  z-index: 10;
  padding: 20px;
}

/* 网格布局 */
.wallpaper-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  padding: 20px 0;
}

@media (max-width: 1200px) {
  .wallpaper-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  }
}

@media (max-width: 800px) {
  .wallpaper-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 15px;
  }
}

@media (max-width: 500px) {
  .wallpaper-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 10px;
  }
}

.wallpaper-card {
  background: var(--anime-card-bg);
  backdrop-filter: blur(15px);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(88, 204, 255, 0.2);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  margin-bottom: 20px;
}

.wallpaper-card:hover {
  transform: translateY(-10px) scale(1.03);
  box-shadow: var(--anime-glow), var(--anime-glow-secondary);
  border-color: var(--anime-primary);
  background: var(--anime-card-bg-hover);
}

.wallpaper-image-container {
  position: relative;
  overflow: hidden;
  border-radius: 15px 15px 0 0;
}

.wallpaper-image {
  width: 100%;
  height: auto;
  display: block;
  transition: transform 0.5s ease;
  object-fit: cover;
  min-height: 200px;
  background: rgba(88, 204, 255, 0.1);
  background-image: linear-gradient(135deg, rgba(88, 204, 255, 0.1) 0%, rgba(199, 125, 255, 0.1) 100%);
}

.wallpaper-image[src=""],
.wallpaper-image:not([src]) {
  background: linear-gradient(135deg, rgba(88, 204, 255, 0.2) 0%, rgba(199, 125, 255, 0.2) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.wallpaper-image[src=""]::after,
.wallpaper-image:not([src])::after {
  content: "图片加载中...";
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
}

.wallpaper-card:hover .wallpaper-image {
  transform: scale(1.05);
}

.wallpaper-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
  opacity: 0;
  transition: opacity 0.3s ease;
  display: flex;
  align-items: flex-end;
  padding: 20px;
  /* 不拦截点击，避免覆盖卡片点击行为 */
  pointer-events: none;
}

.wallpaper-card:hover .wallpaper-overlay {
  opacity: 1;
  /* 悬停时允许内部按钮交互 */
  pointer-events: auto;
}

.overlay-content {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.wallpaper-info {
  color: white;
}

.wallpaper-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 5px;
}

.wallpaper-author {
  font-size: 0.9rem;
  opacity: 0.8;
}

.wallpaper-actions {
  display: flex;
  gap: 10px;
}

.wallpaper-footer {
  padding: 15px;
  background: rgba(255, 182, 193, 0.1);
  backdrop-filter: blur(10px);
}

.footer-title {
  font-size: 1rem;
  font-weight: 600;
  color: rgba(255,255,255,0.95);
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.wallpaper-stats {
  display: flex;
  gap: 20px;
  margin-bottom: 10px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
}

.wallpaper-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.load-more {
  text-align: center;
  margin-top: 40px;
}

.wallpaper-detail {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
}

.detail-image-container {
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.detail-image {
  width: 100%;
  height: auto;
  display: block;
}

.detail-info h2 {
  font-size: 2rem;
  margin-bottom: 20px;
  background: var(--anime-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 700;
}

.pixiv-link {
  color: var(--anime-primary-light);
  text-decoration: none;
  transition: all 0.3s ease;
  border-bottom: 1px solid transparent;
}

.pixiv-link:hover {
  color: var(--anime-primary);
  border-bottom-color: var(--anime-primary);
  text-shadow: 0 0 10px rgba(88, 204, 255, 0.5);
}

.detail-description {
  font-size: 1.1rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 30px;
}

.detail-meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-bottom: 30px;
}

.meta-item {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.8);
}

.meta-item strong {
  color: rgba(255, 255, 255, 0.95);
  margin-right: 8px;
}

.detail-tags {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.detail-actions {
  display: flex;
  gap: 15px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .wallpaper-detail {
    grid-template-columns: 1fr;
  }
  
  .detail-meta {
    grid-template-columns: 1fr;
  }
}
</style>
