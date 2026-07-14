<template>
  <view class="entertainment-container">
    <view class="construction-box">
      <image class="construction-icon" src="../../static/construction.png" mode="aspectFit"></image>
      <text class="construction-text">此页面正在施工中</text>
      <text class="construction-subtext">敬请期待...</text>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';

// 页面生命周期
onMounted(() => {
  // 初始化逻辑
});
</script>

<style lang="scss">
.entertainment-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f5f5;
  
  .construction-box {
    background-color: #ffffff;
    padding: 40rpx 30rpx;
    border-radius: 20rpx;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 80%;
    max-width: 600rpx;
    margin-top: -15vh;
    
    .construction-icon {
      width: 200rpx;
      height: 200rpx;
      margin-bottom: 30rpx;
    }
    
    .construction-text {
      font-size: 36rpx;
      color: #333333;
      font-weight: bold;
      margin-bottom: 20rpx;
    }
    
    .construction-subtext {
      font-size: 28rpx;
      color: #666666;
    }
  }
}
</style> 