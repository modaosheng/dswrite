<template>
  <view class="container">
    <PageHeader
      title="我的书架"
      :rightButtons="[
        { icon: 'reload', action: handleRefresh },
        { icon: 'plus', action: openCreateModal },
        { icon: 'more-dot-fill', action: handleMore }
      ]"
    />

    <view class="books-area">
      <view class="book-grid">
        <view 
          class="book-item" 
          v-for="(book, index) in books" 
          :key="index" 
          @click="handleBookClick(book)"
        >
          <image class="book-cover" :src="book.cover" mode="aspectFill"></image>
          <view class="book-info">
            <text class="book-title">{{book.title}}</text>
            <text class="book-author">{{book.author}}</text>
          </view>
          <view class="book-tag" v-if="book.tag">{{book.tag}}</view>
        </view>
      </view>
    </view>

    <CreateBookModal
      v-model:visible="showCreateModal"
      @confirm="handleCreateBook"
      @cancel="handleCancelCreate"
    />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import CreateBookModal from '@/components/CreateBookModal.vue'
import { storageService, type Book } from '@/services/storage'

interface BookData {
  title: string
  author: string
  tag: string
  cover: string
}

const books = ref<Book[]>([])

// 加载书籍列表
onMounted(() => {
  books.value = storageService.getBooks()
})

const showCreateModal = ref(false)

// 处理创建书籍
const handleCreateBook = (bookData: BookData) => {
  const newBook = storageService.saveBook({
    title: bookData.title,
    author: bookData.author.replace(/\s*著\s*$/, ''),
    cover: bookData.cover || '/static/default-cover.png',
    tag: bookData.tag || '新作品',
    volumeCount: 0,
    chapterCount: 0,
    wordCount: 0
  })
  
  books.value.push(newBook)
  showCreateModal.value = false
  
  uni.showToast({
    title: '创建成功',
    icon: 'success'
  })
}

// 处理取消创建
const handleCancelCreate = () => {
  showCreateModal.value = false
}

// 打开弹窗
const openCreateModal = () => {
  showCreateModal.value = true
}

const handleBookClick = (book: Book) => {
  uni.navigateTo({
    url: `/pages/book/book?id=${book.id}&title=${encodeURIComponent(book.title)}&author=${encodeURIComponent(book.author)}&tag=${encodeURIComponent(book.tag)}&cover=${encodeURIComponent(book.cover)}`
  })
}

const handleRefresh = () => {
  console.log('刷新')
}

const handleMore = () => {
  console.log('更多')
}
</script>

<style lang="scss">
.container {
  min-height: 100vh;
  background: $background-secondary;
}

.books-area {
  padding: $spacing-lg;
  
  .book-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: $spacing-lg;
    
    .book-item {
      position: relative;
      background: $background-primary;
      border-radius: $radius-lg;
      overflow: hidden;
      box-shadow: $shadow-sm;
      @include transition-all;
      @include hover-scale;
      
      .book-cover {
        width: 100%;
        height: 280rpx;
        background: $background-tertiary;
      }
      
      .book-info {
        padding: $spacing-sm;
        
        .book-title {
          font-size: $font-md;
          color: $text-primary;
          text-align: center;
          @include text-ellipsis;
        }
        
        .book-author {
          font-size: $font-sm;
          color: $text-secondary;
          text-align: center;
          @include text-ellipsis;
          
          &::before {
            content: '作者：';
          }
        }
      }
      
      .book-tag {
        position: absolute;
        top: 0;
        left: 0;
        padding: $spacing-xs $spacing-sm;
        background: $primary-color;
        color: white;
        font-size: $font-sm;
        border-radius: 0 0 $radius-md 0;
      }
    }
  }
}
</style>
