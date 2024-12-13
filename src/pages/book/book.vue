<template>
  <view class="book-page">
    <!-- 页面头部 -->
    <view class="header">
      <PageHeader :title="bookInfo.title">
        <template #left>
          <view class="header-btn" @click="goBack">
            <uv-icon name="arrow-left" color="#ffffff" size="22"></uv-icon>
          </view>
        </template>
      </PageHeader>
      
      <!-- 书籍信息卡片 -->
      <view class="book-info-card">
        <image class="book-cover" :src="bookInfo.cover" mode="aspectFill" />
        <view class="info-content">
          <view class="info-main">
            <text class="book-title">{{ bookInfo.title }}</text>
            <text class="book-author">{{ bookInfo.author }}</text>
          </view>
          <view class="info-stats">
            <view class="stat-item">
              <text class="stat-value">{{ bookInfo.volumeCount || 0 }}</text>
              <text class="stat-label">分卷</text>
            </view>
            <view class="stat-item">
              <text class="stat-value">{{ bookInfo.chapterCount || 0 }}</text>
              <text class="stat-label">章��</text>
            </view>
            <view class="stat-item">
              <text class="stat-value">{{ bookInfo.wordCount || 0 }}</text>
              <text class="stat-label">字数</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 标签页 -->
    <view class="tabs">
      <view 
        v-for="tab in tabs" 
        :key="tab.key"
        class="tab-item"
        :class="{ active: currentTab === tab.key }"
        @click="switchTab(tab.key)"
      >
        {{ tab.name }}
      </view>
    </view>

    <!-- 内容区域 -->
    <view class="content" :class="currentTab">
      <!-- 目录内容 -->
      <template v-if="currentTab === 'catalog'">
        <view class="catalog-list">
          <template v-if="groupedChapters.length > 0">
            <view 
              v-for="volume in groupedChapters" 
              :key="volume.name" 
              class="volume-group"
            >
              <!-- 分卷标题 -->
              <view 
                class="volume-header" 
                @click="toggleVolume(volume.name)"
                @longpress="showEditVolumePopup(volume)"
              >
                <view class="volume-info">
                  <uv-icon 
                    :name="expandedVolumes[volume.name] ? 'arrow-down' : 'arrow-right'" 
                    size="16" 
                    color="#7371FC"
                  ></uv-icon>
                  <text class="volume-title">{{ volume.name }}</text>
                  <text class="chapter-count">({{ volume.chapters.length }}章)</text>
                </view>
              </view>
              
              <!-- 章节列表 -->
              <view 
                class="chapter-list"
                v-show="expandedVolumes[volume.name]"
              >
                <view 
                  v-for="chapter in volume.chapters" 
                  :key="chapter.id"
                  class="chapter-item-wrapper"
                >
                  <view 
                    class="chapter-slide"
                    :class="{ 'slide-open': chapter.id === currentSlideId }"
                    @touchstart="handleTouchStart($event, chapter.id)"
                    @touchmove="handleTouchMove($event, chapter.id)"
                    @touchend="handleTouchEnd(chapter.id)"
                  >
                    <view 
                      class="chapter-item"
                      @click="openChapter(chapter)"
                      @longpress="showEditChapterPopup(chapter)"
                    >
                      <view class="chapter-info">
                        <text class="chapter-title">{{ chapter.title }}</text>
                        <text class="word-count">{{ chapter.wordCount }}字</text>
                      </view>
                    </view>
                    <view 
                      class="delete-btn"
                      @click.stop="deleteChapter(chapter)"
                    >
                      <uv-icon name="trash" color="#ffffff" size="20"></uv-icon>
                    </view>
                  </view>
                </view>
              </view>
            </view>
          </template>
          <view v-else class="empty-tip">
            <uv-icon name="file-text" size="48" color="#BDC3C7"></uv-icon>
            <text>暂无章节</text>
          </view>
        </view>
      </template>

      <!-- 相关内容 -->
      <template v-if="currentTab === 'related'">
        <view class="related-list">
          <view 
            v-for="item in relatedItems" 
            :key="item.id"
            class="related-item"
            @click="openRelated(item)"
          >
            <view class="related-header">
              <text class="related-title">{{ item.title }}</text>
              <text class="related-type">{{ getRelatedTypeName(item.type) }}</text>
            </view>
            <view class="related-content">{{ item.content }}</view>
            <view class="related-time">{{ formatTime(item.createTime) }}</view>
          </view>
        </view>
      </template>
    </view>

    <!-- 悬浮按钮 -->
    <view class="fab-buttons">
      <view 
        class="fab-button" 
        v-if="currentTab === 'catalog'"
        @click="createNewChapter"
      >
        <uv-icon name="plus" color="#ffffff" size="24"></uv-icon>
      </view>
      <view 
        class="fab-button" 
        v-if="currentTab === 'related'"
        @click="showRelatedMenu"
      >
        <uv-icon name="plus" color="#ffffff" size="24"></uv-icon>
      </view>
    </view>

    <!-- 弹窗组件 -->
    <!-- ... existing popups ... -->
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, computed } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import PageHeader from '@/components/PageHeader.vue'
import ChapterEditor from '@/components/ChapterEditor.vue'
import DebugPanel from '@/components/DebugPanel.vue'
import { storageService, type Related } from '@/services/storage'
import { logger } from '@/utils/debug'

