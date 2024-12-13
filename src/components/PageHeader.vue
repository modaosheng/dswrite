<template>
  <view class="page-header">
    <view class="header-left">
      <slot name="left"></slot>
      <text class="title">{{ title }}</text>
    </view>
    
    <view class="header-right">
      <template v-if="rightButtons">
        <view 
          v-for="(btn, index) in rightButtons" 
          :key="index"
          class="header-btn"
          @click="btn.action"
        >
          <uv-icon 
            :name="btn.icon"
            color="#ffffff"
            size="22"
          ></uv-icon>
        </view>
      </template>
      <slot name="right"></slot>
    </view>
  </view>
</template>

<script setup lang="ts">
defineProps<{
  title?: string
  rightButtons?: Array<{
    icon: string
    action: () => void
  }>
}>()
</script>

<style lang="scss">
.page-header {
  @include flex-between;
  padding: $spacing-lg;
  @include gradient-primary;
  
  .header-left {
    @include flex-center;
    gap: $spacing-md;
    
    .title {
      font-size: $font-lg;
      font-weight: $weight-semibold;
      color: white;
    }
  }
  
  .header-right {
    @include flex-center;
    gap: $spacing-md;
    
    .header-btn {
      @include flex-center;
      width: 72rpx;
      height: 72rpx;
      border-radius: $radius-full;
      background: rgba(255, 255, 255, 0.2);
      @include hover-scale;
    }
  }
}
</style> 