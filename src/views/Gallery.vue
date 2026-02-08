<template>
  <div class="gallery-container">
    <!-- 顶部导航栏 -->
    <header class="gallery-header">
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

    <!-- 搜索和筛选 -->
    <div class="filter-bar">
      <el-input
        v-model="searchQuery"
        placeholder="搜索壁纸..."
        class="search-input"
        clearable
        @clear="handleSearch"
        @keyup.enter="handleSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-button @click="handleSearch" type="primary">搜索</el-button>
    </div>

    <!-- 瀑布流图片展示 -->
    <div class="waterfall-wrapper" ref="waterfallRef">
      <div class="waterfall-column" v-for="(column, idx) in columns" :key="idx">
        <div
          v-for="item in column"
          :key="item.id"
          class="image-card"
          @click="openDetail(item)"
        >
          <div class="image-wrapper">
            <img
              :src="item.thumbnail || item.url || 'data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"600\" height=\"400\"><rect width=\"100%\" height=\"100%\" fill=\"%23efefef\"/><text x=\"50%\" y=\"50%\" dominant-baseline=\"middle\" text-anchor=\"middle\" fill=\"%23888\" font-size=\"20\">No Image</text></svg>'"
              :alt="item.name"
              @load="onImageLoad"
              @error="onImageError"
              loading="lazy"
            />
            <div class="image-overlay">
              <div class="overlay-content">
                <h3>{{ item.name }}</h3>
                <div class="actions">
                  <el-button
                    v-if="isAuthenticated"
                    :icon="isFavorited(item.id) ? StarFilled : Star"
                    circle
                    size="small"
                    @click.stop="toggleFavorite(item)"
                  ></el-button>
                  <el-button
                    :icon="Download"
                    circle
                    size="small"
                    @click.stop="downloadImage(item)"
                  ></el-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 加载更多 -->
    <div v-if="hasMore && !loading" class="load-more">
      <el-button @click="loadMore" :loading="loadingMore">加载更多</el-button>
    </div>

    <!-- skeleton loading -->
    <div v-if="loading" class="skeleton-grid gallery-skeleton">
      <div v-for="n in 8" :key="'g-s-'+n" class="skeleton-card">
        <div class="skeleton-img"></div>
        <div class="skeleton-footer">
          <div class="skeleton-line short"></div>
          <div class="skeleton-line"></div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="!loading && images.length === 0" class="empty">
      <el-empty description="暂无壁纸数据"></el-empty>
    </div>

    <!-- 图片详情对话框 -->
    <el-dialog v-model="detailVisible" :title="selectedImage?.name" width="90%" top="5vh">
      <div v-if="selectedImage" class="detail-container">
        <div class="detail-content">
          <div class="detail-image-section">
            <img :src="selectedImage.url" :alt="selectedImage.name" class="detail-image" />
          </div>
          <div class="detail-info">
            <p><strong>标签:</strong> {{ selectedImage.tag || 'default' }}</p>
            <p><strong>上传时间:</strong> {{ formatDate(selectedImage.created_at) }}</p>
            <div class="detail-actions">
              <el-button
                v-if="isAuthenticated"
                :type="isFavorited(selectedImage.id) ? 'warning' : 'primary'"
                :icon="isFavorited(selectedImage.id) ? StarFilled : Star"
                @click="toggleFavorite(selectedImage)"
              >
                {{ isFavorited(selectedImage.id) ? '取消收藏' : '收藏' }}
              </el-button>
              <el-button type="success" :icon="Download" @click="downloadImage(selectedImage)">
                下载原图
              </el-button>
            </div>
          </div>
        </div>
        
        <!-- 评论区 -->
        <div class="comments-section">
          <h3>评论 ({{ comments.length }})</h3>
          
          <!-- 发表评论 -->
          <div v-if="isAuthenticated" class="comment-input">
            <el-input
              v-model="newComment"
              type="textarea"
              :rows="3"
              placeholder="发表你的评论..."
              maxlength="500"
              show-word-limit
            ></el-input>
            <el-button type="primary" @click="submitComment" :loading="commentLoading">
              发表评论
            </el-button>
          </div>
          <div v-else class="comment-login-tip">
            <el-alert type="info" :closable="false">
              <template #title>
                请先 <el-button link type="primary" @click="showLogin = true">登录</el-button> 后发表评论
              </template>
            </el-alert>
          </div>
          
          <!-- 评论列表 -->
          <div class="comments-list">
            <div v-if="loadingComments" class="loading-comments">
              <el-icon class="loading-icon"><Loading /></el-icon>
            </div>
            <div v-else-if="comments.length === 0" class="no-comments">
              <el-empty description="暂无评论，快来发表第一条评论吧！" :image-size="80"></el-empty>
            </div>
            <div v-else>
              <div v-for="comment in comments" :key="comment.id" class="comment-item">
                <el-avatar :src="comment.user_avatar" :size="40"></el-avatar>
                <div class="comment-content">
                  <div class="comment-header">
                    <span class="comment-username">{{ comment.username }}</span>
                    <span class="comment-time">{{ formatDate(comment.created_at) }}</span>
                  </div>
                  <p class="comment-text">{{ comment.content }}</p>
                  <el-button
                    v-if="isAuthenticated && userInfo?.id === comment.user_id"
                    type="danger"
                    size="small"
                    text
                    @click="deleteComment(comment.id)"
                  >
                    删除
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 登录对话框 -->
    <el-dialog v-model="showLogin" title="登录" width="400px">
      <el-form :model="loginForm" label-width="80px">
        <el-form-item label="用户名">
          <el-input v-model="loginForm.username" placeholder="请输入用户名"></el-input>
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" show-password></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showLogin = false">取消</el-button>
        <el-button type="primary" @click="handleLogin" :loading="loginLoading">登录</el-button>
      </template>
    </el-dialog>

    <!-- 注册对话框 -->
    <el-dialog v-model="showRegister" title="注册" width="400px">
      <el-form :model="registerForm" label-width="80px">
        <el-form-item label="用户名">
          <el-input v-model="registerForm.username" placeholder="请输入用户名"></el-input>
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="registerForm.password" type="password" placeholder="请输入密码" show-password></el-input>
        </el-form-item>
        <el-form-item label="头像URL">
          <el-input v-model="registerForm.avatar" placeholder="可选：头像图片URL"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRegister = false">取消</el-button>
        <el-button type="primary" @click="handleRegister" :loading="registerLoading">注册</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, Star, StarFilled, Download, Loading } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

