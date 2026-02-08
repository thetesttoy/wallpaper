<template>
  <div class="about-page">
    <!-- 英雄区域 -->
    <div class="hero-section">
      <div class="hero-content">
        <h1 class="anime-gradient-text">关于 AnimeWall</h1>
        <p class="subtitle">一个为二次元爱好者打造的壁纸分享平台</p>
        <div class="floating-elements">
          <div class="float-element float-animation" style="animation-delay: 0s;"></div>
          <div class="float-element float-animation" style="animation-delay: 1s;"></div>
          <div class="float-element float-animation" style="animation-delay: 2s;"></div>
        </div>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="content-section">
      <div class="container">
        <!-- 使命部分 -->
        <div class="mission-section anime-card">
          <h2><el-icon><Star /></el-icon> 我们的使命</h2>
          <p>
            我们致力于为全球的二次元爱好者提供一个高质量、易用的壁纸分享平台。
            在这里，你可以发现、收藏和分享最精美的动漫壁纸，与其他同好交流心得。
          </p>
        </div>

        <!-- 特性部分 -->
        <div class="features-section">
          <h2><el-icon><MagicStick /></el-icon> 平台特性</h2>
          <div class="features-grid">
            <div class="feature-card anime-card">
              <div class="feature-icon">
                <el-icon size="40"><Picture /></el-icon>
              </div>
              <h3>高质量壁纸</h3>
              <p>精选高清壁纸，支持多种分辨率，完美适配各种设备屏幕。</p>
            </div>
            
            <div class="feature-card anime-card">
              <div class="feature-icon">
                <el-icon size="40"><Collection /></el-icon>
              </div>
              <h3>智能瀑布流</h3>
              <p>采用先进的瀑布流布局，自动适配不同尺寸的图片，提供流畅的浏览体验。</p>
            </div>
            
            <div class="feature-card anime-card">
              <div class="feature-icon">
                <el-icon size="40"><User /></el-icon>
              </div>
              <h3>个性化收藏</h3>
              <p>创建个人收藏夹，保存喜欢的壁纸，随时随地访问你的专属收藏。</p>
            </div>
            
            <div class="feature-card anime-card">
              <div class="feature-icon">
                <el-icon size="40"><Upload /></el-icon>
              </div>
              <h3>社区分享</h3>
              <p>上传你的原创作品，与社区分享，获得其他用户的点赞和评论。</p>
            </div>
          </div>
        </div>

        <!-- 技术栈部分 -->
        <div class="tech-section anime-card">
          <h2><el-icon><Cpu /></el-icon> 技术栈</h2>
          <div class="tech-tags">
            <span class="tech-tag">Vue 3</span>
            <span class="tech-tag">TypeScript</span>
            <span class="tech-tag">Element Plus</span>
            <span class="tech-tag">Pinia</span>
            <span class="tech-tag">Vue Router</span>
            <span class="tech-tag">Axios</span>
            <span class="tech-tag">Vite</span>
          </div>
          <p class="tech-description">
            我们采用现代化的前端技术栈，确保应用的性能、可维护性和用户体验。
            后端使用FastAPI提供RESTful API，支持JWT认证和高效的数据处理。
          </p>
        </div>

        <!-- 团队部分 -->
        <div class="team-section">
          <h2><el-icon><UserFilled /></el-icon> 开发团队</h2>
          <p>
            AnimeWall由一群热爱二次元文化的开发者创建和维护。
            我们相信技术可以让爱好者的生活更加美好，因此我们致力于打造最好的壁纸分享体验。
          </p>
          <div class="contact-info">
            <p><el-icon><Message /></el-icon> 反馈与建议：contact@animewall.com</p>
            <p><el-icon><Link /></el-icon> GitHub：github.com/animewall</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  Star,
  MagicStick,
  Picture,
  Collection,
  User,
  Upload,
  Cpu,
  UserFilled,
  Message,
  Link
} from '@element-plus/icons-vue'
</script>

<style scoped>
.about-page {
  min-height: 100vh;
}

/* 英雄区域 */
.hero-section {
  background: var(--anime-gradient);
  padding: 80px 20px;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.hero-content {
  max-width: 800px;
  margin: 0 auto;
  position: relative;
  z-index: 2;
}

.hero-section h1 {
  font-size: 3.5rem;
  margin-bottom: 20px;
  font-weight: 800;
}

.subtitle {
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 40px;
}

.floating-elements {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.float-element {
  position: absolute;
  width: 100px;
  height: 100px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  backdrop-filter: blur(5px);
}

.float-element:nth-child(1) {
  top: 20%;
  left: 10%;
}

.float-element:nth-child(2) {
  top: 60%;
  right: 15%;
}

.float-element:nth-child(3) {
  bottom: 20%;
  left: 20%;
}

/* 内容区域 */
.content-section {
  padding: 60px 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* 使命部分 */
.mission-section {
  padding: 40px;
  margin-bottom: 60px;
  text-align: center;
}

.mission-section h2 {
  font-size: 2rem;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.mission-section p {
  font-size: 1.1rem;
  line-height: 1.8;
  color: var(--anime-text-secondary);
  max-width: 800px;
  margin: 0 auto;
}

/* 特性部分 */
.features-section {
  margin-bottom: 60px;
}

.features-section h2 {
  font-size: 2rem;
  margin-bottom: 40px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 30px;
}

.feature-card {
  padding: 30px;
  text-align: center;
  transition: transform 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-10px);
}

.feature-icon {
  margin-bottom: 20px;
  color: var(--anime-primary);
}

.feature-card h3 {
  font-size: 1.3rem;
  margin-bottom: 15px;
  color: var(--anime-text);
}

.feature-card p {
  color: var(--anime-text-secondary);
  line-height: 1.6;
}

/* 技术栈部分 */
.tech-section {
  padding: 40px;
  margin-bottom: 60px;
}

.tech-section h2 {
  font-size: 2rem;
  margin-bottom: 30px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.tech-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 30px;
}

.tech-tag {
  background: var(--anime-gradient);
  color: white;
  padding: 8px 20px;
  border-radius: 25px;
  font-size: 0.9rem;
  font-weight: 500;
}

.tech-description {
  font-size: 1.1rem;
  line-height: 1.8;
  color: var(--anime-text-secondary);
}

/* 团队部分 */
.team-section {
  text-align: center;
  padding: 40px;
}

.team-section h2 {
  font-size: 2rem;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.team-section p {
  font-size: 1.1rem;
  line-height: 1.8;
  color: var(--anime-text-secondary);
  max-width: 800px;
  margin: 0 auto 30px;
}

.contact-info {
  background: rgba(255, 255, 255, 0.05);
  padding: 30px;
  border-radius: 16px;
  max-width: 600px;
  margin: 0 auto;
}

.contact-info p {
  margin: 15px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 1rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .hero-section h1 {
    font-size: 2.5rem;
  }
  
  .mission-section,
  .tech-section,
  .team-section {
    padding: 30px 20px;
  }
  
  .feature-card {
    padding: 20px;
  }
  
  .tech-tags {
    justify-content: center;
  }
}
</style>
