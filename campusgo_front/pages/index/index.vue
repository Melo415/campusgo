<template>
  <view class="container">
    <!-- 可滚动的顶部区域 -->
    <view class="top-scroll-area">
      <!-- 顶部导航部分 -->
      <view class="top-nav">
        <!-- 背景图片容器 -->
        <view class="nav-bg-container" :class="{ scrolled: scrollTop > 20 }">
          <image class="nav-bg" src="/static/xidian-bg.png" mode="aspectFill"></image>
        </view>
        
        <!-- 导航内容 -->
        <view class="city-select">
          <image src="/static/dingwei.png" class="location-icon" mode="aspectFill"></image>
          <text class="city-text">XDU</text>
          <image src="/static/down-arrow.png" class="arrow-icon" mode="aspectFit"></image>
        </view>
        <view class="search-bar" ref="searchBarRef">
          <image src="/static/sosuo.png" class="search-icon" mode="aspectFill"></image>
          <input 
            type="text" 
            placeholder="输入商户名、地点" 
            class="search-input" 
            v-model="searchKeyword"
            @input="onSearchInput"
            @focus="onSearchFocus"
            @blur="onSearchBlur"
          />
          <!-- 搜索建议弹窗直接放在search-bar内部 -->
          <view
            v-if="showSearchResults"
            class="search-suggest-list"
            @touchmove.stop
          >
            <scroll-view 
              scroll-y="true"
              class="search-scroll-container"
              @scrolltolower="onSearchLoadMore"
            >
              <view v-if="searchLoading" class="search-suggest-item">加载中...</view>
              <view 
                v-for="(shop, idx) in searchResults" 
                :key="idx" 
                class="search-suggest-item"
                @click="onSelectShop(shop)"
              >
                <view class="shop-info">
                  <view class="shop-name">
                    <template v-for="(part, i) in highlightParts(shop.name, searchKeyword)">
                      <text v-if="part.isHighlight" :key="'highlight-' + i" class="highlight-keyword">{{ part.text }}</text>
                      <text v-else :key="'normal-' + i">{{ part.text }}</text>
                    </template>
                  </view>
                  <view class="shop-address" v-if="shop.address">
                    <text>{{ shop.address }}</text>
                  </view>
                </view>
              </view>
              <view v-if="!searchResults.length && !searchLoading" class="search-suggest-item">未找到店铺哦~换个关键词吧😊</view>
              <!-- <view v-if="searchIsLoading" class="search-suggest-item">加载更多...</view> -->
            </scroll-view>
          </view>
        </view>
        <view class="right-icons">
          <image src="/static/scan-icon.png" class="scan-icon" mode="aspectFit"></image>
        </view>
      </view>
    </view>

    <!-- 将整个内容区域包裹在scroll-view中 -->
    <scroll-view 
      scroll-y="true"
      class="scroll-container"
      :refresher-enabled="true"
      :refresher-triggered="isRefreshing"
      @refresherrefresh="onRefresh"
      @scrolltolower="onLoadMore"
      @scroll="handleScroll"
    >
      <!-- 分类图标部分 -->
      <view class="category-icons" @wheel="onCategoryWheel">
        <view class="icon-row">
          <view class="icon-item" @click="goToFoodList('1')">
            <image src="/static/images/types/newFood.png" mode="aspectFill" class="icon-image"></image>
            <text class="icon-text">新综美食</text>
          </view>
          
          <view class="icon-item" @click="goToFoodList('2')">
            <image src="/static/lms.png" mode="aspectFill" class="icon-image"></image>
            <text class="icon-text">老综美食</text>
          </view>
          
          <view class="icon-item" @click="goToFoodList('3')">
            <image src="/static/yule.png" mode="aspectFill" class="icon-image"></image>
            <text class="icon-text">娱乐</text>
          </view>
          
          <view class="icon-item" @click="goToFoodList('4')">
            <image src="/static/shitang.png" mode="aspectFill" class="icon-image"></image>
            <text class="icon-text">食堂</text>
          </view>
        </view>
      </view>

      <!-- 热门博客列表 -->
      <view class="hot-blogs">
        <view class="section-title">
          <text class="title-text">热门推荐</text>
        </view>
        
        <view class="blog-grid">
          <view 
            v-for="(blog, index) in hotBlogs" 
            :key="blog.id"
            class="blog-item"
            @click="goToBlogDetail(blog.id)"
          >
            <image 
              v-if="blog.images" 
              :src="getFullImageUrl(blog.images.split(',')[0])" 
              mode="aspectFill" 
              class="blog-image"
            ></image>
            <view class="blog-header">
              <image :src="blog.icon ? getFullImageUrl(blog.icon) : '/static/default-avatar.png'" class="user-avatar" mode="aspectFill"></image>
              <text class="username">{{ blog.name }}</text>
            </view>
            
            <view class="blog-content">
              <text class="blog-title">{{ blog.title }}</text>
              <text class="blog-text">{{ blog.content }}</text>
            </view>
            
            <view class="blog-footer">
              <view class="like-section" @click.stop="toggleLike(blog)">
                <image :src="blog.isLike ? '/static/liked.png' : '/static/like.png'" class="like-icon"></image>
                <text class="like-count">{{ blog.liked }}</text>
              </view>
              
              <view class="comment-section">
                <image src="/static/comment.png" class="comment-icon"></image>
                <text class="comment-count">{{ blog.comments }}</text>
              </view>
            </view>
          </view>
        </view>
        
        <!-- 加载更多提示优化 -->
        <view class="loading-more" v-if="isLoading">
          <text>正在加载更多...</text>
        </view>
        <view class="no-more" v-if="!hasMore && !isLoading">
          <text>没有更多内容了</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { getFullUrl } from '../../config/api.config';

