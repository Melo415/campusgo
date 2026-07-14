<template>
  <view class="container">
    <!-- 自定义图片预览组件 -->
    <custom-image-preview 
      v-model:visible="previewVisible" 
      :images="previewImages" 
      :current="previewCurrentIndex"
      @close="onPreviewClose"
    />

    <!-- 博客内容区域 -->
    <view class="blog-content">
      <!-- 标题 -->
      <view class="blog-title">{{ blog.title }}</view>
      
      <!-- 作者信息 -->
      <view class="author-info" @click="goToUserInfo(blog.userId)">
        <image :src="blog.icon ? getFullImageUrl(blog.icon) : '/static/default-avatar.png'" class="author-avatar" mode="aspectFill"></image>
        <view class="author-detail">
          <text class="author-name">{{ blog.name }}</text>
          <text class="publish-time">{{ formatTime(blog.createTime) }}</text>
        </view>
        <button 
          v-if="!isSelfBlog"
          class="follow-btn" 
          :class="{ active: isFollowed }"
          @click.stop="toggleFollow"
        >{{ isFollowed ? '已关注' : '关注' }}</button>
      </view>
      
      <!-- 图片展示 -->
      <swiper class="image-swiper" v-if="blog.images" indicator-dots autoplay="false" circular>
        <swiper-item v-for="(img, index) in blog.images.split(',')" :key="index">
          <image 
            :src="getFullImageUrl(img)"
            mode="aspectFill"
            class="swiper-image"
            @click="openCustomPreview(index)"
          ></image>
        </swiper-item>
      </swiper>
      
      <!-- 内容 -->
      <view class="content-text">{{ blog.content }}</view>
      
      <!-- 底部操作栏 -->
      <view class="action-bar">
        <view class="like-section" :class="{ active: isLiked }" @click="toggleLike">
          <image :src="blog.isLike ? '/static/liked.png' : '/static/like.png'" class="action-icon" mode="aspectFit"></image>
          <text class="action-text">{{ likeCount }}</text>
        </view>
        <view class="comment-section">
          <image src="/static/comment.png" class="action-icon" mode="aspectFit"></image>
          <text class="action-text">{{ commentCount }}</text>
        </view>
      </view>
      
      <!-- 点赞用户列表 -->
      <view class="likes-list" v-if="likes.length > 0">
        <view class="likes-title">点赞用户</view>
        <view class="likes-grid">
          <view v-for="(user, index) in likes" :key="index" class="like-user">
            <image 
              :src="user.icon ? getFullImageUrl(user.icon) : '/static/default-avatar.png'" 
              class="like-avatar" 
              mode="aspectFill"
              @click="goToUserInfo(user.id)"
            ></image>
            <text class="like-name">{{ user.nickName }}</text>
          </view>
        </view>
      </view>

      <!-- 评论列表 -->
      <view class="comments-section">
        <view class="comments-title">评论 ({{ comments.length }})</view>
        <view class="comment-list">
          <view v-for="(comment, index) in comments" :key="index" class="comment-item">
            <view class="comment-header">
              <image 
                :src="comment.icon ? getFullImageUrl(comment.icon) : '/static/default-avatar.png'" 
                class="comment-avatar" 
                mode="aspectFill"
                @click="goToUserInfo(comment.userId)"
              ></image>
              <view class="comment-info">
                <text class="comment-name" @click="goToUserInfo(comment.userId)">{{ comment.nickName }}</text>
                <text class="comment-time">{{ formatTime(comment.createTime) }}</text>
              </view>
            </view>
            <view class="comment-content">
              <text v-if="comment.targetNickName" class="reply-to">回复 {{ comment.targetNickName }}：</text>
              {{ comment.content }}
            </view>
            <view class="comment-actions">
              <text class="reply-btn" @click="showReplyInput(comment)">回复</text>
            </view>
            
            <!-- 子评论列表 -->
            <view v-if="comment.children && comment.children.length > 0" class="sub-comments">
              <view v-for="(subComment, subIndex) in comment.children" :key="subIndex" class="sub-comment-item">
                <view class="sub-comment-header">
                  <image 
                    :src="subComment.icon ? getFullImageUrl(subComment.icon) : '/static/default-avatar.png'" 
                    class="sub-comment-avatar" 
                    mode="aspectFill"
                    @click="goToUserInfo(subComment.userId)"
                  ></image>
                  <view class="sub-comment-info">
                    <text class="sub-comment-name" @click="goToUserInfo(subComment.userId)">{{ subComment.nickName }}</text>
                    <text class="sub-comment-time">{{ formatTime(subComment.createTime) }}</text>
                  </view>
                </view>
                <view class="sub-comment-content">
                  <text v-if="subComment.targetNickName" class="reply-to" @click="goToUserInfo(subComment.targetUserId)">回复 {{ subComment.targetNickName }}：</text>
                  {{ subComment.content }}
                </view>
                <view class="comment-actions">
                  <text class="reply-btn" @click="showReplyInput(subComment)">回复</text>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 评论输入框 -->
    <view class="comment-input-container">
      <input 
        type="text" 
        v-model="commentContent" 
        :placeholder="replyPlaceholder" 
        class="comment-input"
        @confirm="submitComment"
      />
      <button class="submit-btn" @click="submitComment">发送</button>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getFullUrl } from '../../config/api.config'
