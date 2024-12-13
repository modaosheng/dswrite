<template>
  <view class="modal-wrapper" v-if="visible" @click.stop="handleMaskClick">
    <view class="modal-content" @click.stop>
      <view class="modal-header">
        <text class="title">新建作品</text>
      </view>
      
      <view class="form-content">
        <view class="form-item">
          <text class="label">书名</text>
          <input 
            class="input" 
            v-model="formData.title"
            placeholder="请输入书名，必填" 
          />
        </view>

        <view class="form-item">
          <text class="label">作者</text>
          <input 
            class="input" 
            v-model="formData.author"
            placeholder="TEL"
          />
        </view>

        <view class="form-item">
          <text class="label">标签</text>
          <input 
            class="input" 
            v-model="formData.tag"
            placeholder="新作品" 
          />
        </view>
        
        <view class="form-item">
          <text class="label">封面</text>
          <view class="cover-upload" @click="handleChooseImage">
            <image 
              v-if="coverUrl" 
              :src="coverUrl" 
              mode="aspectFill" 
              class="cover-image"
            />
            <view v-else class="upload-placeholder">
              <uv-icon name="photo" size="40"></uv-icon>
              <text>添加封面</text>
            </view>
          </view>
        </view>
      </view>

      <view class="actions">
        <button class="btn cancel" @click="handleCancel">取消</button>
        <button class="btn confirm" @click="handleConfirm">确定</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible', 'confirm', 'cancel'])

const coverUrl = ref('')
const formData = reactive({
  title: '',
  author: 'TEL',
  tag: '新作品'
})

// 选择图片
const handleChooseImage = () => {
  uni.chooseImage({
    count: 1,
    success: (res) => {
      coverUrl.value = res.tempFilePaths[0]
    }
  })
}

// 点击遮罩层
const handleMaskClick = () => {
  emit('update:visible', false)
}

// 取消
const handleCancel = () => {
  emit('cancel')
  emit('update:visible', false)
}

// 确定
const handleConfirm = () => {
  if (!formData.title.trim()) {
    uni.showToast({
      title: '请输入书名',
      icon: 'none'
    })
    return
  }
  
  emit('confirm', {
    ...formData,
    cover: coverUrl.value
  })
  emit('update:visible', false)
}
</script>

<style lang="scss" scoped>
.modal-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  @include flex-center;
  z-index: 999;
}

.modal-content {
  background: $background-primary;
  border-radius: $radius-lg;
  padding: $spacing-xl;
  width: 80%;
  max-width: 600rpx;
  
  .modal-header {
    @include flex-between;
    margin-bottom: $spacing-lg;
    
    .title {
      font-size: $font-lg;
      font-weight: $weight-semibold;
      color: $text-primary;
    }
  }
  
  .form-content {
    .form-item {
      margin-bottom: $spacing-lg;
      
      .label {
        display: block;
        font-size: $font-md;
        color: $text-secondary;
        margin-bottom: $spacing-sm;
      }
      
      .input {
        width: 100%;
        padding: $spacing-md;
        border: 1px solid $border-color;
        border-radius: $radius-md;
        font-size: $font-md;
        color: $text-primary;
        background: $background-secondary;
        
        &:focus {
          border-color: $primary-color;
        }
      }
      
      .cover-upload {
        width: 200rpx;
        height: 260rpx;
        border: 2rpx dashed $border-color;
        border-radius: $radius-md;
        overflow: hidden;
        @include transition-all;
        
        &:active {
          border-color: $primary-color;
        }
        
        .cover-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .upload-placeholder {
          width: 100%;
          height: 100%;
          @include flex-center;
          flex-direction: column;
          gap: $spacing-sm;
          color: $text-secondary;
          
          .uv-icon {
            color: $text-disabled;
          }
          
          text {
            font-size: $font-sm;
          }
        }
      }
    }
  }
  
  .actions {
    @include flex-between;
    margin-top: $spacing-xl;
    
    .btn {
      padding: $spacing-sm $spacing-xl;
      border-radius: $radius-md;
      font-size: $font-md;
      @include transition-all;
      @include hover-scale;
      
      &.cancel {
        color: $text-secondary;
        background: $background-tertiary;
      }
      
      &.confirm {
        @include gradient-primary;
        color: white;
      }
    }
  }
}
</style> 