<template>
  <view class="message-container">
    <!-- 顶部标题栏
    <view class="header">
      <text class="title">消息通知</text>
      <image class="header-icon" src="/static/xiaoxi.png" mode="aspectFit"></image>
    </view> -->

    <!-- 顶部标题栏 -->
    <view class="header">
      <text class="title">消息通知</text>
      <!-- 添加清除按钮，仅在有消息时显示 -->
      <view v-if="notifications.length > 0" class="header-right" @click="handleClearAll">
        <text class="clear-text">清空消息</text>
      </view>
    </view>

    <!-- 通知列表 -->
    <scroll-view 
      scroll-y 
      class="notification-list"
      :refresher-enabled="true"
      :refresher-triggered="isRefreshing"
      @refresherrefresh="onRefresh"
    >
      <view v-if="notifications.length === 0" class="empty-state">
        <image class="empty-icon" src="/static/empty-message.png" mode="aspectFit"></image>
        <text class="empty-text">暂无消息通知</text>
      </view>

      <view 
        v-for="(notification, index) in notifications" 
        :key="index" 
        class="notification-item"
        :class="{ unread: !notification.read }"
        @click="goToUserProfile(notification.fromUserId)"
      >
        <!-- 发送者头像 -->
        <image 
          :src="notification.fromUserIcon || '/static/default-avatar.png'" 
          class="sender-avatar"
          mode="aspectFill"
        ></image>

        <!-- 通知内容 -->
        <view class="notification-content">
          <view class="notification-header">
            <text class="sender-name">{{ notification.fromUserName || '用户' }}</text>
            <text class="notification-time">{{ formatTime(notification.createTime) }}</text>
          </view>
          <text class="notification-text">{{ formatNotification(notification) }}</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
import { wsClient } from '@/utils/websocket'
import { 
    getNotifications, 
    addNotification, 
    markAllAsRead, 
    deleteNotification, 
    clearAllNotifications,
    getUnreadCount 
} from '@/utils/storage'  // 确保这个文件也存在
import { getFullUrl } from '@/config/api.config'