import customImagePreview from '../../components/custom-image-preview.vue'

// 基础URL
const baseURL = '/static/images'

// 博客数据
const blog = ref({})
const likes = ref([])

// 评论相关
const comments = ref([])
const commentContent = ref('')

// 回复相关
const replyPlaceholder = ref('写下你的评论...')
const currentReplyComment = ref(null)

// 关注状态
const isFollowed = ref(false)

// 当前用户ID
const currentUserId = ref(null)

// 图片预览状态
const previewVisible = ref(false)
const previewImages = ref([])
const previewCurrentIndex = ref(0)

// 计算属性：判断是否是自己的博客
const isSelfBlog = computed(() => {
  return currentUserId.value && blog.value.userId === currentUserId.value
})

// 计算属性：处理点赞状态
const isLiked = computed(() => {
  return blog.value.isLike || false
})

// 计算属性：处理点赞数
const likeCount = computed(() => {
  return blog.value.liked || 0
})

// 计算属性：处理评论数
const commentCount = computed(() => {
  return blog.value.comments || 0
})

// 获取完整图片URL
const getFullImageUrl = (url) => {
  if (!url) return '/static/default-avatar.png'
  if (url.startsWith('http')) return url
  if (url.startsWith('/static')) return url
  return baseURL + '/' + url
}

// 格式化时间
const formatTime = (time) => {
  if (!time) return ''
  console.log('Input time:', time, 'Type:', typeof time);
  let date;
  // 检查时间是否为数组格式
  if (Array.isArray(time)) {
    // 如果数组长度小于6，补充缺失的元素
    const timeArray = [...time];
    while (timeArray.length < 6) {
      timeArray.push(0); // 补充缺失的分钟或秒数
    }
    // 注意月份需要减1
    date = new Date(timeArray[0], timeArray[1] - 1, timeArray[2], timeArray[3], timeArray[4], timeArray[5]);
  } else {
    // 尝试解析其他格式的时间
    date = new Date(time);
  }
  console.log('Parsed date:', date);
  // 检查日期是否有效
  if (isNaN(date.getTime())) {
    console.error('Invalid time format for date:', time);
    return '日期无效';
  }
  const formatted = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  console.log('Formatted result:', formatted);
  return formatted;
}

// 预览图片
const previewImage = (index) => {
  const images = blog.value.images.split(',').map(img => getFullImageUrl(img))
  uni.previewImage({
    urls: images,
    current: index
  })
}

// 打开自定义图片预览
const openCustomPreview = (index) => {
  previewImages.value = blog.value.images.split(',').map(img => getFullImageUrl(img))
  previewCurrentIndex.value = index
  previewVisible.value = true
}

// 自定义图片预览关闭回调
const onPreviewClose = () => {
  previewVisible.value = false
}

