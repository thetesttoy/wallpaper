<template>
  <div class="favorites-page">
    <!-- 头部区域 -->
    <div class="header-section">
      <div class="header-content">
        <h1 class="anime-gradient-text">
          <el-icon><StarFilled /></el-icon> 我的收藏
        </h1>
        <p class="subtitle">这里收藏了你所有喜欢的壁纸</p>
        
        <!-- 收藏统计 -->
        <div class="stats-cards">
          <div class="stat-card anime-card">
            <div class="stat-icon">
              <el-icon><PictureFilled /></el-icon>
            </div>
            <div class="stat-info">
              <h3>{{ totalFavorites }}</h3>
              <p>收藏壁纸</p>
            </div>
          </div>
          
          <div class="stat-card anime-card">
            <div class="stat-icon">
              <el-icon><View /></el-icon>
            </div>
            <div class="stat-info">
              <h3>{{ totalViews }}</h3>
              <p>总浏览</p>
            </div>
          </div>
          
          <div class="stat-card anime-card">
            <div class="stat-icon">
              <el-icon><Download /></el-icon>
            </div>
            <div class="stat-info">
              <h3>{{ totalDownloads }}</h3>
              <p>总下载</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="content-section">
      <div class="container">
        <!-- 筛选和排序 -->
        <div class="filter-section">
          <div class="filter-controls">
            <el-input
              v-model="searchQuery"
              placeholder="搜索收藏的壁纸..."
              class="search-input"
              :prefix-icon="Search"
              clearable
            ></el-input>
            
            <div class="filter-buttons">
              <el-button
                v-for="category in categories"
                :key="category.value"
                :type="activeCategory === category.value ? 'primary' : 'default'"
                @click="activeCategory = category.value"
                class="category-btn"
              >
                {{ category.label }}
              </el-button>
            </div>
            
            <el-select
              v-model="sortBy"
              placeholder="排序方式"
              class="sort-select"
            >
              <el-option
                v-for="option in sortOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              ></el-option>
            </el-select>
          </div>
        </div>

        <!-- 加载状态 -->
        <div v-if="loading" class="loading-state">
          <el-icon class="loading-icon" size="60"><Loading></Loading></el-icon>
          <p>加载收藏中...</p>
        </div>

        <!-- 收藏壁纸列表 -->
        <div v-else-if="filteredFavorites.length > 0" class="favorites-grid">
          <div
            v-for="wallpaper in paginatedFavorites"
            :key="wallpaper.id"
            class="favorite-item anime-card"
          >
            <div class="wallpaper-image">
              <img :src="wallpaper.imageUrl" :alt="wallpaper.title" @click="showDetail(wallpaper)" />
              <div class="image-overlay">
                <div class="overlay-actions">
                  <el-button
                    type="primary"
                    :icon="Download"
                    circle
                    @click.stop="downloadWallpaper(wallpaper)"
                  ></el-button>
                  <el-button
                    type="danger"
                    :icon="Delete"
                    circle
                    @click.stop="removeFromFavorites(wallpaper.id)"
                  ></el-button>
                </div>
              </div>
            </div>
            
            <div class="wallpaper-info">
              <h3>{{ wallpaper.title }}</h3>
              <p class="description">{{ wallpaper.description || '暂无描述' }}</p>
              
              <div class="wallpaper-meta">
                <div class="meta-item">
                  <el-icon><View /></el-icon>
                  <span>{{ wallpaper.views.toLocaleString() }}</span>
                </div>
                <div class="meta-item">
                  <el-icon><Download /></el-icon>
                  <span>{{ wallpaper.downloads.toLocaleString() }}</span>
                </div>
                <div class="meta-item">
                  <el-icon><Star /></el-icon>
                  <span>{{ wallpaper.likes.toLocaleString() }}</span>
                </div>
              </div>
              
              <div class="tags">
                <el-tag
                  v-for="tag in wallpaper.tags || []"
                  :key="tag"
                  size="small"
                  type="info"
                  class="tag"
                >
                  {{ tag }}
                </el-tag>
              </div>
              
              <div class="added-date">
                <el-icon><Clock /></el-icon>
                <span>收藏于：{{ formatDate(wallpaper.addedDate || wallpaper.uploadTime || '') }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
          <div v-else class="empty-state">
            <div class="empty-content">
              <el-icon size="80"><Star></Star></el-icon>
              <h3>暂无收藏</h3>
              <p>你还没有收藏任何壁纸，快去发现喜欢的作品吧！</p>
              <el-button type="primary" @click="goToHome">
                <el-icon><HomeFilled></HomeFilled></el-icon>
                浏览壁纸
              </el-button>
            </div>
          </div>

        <!-- 分页 -->
        <div v-if="!loading && filteredFavorites.length > 0" class="pagination-section">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="filteredFavorites.length"
          :page-sizes="[12, 24, 36, 48]"
          layout="total, sizes, prev, pager, next, jumper"
          background
        ></el-pagination>
        </div>
      </div>
    </div>

    <!-- 壁纸详情对话框 -->
    <el-dialog
      v-model="detailVisible"
      :title="selectedWallpaper?.title"
      width="800px"
      class="wallpaper-dialog"
    >
      <div v-if="selectedWallpaper" class="dialog-content">
        <div class="dialog-image">
          <img :src="selectedWallpaper.imageUrl" :alt="selectedWallpaper.title" />
        </div>
        <div class="dialog-info">
          <h3>{{ selectedWallpaper.title }}</h3>
          <p class="dialog-description">{{ selectedWallpaper.description || '暂无描述' }}</p>
          
          <div class="dialog-stats">
            <div class="stat-item">
              <el-icon><View /></el-icon>
              <span>浏览：{{ selectedWallpaper.views.toLocaleString() }}</span>
            </div>
            <div class="stat-item">
              <el-icon><Download /></el-icon>
              <span>下载：{{ selectedWallpaper.downloads.toLocaleString() }}</span>
            </div>
            <div class="stat-item">
              <el-icon><Star /></el-icon>
              <span>点赞：{{ selectedWallpaper.likes.toLocaleString() }}</span>
            </div>
          </div>
          
          <div class="dialog-tags">
            <span class="tags-label">标签：</span>
            <el-tag
              v-for="tag in selectedWallpaper.tags || []"
              :key="tag"
              size="small"
              type="primary"
            >
              {{ tag }}
            </el-tag>
          </div>
          
          <div class="dialog-actions">
            <el-button type="primary" :icon="Download" @click="downloadWallpaper(selectedWallpaper)">
              下载壁纸
            </el-button>
            <el-button :icon="FullScreen" @click="viewFullscreen">
              全屏查看
            </el-button>
            <el-button type="danger" :icon="Delete" @click="removeFromFavorites(selectedWallpaper.id)">
              移除收藏
            </el-button>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { Wallpaper } from '@/types/wallpaper'
import { useAuthStore } from '@/stores/auth'
import {
  StarFilled,
  PictureFilled,
  View,
  Download,
  Search,
  Delete,
  Clock,
  Star,
  HomeFilled,
  FullScreen,
  Loading
} from '@element-plus/icons-vue'

const router = useRouter()
const authStore = useAuthStore()

// 响应式数据
const favorites = ref<Wallpaper[]>([])
const searchQuery = ref('')
const activeCategory = ref('all')
const sortBy = ref('date')
const currentPage = ref(1)
const pageSize = ref(12)
const detailVisible = ref(false)
const selectedWallpaper = ref<Wallpaper | null>(null)
const loading = ref(false)

// 统计
const totalFavorites = computed(() => favorites.value.length)
const totalViews = computed(() => favorites.value.reduce((sum, item) => sum + item.views, 0))
const totalDownloads = computed(() => favorites.value.reduce((sum, item) => sum + item.downloads, 0))

// 分类选项
const categories = [
  { label: '全部', value: 'all' },
  { label: '动漫', value: 'anime' },
  { label: '幻想', value: 'fantasy' },
  { label: '游戏', value: 'game' },
  { label: '风景', value: 'landscape' }
]

// 排序选项
const sortOptions = [
  { label: '收藏时间', value: 'date' },
  { label: '浏览数', value: 'views' },
  { label: '下载数', value: 'downloads' },
  { label: '点赞数', value: 'likes' }
]

// 过滤后的收藏
const filteredFavorites = computed(() => {
  let result = [...favorites.value]
  
  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(item =>
      item.title.toLowerCase().includes(query) ||
      (item.description && item.description.toLowerCase().includes(query)) ||
      (item.tags && item.tags.some(tag => tag.toLowerCase().includes(query)))
    )
  }
  
  // 分类过滤
  if (activeCategory.value !== 'all') {
    result = result.filter(item => item.category === activeCategory.value)
  }
  
  // 排序
  switch (sortBy.value) {
    case 'views':
      result.sort((a, b) => b.views - a.views)
      break
    case 'downloads':
      result.sort((a, b) => b.downloads - a.downloads)
      break
    case 'likes':
      result.sort((a, b) => b.likes - a.likes)
      break
    default: // date
      result.sort((a, b) => {
        const dateA = new Date(a.addedDate || a.uploadTime || '').getTime()
        const dateB = new Date(b.addedDate || b.uploadTime || '').getTime()
        return dateB - dateA
      })
  }
  
  return result
})

