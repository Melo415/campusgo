<template>
  <view class="foot-massage-empty-container">
    <text class="empty-text">别想了孩子，XD怎么可能会有足浴店呢？</text>
  </view>
</template>

<script>
export default {
  data() {
    return {};
  },
  methods: {}
};
</script>

<style scoped>
.foot-massage-empty-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh; /* 使容器至少占满整个视口高度 */
  background-color: #f4f4f4; /* 背景颜色 */
}

.empty-text {
  font-size: 18px; /* 文字大小 */
  color: #333; /* 文字颜色 */
  text-align: center; /* 文字居中 */
  line-height: 1.5; /* 行高 */
}
</style>