// 点赞/取消点赞
const toggleLike = async () => {
  try {
    const token = uni.getStorageSync('token')
    if (!token) {
      uni.showToast({
        title: '请先登录',
        icon: 'none'
      })
      setTimeout(() => {
        uni.navigateTo({
          url: '/pages/login/login'
        })
      }, 800)
      return
    }
    
    const res = await uni.request({
      url: getFullUrl(`/blog/like/${blog.value.id}`),
      method: 'PUT',
      header: {
        'authorization': token
      }
    })
    
    if (res.statusCode === 200 && res.data.success) {
      // 重新获取博客数据
      const blogRes = await uni.request({
        url: getFullUrl(`/blog/${blog.value.id}`),
        method: 'GET',
        header: {
          'authorization': token
        }
      })
      
      if (blogRes.statusCode === 200 && blogRes.data.success) {
        // 更新博客数据
        blog.value = blogRes.data.data
        // 获取点赞用户列表
        getLikesList()
        
        // Emit event with updated like status and count
        uni.$emit('blogUpdated', {
          id: blog.value.id,
          isLike: blog.value.isLike,
          liked: blog.value.liked
        })
        
        uni.showToast({
          title: blog.value.isLike ? '点赞成功' : '取消点赞',
          icon: 'none'
        })
      }
    }
  } catch (error) {
    console.error('操作失败:', error)
    uni.showToast({
      title: '操作失败',
      icon: 'none'
    })
  }
}

// 获取博客详情
const getBlogDetail = async (id) => {
  try {
    const token = uni.getStorageSync('token')
    const res = await uni.request({
      url: getFullUrl(`/blog/${id}`),
      method: 'GET',
      header: {
        'authorization': token
      }
    })
    
    if (res.statusCode === 200 && res.data.success) {
      blog.value = res.data.data
      console.log('博客详情数据:', blog.value)
      // 确保isLike属性存在
      if (blog.value.isLike === undefined) {
        blog.value.isLike = false
      }
      // 获取点赞用户列表
      getLikesList()
      // 获取评论列表
      getComments()
      // 检查关注状态
      checkFollowStatus()
    } else if (res.statusCode === 401) {
      uni.showToast({
        title: '请先登录',
        icon: 'none'
      })
      setTimeout(() => {
        uni.navigateTo({
          url: '/pages/login/login'
        })
      }, 1500)
    }
  } catch (error) {
    console.error('获取博客详情失败:', error)
    uni.showToast({
      title: '获取博客详情失败',
      icon: 'none'
    })
  }
}

// 获取点赞用户列表
const getLikesList = async () => {
  try {
    const token = uni.getStorageSync('token')
    const res = await uni.request({
      url: getFullUrl(`/blog/likes/${blog.value.id}`),
      method: 'GET',
      header: {
        'authorization': token
      }
    })
    
    if (res.statusCode === 200 && res.data.success) {
      likes.value = res.data.data
    }
  } catch (error) {
    console.error('获取点赞列表失败:', error)
  }
}

// 获取评论列表
const getComments = async () => {
  try {
    const token = uni.getStorageSync('token')
    const res = await uni.request({
      url: getFullUrl(`/blog/comments/${blog.value.id}`),
      method: 'GET',
      header: {
        'authorization': token
      }
    })
    
    if (res.statusCode === 200 && res.data.success) {
      comments.value = res.data.data
    }
    console.log('评论列表:', comments.value)
  } catch (error) {
    console.error('获取评论列表失败:', error)
    uni.showToast({
      title: '获取评论列表失败',
      icon: 'none'
    })
  }
}

// 显示回复输入框
const showReplyInput = (comment) => {
  currentReplyComment.value = comment
  replyPlaceholder.value = `回复 ${comment.nickName}：`
  // 滚动到输入框
  uni.pageScrollTo({
    scrollTop: 999999,
    duration: 300
  })
}