interface Chapter {
  id: number
  bookId: number
  title: string
  content: string
  wordCount: number
  volume?: string
}

interface BookInfo {
  title: string
  author: string
  tag: string
  cover: string
  volumeCount: number
  chapterCount: number
  wordCount: number
}

const bookInfo = ref<BookInfo>({
  title: '',
  author: '',
  tag: '',
  cover: '',
  volumeCount: 0,
  chapterCount: 1,
  wordCount: 0
})

const tabs = [
  { key: 'catalog' as const, name: '目录' },
  { key: 'related' as const, name: '相关' }
] as const

const currentTab = ref<'catalog' | 'related'>('catalog')

// 添加新的状态
const showEditor = ref(false)
const isNewChapter = ref(false)
const currentChapter = ref<Chapter>({
  id: 0,
  bookId: 0,
  title: '',
  content: '',
  wordCount: 0
})

const chapters = ref<Chapter[]>([
  {
    id: 1,
    bookId: 0,
    title: '引子',
    content: '',
    wordCount: 0
  }
  // 可以添加更多章节
])

// 添加在其他 ref 变量之后
const bookId = ref(0)

const relatedItems = ref<Related[]>([])

// 添加相关类型配置
const relatedTypes = [
  { label: '笔记', value: 'note' },
  { label: '人物', value: 'character' },
  { label: '地点', value: 'place' },
  { label: '物品', value: 'item' }
]

// 定义 popup ref
const popup = ref()

// 添加新的状态
const chapterConfigPopup = ref()
const newChapterConfig = ref({
  volume: '',
  title: ''
})

// 创建页��专用的日志器
const pageLogger = logger.createLogger('Book')

// 计算属性：按分卷分组的章节
const groupedChapters = computed(() => {
  pageLogger.debug('Computing grouped chapters...')
  pageLogger.debug('Current chapters:', chapters.value)
  
  if (!chapters.value || chapters.value.length === 0) {
    pageLogger.debug('No chapters found')
    return []
  }

  const groups: { [key: string]: Chapter[] } = {}
  
  // 处理所有章节
  chapters.value.forEach(chapter => {
    const volumeName = chapter.volume && chapter.volume.trim().length > 0
      ? chapter.volume.trim()
      : '未分卷'
      
    pageLogger.debug(`Processing chapter ${chapter.id}:`, {
      title: chapter.title,
      volume: chapter.volume,
      volumeName
    })
    
    if (!groups[volumeName]) {
      pageLogger.debug('Creating new volume group:', volumeName)
      groups[volumeName] = []
    }
    groups[volumeName].push(chapter)
  })
  
  // 转换为数组并排序
  const result = Object.entries(groups).map(([name, volumeChapters]) => ({
    name,
    chapters: volumeChapters.sort((a, b) => a.id - b.id)
  })).sort((a, b) => {
    if (a.name === '未分卷') return 1
    if (b.name === '未分卷') return -1
    return a.name.localeCompare(b.name)
  })
  
  pageLogger.debug('Grouped chapters result:', {
    totalGroups: result.length,
    groups: result.map(g => ({
      name: g.name,
      chapterCount: g.chapters.length,
      chapters: g.chapters.map(c => ({
        id: c.id,
        title: c.title,
        volume: c.volume
      }))
    }))
  })
  
  return result
})

// 添加展开状态管理
const expandedVolumes = ref<{ [key: string]: boolean }>({})

