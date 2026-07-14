<template>
  <view class="user-profile">
    <!-- 用户基本信息区域 -->
    <view class="user-header">
      <view class="user-info">
        <image 
          :src="userInfo.icon || '/static/default-avatar.png'" 
          class="user-avatar" 
          mode="aspectFill"
          @click="previewImage(userInfo.icon || '/static/default-avatar.png', [userInfo.icon || '/static/default-avatar.png'])"
        ></image>
        <view class="user-details">
          <text class="user-name">{{ userInfo.nickName || '匿名' }}</text>
          <text class="user-signature">{{ userInfo.introduce || '这个人很懒，什么都没写~' }}</text>
		      <text class="user-city">{{ userInfo.city || '平壤' }}</text>
          <view class="user-stats">
            <view class="stat-item">
              <text class="stat-num">{{ userInfo.follows || 0 }}</text>
              <text class="stat-label">关注</text>
            </view>
            <view class="stat-item">
              <text class="stat-num">{{ userInfo.fans || 0 }}</text>
              <text class="stat-label">粉丝</text>
            </view>
            <view class="stat-item">
              <text class="stat-num">{{ userInfo.notes || 0 }}</text>
              <text class="stat-label">笔记</text>
            </view>
          </view>
        </view>
      </view>
      <!-- 关注按钮 -->
      <button 
        v-if="!isSelf"
        class="follow-btn" 
        :class="{ active: isFollowed }"
        @click="toggleFollow"
      >
        {{ isFollowed ? '已关注' : '关注' }}
      </button>
    </view>

    <!-- 用户笔记列表 -->
    <view class="blog-list">
      <view class="blog-title">Ta的笔记</view>
      <view v-if="blogs.length === 0" class="empty-state">
        <image src="/static/屏幕截图 2025-04-04 152710.png" mode="aspectFit" class="empty-image"></image>
        <text class="empty-text">暂无笔记</text>
      </view>
      <view v-else class="blog-items">
        <view 
          v-for="blog in blogs" 
          :key="blog.id" 
          class="blog-item"
          @click="goToBlogDetail(blog.id)"
        >
          <text class="blog-content-title">{{ blog.title }}</text>
          <text class="blog-content-text">{{ blog.content }}</text>
          <view class="blog-images" v-if="blog.images">
            <image 
              v-for="(img, index) in blog.images.split(',')"
              :key="index"
              :src="getFullImageUrl(img)"
              mode="aspectFill"
              class="blog-image"
              @click.stop="previewImage(img, blog.images.split(','))"
            ></image>
          </view>
          <view class="blog-meta">
            <text class="blog-time">{{ formatTime(blog.createTime) }}</text>
            <view class="blog-stats">
              <view class="stat-item">
                <image :src="blog.isLike ? '/static/liked.png' : '/static/like.png'" class="stat-icon"></image>
                <text class="stat-num">{{ blog.liked }}</text>
              </view>
              <view class="stat-item">
                <image src="/static/comment.png" class="stat-icon"></image>
                <text class="stat-num">{{ blog.comments }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getFullUrl } from '../../config/api.config'

// 用户信息
const userInfo = ref({})
// 是否是当前用户自己
const isSelf = ref(false)
// 是否已关注
const isFollowed = ref(false)
// 博客列表
const blogs = ref([])

// 基础URL
const baseURL = '/static/images'

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
  let date;
  // 检查时间是否为数组格式
  if (Array.isArray(time) && time.length >= 6) {
    // 注意月份需要减1
    date = new Date(time[0], time[1] - 1, time[2], time[3], time[4], time[5]);
  } else {
    // 尝试解析其他格式的时间
    date = new Date(time);
  }
  // 检查日期是否有效
  if (isNaN(date.getTime())) {
    console.error('Invalid time format for date:', time);
    return '日期无效';
  }
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// 预览图片
const previewImage = (current, urls) => {
  const fullUrls = urls.map(url => getFullImageUrl(url))
  uni.previewImage({
    urls: fullUrls,
    current: getFullImageUrl(current)
  })
}