// 提交评论
const submitComment = async () => {
  if (!commentContent.value.trim()) {
    uni.showToast({
      title: '请输入评论内容',
      icon: 'none'
    })
    return
  }

  try {
    const token = uni.getStorageSync('token')
    if (!token) {
      uni.showToast({
        title: '请先登录',
        icon: 'none'
      })
      setTimeout(() => {
        uni.navigateTo({
          url: '/pages/login/login'
        })
      }, 1500)
      return
    }

    const commentData = {
      blogId: blog.value.id,
      content: commentContent.value
    }

    // 如果是回复评论
    if (currentReplyComment.value) {
      commentData.parentId = currentReplyComment.value.parentId || currentReplyComment.value.id
      commentData.answerId = currentReplyComment.value.id
      commentData.targetUserId = currentReplyComment.value.userId
    }

    console.log('准备提交评论:', commentData)

    const res = await uni.request({
      url: currentReplyComment.value ? getFullUrl('/blog/comments/reply') : getFullUrl('/blog/comments'),
      method: 'POST',
      header: {
        'authorization': token
      },
      data: commentData
    })

    console.log('评论提交响应:', res)

    if (res.statusCode === 200 && res.data.success) {
      uni.showToast({
        title: '评论成功',
        icon: 'success'
      })
      // 清空输入框和回复状态
      commentContent.value = ''
      currentReplyComment.value = null
      replyPlaceholder.value = '写下你的评论...'
      // 重新获取评论列表
      await getComments()
      // 更新博客评论数
      blog.value.comments = (blog.value.comments || 0) + 1
      // Emit event with updated comment count
      uni.$emit('blogUpdated', {
        id: blog.value.id,
        comments: blog.value.comments
      })
      // 触发全局事件通知 my.vue 更新评价列表
      uni.$emit('commentPublished')
    } else {
      console.error('评论失败:', res.data)
      uni.showToast({
        title: res.data.message || '评论失败',
        icon: 'none'
      })
    }
  } catch (error) {
    console.error('评论失败:', error)
    uni.showToast({
      title: '评论失败',
      icon: 'none'
    })
  }
}

// 检查是否已关注
const checkFollowStatus = async () => {
  if (!blog.value.userId) {
    console.log('[checkFollowStatus] blog.userId not available yet, skipping check.');
    return;
  }
  try {
    const token = uni.getStorageSync('token')
    if (!token) {
      console.log('[checkFollowStatus] No token found, skipping check.');
      isFollowed.value = false;
      return;
    }

    console.log(`[checkFollowStatus] Checking follow status for userId: ${blog.value.userId}`);
    const res = await uni.request({
      url: getFullUrl(`/follow/or/not/${blog.value.userId}`),
      method: 'GET',
      header: { 'authorization': token }
    })

    if (res.statusCode === 200 && res.data.success) {
      isFollowed.value = res.data.data
      console.log(`[checkFollowStatus] Follow status updated: ${isFollowed.value}`);
    } else {
      console.error('[checkFollowStatus] API call failed or returned error:', res);
      isFollowed.value = false;
    }
  } catch (error) {
    console.error('获取关注状态失败 (catch block):', error)
    isFollowed.value = false;
  }
}

// 关注/取消关注
const toggleFollow = async () => {
  try {
    const token = uni.getStorageSync('token')
    if (!token) {
      uni.showToast({
        title: '请先登录',
        icon: 'none'
      })
      setTimeout(() => {
        uni.navigateTo({
          url: '/pages/login/login'
        })
      }, 1500)
      return
    }

    const res = await uni.request({
      url: getFullUrl(`/follow/${blog.value.userId}/${!isFollowed.value}`),
      method: 'PUT',
      header: {
        'authorization': token
      }
    })

    if (res.statusCode === 200 && res.data.success) {
      isFollowed.value = !isFollowed.value
      uni.showToast({
        title: isFollowed.value ? '关注成功' : '已取消关注',
        icon: 'success'
      })
    } else {
      uni.showToast({
        title: res.data.message || '操作失败',
        icon: 'none'
      })
    }
  } catch (error) {
    console.error('关注操作失败:', error)
    uni.showToast({
      title: '操作失败',
      icon: 'none'
    })
  }
}