// 切换分卷展开状态
const toggleVolume = (volumeName: string) => {
  expandedVolumes.value[volumeName] = !expandedVolumes.value[volumeName]
}

// 修改加载章节的方法
const loadChapters = () => {
  const loadedChapters = storageService.getChapters(bookId.value)
  pageLogger.debug('Raw loaded chapters:', loadedChapters)
  
  // 确保每个章节都有 volume 字段
  chapters.value = loadedChapters.map(chapter => ({
    ...chapter,
    volume: chapter.volume || undefined
  }))
  
  pageLogger.debug('Processed chapters:', chapters.value)
  
  // 确保所有分卷都有展开状态
  nextTick(() => {
    const volumes = new Set(chapters.value.map(c => 
      c.volume && c.volume.trim().length > 0 ? c.volume.trim() : '未分卷'
    ))
    pageLogger.debug('Available volumes:', Array.from(volumes))
    volumes.forEach(volume => {
      if (expandedVolumes.value[volume] === undefined) {
        expandedVolumes.value[volume] = true
      }
    })
    pageLogger.debug('Updated expanded states:', expandedVolumes.value)
  })
}

onLoad((options: any) => {
  pageLogger.debug('Page onLoad with options:', options)
  if (!options.id) {
    pageLogger.error('Missing book id')
    uni.navigateBack()
    return
  }

  bookId.value = parseInt(options.id)
  pageLogger.debug('Loading book with id:', bookId.value)
  
  bookInfo.value = {
    title: decodeURIComponent(options.title || ''),
    author: decodeURIComponent(options.author || ''),
    tag: decodeURIComponent(options.tag || ''),
    cover: decodeURIComponent(options.cover || ''),
    volumeCount: 0,
    chapterCount: 0,
    wordCount: 0
  }

  // 加载章节列表
  loadChapters()
  
  // 初始化展开状态
  nextTick(() => {
    pageLogger.debug('Initializing volume expanded states')
    groupedChapters.value.forEach(volume => {
      pageLogger.debug('Setting expanded state for volume:', volume.name)
      expandedVolumes.value[volume.name] = true
    })
    pageLogger.debug('Current expanded states:', expandedVolumes.value)
  })
})

onShow(() => {
  loadChapters()
  loadRelated()
  const book = storageService.getBook(bookId.value)
  if (book) {
    bookInfo.value = book
  }
})

const goBack = () => {
  // 确保有可返回的页面栈
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack()
  } else {
    // 如果没有页面栈，直接跳转到首页
    uni.reLaunch({
      url: '/pages/index/index'
    })
  }
}

const switchTab = (tab: 'catalog' | 'related') => {
  currentTab.value = tab
}

const openChapter = (chapter: Chapter) => {
  const url = `/pages/chapter/edit?id=${chapter.id}&isNew=false&bookId=${bookId.value}&title=${encodeURIComponent(chapter.title)}&volume=${encodeURIComponent(chapter.volume || '')}`
  uni.navigateTo({ url })
}

const createNewChapter = () => {
  newChapterConfig.value = {
    volume: '',
    title: ''
  }
  chapterConfigPopup.value?.open()
}

const cancelNewChapter = () => {
  chapterConfigPopup.value?.close()
}

const confirmNewChapter = () => {
  if (!newChapterConfig.value.title.trim()) {
    uni.showToast({
      title: '请输入章节名称',
      icon: 'none'
    })
    return
  }

  const nextChapterId = chapters.value.length > 0 
    ? Math.max(...chapters.value.map(c => c.id)) + 1 
    : 1

  // 创建新章节并保存
  const newChapter: Chapter = {
    id: nextChapterId,
    bookId: bookId.value,
    title: newChapterConfig.value.title.trim(),
    content: '',
    wordCount: 0,
    volume: newChapterConfig.value.volume.trim() || undefined
  }
  
  pageLogger.debug('Creating new chapter with data:', newChapter)
  
  try {
    // 保存到本地存储
    storageService.saveChapter(newChapter)
    pageLogger.debug('Chapter saved successfully')
    
    // 重新加载章节列表
    loadChapters()
    pageLogger.debug('Chapters after reload:', chapters.value)

    // 确保新分卷被展开
    const volumeName = newChapter.volume || '未分卷'
    expandedVolumes.value[volumeName] = true
    pageLogger.debug('Expanded volumes after save:', expandedVolumes.value)

    chapterConfigPopup.value?.close()
    
    // 导航到编辑页面
    const url = `/pages/chapter/edit?id=${nextChapterId}&isNew=true&bookId=${bookId.value}&title=${encodeURIComponent(newChapterConfig.value.title)}&volume=${encodeURIComponent(newChapterConfig.value.volume || '')}`
    pageLogger.debug('Navigating to:', url)
    uni.navigateTo({ url })
  } catch (error) {
    pageLogger.error('Error saving chapter:', error)
    uni.showToast({
      title: '保存失败',
      icon: 'none'
    })
  }
}