// 基础URL
const baseURL = '/static/images'

// 热门博客列表
const hotBlogs = ref([])
const currentPage = ref(1)
const isLoading = ref(false)
const hasMore = ref(true)

// 添加刷新状态
const isRefreshing = ref(false)

const scrollTop = ref(0)

// 当前最小时间戳，初始化为 Long.MAX_VALUE
const minTime = ref(9223372036854775807n)

// 搜索相关
const searchKeyword = ref('')
const searchResults = ref([])
const showSearchResults = ref(false)
const searchLoading = ref(false)
let searchBlurTimeout = null

// Add new state variables for search pagination
const searchCurrentPage = ref(1)
const searchHasMore = ref(true)
const searchIsLoading = ref(false)

const searchBarRef = ref(null)

//获取token
const token = uni.getStorageSync('token')

// 获取完整图片URL
const getFullImageUrl = (url) => {
  if (!url) return '/static/default-avatar.png'
  if (url.startsWith('http')) return url
  if (url.startsWith('/static')) return url
  // 处理Windows路径格式，将反斜杠替换为正斜杠
  const normalizedUrl = url.replace(/\\/g, '/')
  return baseURL + '/' + normalizedUrl
}

// 获取热门博客
const getHotBlogs = async (isLoadMore = false) => {
  if (isLoading.value || (!isLoadMore && !hasMore.value)) return
  
  try {
    isLoading.value = true
    
    const token = uni.getStorageSync('token')
    
    
    const res = await uni.request({
      url: `${getFullUrl('/blog/hot')}?lastScore=${minTime.value.toString()}`,
      method: 'GET',
      header: {
        'authorization': token
      }
    })
    
    if (res.statusCode === 200 && res.data.success) {
      const scrollResult = res.data.data
	  
      if (scrollResult && Array.isArray(scrollResult.list)) {
        const newBlogs = scrollResult.list
        
        // 获取当前用户信息
        const userRes = await uni.request({
          url: getFullUrl('/user/me'),
          method: 'GET',
          header: {
            'authorization': token
          }
        })
        
        if (userRes.statusCode === 200 && userRes.data.success) {
          const currentUserId = userRes.data.data.id
          
          // 为每个博客获取点赞列表并更新isLike状态
          for (let blog of newBlogs) {
            const likesRes = await uni.request({
              url: getFullUrl(`/blog/likes/${blog.id}`),
              method: 'GET',
              header: {
                'authorization': token
              }
            })
            
            if (likesRes.statusCode === 200 && likesRes.data.success) {
              const likesList = likesRes.data.data
              // 检查当前用户是否在点赞列表中
              blog.isLike = likesList.some(like => like.id === currentUserId)
            }
          }
        }
        
        if (newBlogs.length === 0) {
          hasMore.value = false
          return
        }
        
        if (isLoadMore) {
          hotBlogs.value = [...hotBlogs.value, ...newBlogs]
        } else {
          hotBlogs.value = newBlogs
        }
        
        hasMore.value = true
        console.log('hasMore set to:', hasMore.value)
        
        if (isLoadMore) {
          currentPage.value++
        } else {
          currentPage.value = 1
        }
        
        minTime.value = BigInt(scrollResult.minTime) || minTime.value
      } else {
        console.error('数据结构不正确:', scrollResult)
        uni.showToast({
          title: '数据结构不正确',
          icon: 'none'
        })
      }
    } else {
      console.error('请求失败:', res.data.errorMsg)
      uni.showToast({
        title: res.data.errorMsg || '请求失败',
        icon: 'none'
      })
    }
  } catch (error) {
    console.error('Failed to get hot blogs:', error)
    uni.showToast({
      title: '获取热门博客失败',
      icon: 'none'
    })
  } finally {
    isLoading.value = false
    isRefreshing.value = false
  }
}