// 获取当前用户信息
const getCurrentUser = async () => {
  try {
    const token = uni.getStorageSync('token')
    if (!token) return

    const res = await uni.request({
      url: getFullUrl('/user/me'),
      method: 'GET',
      header: {
        'authorization': token
      }
    })

    if (res.statusCode === 200 && res.data.success) {
      currentUserId.value = res.data.data.id
    }
  } catch (error) {
    console.error('获取当前用户信息失败:', error)
  }
}

// 跳转到用户信息页面
const goToUserInfo = (userId) => {
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

// 页面加载
onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const options = currentPage.$page?.options || {}
  const id = options.id
  
  console.log('当前页面参数:', options)
  console.log('博客ID:', id)
  
  if (id) {
    getCurrentUser()
    getBlogDetail(id)
  } else {
    console.error('未获取到博客ID')
    uni.showToast({
      title: '参数错误',
      icon: 'none'
    })
  }
})

// 页面显示时触发
onShow(() => {
  console.log('[onShow] Blog detail page became visible.');
  if (blog.value.userId) {
    checkFollowStatus();
  }
})
</script>

<style lang="scss">
.container {
  background-color: #f8f8f8;
  min-height: 100vh;
  padding: 20rpx;
}

.blog-content {
  background-color: #fff;
  border-radius: 12rpx;
  padding: 30rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
  margin-bottom: 20rpx;
}

.blog-title {
  font-size: 40rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 30rpx;
  line-height: 1.4;
}

.author-info {
  display: flex;
  align-items: center;
  margin-bottom: 30rpx;
  
  .author-avatar {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
    margin-right: 20rpx;
    border: 2rpx solid #f5f5f5;
  }
  
  .author-detail {
    flex: 1;
    display: flex;
    flex-direction: column;
    
    .author-name {
      font-size: 32rpx;
      color: #333;
      font-weight: 500;
      margin-bottom: 4rpx;
    }
    
    .publish-time {
      font-size: 26rpx;
      color: #999;
    }
  }
  
  .follow-btn {
    min-width: 140rpx;
    height: 56rpx;
    line-height: 56rpx;
    text-align: center;
    border-radius: 28rpx;
    font-size: 26rpx;
    background-color: #07C160;
    color: #fff;
    padding: 0 20rpx;
    border: none;
    
    &.active {
      background-color: #f5f5f5;
      color: #666;
    }
  }
}

.image-list {
  margin-bottom: 30rpx;
  
  .blog-image {
    width: 100%;
    margin-bottom: 20rpx;
    border-radius: 12rpx;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
  }
}

