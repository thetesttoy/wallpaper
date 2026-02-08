<template>
  <div class="profile-page">
    <div class="header-section">
      <div class="header-content">
        <h1 class="anime-gradient-text">个人中心</h1>
        <p class="subtitle">查看你的账号信息（来自后端真实接口）</p>
      </div>
    </div>

    <div class="content-section">
      <div class="container">
        <div class="profile-card anime-card">
          <div class="avatar-row">
            <el-avatar
              :size="96"
              :src="userInfo?.avatar || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'"
            />
            <div class="avatar-meta">
              <h2 class="username">{{ userInfo?.username || '-' }}</h2>
              <p class="bio">{{ userInfo?.bio || '这个人很懒，什么都没留下' }}</p>
            </div>
          </div>

          <div class="info-grid">
            <div class="info-item">
              <span class="label">用户ID</span>
              <span class="value">{{ userInfo?.id ?? '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label">性别</span>
              <span class="value">{{ userInfo?.gender || 'unknown' }}</span>
            </div>
          </div>

          <div class="actions">
            <el-button type="primary" :loading="loading" @click="refresh">
              刷新信息
            </el-button>
            <el-button @click="goFavorites">我的收藏</el-button>
          </div>

          <el-alert
            v-if="hint"
            type="info"
            :closable="false"
            show-icon
            class="hint"
            :title="hint"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const hint = ref<string>('')

const userInfo = computed(() => authStore.userInfo)

const refresh = async () => {
  try {
    loading.value = true
    hint.value = ''
    const data = await authStore.fetchUserInfo()
    if (data) ElMessage.success('已刷新')
    else hint.value = '刷新失败：可能是网络问题或 token 已失效（请重新登录）'
  } catch (e: any) {
    hint.value = e?.message || '刷新失败'
  } finally {
    loading.value = false
  }
}

const goFavorites = () => {
  router.push('/favorites')
}

onMounted(async () => {
  // 确保进入页面时有一次最新数据
  await refresh()
})
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
}

.header-section {
  background: var(--anime-gradient);
  padding: 60px 20px;
  position: relative;
  overflow: hidden;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
}

.subtitle {
  margin-top: 10px;
  color: rgba(255, 255, 255, 0.9);
}

.content-section {
  padding: 40px 20px;
  background: var(--anime-bg);
}

.container {
  max-width: 900px;
  margin: 0 auto;
}

.profile-card {
  padding: 28px;
}

.avatar-row {
  display: flex;
  gap: 18px;
  align-items: center;
  margin-bottom: 18px;
}

.avatar-meta .username {
  margin: 0 0 6px;
  color: var(--anime-text);
}

.avatar-meta .bio {
  margin: 0;
  color: var(--anime-text-secondary);
  line-height: 1.6;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-top: 18px;
}

.info-item {
  padding: 14px 16px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.label {
  color: rgba(255, 255, 255, 0.75);
}

.value {
  color: var(--anime-text);
  font-weight: 600;
}

.actions {
  margin-top: 22px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.hint {
  margin-top: 18px;
}

@media (max-width: 640px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>