// 获取用户信息
const loadUserInfo = async (userId) => {
  try {
    const token = uni.getStorageSync('token')
    if (!token) return

    const res = await uni.request({
      url: getFullUrl(`/user/${userId}`),
      method: 'GET',
      header: {
        'authorization': token
      }
    })
	
	const userAdditionalInfo = await uni.request({
	  url: getFullUrl(`/user/info/${userId}`),
	  method: 'GET',
	  header: {
	    'authorization': token
	  }
	})
	
    console.log('获取用户信息User_API响应:', res.data.data)
	console.log('获取用户信息UserInfo_API响应:', userAdditionalInfo.data.data)
	
	// 将userAdditionalInfo中的introduce属性添加到res.data.data对象中
	if (userAdditionalInfo.data.data && userAdditionalInfo.data.data.introduce !== undefined) {
	  // 确保res.data.data是一个对象
	  if (res.data.data) {
	    res.data.data.introduce = userAdditionalInfo.data.data.introduce;
		res.data.data.city = userAdditionalInfo.data.data.city;
	  }
	}
	
	// 现在res.data.data中包含了introduce属性
	console.log('合并后的用户信息:', res.data.data)

    if (res.statusCode === 200 && res.data.success) {
      userInfo.value = res.data.data
      // 获取用户笔记数量
      const blogRes = await uni.request({
        url: getFullUrl(`/blog/of/user?id=${userId}`),
        method: 'GET',
        header: {
          'authorization': token
        },
        data: {
          current: 1
        }
      })
      
      console.log('获取用户笔记数量API响应:', blogRes.data.data)

      if (blogRes.statusCode === 200 && blogRes.data.success) {
        userInfo.value.notes = blogRes.data.data.length
      }
      
      const followRes = await uni.request({
        url: getFullUrl(`/follow/count/${userId}`),
        method: 'GET',
        header: {
          'authorization': token
        }
      })
      console.log('获取用户关注数量API响应:', followRes.data.data.followCount)
      if (followRes.statusCode === 200 && followRes.data.success) {
        userInfo.value.follows = followRes.data.data.followCount || 0
        userInfo.value.fans = followRes.data.data.followerCount || 0
      }
      
      // 检查是否是当前用户
      checkIfSelf(userId)
      // 检查关注状态
      checkFollowStatus(userId)
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    uni.showToast({
      title: '获取用户信息失败',
      icon: 'none'
    })
  }
}

// 检查是否是当前用户
const checkIfSelf = async (userId) => {
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
      isSelf.value = Number(res.data.data.id) === Number(userId)  
      console.log('检查用户身份API响应:', isSelf.value)
    }
  } catch (error) {
    console.error('检查用户身份失败:', error)
  }
}

// 检查关注状态
const checkFollowStatus = async (userId) => {
  try {
    const token = uni.getStorageSync('token')
    if (!token) return

    const res = await uni.request({
      url: getFullUrl(`/follow/or/not/${userId}`),
      method: 'GET',
      header: {
        'authorization': token
      }
    })

    if (res.statusCode === 200 && res.data.success) {
      isFollowed.value = res.data.data
    }
  } catch (error) {
    console.error('获取关注状态失败:', error)
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
      url: getFullUrl(`/follow/${userInfo.value.id}/${!isFollowed.value}`),
      method: 'PUT',
      header: {
        'authorization': token
      }
    })

    if (res.statusCode === 200 && res.data.success) {
      isFollowed.value = !isFollowed.value
      // 更新粉丝数
      userInfo.value.fans = isFollowed.value 
        ? (userInfo.value.fans || 0) + 1 
        : (userInfo.value.fans || 1) - 1
      
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

// 加载用户的博客列表
const loadUserBlogs = async (userId) => {
  try {
    const token = uni.getStorageSync('token')
    if (!token) return

    const res = await uni.request({
      url: getFullUrl(`/blog/of/user?id=${userId}`),
      method: 'GET',
      header: {
        'authorization': token
      },
      data: {
        current: 1
      }
    })

    if (res.statusCode === 200 && res.data.success) {
      blogs.value = res.data.data
    }
  } catch (error) {
    console.error('获取用户博客列表失败:', error)
    uni.showToast({
      title: '获取博客列表失败',
      icon: 'none'
    })
  }
}

// 跳转到博客详情
const goToBlogDetail = (blogId) => {
  uni.navigateTo({
    url: `/pages/blog/detail?id=${blogId}`
  })
}

// 页面加载
onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const options = currentPage.$page?.options || {}
  const userId = options.id

  if (userId) {
    loadUserInfo(userId)
    loadUserBlogs(userId)
  } else {
    uni.showToast({
      title: '参数错误',
      icon: 'none'
    })
  }
})
</script>

