<template>
  <div class="app-container" :style="backgroundStyle">
    <div class="background-overlay"></div>
    <div class="content-wrapper">
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const backgroundImageUrl = ref<string | null>(null)

// 计算背景样式
const backgroundStyle = computed(() => {
  if (backgroundImageUrl.value) {
    return {
      backgroundImage: `url(${backgroundImageUrl.value})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed'
    }
  }
  return {}
})

// 获取随机背景图
const fetchRandomBackground = async () => {
  try {
    const response = await authStore.api.get('/api/images/random-background')
    if (response.data.code === 200 && response.data.data?.url) {
      backgroundImageUrl.value = response.data.data.url
    }
  } catch (error) {
    // 静默处理错误，不影响页面显示
    console.warn('获取随机背景图失败（将使用默认背景）:', error)
  }
}

onMounted(() => {
  fetchRandomBackground()
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', 'Microsoft YaHei', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.app-container {
  position: relative;
  min-height: 100vh;
  width: 100%;
}

.background-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    135deg,
    rgba(15, 23, 42, 0.9) 0%,
    rgba(88, 204, 255, 0.1) 40%,
    rgba(199, 125, 255, 0.1) 100%
  );
  z-index: 0;
  pointer-events: none;
}

.content-wrapper {
  position: relative;
  z-index: 1;
  min-height: 100vh;
}

#app {
  min-height: 100vh;
}
</style>