// 响应式数据
const images = ref<any[]>([])
const columns = ref<any[][]>([[], [], []]) // 3列瀑布流
const loading = ref(false)
const loadingMore = ref(false)
// 跟踪图片加载状态
const loadingImages = ref(new Set<string | number>())
const hasMore = ref(true)
const page = ref(1)
const pageSize = ref(20)
const searchQuery = ref('')
const detailVisible = ref(false)
const selectedImage = ref<any>(null)
const showLogin = ref(false)
const showRegister = ref(false)
const loginLoading = ref(false)
const registerLoading = ref(false)
const favoriteIds = ref<Set<number>>(new Set())
const waterfallRef = ref<HTMLElement>()
const comments = ref<any[]>([])
const newComment = ref('')
const commentLoading = ref(false)
const loadingComments = ref(false)

// 表单数据
const loginForm = ref({ username: '', password: '' })
const registerForm = ref({ username: '', password: '', avatar: '' })

// 计算属性
const isAuthenticated = computed(() => authStore.isAuthenticated)
const userInfo = computed(() => authStore.userInfo)

// 获取图片列表
const fetchImages = async (reset = false) => {
  if (reset) {
    page.value = 1
    images.value = []
    columns.value = [[], [], []]
    loading.value = true
  } else {
    loadingMore.value = true
  }

  try {
    const params: any = {
      skip: page.value,
      limit: pageSize.value
    }

    let response;
    if (searchQuery.value) {
      const searchParams: any = { query: searchQuery.value, skip: page.value, limit: pageSize.value }
      response = await authStore.api.get('/api/images/search', { params: searchParams })
    } else {
      response = await authStore.api.get('/api/images/page', { params })
    }
    
    if (response.data.code === 200) {
      const newImages = response.data.data?.images || []

      // 统一格式：确保每张图片都包含 id, name, url, thumbnail
      const normalized = newImages.map((item: any) => ({
        id: item.id ?? item.pixiv_id ?? null,
        name: item.name || item.title || '未命名图片',
        url: item.url || item.original_url || item.originalUrl || item.original || '',
        thumbnail: item.thumbnail || item.thumb_url || item.thumbUrl || item.thumbnailUrl || item.url || '' ,
        tag: item.tag || item.tags || null,
        created_at: item.created_at || item.createdAt || null
      }))

      if (reset) {
        images.value = normalized
      } else {
        images.value.push(...normalized)
      }

      hasMore.value = response.data.data?.has_more || false
      page.value++

      // 重新分配图片到列
      await nextTick()
      distributeImages()
    }
  } catch (error: any) {
    console.error('获取图片失败:', error)
    ElMessage.error(error.response?.data?.detail || '获取图片失败')
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

// 分配图片到列（瀑布流）
const distributeImages = () => {
  const newColumns: any[][] = [[], [], []]
  images.value.forEach((img, index) => {
    // 找到最短的列
    const shortestColumn = newColumns.reduce((min, col, idx) => {
      const minCol = newColumns[min]
      return (minCol && col.length < minCol.length) ? idx : min
    }, 0)
    const targetColumn = newColumns[shortestColumn]
    if (targetColumn) {
      targetColumn.push(img)
    }
  })
  columns.value = newColumns
}

// 图片加载完成
const onImageLoad = () => {
  // 可以在这里做懒加载优化
}

// 图片加载错误
const onImageError = (e: Event) => {
  console.error('图片加载失败:', e)
}

// 图片加载回调
const onItemLoad = (id: string | number) => { loadingImages.value.delete(String(id)) }
const onItemError = (id: string | number) => { loadingImages.value.delete(String(id)) }

const getItemTags = (item: any) => {
  if (!item) return []
  if (Array.isArray(item.tags)) return item.tags
  if (item.tags && typeof item.tags === 'string') return item.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t)
  if (item.tag && typeof item.tag === 'string') return item.tag.split(',').map((t: string) => t.trim()).filter((t: string) => t)
  return []
}

// 点击标签触发搜索
const handleTagClick = (tag: string) => {
  searchQuery.value = tag
  page.value = 1
  fetchImages(true)
}

// 加载更多
const loadMore = () => {
  if (!loadingMore.value && hasMore.value) {
    fetchImages(false)
  }
}

// 搜索
const handleSearch = () => {
  fetchImages(true)
}

// 打开详情
const openDetail = async (item: any) => {
  try {
    // 如果没有 url，尝试获取详情
    if ((!item.url || item.url.trim() === '') && item.id) {
      try {
        const resp = await authStore.api.get(`/api/images/detail/${item.id}`)
        if (resp.data?.code === 200 && resp.data.data) {
          const d = resp.data.data
          item.url = d.url || d.original_url || d.original || item.url
          item.thumbnail = item.thumbnail || d.thumbnail || d.thumb_url || d.thumb
          item.name = item.name || d.name || d.title || item.name
        }
      } catch (e) {
        console.warn('从详情接口获取图片失败:', e)
      }
    }

    selectedImage.value = item
    detailVisible.value = true
    // 加载评论
    await loadComments(item.id)
  } catch (e) {
    console.error('打开详情失败:', e)
    ElMessage.error('打开详情失败')
  }
}

// 加载评论
const loadComments = async (imageId: number) => {
  loadingComments.value = true
  try {
    const response = await authStore.api.get(`/api/comment/list/${imageId}`)
    if (response.data.code === 200) {
      comments.value = response.data.data?.comments || []
    }
  } catch (error) {
    console.error('加载评论失败:', error)
  } finally {
    loadingComments.value = false
  }
}

// 提交评论
const submitComment = async () => {
  if (!newComment.value.trim()) {
    ElMessage.warning('请输入评论内容')
    return
  }

  commentLoading.value = true
  try {
    const response = await authStore.api.post('/api/comment/add', {
      image_id: selectedImage.value.id,
      content: newComment.value.trim()
    })
    
    if (response.data.code === 200) {
      ElMessage.success('评论成功')
      newComment.value = ''
      // 重新加载评论
      await loadComments(selectedImage.value.id)
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.detail || '评论失败')
  } finally {
    commentLoading.value = false
  }
}

// 删除评论
const deleteComment = async (commentId: number) => {
  try {
    await authStore.api.post('/api/comment/delete', { comment_id: commentId })
    ElMessage.success('删除成功')
    // 重新加载评论
    await loadComments(selectedImage.value.id)
  } catch (error: any) {
    ElMessage.error(error.response?.data?.detail || '删除失败')
  }
}

// 切换收藏
const toggleFavorite = async (item: any) => {
  if (!isAuthenticated.value) {
    showLogin.value = true
    return
  }

  const imageId = Number(item.id)
  const isFav = favoriteIds.value.has(imageId)

  try {
    if (isFav) {
      await authStore.api.post('/api/favorite/remove', { image_id: imageId })
      favoriteIds.value.delete(imageId)
      ElMessage.success('取消收藏成功')
    } else {
      await authStore.api.post('/api/favorite/add', { image_id: imageId })
      favoriteIds.value.add(imageId)
      ElMessage.success('收藏成功')
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.detail || '操作失败')
  }
}

// 检查是否收藏
const isFavorited = (imageId: number) => {
  return favoriteIds.value.has(imageId)
}

// 下载图片
const downloadImage = (item: any) => {
  // 创建一个隐藏的 a 标签来触发下载
  const link = document.createElement('a')
  link.href = item.url
  link.download = item.name || 'wallpaper.jpg'
  link.target = '_blank'
  link.rel = 'noopener noreferrer'
  
  // 添加到 DOM 并点击
  document.body.appendChild(link)
  link.click()
  
  // 清理
  setTimeout(() => {
    document.body.removeChild(link)
  }, 100)
  
  ElMessage.success('开始下载')
}

// 登录
const handleLogin = async () => {
  if (!loginForm.value.username || !loginForm.value.password) {
    ElMessage.warning('请输入用户名和密码')
    return
  }

  loginLoading.value = true
  try {
    await authStore.login(loginForm.value)
    ElMessage.success('登录成功')
    showLogin.value = false
    loginForm.value = { username: '', password: '' }
    // 加载收藏列表
    loadFavorites()
  } catch (error: any) {
    ElMessage.error(error.message || '登录失败')
  } finally {
    loginLoading.value = false
  }
}

// 注册
const handleRegister = async () => {
  if (!registerForm.value.username || !registerForm.value.password) {
    ElMessage.warning('请输入用户名和密码')
    return
  }

  registerLoading.value = true
  try {
    await authStore.register(registerForm.value)
    ElMessage.success('注册成功')
    showRegister.value = false
    registerForm.value = { username: '', password: '', avatar: '' }
    // 加载收藏列表
    loadFavorites()
  } catch (error: any) {
    ElMessage.error(error.message || '注册失败')
  } finally {
    registerLoading.value = false
  }
}

// 退出登录
const handleLogout = () => {
  authStore.logout()
  favoriteIds.value.clear()
  ElMessage.success('已退出登录')
}

// 加载收藏列表
const loadFavorites = async () => {
  if (!isAuthenticated.value) return

  try {
    const response = await authStore.api.get('/api/favorite/list')
    if (response.data.code === 200) {
      const favorites = response.data.data?.favorites || []
      favoriteIds.value = new Set(favorites.map((f: any) => f.image_id))
    }
  } catch (error) {
    console.error('加载收藏失败:', error)
  }
}

// 格式化日期
const formatDate = (dateStr: string) => {
  if (!dateStr) return '未知'
  return new Date(dateStr).toLocaleString('zh-CN')
}

// 监听图片变化，重新分配
watch(images, () => {
  nextTick(() => {
    distributeImages()
  })
}, { deep: true })

// 初始化
onMounted(async () => {
  await authStore.checkAuth()
  if (isAuthenticated.value) {
    loadFavorites()
  }
  fetchImages(true)
})
</script>

<style scoped>
.gallery-container {
  min-height: 100vh;
  /* 背景由App.vue统一管理，这里不需要设置背景 */
}

/* 顶部导航 - 二次元风格 */
.gallery-header {
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(15px);
  padding: 1rem 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  position: sticky;
  top: 0;
  z-index: 1000;
  border-bottom: 1px solid rgba(88, 204, 255, 0.2);
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
  font-weight: bold;
  background: var(--anime-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  text-shadow: 0 0 20px rgba(88, 204, 255, 0.5);
  animation: glow-pulse 2s ease-in-out infinite;
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
  transition: all 0.3s;
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
}

/* 搜索栏 - 二次元风格 */
.filter-bar {
  max-width: 1400px;
  margin: 2rem auto;
  padding: 0 2rem;
  display: flex;
  gap: 1rem;
}

.filter-bar :deep(.el-input__wrapper) {
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(88, 204, 255, 0.3);
  border-radius: 20px;
  box-shadow: none;
  transition: all 0.3s;
}

.filter-bar :deep(.el-input__wrapper:hover) {
  border-color: var(--anime-primary);
  box-shadow: 0 0 10px rgba(88, 204, 255, 0.2);
}

.filter-bar :deep(.el-button--primary) {
  background: var(--anime-gradient);
  border: none;
  box-shadow: 0 4px 15px rgba(88, 204, 255, 0.2);
  transition: all 0.3s;
}

.filter-bar :deep(.el-button--primary:hover) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(88, 204, 255, 0.4);
}

.search-input {
  flex: 1;
  max-width: 400px;
}

/* 瀑布流 */
.waterfall-wrapper {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1rem;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.waterfall-column {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.image-card {
  background: var(--anime-card-bg);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(88, 204, 255, 0.2);
  transition: all 0.3s ease;
  cursor: pointer;
}

.image-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: var(--anime-glow);
  border-color: var(--anime-primary);
  background: var(--anime-card-bg-hover);
}

.image-wrapper {
  position: relative;
  width: 100%;
  padding-top: 100%; /* 正方形占位 */
  overflow: hidden;
}

.image-wrapper img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
  opacity: 0;
  transition: opacity 0.3s;
  display: flex;
  align-items: flex-end;
  padding: 1rem;
}

.image-card:hover .image-overlay {
  opacity: 1;
}

.overlay-content {
  width: 100%;
  color: white;
}

.overlay-content h3 {
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

/* 加载更多 */
.load-more {
  text-align: center;
  padding: 2rem;
}

/* 加载中 */
.loading {
  text-align: center;
  padding: 4rem;
  color: rgba(255, 255, 255, 0.9);
}

.loading-icon {
  font-size: 3rem;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes glow-pulse {
  0%, 100% {
    opacity: 1;
    filter: brightness(1);
  }
  50% {
    opacity: 0.8;
    filter: brightness(1.2);
  }
}

/* 空状态 */
.empty {
  padding: 4rem;
  text-align: center;
}

/* 详情对话框 - 二次元风格 */
.detail-container {
  max-height: 80vh;
  overflow-y: auto;
}

:deep(.el-dialog) {
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(88, 204, 255, 0.3);
  border-radius: 20px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.5);
}

:deep(.el-dialog__header) {
  border-bottom: 1px solid rgba(88, 204, 255, 0.2);
  padding: 20px;
}

:deep(.el-dialog__title) {
  color: rgba(255, 255, 255, 0.9);
  font-weight: bold;
  background: var(--anime-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.detail-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
}

.detail-image-section {
  position: sticky;
  top: 0;
}

.detail-image {
  width: 100%;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.detail-info {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.detail-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

/* 评论区 */
.comments-section {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 2rem;
}

.comments-section h3 {
  margin-bottom: 1rem;
  font-size: 1.2rem;
}

.comment-input {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.comment-input .el-button {
  align-self: flex-end;
}

.comment-login-tip {
  margin-bottom: 2rem;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.loading-comments {
  text-align: center;
  padding: 2rem;
}

.no-comments {
  padding: 2rem;
}

.comment-item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.comment-content {
  flex: 1;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.comment-username {
  font-weight: 600;
  color: var(--anime-primary-light);
}

.comment-time {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
}

.comment-text {
  margin: 0 0 0.5rem 0;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.8);
  word-wrap: break-word;
}

/* 响应式 */
@media (max-width: 1024px) {
  .waterfall-wrapper {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .waterfall-wrapper {
    grid-template-columns: 1fr;
  }
  
  .detail-content {
    grid-template-columns: 1fr;
  }
  
  .filter-bar {
    flex-direction: column;
  }
  
  .comment-item {
    flex-direction: column;
  }
}
</style>
