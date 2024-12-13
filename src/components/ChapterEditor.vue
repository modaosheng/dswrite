<template>
  <view class="chapter-editor" v-if="visible">
    <!-- 移除章节标题输入框，只显示字数统计 -->
    <view class="chapter-info">
      <view class="word-count">字数：{{ content.length }}</view>
    </view>

    <!-- 工具栏 -->
    <view class="toolbar">
      <view class="tool-item" @click="toggleOutline">
        <uv-icon name="list" size="20"></uv-icon>
        <text>大纲</text>
      </view>
      <view class="tool-item" @click="toggleAutoSave">
        <uv-icon :name="isAutoSave ? 'checkmark-circle' : 'circle'" size="20"></uv-icon>
        <text>自动保存</text>
      </view>
      <view class="tool-item" @click="showFontSettings">
        <uv-icon name="text" size="20"></uv-icon>
        <text>字体</text>
      </view>
    </view>

    <!-- 编辑区域 -->
    <view class="editor-container">
      <textarea
        class="editor"
        v-model="content"
        :style="editorStyle"
        placeholder="请输入章节内容..."
        @input="handleInput"
        @blur="handleBlur"
      ></textarea>
    </view>

    <!-- 大纲�����边栏 -->
    <view class="outline-panel" v-if="showOutline">
      <view class="outline-header">
        <text>章节大纲</text>
        <uv-icon name="close" size="20" @click="toggleOutline"></uv-icon>
      </view>
      <view class="outline-content">
        <!-- 大纲内容列表 -->
      </view>
    </view>

    <!-- 字体设置弹窗 -->
    <uv-popup v-model="showFontPanel" mode="bottom">
      <view class="font-settings">
        <view class="setting-item">
          <text>字体大小</text>
          <slider 
            :value="fontSize" 
            :min="12" 
            :max="24" 
            @change="changeFontSize"
          />
        </view>
        <view class="setting-item">
          <text>行间距</text>
          <slider 
            :value="lineHeight" 
            :min="1" 
            :max="2" 
            :step="0.1" 
            @change="changeLineHeight"
          />
        </view>
      </view>
    </uv-popup>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad, onUnload } from '@dcloudio/uni-app'
import { storageService } from '@/services/storage'

// 在其他状态变量声明后添加
let saveTimeout: number | null = null

// 状态变量
const chapterId = ref(0)
const isNewChapter = ref(false)
const chapterTitle = ref('')
const content = ref('')
const isAutoSave = ref(true)
const showOutline = ref(false)
const showFontPanel = ref(false)
const fontSize = ref(16)
const lineHeight = ref(1.5)
const volume = ref('')

// 定义组件属性
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  chapterId: {
    type: Number,
    default: 0
  },
  isNewChapter: {
    type: Boolean,
    default: false
  },
  bookId: {
    type: Number,
    required: true
  }
})

// 定义事件
const emit = defineEmits(['update:visible', 'save', 'back'])

// 方法定义
const loadChapterContent = () => {
  const chapter = storageService.getChapter(props.bookId, props.chapterId)
  if (chapter) {
    chapterTitle.value = chapter.title
    content.value = chapter.content
    volume.value = chapter.volume || ''
  }
}

let autoSaveTimer: number | null = null  // 添加定时器引用

// 修改自动保存启动函数
const startAutoSave = () => {
  // 清除可能存在的旧定时器
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer)
  }
  
  autoSaveTimer = setInterval(() => {
    if (isAutoSave.value && content.value) {
      saveChapter()
    }
  }, 60000) as unknown as number
}

// 添加清理函数
onUnload(() => {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer)
  }
})

// 修改返回函数，移除 navigateBack 调用
const goBack = () => {
  console.log('goBack called, content:', !!content.value, 'title:', !!chapterTitle.value)
  if (content.value || chapterTitle.value) {
    uni.showModal({
      title: '提示',
      content: '是否保存当前内容？',
      success: async (res) => {
        console.log('Modal result:', res.confirm ? 'confirm' : 'cancel')
        if (res.confirm) {
          console.log('Calling saveChapter from goBack')
          await saveChapter()
        }
        // 移除这里的 navigateBack，由父组件处理返回
        emit('back')  // 添加一个返回事件
      }
    })
  } else {
    emit('back')  // 添加一个返回事件
  }
}

// 修改保存函数，使用 Promise
const saveChapter = () => {
  return new Promise((resolve) => {
    if (saveTimeout) {
      clearTimeout(saveTimeout)
    }
    
    console.log('Starting saveChapter...', {
      chapterId: props.chapterId,
      title: chapterTitle.value,
      content: content.value,
      volume: volume.value
    })
    
    // 只要有标题就可以保存
    if (!chapterTitle.value) {
      console.log('No title, skipping save')
      resolve(false)
      return
    }

    console.log('Emitting save event...')
    emit('save', {
      chapterId: props.chapterId,
      title: chapterTitle.value || `第${props.chapterId}章`,
      content: content.value || '',
      volume: volume.value
    })
    
    resolve(true)
  })
}