// 分页后的数据
const paginatedFavorites = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredFavorites.value.slice(start, end)
})

// 加载收藏数据
const loadFavorites = async () => {
  if (!authStore.isAuthenticated) {
    ElMessage.warning('请先登录')
    return
  }

  try {
    loading.value = true
    const response = await authStore.api.get('/api/favorite/list')
    
    if (response.data.code === 200) {
      // ✅ 对齐后端真实返回：data.favorites = [{ id, image_id, created_at, image: {id, name, url, thumbnail, tag, created_at} }]
      const list = response.data.data?.favorites || []
      favorites.value = list.map((row: any) => {
        const img = row.image || {}
        return {
          id: String(img.id ?? row.image_id ?? row.id ?? ''),
          title: img.name || '未命名壁纸',
          imageUrl: img.url || '',
          thumbnailUrl: img.thumbnail || img.url || '', // ⭐ 使用后端返回的 thumbnail 字段
          category: img.tag || 'default',
          tags: img.tag ? [img.tag] : [],
          views: 0,
          downloads: 0,
          likes: 0,
          // 收藏时间用 favorite.created_at；图片时间用 image.created_at
          addedDate: row.created_at || undefined,
          uploadTime: img.created_at || undefined
        } as Wallpaper
      })
    } else {
      ElMessage.error(response.data.message || '加载收藏失败')
    }
  } catch (error: any) {
    console.error('加载收藏失败:', error)
    ElMessage.error(error.response?.data?.detail || error.message || '加载收藏失败')
  } finally {
    loading.value = false
  }
}