<style lang="scss">
.user-profile {
  min-height: 100vh;
  background-color: #f8f8f8;
  padding-bottom: 20px;
}

.user-header {
  background-color: #fff;
  padding: 20px;
  margin-bottom: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  
  .user-info {
    display: flex;
    align-items: flex-start;
    margin-bottom: 20px;
    
    .user-avatar {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      margin-right: 15px;
      border: 2px solid #f0f0f0;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    }
    
    .user-details {
      flex: 1;
      
      .user-name {
        font-size: 18px;
        font-weight: bold;
        color: #333;
        margin-bottom: 5px;
        display: block;
      }
      
      .user-signature {
        font-size: 14px;
        color: #666;
        margin-bottom: 5px;
        display: block;
        line-height: 1.4;
      }
	  
	  .user-city {
	    font-size: 14px;
	    color: #666;
	    margin-bottom: 5px;
	    display: block;
	    line-height: 1.4;
	  }
      
      .user-stats {
        display: flex;
        
        .stat-item {
          margin-right: 20px;
          text-align: center;
          
          .stat-num {
            font-size: 16px;
            font-weight: bold;
            color: #333;
            margin-right: 5px;
          }
          
          .stat-label {
            font-size: 12px;
            color: #666;
          }
        }
      }
    }
  }
  
  .follow-btn {
    width: 100%;
    height: 36px;
    line-height: 36px;
    text-align: center;
    background-color: #07C160;
    color: #fff;
    border-radius: 18px;
    font-size: 14px;
    border: none;
    transition: all 0.3s ease;
    
    &.active {
      background-color: #f5f5f5;
      color: #666;
    }
    
    &:active {
      transform: scale(0.98);
    }
  }
}

.blog-list {
  background-color: #fff;
  padding: 15px;
  
  .blog-title {
    font-size: 16px;
    font-weight: bold;
    color: #333;
    margin-bottom: 15px;
    padding-left: 10px;
    border-left: 3px solid #07C160;
  }
  
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 30px 0;
    
    .empty-image {
      width: 100px;
      height: 100px;
      margin-bottom: 15px;
    }
    
    .empty-text {
      font-size: 14px;
      color: #999;
    }
  }
  
  .blog-items {
    .blog-item {
      padding: 15px;
      border-bottom: 1px solid #f0f0f0;
      
      &:last-child {
        border-bottom: none;
      }
      
      .blog-content-title {
        font-size: 16px;
        font-weight: bold;
        color: #333;
        margin-bottom: 8px;
        display: block;
      }
      
      .blog-content-text {
        font-size: 14px;
        color: #666;
        line-height: 1.5;
        margin-bottom: 10px;
        display: block;
      }
      
      .blog-images {
        display: flex;
        flex-wrap: wrap;
        margin: 10px 0;
        
        .blog-image {
          width: calc(33.33% - 6px);
          height: 100px;
          margin: 3px;
          border-radius: 4px;
          object-fit: cover;
        }
      }
      
      .blog-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 10px;
        
        .blog-time {
          font-size: 12px;
          color: #999;
        }
        
        .blog-stats {
          display: flex;
          align-items: center;
          
          .stat-item {
            display: flex;
            align-items: center;
            margin-left: 15px;
            
            .stat-icon {
              width: 16px;
              height: 16px;
              margin-right: 4px;
            }
            
            .stat-num {
              font-size: 12px;
              color: #666;
            }
          }
        }
      }
    }
  }
}
</style> 