interface ChapterSaveData {
  chapterId: number
  title: string
  content: string
}

const handleChapterSave = (chapterData: ChapterSaveData) => {
  storageService.saveChapter({
    id: chapterData.chapterId,
    bookId: bookId.value,  // 使用 ref 变量
    title: chapterData.title,
    content: chapterData.content,
    wordCount: chapterData.content.length
  })
  
  // 重新加载章节列表
  chapters.value = storageService.getChapters(bookId.value)
}

// 加载相关内容
const loadRelated = () => {
  relatedItems.value = storageService.getRelated(bookId.value)
}

// 修改显示菜单方法
const showRelatedMenu = () => {
  popup.value?.open()
}

// 修改类型选择处理方法
const handleRelatedTypeSelect = (type: 'note' | 'character' | 'place' | 'item') => {
  popup.value?.close()
  createRelated(type)
}

// 修改创建相关内容方法
const createRelated = (type: 'note' | 'character' | 'place' | 'item') => {
  uni.navigateTo({
    url: `/pages/chapter/edit?id=${Date.now()}&isNew=true&bookId=${bookId.value}&type=related&relatedType=${type}`
  })
}

// 打开相关内容
const openRelated = (item: Related) => {
  uni.navigateTo({
    url: `/pages/chapter/edit?id=${item.id}&isNew=false&bookId=${bookId.value}&type=related&relatedType=${item.type}`
  })
}

// 获取相关内容类型名称
const getRelatedTypeName = (type: string) => {
  const types = {
    note: '笔记',
    character: '人物',
    place: '地点',
    item: '物品'
  }
  return types[type as keyof typeof types] || type
}

// 格式化时间
const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleString()
}

// 添加编辑状态
const editVolumePopup = ref()
const editChapterPopup = ref()
const editVolumeConfig = ref({
  oldName: '',
  newName: '',
  chapters: [] as Chapter[]
})
const editChapterConfig = ref({
  chapter: null as Chapter | null,
  newTitle: ''
})

// 显示编辑分卷弹窗
const showEditVolumePopup = (volume: { name: string, chapters: Chapter[] }) => {
  editVolumeConfig.value = {
    oldName: volume.name,
    newName: volume.name,
    chapters: volume.chapters
  }
  editVolumePopup.value?.open()
}

// 取消编辑分卷
const cancelEditVolume = () => {
  editVolumePopup.value?.close()
}

// 确认编辑分卷
const confirmEditVolume = () => {
  if (!editVolumeConfig.value.newName.trim()) {
    uni.showToast({
      title: '请输入分卷名称',
      icon: 'none'
    })
    return
  }

  // 更新所有相关章节的分卷名称
  editVolumeConfig.value.chapters.forEach(chapter => {
    const updatedChapter = {
      ...chapter,
      volume: editVolumeConfig.value.newName.trim()
    }
    storageService.saveChapter(updatedChapter)
  })

  // 重新加载章节列表
  loadChapters()
  editVolumePopup.value?.close()

  uni.showToast({
    title: '修改成功',
    icon: 'success'
  })
}

// 显示编辑章节弹窗
const showEditChapterPopup = (chapter: Chapter) => {
  editChapterConfig.value = {
    chapter,
    newTitle: chapter.title
  }
  editChapterPopup.value?.open()
}

// 取消编辑章节
const cancelEditChapter = () => {
  editChapterPopup.value?.close()
}

// 确认编辑章节
const confirmEditChapter = () => {
  if (!editChapterConfig.value.newTitle.trim()) {
    uni.showToast({
      title: '请输入章节名称',
      icon: 'none'
    })
    return
  }

  if (editChapterConfig.value.chapter) {
    const updatedChapter = {
      ...editChapterConfig.value.chapter,
      title: editChapterConfig.value.newTitle.trim()
    }
    storageService.saveChapter(updatedChapter)
    
    // 重新加载章节列表
    loadChapters()
    editChapterPopup.value?.close()

    uni.showToast({
      title: '修改成功',
      icon: 'success'
    })
  }
}

