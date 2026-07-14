<template>
  <view v-if="visible" class="custom-image-preview" @click="close">
    <swiper 
      class="image-swiper" 
      :current="currentIndex" 
      @change="onSwiperChange"
      @animationfinish="onAnimationFinish"
    >
      <swiper-item v-for="(img, index) in images" :key="index">
        <image :src="img" mode="widthFix" class="preview-image"></image>
      </swiper-item>
    </swiper>
    <!-- 关闭按钮 -->
    <view class="close-btn" @click.stop="close">
      <text>✕</text>
    </view>
  </view>
</template>

<script setup>
import { ref, watch } from 'vue'

// 定义组件属性
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  images: {
    type: Array,
    default: () => []
  },
  current: {
    type: Number,
    default: 0
  }
})

// 定义组件事件
const emit = defineEmits(['update:visible', 'close'])

// 当前显示的图片索引
const currentIndex = ref(props.current)
// 标记是否正在滑动
const isSliding = ref(false)
// 标记是否需要关闭
const shouldClose = ref(false)

// 监听props变化，更新当前索引
watch(() => props.current, (newVal) => {
  currentIndex.value = newVal
})

// 监听props变化，更新当前索引
watch(() => props.visible, (newVal) => {
  if (newVal) {
    currentIndex.value = props.current
    isSliding.value = false
    shouldClose.value = false
  }
})

// 轮播图切换时触发
const onSwiperChange = (e) => {
  currentIndex.value = e.detail.current
  isSliding.value = true
  shouldClose.value = false
  
  // 检查是否滑动到最后一张
  if (currentIndex.value === props.images.length - 1) {
    shouldClose.value = true
  }
}

// 动画结束时触发
const onAnimationFinish = () => {
  if (isSliding.value && shouldClose.value) {
    // 滑动到最后一张，延迟关闭
    setTimeout(() => {
      close()
    }, 300)
  }
  isSliding.value = false
}

// 关闭预览
const close = () => {
  emit('update:visible', false)
  emit('close')
}
</script>

<style lang="scss">
.custom-image-preview {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.9);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.image-swiper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-swiper swiper-item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.close-btn {
  position: absolute;
  top: 20rpx;
  right: 20rpx;
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 40rpx;
}
</style>