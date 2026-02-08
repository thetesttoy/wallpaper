<template>
  <div class="favorites-container">
    <header class="favorites-header">
      <div class="header-content">
        <h1>⭐ 我的收藏</h1>
        <el-button @click="$router.push('/')">返回首页</el-button>
      </div>
    </header>

    <div class="favorites-content">
      <div v-if="loading" class="loading">
        <el-icon class="loading-icon"><Loading /></el-icon>
        <p>加载中...</p>
      </div>

      <div v-else-if="favorites.length === 0" class="empty">
        <el-empty description="暂无收藏">
          <el-button type="primary" @click="$router.push('/')">去浏览壁纸</el-button>
        </el-empty>
      </div>

      <div v-else class="favorites-grid">
        <div
          v-for="item in favorites"
          :key="item.id"
          class="favorite-card"
          @click="openDetail(item.image)"
        >
          <div class="image-wrapper">
            <img :src="item.image.url" :alt="item.image.name" />
            <div class="image-overlay">
              <el-button
                type="danger"
                :icon="Delete"
                circle
                size="small"
                @click.stop="removeFavorite(item.image_id)"
              ></el-button>
            </div>
          </div>
          <div class="card-info">
            <h3>{{ item.image.name }}</h3>
            <p class="tag">{{ item.image.tag || 'default' }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 详情对话框 -->
    <el-dialog v-model="detailVisible" :title="selectedImage?.name" width="80%">
      <div v-if="selectedImage" class="detail-content">
        <img :src="selectedImage.url" :alt="selectedImage.name" class="detail-image" />
        <div class="detail-info">
          <p><strong>标签:</strong> {{ selectedImage.tag || 'default' }}</p>
          <p><strong>收藏时间:</strong> {{ formatDate(selectedImage.created_at) }}</p>
          <div class="detail-actions">
            <el-button type="danger" :icon="Delete" @click="removeFavorite(selectedImage.id)">
              取消收藏
            </el-button>
            <el-button type="success" :icon="Download" @click="downloadImage(selectedImage)">
              下载
            </el-button>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Download, Loading } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const favorites = ref<any[]>([])
const loading = ref(false)
const detailVisible = ref(false)
const selectedImage = ref<any>(null)

// 加载收藏列表
const loadFavorites = async () => {
  loading.value = true
  try {
    const response = await authStore.api.get('/api/favorite/list', {
      params: { skip: 0, limit: 100 }
    })
    
    if (response.data.code === 200) {
      favorites.value = response.data.data?.favorites || []
    }
  } catch (error: any) {
    console.error('加载收藏失败:', error)
    ElMessage.error(error.response?.data?.detail || '加载收藏失败')
  } finally {
    loading.value = false
  }
}

// 移除收藏
const removeFavorite = async (imageId: number) => {
  try {
    await ElMessageBox.confirm('确定要取消收藏吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await authStore.api.post('/api/favorite/remove', { image_id: imageId })
    ElMessage.success('取消收藏成功')
    
    // 重新加载列表
    loadFavorites()
    
    // 如果当前查看的图片被移除，关闭对话框
    if (selectedImage.value?.id === imageId) {
      detailVisible.value = false
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.detail || '取消收藏失败')
    }
  }
}

// 打开详情
const openDetail = (image: any) => {
  selectedImage.value = image
  detailVisible.value = true
}

// 下载图片
const downloadImage = (image: any) => {
  const link = document.createElement('a')
  link.href = image.url
  link.download = image.name
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  ElMessage.success('开始下载')
}

// 格式化日期
const formatDate = (dateStr: string) => {
  if (!dateStr) return '未知'
  return new Date(dateStr).toLocaleString('zh-CN')
}

onMounted(() => {
  if (!authStore.isAuthenticated) {
    router.push('/')
    return
  }
  loadFavorites()
})
</script>

<style scoped>
.favorites-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.favorites-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 1.5rem 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.favorites-header h1 {
  margin: 0;
  background: linear-gradient(45deg, #ff6b9d, #6a5af9);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.favorites-content {
  max-width: 1400px;
  margin: 2rem auto;
  padding: 0 1rem;
}

.loading, .empty {
  text-align: center;
  padding: 4rem;
  color: white;
}

.loading-icon {
  font-size: 3rem;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.favorites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
}

.favorite-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: transform 0.3s;
  cursor: pointer;
}

.favorite-card:hover {
  transform: translateY(-5px);
}

.image-wrapper {
  position: relative;
  width: 100%;
  padding-top: 100%;
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
  background: rgba(0, 0, 0, 0.5);
  opacity: 0;
  transition: opacity 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.favorite-card:hover .image-overlay {
  opacity: 1;
}

.card-info {
  padding: 1rem;
}

.card-info h3 {
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tag {
  margin: 0;
  color: #666;
  font-size: 0.8rem;
}

.detail-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
}

.detail-image {
  width: 100%;
  border-radius: 12px;
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

@media (max-width: 768px) {
  .favorites-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
  
  .detail-content {
    grid-template-columns: 1fr;
  }
}
</style>