// Function to handle blog updates from the detail page
const handleBlogUpdate = (data) => {
  console.log('Received blog update event:', data);
  if (!data || data.id === undefined) {
    console.warn('Received invalid blog update event data:', data);
    return;
  }

  const index = hotBlogs.value.findIndex(blog => blog.id === data.id);
  if (index !== -1) {
    console.log(`Updating blog with ID ${data.id}`);
    const updatedBlog = { ...hotBlogs.value[index] };

    // 更新点赞相关字段
    if (data.isLike !== undefined) {
      updatedBlog.isLike = data.isLike;
    }
    if (data.liked !== undefined) {
      updatedBlog.liked = data.liked;
    }
    if (data.comments !== undefined) {
      updatedBlog.comments = data.comments;
    }

    // 使用Vue的响应式更新方式
    hotBlogs.value[index] = updatedBlog;
    console.log('Updated hotBlogs:', hotBlogs.value[index]);
  } else {
    console.log(`Blog with ID ${data.id} not found in hotBlogs.`);
  }
};

// 跳转到博客详情
const goToBlogDetail = (blogId) => {
  console.log('跳转到博客详情，ID:', blogId)
  if (!blogId) {
    uni.showToast({
      title: '参数错误',
      icon: 'none'
    })
    return
  }
  
  uni.navigateTo({
    url: `/pages/blog/detail?id=${blogId}`,
    success: () => {
      console.log('页面跳转成功')
    },
    fail: (err) => {
      console.error('页面跳转失败:', err)
      uni.showToast({
        title: '页面跳转失败',
        icon: 'none'
      })
    }
  })
}