// 修改自动保存开关
const toggleAutoSave = () => {
  isAutoSave.value = !isAutoSave.value
  if (isAutoSave.value) {
    startAutoSave()
  } else if (autoSaveTimer) {
    clearInterval(autoSaveTimer)
  }
}

// 生命周期
onLoad((options: any) => {
  isNewChapter.value = options.type === 'new'
  if (!isNewChapter.value) {
    chapterId.value = parseInt(options.id)
    loadChapterContent()
  } else {
    // 如果是新章节，使用传入的标题和分卷
    if (options.title) {
      chapterTitle.value = decodeURIComponent(options.title)
    }
    if (options.volume) {
      volume.value = decodeURIComponent(options.volume)
    }
  }
  
  if (isAutoSave.value) {
    startAutoSave()
  }
})

// 计算属性
const editorStyle = computed(() => ({
  fontSize: `${fontSize.value}px`,
  lineHeight: lineHeight.value
}))

// 其他方法...

const handleInput = () => {
  // 可以在这里添加输入处理逻辑
}

const toggleOutline = () => {
  showOutline.value = !showOutline.value
}

const showFontSettings = () => {
  showFontPanel.value = true
}

const changeFontSize = (e: any) => {
  fontSize.value = e.detail.value
}

const changeLineHeight = (e: any) => {
  lineHeight.value = e.detail.value
}

// 修改失焦处理函数
const handleBlur = () => {
  // 只要有标题就保存
  if (chapterTitle.value) {
    saveChapter()
  }
}

</script>

<style lang="scss">
.chapter-edit-page {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.chapter-info {
  background-color: #fff;
  padding: 20rpx 30rpx;
  
  .word-count {
    font-size: 24rpx;
    color: #999;
  }
}

.toolbar {
  display: flex;
  padding: 20rpx;
  background-color: #fff;
  border-bottom: 1rpx solid #eee;
  
  .tool-item {
    display: flex;
    align-items: center;
    margin-right: 30rpx;
    font-size: 24rpx;
    
    text {
      margin-left: 6rpx;
    }
  }
}

.editor-container {
  background: $background-primary;
  min-height: 100vh;
  
  .editor-header {
    @include flex-between;
    padding: $spacing-lg;
    background: $background-secondary;
    border-bottom: 1px solid $border-color;
    
    .title-input {
      flex: 1;
      font-size: $font-lg;
      color: $text-primary;
      background: transparent;
      border: none;
      margin-right: $spacing-xl;
      
      &:focus {
        outline: none;
      }
    }
    
    .actions {
      @include flex-center;
      gap: $spacing-md;
      
      .action-btn {
        @include flex-center;
        padding: $spacing-sm $spacing-lg;
        border-radius: $radius-md;
        font-size: $font-md;
        @include transition-all;
        @include hover-scale;
        
        &.save {
          @include gradient-primary;
          color: white;
        }
        
        &.back {
          color: $text-secondary;
          background: $background-tertiary;
        }
      }
    }
  }
  
  .editor-content {
    padding: $spacing-lg;
    
    .content-input {
      width: 100%;
      min-height: 500rpx;
      font-size: $font-md;
      line-height: 1.6;
      color: $text-primary;
      background: transparent;
      border: none;
      resize: none;
      
      &:focus {
        outline: none;
      }
    }
  }
  
  .toolbar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    @include flex-between;
    padding: $spacing-md $spacing-lg;
    background: $background-secondary;
    border-top: 1px solid $border-color;
    @include safe-bottom;
    
    .tool-btn {
      @include flex-center;
      padding: $spacing-sm;
      border-radius: $radius-md;
      color: $text-secondary;
      @include transition-all;
      @include hover-scale;
      
      &.active {
        color: $primary-color;
        background: rgba($primary-color, 0.1);
      }
    }
  }
}

.outline-panel {
  position: fixed;
  right: 0;
  top: 0;
  width: 500rpx;
  height: 100vh;
  background-color: #fff;
  box-shadow: -2rpx 0 10rpx rgba(0, 0, 0, 0.1);
  z-index: 100;
  
  .outline-header {
    padding: 30rpx;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1rpx solid #eee;
  }
}

.font-settings {
  padding: 30rpx;
  
  .setting-item {
    margin-bottom: 30rpx;
    
    text {
      display: block;
      margin-bottom: 10rpx;
    }
  }
}
</style>