// 准备调试数据
const debugData = computed(() => ({
  bookInfo: bookInfo.value,
  chaptersCount: chapters.value.length,
  volumes: groupedChapters.value.map(v => ({
    name: v.name,
    chaptersCount: v.chapters.length,
    chapters: v.chapters.map(c => ({
      id: c.id,
      title: c.title,
      wordCount: c.wordCount
    }))
  }))
}))

// 滑动相关状态
const currentSlideId = ref<number | null>(null)
const touchStartX = ref(0)
const touchStartY = ref(0)
const slideThreshold = 50 // 触发滑动的阈值

// 处理触摸开始
const handleTouchStart = (event: TouchEvent, chapterId: number) => {
  touchStartX.value = event.touches[0].clientX
  touchStartY.value = event.touches[0].clientY
}

// 处理触摸移动
const handleTouchMove = (event: TouchEvent, chapterId: number) => {
  if (!event.touches[0]) return
  
  const deltaX = touchStartX.value - event.touches[0].clientX
  const deltaY = Math.abs(touchStartY.value - event.touches[0].clientY)
  
  // 如果垂直移动大于水平移动，不处理滑动
  if (deltaY > Math.abs(deltaX)) return
  
  // 只允许向左滑动
  if (deltaX > slideThreshold) {
    currentSlideId.value = chapterId
  } else if (deltaX < -slideThreshold) {
    currentSlideId.value = null
  }
}

// 处理触摸结束
const handleTouchEnd = (chapterId: number) => {
  // 可以添加额外的处理逻辑
}

// 删除章节
const deleteChapter = async (chapter: Chapter) => {
  try {
    uni.showModal({
      title: '确认删除',
      content: '确定要删除这个章节吗？',
      success: (res) => {
        if (res.confirm) {
          // 从存储中删除章节
          storageService.deleteChapter(chapter.bookId, chapter.id)
          // 重新加载章节列表
          loadChapters()
          // 关闭滑动状态
          currentSlideId.value = null
          
          uni.showToast({
            title: '删除成功',
            icon: 'success'
          })
        }
      }
    })
  } catch (error) {
    pageLogger.error('Error deleting chapter:', error)
    uni.showToast({
      title: '删除失败',
      icon: 'none'
    })
  }
}
</script>

<style lang="scss">
@import '@/styles/theme.scss';

