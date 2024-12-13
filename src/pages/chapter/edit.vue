<template>
  <view class="edit-container">
    <PageHeader :title="isNewChapter ? '新建章节' : '编辑章节'">
      <template #left>
        <view class="header-btn" @click="goBack">
          <uv-icon name="arrow-left" color="#ffffff" size="22"></uv-icon>
        </view>
      </template>
    </PageHeader>
    
    <view class="editor-wrapper">
      <ChapterEditor
        class="chapter-editor"
        :visible="true"
        :chapter-id="chapterId"
        :is-new-chapter="isNewChapter"
        :book-id="bookId"
        @save="handleSave"
        @back="goBack"
      />
    </view>
  </view>
</template>

<style lang="scss">
.edit-container {
  min-height: 100vh;
  background: $background-primary;
  
  .editor-wrapper {
    height: calc(100vh - 88rpx);
    
    .chapter-editor {
      height: 100%;
    }
  }
}
</style>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import PageHeader from '@/components/PageHeader.vue'
import ChapterEditor from '@/components/ChapterEditor.vue'
import { storageService } from '@/services/storage'

const chapterId = ref(0)
const isNewChapter = ref(false)
const bookId = ref(0)
const isRelated = ref(false)
const relatedType = ref('')
const bookTitle = ref('')

onLoad((options: any) => {
  chapterId.value = parseInt(options.id || '0')
  isNewChapter.value = options.isNew === 'true'
  bookId.value = parseInt(options.bookId)
  bookTitle.value = decodeURIComponent(options.bookTitle || '')
  
  if (options.type === 'related') {
    isRelated.value = true
    relatedType.value = options.relatedType
  }
})

const goBack = () => {
  const pages = getCurrentPages()
  console.log('Current pages stack:', pages)
  
  const prevPage = pages[pages.length - 2]
  console.log('Previous page:', prevPage?.route)
  
  if (prevPage?.route === 'pages/book/book') {
    uni.navigateBack()
  } else {
    uni.redirectTo({
      url: `/pages/book/book?id=${bookId.value}`
    })
  }
}

const handleSave = (data: any) => {
  if (isRelated.value) {
    storageService.saveRelated({
      id: chapterId.value,
      bookId: bookId.value,
      title: data.title,
      content: data.content,
      type: relatedType.value as 'note' | 'character' | 'place' | 'item',
      createTime: Date.now()
    })
  } else {
    storageService.saveChapter({
      id: chapterId.value,
      bookId: bookId.value,
      title: data.title,
      content: data.content,
      wordCount: data.content.length
    })
  }

  uni.showToast({
    title: '保存成功',
    icon: 'success',
    duration: 2000
  })

  setTimeout(() => {
    const pages = getCurrentPages()
    const prevPage = pages[pages.length - 2]
    
    if (prevPage?.route === 'pages/book/book') {
      uni.navigateBack()
    } else {
      uni.redirectTo({
        url: `/pages/book/book?id=${bookId.value}`
      })
    }
  }, 500)
}
</script> 