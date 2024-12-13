<template>
  <view v-if="isDev" class="debug-panel">
    <view class="header" @click="showDebugInfo = !showDebugInfo">
      <text class="title">{{ title }}</text>
      <text class="close-btn">{{ showDebugInfo ? '收起' : '展开' }}</text>
    </view>
    <view v-if="showDebugInfo" class="content">
      <template v-if="Array.isArray(data)">
        <view 
          v-for="(item, index) in data" 
          :key="index"
          class="debug-item"
        >
          <text class="message">{{ formatValue(item) }}</text>
        </view>
      </template>
      <template v-else>
        <view 
          v-for="(value, key) in data" 
          :key="key"
          class="debug-item"
        >
          <text class="label">{{ key }}:</text>
          <view class="message">{{ formatValue(value) }}</view>
        </view>
      </template>
    </view>
  </view>
</template>

<script setup lang="ts">
import { isDev, showDebugInfo } from '@/utils/debug'

const props = defineProps<{
  data: any
  title?: string
}>()

// 格式化显示值
const formatValue = (value: any): string => {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2)
    } catch {
      return Object.prototype.toString.call(value)
    }
  }
  return String(value)
}
</script>

<style lang="scss">
.debug-panel {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: $background-primary;
  border-top: 1px solid $border-color;
  @include safe-bottom;
  
  .header {
    @include flex-between;
    padding: $spacing-md $spacing-lg;
    border-bottom: 1px solid $border-color;
    
    .title {
      font-size: $font-md;
      font-weight: $weight-medium;
      color: $text-primary;
    }
    
    .close-btn {
      @include flex-center;
      padding: $spacing-xs;
      color: $text-secondary;
      @include transition-all;
      @include hover-scale;
    }
  }
  
  .content {
    padding: $spacing-lg;
    max-height: 60vh;
    overflow-y: auto;
    
    .debug-item {
      margin-bottom: $spacing-md;
      padding: $spacing-md;
      background: $background-secondary;
      border-radius: $radius-md;
      
      .item-header {
        @include flex-between;
        margin-bottom: $spacing-sm;
        
        .label {
          font-size: $font-sm;
          color: $text-secondary;
        }
        
        .time {
          font-size: $font-xs;
          color: $text-disabled;
        }
      }
      
      .message {
        font-size: $font-sm;
        color: $text-primary;
        word-break: break-all;
        
        &.error {
          color: $error-color;
        }
        
        &.warning {
          color: $warning-color;
        }
        
        &.success {
          color: $success-color;
        }
      }
    }
  }
}
</style> 