.book-page {
  min-height: 100vh;
  background-color: $background-secondary;
  
  .header {
    @include gradient-primary;
    padding-bottom: $spacing-xxl;
    border-radius: 0 0 $radius-xl $radius-xl;
    
    .header-btn {
      @include flex-center;
      width: 72rpx;
      height: 72rpx;
      border-radius: $radius-full;
      background: rgba(255, 255, 255, 0.2);
      @include hover-scale;
    }
    
    .book-info-card {
      margin: $spacing-lg $spacing-lg 0;
      padding: $spacing-lg;
      background: $background-primary;
      border-radius: $radius-lg;
      box-shadow: $shadow-lg;
      display: flex;
      gap: $spacing-lg;
      
      .book-cover {
        width: 180rpx;
        height: 240rpx;
        border-radius: $radius-md;
        box-shadow: $shadow-md;
      }
      
      .info-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        
        .info-main {
          .book-title {
            font-size: $font-lg;
            font-weight: $weight-semibold;
            color: $text-primary;
            @include text-ellipsis;
          }
          
          .book-author {
            font-size: $font-sm;
            color: $text-secondary;
            margin-top: $spacing-xs;
          }
        }
        
        .info-stats {
          display: flex;
          gap: $spacing-xl;
          
          .stat-item {
            text-align: center;
            
            .stat-value {
              font-size: $font-lg;
              font-weight: $weight-semibold;
              color: $primary-color;
            }
            
            .stat-label {
              font-size: $font-xs;
              color: $text-secondary;
              margin-top: $spacing-xs;
            }
          }
        }
      }
    }
  }
  
  .tabs {
    position: sticky;
    top: 0;
    z-index: 10;
    @include glass-effect;
    display: flex;
    padding: $spacing-md $spacing-lg;
    margin: -$spacing-xl $spacing-lg 0;
    border-radius: $radius-lg;
    box-shadow: $shadow-sm;
    
    .tab-item {
      flex: 1;
      text-align: center;
      padding: $spacing-md;
      font-size: $font-md;
      color: $text-secondary;
      position: relative;
      @include transition-all;
      
      &.active {
        color: $primary-color;
        font-weight: $weight-medium;
        
        &::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 40rpx;
          height: 4rpx;
          background: $primary-color;
          border-radius: $radius-full;
        }
      }
    }
  }
  
  .content {
    padding: $spacing-lg;
    
    .catalog-list {
      .volume-group {
        margin-bottom: $spacing-lg;
        background: $background-primary;
        border-radius: $radius-lg;
        overflow: hidden;
        box-shadow: $shadow-sm;
        
        .volume-header {
          padding: $spacing-lg;
          background: $background-secondary;
          @include hover-scale;
          
          .volume-info {
            @include flex-center;
            gap: $spacing-sm;
            
            .volume-title {
              font-size: $font-md;
              font-weight: $weight-medium;
              color: $text-primary;
            }
            
            .chapter-count {
              font-size: $font-sm;
              color: $text-secondary;
            }
          }
        }
        
        .chapter-list {
          .chapter-item-wrapper {
            position: relative;
            overflow: hidden;
            
            .chapter-slide {
              display: flex;
              width: 100%;
              transform: translateX(0);
              transition: transform $transition-normal $ease-out;
              
              &.slide-open {
                transform: translateX(-140rpx);
              }
            }
            
            .chapter-item {
              flex: 1;
              padding: $spacing-lg;
              background: $background-primary;
              border-bottom: 1px solid $divider-color;
              @include hover-scale;
              
              .chapter-info {
                @include flex-between;
                
                .chapter-title {
                  font-size: $font-md;
                  color: $text-primary;
                  @include text-ellipsis;
                  max-width: 70%;
                }
                
                .word-count {
                  font-size: $font-sm;
                  color: $text-secondary;
                }
              }
            }
            
            .delete-btn {
              @include flex-center;
              width: 140rpx;
              background: $error-color;
              @include hover-scale;
            }
          }
        }
      }
      
      .empty-tip {
        @include flex-center;
        flex-direction: column;
        gap: $spacing-md;
        padding: $spacing-xxl 0;
        color: $text-disabled;
        font-size: $font-md;
      }
    }
    
    .related-list {
      .related-item {
        margin-bottom: $spacing-lg;
        padding: $spacing-lg;
        background: $background-primary;
        border-radius: $radius-lg;
        box-shadow: $shadow-sm;
        @include hover-scale;
        
        .related-header {
          @include flex-between;
          margin-bottom: $spacing-md;
          
          .related-title {
            font-size: $font-md;
            font-weight: $weight-medium;
            color: $text-primary;
          }
          
          .related-type {
            font-size: $font-xs;
            color: $primary-color;
            background: rgba($primary-color, 0.1);
            padding: $spacing-xs $spacing-sm;
            border-radius: $radius-full;
          }
        }
        
        .related-content {
          font-size: $font-sm;
          color: $text-secondary;
          @include multi-ellipsis(3);
          margin-bottom: $spacing-sm;
        }
        
        .related-time {
          font-size: $font-xs;
          color: $text-disabled;
        }
      }
    }
  }
  
  .fab-buttons {
    position: fixed;
    right: $spacing-xl;
    bottom: $spacing-xl;
    @include safe-bottom;
    display: flex;
    flex-direction: column;
    gap: $spacing-md;
    
    .fab-button {
      @include flex-center;
      width: 100rpx;
      height: 100rpx;
      border-radius: $radius-full;
      @include gradient-primary;
      box-shadow: $shadow-xl;
      @include hover-scale;
    }
  }
}

// 弹窗样式
.popup-content {
  background: $background-primary;
  border-radius: $radius-lg $radius-lg 0 0;
  padding: $spacing-xl;
  
  .popup-title {
    font-size: $font-lg;
    font-weight: $weight-semibold;
    color: $text-primary;
    text-align: center;
    margin-bottom: $spacing-xl;
  }
  
  .popup-form {
    .form-item {
      margin-bottom: $spacing-lg;
      
      .label {
        font-size: $font-md;
        color: $text-secondary;
        margin-bottom: $spacing-sm;
      }
    }
    
    .form-buttons {
      display: flex;
      gap: $spacing-md;
      margin-top: $spacing-xl;
      
      .uv-button {
        flex: 1;
        
        &--primary {
          background: $primary-color;
        }
      }
    }
  }
}
</style> 