// 移除收藏
const removeFromFavorites = async (id: string) => {
  try {
    await ElMessageBox.confirm(
      '确定要从收藏中移除这个壁纸吗？',
      '移除收藏',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const response = await authStore.api.post(`/api/favorite/remove`, {
      image_id: Number(id)
    })
    
    if (response.data.code === 200) {
      // 从本地列表中移除
      favorites.value = favorites.value.filter(item => item.id !== id)
      ElMessage.success('已从收藏中移除')
      
      // 如果当前查看的壁纸被移除，关闭对话框
      if (selectedWallpaper.value?.id === id) {
        detailVisible.value = false
        selectedWallpaper.value = null
      }
    } else {
      ElMessage.error(response.data.message || '移除收藏失败')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('移除收藏失败:', error)
      ElMessage.error(error.response?.data?.detail || error.message || '移除收藏失败')
    }
  }
}

// 下载壁纸
const downloadWallpaper = async (wallpaper: Wallpaper) => {
  try {
    // 记录下载（后端是模拟记录，不返回文件流）
    await authStore.api.post(`/api/images/download/${wallpaper.id}`)

    // 直接触发浏览器下载原图
    const link = document.createElement('a')
    link.href = wallpaper.imageUrl
    link.download = `${wallpaper.title}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    ElMessage.success(`开始下载：${wallpaper.title}`)
  } catch (error: any) {
    console.error('下载失败:', error)
    ElMessage.error(error.response?.data?.detail || error.message || '下载失败')
  }
}

// 其他方法
const showDetail = (wallpaper: Wallpaper) => {
  selectedWallpaper.value = wallpaper
  detailVisible.value = true
}

const viewFullscreen = () => {
  if (selectedWallpaper.value) {
    window.open(selectedWallpaper.value.imageUrl, '_blank')
  }
}

const formatDate = (dateString: string) => {
  if (!dateString) return '未知时间'
  
  try {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch {
    return dateString
  }
}

const goToHome = () => {
  router.push('/')
}

onMounted(() => {
  // 检查认证状态
  authStore.checkAuth().then(() => {
    if (authStore.isAuthenticated) {
      loadFavorites()
    } else {
      ElMessage.warning('请先登录查看收藏')
      router.push('/')
    }
  })
})
</script>

<style scoped>
.favorites-page {
  min-height: 100vh;
}

/* 头部区域 */
.header-section {
  background: var(--anime-gradient);
  padding: 60px 20px;
  position: relative;
  overflow: hidden;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  z-index: 2;
}

.header-section h1 {
  font-size: 3rem;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 15px;
}

.subtitle {
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 40px;
}

/* 统计卡片 */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 40px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 25px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.stat-icon {
  font-size: 2.5rem;
  color: var(--anime-primary);
  margin-right: 20px;
}

.stat-info h3 {
  font-size: 2rem;
  margin-bottom: 5px;
  color: white;
}

.stat-info p {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
}

/* 内容区域 */
.content-section {
  padding: 40px 20px;
  background: var(--anime-bg);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

/* 筛选区域 */
.filter-section {
  margin-bottom: 40px;
}

.filter-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: center;
}

.search-input {
  flex: 1;
  min-width: 300px;
}

.filter-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.category-btn {
  border-radius: 20px;
}

.sort-select {
  width: 150px;
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
}

.loading-icon {
  animation: spin 1s linear infinite;
  color: var(--anime-primary);
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-state p {
  color: var(--anime-text);
  font-size: 1.2rem;
}

/* 收藏网格 */
.favorites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 30px;
  margin-bottom: 40px;
}

.favorite-item {
  background: white;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.favorite-item:hover {
  transform: translateY(-10px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.wallpaper-image {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.wallpaper-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
  cursor: pointer;
}

.favorite-item:hover .wallpaper-image img {
  transform: scale(1.05);
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.favorite-item:hover .image-overlay {
  opacity: 1;
}

.overlay-actions {
  display: flex;
  gap: 15px;
}

.wallpaper-info {
  padding: 20px;
}

.wallpaper-info h3 {
  font-size: 1.3rem;
  margin-bottom: 10px;
  color: var(--anime-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.description {
  color: var(--anime-text-secondary);
  font-size: 0.9rem;
  margin-bottom: 15px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.wallpaper-meta {
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--anime-text-secondary);
  font-size: 0.9rem;
}

.meta-item .el-icon {
  color: var(--anime-primary);
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-bottom: 15px;
}

.tag {
  border-radius: 10px;
}

.added-date {
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--anime-text-secondary);
  font-size: 0.85rem;
}

.added-date .el-icon {
  color: var(--anime-accent);
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
}

.empty-content .el-icon {
  color: var(--anime-primary);
  margin-bottom: 20px;
}

.empty-content h3 {
  font-size: 1.8rem;
  margin-bottom: 10px;
  color: var(--anime-text);
}

.empty-content p {
  color: var(--anime-text-secondary);
  margin-bottom: 30px;
  font-size: 1.1rem;
}

/* 分页 */
.pagination-section {
  display: flex;
  justify-content: center;
  margin-top: 40px;
}

/* 对话框 */
.wallpaper-dialog .el-dialog__header {
  border-bottom: 1px solid var(--el-border-color-light);
  padding-bottom: 20px;
}

.dialog-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
}

.dialog-image {
  border-radius: 10px;
  overflow: hidden;
}

.dialog-image img {
  width: 100%;
  height: auto;
  border-radius: 10px;
}

.dialog-info h3 {
  font-size: 1.5rem;
  margin-bottom: 15px;
  color: var(--anime-text);
}

.dialog-description {
  color: var(--anime-text-secondary);
  margin-bottom: 20px;
  line-height: 1.6;
}

.dialog-stats {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--anime-text);
}

.stat-item .el-icon {
  color: var(--anime-primary);
}

.dialog-tags {
  margin-bottom: 25px;
}

.tags-label {
  color: var(--anime-text-secondary);
  margin-right: 10px;
}

.dialog-tags .el-tag {
  margin-right: 5px;
  margin-bottom: 5px;
}

.dialog-actions {
  display: flex;
  gap: 15px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-section h1 {
    font-size: 2rem;
  }
  
  .stats-cards {
    grid-template-columns: 1fr;
  }
  
  .filter-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-input {
    min-width: auto;
  }
  
  .favorites-grid {
    grid-template-columns: 1fr;
  }
  
  .dialog-content {
    grid-template-columns: 1fr;
  }
  
  .dialog-actions {
    flex-direction: column;
  }
}

@media (max-width: 480px) {
  .header-section {
    padding: 40px 15px;
  }
  
  .content-section {
    padding: 30px 15px;
  }
  
  .wallpaper-meta {
    flex-direction: column;
    gap: 10px;
  }
}
</style>