.image-swiper {
  width: 100%;
  height: 600rpx;
  margin-bottom: 30rpx;
  border-radius: 12rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.swiper-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.content-text {
  font-size: 32rpx;
  color: #333;
  line-height: 1.8;
  margin-bottom: 30rpx;
  white-space: pre-wrap;
}

.action-bar {
  display: flex;
  align-items: center;
  padding: 20rpx 0;
  border-top: 1rpx solid #f5f5f5;
  margin-top: 30rpx;
  
  .like-section,
  .comment-section {
    display: flex;
    align-items: center;
    margin-right: 40rpx;
    padding: 10rpx 20rpx;
    border-radius: 30rpx;
    background-color: #f8f8f8;
    
    .action-icon {
      width: 36rpx;
      height: 36rpx;
      margin-right: 10rpx;
    }
    
    .action-text {
      font-size: 28rpx;
      color: #666;
    }
  }
  
  .like-section {
    &.active {
      background-color: #fff0f0;
      .action-text {
        color: #ff4d4f;
      }
    }
  }
}

.likes-list {
  margin-top: 30rpx;
  padding: 30rpx;
  background-color: #fff;
  border-radius: 12rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
  
  .likes-title {
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 30rpx;
    display: flex;
    align-items: center;
    
    &::before {
      content: '';
      display: inline-block;
      width: 6rpx;
      height: 30rpx;
      background-color: #ff4d4f;
      margin-right: 10rpx;
      border-radius: 3rpx;
    }
  }
  
  .likes-grid {
    display: flex;
    flex-wrap: wrap;
    
    .like-user {
      width: 25%;
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 30rpx;
      
      .like-avatar {
        width: 80rpx;
        height: 80rpx;
        border-radius: 50%;
        margin-bottom: 10rpx;
        border: 2rpx solid #f5f5f5;
      }
      
      .like-name {
        font-size: 26rpx;
        color: #666;
        text-align: center;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }
}

.comments-section {
  margin-top: 30rpx;
  padding: 30rpx;
  background-color: #fff;
  border-radius: 12rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
  
  .comments-title {
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 30rpx;
    display: flex;
    align-items: center;
    
    &::before {
      content: '';
      display: inline-block;
      width: 6rpx;
      height: 30rpx;
      background-color: #2979ff;
      margin-right: 10rpx;
      border-radius: 3rpx;
    }
  }
  
  .comment-list {
    .comment-item {
      padding: 20rpx 0;
      border-bottom: 1rpx solid #f5f5f5;
      
      &:last-child {
        border-bottom: none;
      }
      
      .comment-header {
        display: flex;
        align-items: center;
        margin-bottom: 10rpx;
        
        .comment-avatar {
          width: 60rpx;
          height: 60rpx;
          border-radius: 50%;
          margin-right: 20rpx;
        }
        
        .comment-info {
          display: flex;
          flex-direction: column;
          
          .comment-name {
            font-size: 28rpx;
            color: #333;
            font-weight: 500;
          }
          
          .comment-time {
            font-size: 24rpx;
            color: #999;
            margin-top: 4rpx;
          }
        }
      }
      
      .comment-content {
        font-size: 28rpx;
        color: #333;
        line-height: 1.6;
        padding-left: 80rpx;
        
        .reply-to {
          color: #2979ff;
          margin-right: 10rpx;
        }
      }

      .comment-actions {
        padding-left: 80rpx;
        margin-top: 10rpx;
        
        .reply-btn {
          font-size: 24rpx;
          color: #666;
          padding: 4rpx 12rpx;
          background-color: #f5f5f5;
          border-radius: 20rpx;
        }
      }
    }
  }
}

.comment-input-container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #fff;
  padding: 20rpx;
  display: flex;
  align-items: center;
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);
  
  .comment-input {
    flex: 1;
    height: 72rpx;
    background-color: #f5f5f5;
    border-radius: 36rpx;
    padding: 0 30rpx;
    font-size: 28rpx;
    margin-right: 20rpx;
  }
  
  .submit-btn {
    width: 120rpx;
    height: 72rpx;
    line-height: 72rpx;
    text-align: center;
    background-color: #2979ff;
    color: #fff;
    border-radius: 36rpx;
    font-size: 28rpx;
  }
}

.sub-comments {
  margin-left: 40rpx;
  padding-left: 40rpx;
  border-left: 2rpx solid #f5f5f5;
  
  .sub-comment-item {
    padding: 20rpx 0;
    border-bottom: 1rpx solid #f5f5f5;
    
    &:last-child {
      border-bottom: none;
    }
    
    .sub-comment-header {
      display: flex;
      align-items: center;
      margin-bottom: 10rpx;
      
      .sub-comment-avatar {
        width: 50rpx;
        height: 50rpx;
        border-radius: 50%;
        margin-right: 15rpx;
      }
      
      .sub-comment-info {
        display: flex;
        flex-direction: column;
        
        .sub-comment-name {
          font-size: 26rpx;
          color: #333;
          font-weight: 500;
        }
        
        .sub-comment-time {
          font-size: 22rpx;
          color: #999;
          margin-top: 4rpx;
        }
      }
    }
    
    .sub-comment-content {
      font-size: 26rpx;
      color: #333;
      line-height: 1.6;
      padding-left: 65rpx;
      
      .reply-to {
        color: #2979ff;
        margin-right: 10rpx;
      }
    }
  }
}
</style> 