// 点赞/取消点赞
const toggleLike = async (blog) => {
	const token = uni.getStorageSync('token')
  try {
    if (!token) {
      uni.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }
    
    const res = await uni.request({
      url: getFullUrl(`/blog/like/${blog.id}`),
      method: 'PUT',
      header: {
        'authorization': token
      }
    })
    
    if (res.statusCode === 200 && res.data.success) {
      // 重新获取博客数据
      const blogRes = await uni.request({
        url: getFullUrl(`/blog/${blog.id}`),
        method: 'GET',
        header: {
          'authorization': token
        }
      })
      
      if (blogRes.statusCode === 200 && blogRes.data.success) {
        // 更新当前博客数据
        const updatedBlog = blogRes.data.data
        const index = hotBlogs.value.findIndex(item => item.id === blog.id)
        if (index !== -1) {
          // 直接使用从服务器获取的最新数据更新整个博客对象
          // 确保 comments 字段也正确更新
          hotBlogs.value[index] = { ...hotBlogs.value[index], ...updatedBlog };
        }
        
        uni.showToast({
          title: updatedBlog.isLike ? '点赞成功' : '取消点赞',
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

// 跳转到美食列表
const goToFoodList = (type) => {
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
  if (type === '3') {
    uni.navigateTo({
      url: '/pages/entertainment/entertainment'
    });
  } else if (type === '4') {
    uni.navigateTo({
      url: '/pages/canteen/canteen'
    });
  } else {
    uni.navigateTo({
      url: `/pages/foodList/foodList?typeId=${type}`
    });
  }
};

// 添加下拉刷新处理函数
const onRefresh = async () => {
  isRefreshing.value = true
  hasMore.value = true // 重置加载更多状态
  currentPage.value = 1 // 重置页码
  minTime.value = 9223372036854775807n // 重置minTime为最大值
  await getHotBlogs(false)
}

// 添加加载更多处理函数
const onLoadMore = async () => {
  if (!hasMore.value || isLoading.value) return
  await getHotBlogs(true)
}

const handleScroll = (e) => {
  scrollTop.value = e.detail.scrollTop
}

// Use onShow to register the listener when the page becomes visible
onShow(() => {
  console.log('Index page onShow: Registering blogUpdated listener');
  uni.$on('blogUpdated', handleBlogUpdate);
});

// 页面加载时获取第一页数据
onMounted(() => {
  getHotBlogs(false)
  // Listener registration moved to onShow
  document.addEventListener('click', handleClickOutside)
  nextTick(() => {
    const topNav = document.querySelector('.top-nav');
    if (topNav) {
      topNav.addEventListener('wheel', preventWheel, { passive: false });
    }
  });
})

// 页面卸载时执行
onUnmounted(() => {
  console.log('Index page onUnmounted: Removing blogUpdated listener');
  uni.$off('blogUpdated', handleBlogUpdate);
  // Remove scroll listener if it was added directly
  uni.offReachBottom(onReachBottom) // This was removed by mistake, adding it back
  document.removeEventListener('click', handleClickOutside)
  const topNav = document.querySelector('.top-nav');
  if (topNav) {
    topNav.removeEventListener('wheel', preventWheel);
  }
})

function handleClickOutside(e) {
  // 只要不是搜索框和弹窗区域就关闭
  const searchBar = document.querySelector('.search-bar')
  if (searchBar && !searchBar.contains(e.target)) {
    showSearchResults.value = false
  }
}

// 跳转到店铺详情页
const onSelectShop = (shop) => {
  showSearchResults.value = false
  if (shop.id) {
    uni.navigateTo({ url: `/pages/foodShop/detail?id=${shop.id}` })
  } else {
    uni.showToast({ 
      title: '店铺信息不完整', 
      icon: 'none' 
    })
  }
}

const onSearchInput = async (e) => {
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
	  }, 1000)
	  return
	}
	
  const newKeyword = e.detail.value
  searchKeyword.value = newKeyword
  
  if (!searchKeyword.value) {
    searchResults.value = []
    showSearchResults.value = false
    searchCurrentPage.value = 1
    searchHasMore.value = true
    return
  }

  // If it's a new search (not loading more), reset the state
  if (searchCurrentPage.value === 1) {
    searchResults.value = []
    searchHasMore.value = true
  }

  searchLoading.value = true
  searchIsLoading.value = true
  
  try {
    const res = await uni.request({
      url: getFullUrl('/shop/search'),
      method: 'GET',
      data: {
        current: searchCurrentPage.value,
        size: 10,
        keyword: searchKeyword.value,
      },
      header:{
        'authorization': token
      },
    })
    
    if (res.statusCode === 200 && res.data.success) {
      const arr = res.data.data || []
      const newResults = arr.map(item => typeof item === 'string' ? { name: item } : item)
      
      if (searchCurrentPage.value === 1) {
        searchResults.value = newResults
      } else {
        searchResults.value = [...searchResults.value, ...newResults]
      }
      
      // Update hasMore based on whether we got a full page of results
      searchHasMore.value = newResults.length === 10
      showSearchResults.value = true
    } else {
      if (searchCurrentPage.value === 1) {
        searchResults.value = []
      }
      searchHasMore.value = false
    }
  } catch (err) {
    if (searchCurrentPage.value === 1) {
      searchResults.value = []
    }
    searchHasMore.value = false
  } finally {
    searchLoading.value = false
    searchIsLoading.value = false
  }
}
const onSearchFocus = () => {
  if (!searchKeyword.value) {
    searchResults.value = []
    showSearchResults.value = false
  }
  if (searchResults.value.length) showSearchResults.value = true
}
const onSearchBlur = () => {
  searchBlurTimeout = setTimeout(() => {
    showSearchResults.value = false
  }, 120)
}

const onSearchLoadMore = async () => {
  if (!searchHasMore.value || searchLoading.value) return
  searchCurrentPage.value++
  await onSearchInput({ detail: { value: searchKeyword.value } })
}

const highlightParts = (text, keyword) => {
  if (!keyword) return [{ text, isHighlight: false }]
  const reg = new RegExp(keyword.replace(/[.*+?^${}()|[\\]\\/g, '\\$&'), 'gi')
  let result = []
  let lastIndex = 0
  let match
  while ((match = reg.exec(text))) {
    if (match.index > lastIndex) {
      result.push({ text: text.slice(lastIndex, match.index), isHighlight: false })
    }
    result.push({ text: match[0], isHighlight: true })
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < text.length) {
    result.push({ text: text.slice(lastIndex), isHighlight: false })
  }
  return result
}

function preventWheel(e) {
  e.preventDefault();
  e.stopPropagation();
}

function onCategoryWheel(e) {
  const el = e.currentTarget;
  // 只在内容溢出时允许滚动
  if (el.scrollHeight > el.clientHeight) {
    el.scrollTop += e.deltaY;
    e.preventDefault();
    e.stopPropagation();
  }
}
</script>

<style lang="scss">
.container {
  background-color: #f8f8f8;
  min-height: 100vh;
}

.top-scroll-area {
  max-height: 220px; // 可根据实际内容调整
}

.top-nav {
  display: flex;
  align-items: center;
  padding: 15px;
  height: 60px;
  position: relative;
  background: transparent;
  padding-top: calc(15px + var(--status-bar-height));
}

.scroll-container {
  height: calc(100vh - 60px - var(--status-bar-height));
}

.nav-bg-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  transition: all 0.3s;
  
  // 使用类来控制圆角
  &.scrolled {
    border-bottom-left-radius: 12px;
    border-bottom-right-radius: 12px;
  }
  
  .nav-bg {
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: blur(2px);
    transform: scale(1.1);
  }
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.3);
    transition: all 0.3s;
  }
  
  &.scrolled::after {
    border-bottom-left-radius: 12px;
    border-bottom-right-radius: 12px;
  }
}

.city-select {
  display: flex;
  align-items: center;
  position: relative;
  z-index: 1;
  flex-direction: column;
  margin-right: 10px;
  
  .location-icon {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    margin-bottom: 2px;
  }
  
  .city-text {
    font-size: 16px;
    font-weight: bold;
    color: white;
    margin-top: 2px;
  }
  
  .arrow-icon {
    width: 12px;
    height: 12px;
    margin-left: 5px;
    filter: brightness(0) invert(1);
  }
}

.search-bar {
  flex: 1;
  display: flex;
  align-items: center;
  background-color: white;
  border-radius: 20px;
  padding: 8px 15px;
  margin: 0 10px;
  position: relative;
  z-index: 10001;
  
  .search-icon {
    width: 20px;
    height: 20px;
    margin-right: 8px;
    border-radius: 50%;
  }
  
  .search-input {
    flex: 1;
    border: none;
    outline: none;
    background-color: transparent;
    font-size: 14px;
  }
}

.right-icons {
  position: relative;
  z-index: 1;
  
  .scan-icon {
    width: 22px;
    height: 22px;
    filter: brightness(0) invert(1); // 使扫描图标变为白色
  }
}

.category-icons {
  display: flex;
  padding: 15px 0;
  background: linear-gradient(to bottom, #fff5f4, #ffffff);
  border-radius: 12px;
  margin: -10px 0 10px 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  position: relative;
  z-index: 10;
  max-height: 120px; /* 你可以根据实际需要调整 */
  overflow-y: auto;
  
  .icon-row {
    display: flex;
    justify-content: space-around;
    width: 100%;
    padding: 0 10px;
  }
  
  .icon-item {
    width: 22%;
    display: flex;
    flex-direction: column;
    align-items: center;
    
    .icon-image {
      width: 50px;
      height: 50px;
      margin-bottom: 8px;
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    }
    
    .icon-text {
      font-size: 13px;
      color: #333;
      text-align: center;
      line-height: 1.2;
      font-weight: 500;
    }
  }
}

.hot-blogs {
  margin: 10px;
  
  .section-title {
    margin-bottom: 15px;
    padding: 0 5px;
    
    .title-text {
      font-size: 18px;
      font-weight: bold;
      color: #333;
    }
  }
  
  .blog-grid {
    display: flex;
    flex-wrap: wrap;
    margin: 0 -5px;
    
    .blog-item {
      width: calc(50% - 10px);
      margin: 5px;
      background-color: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      
      .blog-image {
        width: 100%;
        height: 160px;
        object-fit: cover;
        background-color: #f5f5f5;
      }
      
      .blog-header {
        display: flex;
        align-items: center;
        padding: 10px;
        
        .user-avatar {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          margin-right: 8px;
        }
        
        .username {
          font-size: 12px;
          color: #666;
        }
      }
      
      .blog-content {
        padding: 0 10px 10px;
        
        .blog-title {
          font-size: 14px;
          font-weight: bold;
          color: #333;
          margin-bottom: 5px;
          display: block;
        }
        
        .blog-text {
          font-size: 12px;
          color: #666;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }
      
      .blog-footer {
        display: flex;
        align-items: center;
        padding: 10px;
        border-top: 1px solid #f5f5f5;
        
        .like-section,
        .comment-section {
          display: flex;
          align-items: center;
          margin-right: 15px;
          
          image {
            width: 16px;
            height: 16px;
            margin-right: 4px;
          }
          
          text {
            font-size: 12px;
            color: #999;
          }
        }
      }
    }
  }
  
  .loading-more, .no-more {
    text-align: center;
    padding: 20rpx;
    color: #999;
    font-size: 24rpx;
  }
}

.search-suggest-list {
  position: absolute;
  left: 0;
  right: 0;
  top: 100%;
  z-index: 10002;
  background: #fff;
  border-radius: 0 0 10px 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  max-height: 240px;
  overflow: hidden;
}

.search-scroll-container {
  max-height: 240px;
  overflow-y: auto;
}

.search-suggest-item {
  padding: 12px 18px;
  font-size: 15px;
  color: #333;
  border-bottom: 1px solid #f2f2f2;
  &:last-child { border-bottom: none; }

  .shop-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }

  .shop-name {
    flex: 1;
    margin-right: 10px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .shop-address {
    background-color: #f5f5f5;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    color: #666;
    max-width: 40%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.highlight-keyword {
  color: #e43d33;
  font-weight: bold;
  background: #fff0ef;
  border-radius: 3px;
  padding: 0 2px;
}
</style>