export default {
  setup() {
    const notifications = ref(getNotifications())
    const isRefreshing = ref(false)
    const unreadCount = ref(getUnreadCount())

    // 获取用户信息
    const getUserInfo = async (userId) => {
      try {
        const token = uni.getStorageSync('token')
        const res = await uni.request({
          url: getFullUrl(`/user/${userId}`),
          method: 'GET',
          header: {
            'authorization': token
          }
        })
        
        if (res.statusCode === 200 && res.data.success) {
          return res.data.data
        }
        return null
      } catch (error) {
        console.error('获取用户信息失败:', error)
        return null
      }
    }

    // 格式化通知内容
    const formatNotification = (notification) => {
      try {
        switch (notification.type) {
          case 3: // FOLLOW
            return `关注了你`
          case 1: // LIKE
            return `点赞了你的博客`
          case 2: // COMMENT
            return `评论了你的博客: ${notification.content || ''}`
          default:
            return notification.content || ''
        }
      } catch (error) {
        console.error('格式化消息失败:', error, notification)
        return ''
      }
    }

    // 格式化时间
    const formatTime = (time) => {
      if (!time) return ''
      const date = new Date(time)
      const now = new Date()
      const diff = now - date
      
      // 小于1分钟
      if (diff < 60000) {
        return '刚刚'
      }
      // 小于1小时
      if (diff < 3600000) {
        return `${Math.floor(diff / 60000)}分钟前`
      }
      // 小于24小时
      if (diff < 86400000) {
        return `${Math.floor(diff / 3600000)}小时前`
      }
      // 大于24小时
      return date.toLocaleDateString()
    }

    // 处理新消息
    const handleNewMessage = async (message) => {
      try {
        // 如果消息是字符串，需要解析成对象
        const messageData = typeof message === 'string' ? JSON.parse(message) : message;
        
        // 添加消息ID来防止重复
        const messageId = `${messageData.fromUserId}_${messageData.type}_${messageData.createTime}`;
        
        // 检查消息是否已存在
        const existingNotifications = getNotifications();
        const isDuplicate = existingNotifications.some(notification => 
            `${notification.fromUserId}_${notification.type}_${notification.createTime}` === messageId
        );

        if (!isDuplicate) {
          let userInfo = null
          userInfo = await getUserInfo(messageData.fromUserId)
          
          // // 从content中提取用户名
          // let userName = '用户';
          // if (messageData.content) {
          //   const match = messageData.content.match(/^(.*?)关注了你/);//正则表达式提取用户名
          //   if (match && match[1]) {
          //     userName = match[1];
          //   }
          // }

          const notification = {
            ...messageData,
            read: false,
            fromUserIcon: userInfo?.icon || '/static/default-avatar.png',
            fromUserName: userInfo?.nickName || '用户user_bqafkr4oeh',
            // 使用服务器发送的时间，如果没有则使用当前时间
            createTime: messageData.createTime || new Date().toISOString()
          }

          console.log('收到新消息:', notification);
          addNotification(notification);
          notifications.value = getNotifications();
          unreadCount.value = getUnreadCount();
        }
      } catch (error) {
        console.error('处理消息失败:', error, message);
      }
    }

    // 标记所有消息为已读
    const handleMarkAllAsRead = () => {
      markAllAsRead()
      notifications.value = getNotifications()
      unreadCount.value = 0
    }

    // 删除单条消息
    const handleDeleteNotification = (index) => {
      deleteNotification(index)
      notifications.value = getNotifications()
      unreadCount.value = getUnreadCount()
    }

    // 清空所有消息
    const handleClearAll = () => {
      uni.showModal({
        title: '提示',
        content: '确定要清空所有消息吗？',
        confirmColor: '#ff4d4f',
        success: (res) => {
          if (res.confirm) {
            clearAllNotifications();
            notifications.value = [];
            unreadCount.value = 0;
            // 显示清除成功提示
            uni.showToast({
              title: '清除成功',
              icon: 'success',
              duration: 2000
            });
          }
        }
      });
    }

    // 下拉刷新
    const onRefresh = async () => {
      isRefreshing.value = true
      // 重新获取消息列表
      notifications.value = getNotifications()
      unreadCount.value = getUnreadCount()
      setTimeout(() => {
        isRefreshing.value = false
      }, 1000)
    }

    // 跳转到用户主页
    const goToUserProfile = (userId) => {
      if (!userId) {
        uni.showToast({
          title: '用户信息错误',
          icon: 'none'
        })
        return
      }
      
      uni.navigateTo({
        url: `/pages/userInfo/userInfo?id=${userId}`,
        success: () => {
          console.log('跳转到用户信息页面成功')
        },
        fail: (err) => {
          console.error('跳转到用户信息页面失败:', err)
          uni.showToast({
            title: '跳转失败',
            icon: 'none'
          })
        }
      })
    }

    onMounted(() => {
      // 只在未连接时建立连接
      if (!wsClient.connected) {
        wsClient.connect()
      }
      wsClient.addMessageHandler(handleNewMessage)
      
      // 进入消息页面时，标记所有消息为已读
      handleMarkAllAsRead()
    })

    onUnmounted(() => {
      wsClient.removeMessageHandler(handleNewMessage)
    })

    return {
      notifications,
      isRefreshing,
      unreadCount,
      formatNotification,
      formatTime,
      onRefresh,
      handleMarkAllAsRead,
      handleDeleteNotification,
      handleClearAll,
      goToUserProfile
    }
  }
}
</script>

<style lang="scss">
.message-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  
  .header {
    background-color: #ffffff;
    padding: 20rpx 30rpx;
    padding-top: calc(20rpx + var(--status-bar-height));
    border-bottom: 1rpx solid #eee;
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .title {
      font-size: 36rpx;
      font-weight: bold;
      color: #333;
    }
    
    .header-right {
      display: flex;
      align-items: center;
      padding: 10rpx 20rpx;
      
      .clear-text {
        font-size: 28rpx;
        color: #666;
      }
      
      &:active {
        opacity: 0.7;
      }
    }
  }
  
  .notification-list {
    height: calc(100vh - 88rpx - var(--status-bar-height));
  }
  
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 100rpx 0;
    
    .empty-icon {
      width: 200rpx;
      height: 200rpx;
      margin-bottom: 30rpx;
    }
    
    .empty-text {
      color: #999;
      font-size: 28rpx;
    }
  }
  
  .notification-item {
    display: flex;
    padding: 30rpx;
    background-color: #ffffff;
    border-bottom: 1rpx solid #eee;
    
    &.unread {
      background-color: #f0f7ff;
      
      &::before {
        content: '';
        position: absolute;
        left: 15rpx;
        width: 8rpx;
        height: 8rpx;
        border-radius: 50%;
        background-color: #ff4d4f;
      }
    }
    
    .sender-avatar {
      width: 80rpx;
      height: 80rpx;
      border-radius: 50%;
      margin-right: 20rpx;
    }
    
    .notification-content {
      flex: 1;
      
      .notification-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10rpx;
        
        .sender-name {
          font-size: 28rpx;
          color: #333;
          font-weight: 500;
        }
        
        .notification-time {
          font-size: 24rpx;
          color: #999;
        }
      }
      
      .notification-text {
        font-size: 26rpx;
        color: #666;
        line-height: 1.4;
      }
    }
  }
}
</style>