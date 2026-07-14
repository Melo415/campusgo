<template>
  <view class="personal-home">
    <!-- 固定状态栏背景 -->
    <view 
      class="status-bar-bg" 
      :style="{ height: statusBarHeight + 'px' }" 
      v-if="showStatusBarBg"
    ></view>
    
    <!-- 背景图片区域 -->
    <view class="background-wrapper">
      <image class="bg-image" :src="backgroundUrl || '/static/myvuebg.png'" mode="aspectFill"></image>
      <view class="bg-mask"></view>
    </view>

    <!-- 顶部内容区 -->
    <view class="content-wrapper">
      <!-- 页面标题和设置按钮 -->
      <view class="header-bar" :style="{ paddingTop: (statusBarHeight + 32) + 'px' }">
        <view class="left-section">
          <text class="title">个人中心</text>
        </view>
        <view class="right-section">
          <view class="setting-btn" @click="changeBackground">
            <text>设置背景</text>
          </view>
        </view>
      </view>

      <!-- 用户信息区域 -->
      <view class="user-info-section">
        <view class="user-avatar">
          <image 
            :src="userInfo.avatarUrl || '/static/default-avatar.png'" 
            mode="aspectFill"
            @click="previewImage(userInfo.avatarUrl || '/static/default-avatar.png', [userInfo.avatarUrl || '/static/default-avatar.png'])"
          ></image>
        </view>
        <view class="user-details">
          <view class="user-name">{{ userInfo.username }}</view>
          <view class="user-status">{{ userInfo.status }}</view>
          <view class="user-location">
            <text class="iconfont icon-location"></text>
            {{ userInfo.location }}
          </view>
          <view class="action-buttons" v-if="isLoggedIn">
            <button class="edit-button" @click="editProfile">编辑资料</button>
            <button class="logout-button" @click="logout">退出登录</button>
          </view>
          <view class="action-buttons login-only" v-else>
            <button class="login-prompt-button" @click="goToLogin">登录</button>
          </view>
        </view>
      </view>

      <!-- 数据统计区域 -->
      <view class="stats-section">
        <view class="stat-item">
          <text class="stat-number">{{ notes.length }}</text>
          <text class="stat-label">笔记</text>
        </view>
        <view class="stat-item">
          <text class="stat-number">{{ followings.length }}</text>
          <text class="stat-label">关注</text>
        </view>
        <view class="stat-item">
          <text class="stat-number">{{ followers.length }}</text>
          <text class="stat-label">粉丝</text>
        </view>
      </view>

      <!-- 标签栏区域 -->
      <view class="tab-bar">
        <view
          class="tab"
          :class="{ active: activeTab === 'note' }"
          @click="changeTab('note')"
        >笔记</view>
        <view
          class="tab"
          :class="{ active: activeTab === 'evaluation' }"
          @click="changeTab('evaluation')"
        >评价</view>
        <view
          class="tab"
          :class="{ active: activeTab === 'fans' }"
          @click="changeTab('fans')"
        >粉丝</view>
        <view
          class="tab"
          :class="{ active: activeTab === 'follow' }"
          @click="changeTab('follow')"
        >关注</view>
      </view>
      
      <!-- 笔记展示区域 -->
      <view v-if="activeTab === 'note'" class="notes-container">
        <view v-if="notes.length === 0" class="empty-state">
          <image class="empty-image" src="/static/biji.png" mode="aspectFit"></image>
          <text class="empty-text">你还没有发过任何一条笔记哦~</text>
          <button class="empty-button" @click="navigateTo('note')">去发布笔记</button>
        </view>
        <view v-else v-for="(note, index) in notes" :key="index" class="note-item" @click="goToBlogDetail(note.id)">
          <view class="note-content">
            <text class="note-title">{{ note.title }}</text>
            <text class="note-text">{{ note.content }}</text>
            <view class="note-images" v-if="note.images">
              <image 
                v-for="(img, imgIndex) in note.images.split(',')" 
                :key="imgIndex"
                :src="getFullImageUrl(img)"
                mode="aspectFill"
                class="note-image"
                @click.stop="previewImage(img, note.images.split(','))"
              ></image>
            </view>
            <view class="note-meta">
              <text class="note-time">{{ formatTime(note.createTime) }}</text>
              <view class="note-interaction">
                <view class="interaction-item">
                  <image :src="note.isLike ? '/static/liked.png' : '/static/like.png'" class="interaction-icon"></image>
                  <text class="interaction-count">{{ note.liked }}</text>
                </view>
                <view class="interaction-item">
                  <image src="/static/comment.png" class="interaction-icon"></image>
                  <text class="interaction-count">{{ note.comments }}</text>
                </view>
                <button class="delete-btn" @click.stop="deleteNote(note.id)">删除</button>
              </view>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 评价展示区域 -->
      <view v-if="activeTab === 'evaluation'" class="evaluations-container">
        <view v-if="evaluations.length === 0" class="empty-state">
          <image class="empty-image evaluation-empty-image" src="/static/comment.png" mode="aspectFit"></image>
          <text class="empty-text">你还没有发表过任何评价哦~</text>
        </view>
        <view v-else v-for="(evaluation, index) in evaluations" :key="index" class="evaluation-item">
          <view class="evaluation-content">
            <!-- 博客信息 -->
            <view class="blog-info" @click="goToBlogDetail(evaluation.blogId)">
              <view class="blog-header">
                <image :src="evaluation.blogUserIcon || '/static/default-avatar.png'" class="blog-user-avatar" mode="aspectFill"></image>
                <text class="blog-user-name">{{ evaluation.blogUserName }}</text>
              </view>
              <view class="blog-preview">
                <text class="blog-title">{{ evaluation.blogTitle }}</text>
                <text class="blog-content">{{ evaluation.blogContent }}</text>
                <view class="blog-images" v-if="evaluation.blogImages">
                  <image 
                    v-for="(img, imgIndex) in evaluation.blogImages.split(',')" 
                    :key="imgIndex"
                    :src="getFullImageUrl(img)"
                    mode="aspectFill"
                    class="blog-image"
                    @click.stop="previewImage(img, evaluation.blogImages.split(','))"
                  ></image>
                </view>
              </view>
            </view>
            
            <!-- 评价内容 -->
            <view class="comment-section">
              <text class="comment-text">{{ evaluation.content }}</text>
              <view class="comment-meta">
                <text class="comment-time">{{ formatTime(evaluation.createTime) }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 粉丝展示区域 -->
      <view v-if="activeTab === 'fans'" class="fans-container">
        <view v-if="followers.length === 0" class="empty-state">
          <image class="empty-image" src="/static/xiaolian.png" mode="aspectFit"></image>
          <text class="empty-text">还没有人关注你哦，快去发布优质内容吧~</text>
        </view>
        <view v-else class="follow-list">
          <view v-for="user in followers" :key="user.id" class="follow-item" @click="goToUserPage(user.id)">
            <view class="follow-user-info">
              <image :src="user.icon || '/static/default-avatar.png'" class="follow-avatar" mode="aspectFill"></image>
              <view class="follow-info">
                <text class="follow-name">{{ user.nickName }}</text>
                <text class="follow-signature" v-if="user.signature">{{ user.signature }}</text>
              </view>
            </view>
            <!-- <button class="unfollow-btn" @click.stop="unfollowUser(user.id)">取消关注</button> -->
          </view>
        </view>
      </view>
      
      <!-- 关注展示区域 -->
      <view v-if="activeTab === 'follow'" class="follow-container">
        <view v-if="followings.length === 0" class="empty-state">
          <image class="empty-image" src="/static/aixin.png" mode="aspectFit"></image>
          <text class="empty-text">你还没有关注任何人哦~</text>
          <button class="empty-button" @click="navigateTo('home')">去发现有趣的人</button>
        </view>
        <view v-else class="follow-list">
          <view v-for="user in followings" :key="user.id" class="follow-item" @click="goToUserPage(user.id)">
            <view class="follow-user-info">
              <image :src="user.icon || '/static/default-avatar.png'" class="follow-avatar" mode="aspectFill"></image>
              <view class="follow-info">
                <text class="follow-name">{{ user.nickName }}</text>
                <text class="follow-signature" v-if="user.signature">{{ user.signature }}</text>
              </view>
            </view>
            <button class="unfollow-btn" @click.stop="unfollowUser(user.id)">取消关注</button>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 底部导航栏 -->
    <!-- <view class="bottom-nav">
      <view class="nav-item" :class="{ active: currentPage === 'home' }" @click="navigateTo('home')">
        <text>首页</text>
      </view>
      <view class="nav-item" :class="{ active: currentPage === 'message' }" @click="navigateTo('message')">
        <text>消息</text>
      </view>
      <view class="nav-item" :class="{ active: currentPage === 'note' }" @click="navigateTo('note')">
        <text>笔记</text>
      </view>
      <view class="nav-item" :class="{ active: currentPage === 'personal' }" @click="navigateTo('personal')">
        <text>个人中心</text>
      </view>
    </view> -->
  </view>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { onPageScroll, onShow } from '@dcloudio/uni-app'
import { getFullUrl } from '../../config/api.config'

// 获取状态栏高度
const statusBarHeight = uni.getSystemInfoSync().statusBarHeight

// 控制状态栏背景显隐
const showStatusBarBg = ref(false)

// 登录状态
const isLoggedIn = ref(false)

// 用户信息
const userInfo = ref({
  avatarUrl: '',
  username: '',
  status: '',
  location: '',
  fansCount: 0,
  followCount: 0
})

// 背景图片URL
const backgroundUrl = ref('')

// 标签页
const activeTab = ref('note')
const currentPage = ref('personal')

// 笔记和评价数据
const notes = ref([])
const evaluations = ref([])

// 关注列表数据
const followings = ref([])
// 粉丝列表数据
const followers = ref([])

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
  if (Array.isArray(time)) {
	  // 如果数组长度小于6，补充缺失的元素
	  const timeArray = [...time];
	  while (timeArray.length < 6) {
	    timeArray.push(0); // 补充缺失的分钟或秒数
	  }
    // 注意月份需要减1，因为Date对象的月份是从0开始的
    //date = new Date(time[0], time[1] - 1, time[2], time[3], time[4], time[5]);
	date = new Date(timeArray[0], timeArray[1] - 1, timeArray[2], timeArray[3], timeArray[4], timeArray[5]);
  } else {
    // 尝试解析其他格式的时间
    date = new Date(time);
  }
  // 检查日期是否有效
  if (isNaN(date.getTime())) {
    console.error('Invalid time format for date:', time);
    return '日期无效'; // 或者返回空字符串或其他提示
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

// 加载笔记
const loadNotes = async () => {
  try {
    const token = uni.getStorageSync('token')
    if (!token) {
      notes.value = []
      return
    }

    const res = await uni.request({
      url: getFullUrl('/blog/of/me'),
      method: 'GET',
      header: {
        'authorization': token
      },
      data: {
        current: 1
      }
    })

    if (res.statusCode === 200 && res.data.success) {
      // Sort notes by createTime in descending order
      const sortedNotes = res.data.data.sort((a, b) => {
        // Helper function to create Date object from array
        const createDate = (timeArray) => new Date(timeArray[0], timeArray[1] - 1, timeArray[2], timeArray[3], timeArray[4], timeArray[5]);
        const dateA = createDate(a.createTime);
        const dateB = createDate(b.createTime);
        return dateB - dateA;
      });
      notes.value = sortedNotes;
      console.log('Sorted Notes:', JSON.stringify(notes.value.map(note => ({ id: note.id, createTime: note.createTime }))));
    } else {
      console.error('获取笔记列表失败:', res.data)
      uni.showToast({
        title: res.data.message || '获取笔记列表失败',
        icon: 'none'
      })
    }
  } catch (error) {
    console.error('获取笔记列表失败:', error)
    uni.showToast({
      title: '获取笔记列表失败',
      icon: 'none'
    })
  }
}

// 删除笔记
const deleteNote = async (noteId) => {
  try {
    const token = uni.getStorageSync('token')
    if (!token) {
      uni.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }

    uni.showModal({
      title: '提示',
      content: '确定要删除这条笔记吗？',
      success: async (res) => {
        if (res.confirm) {
          const deleteRes = await uni.request({
            url: getFullUrl(`/blog/${noteId}`),
            method: 'DELETE',
            header: {
              'authorization': token
            }
          })

          if (deleteRes.statusCode === 200 && deleteRes.data.success) {
            uni.showToast({
              title: '删除成功',
              icon: 'success'
            })
            // 重新加载笔记列表
            await loadNotes()
          } else {
            uni.showToast({
              title: deleteRes.data.message || '删除失败',
              icon: 'none'
            })
          }
        }
      }
    })
  } catch (error) {
    console.error('删除笔记失败:', error)
    uni.showToast({
      title: '删除失败',
      icon: 'none'
    })
  }
}

// 检查登录状态并加载数据
const checkLoginStatusAndLoadData = async () => {
  const token = uni.getStorageSync('token');
  const previousLoginStatus = isLoggedIn.value;
  isLoggedIn.value = !!token;

  console.log(`[checkLoginStatusAndLoadData] isLoggedIn: ${isLoggedIn.value}, previous: ${previousLoginStatus}`);

  if (isLoggedIn.value) {
    // 统一在登录状态下加载/刷新核心数据
    console.log('[checkLoginStatusAndLoadData] Logged in state detected/confirmed. Loading/Refreshing core data.');
    // 使用 Promise.all 来并行加载，提高效率
    try {
      await Promise.all([
        loadUserInfo(),    // 加载用户信息
        loadNotes(),       // 加载笔记
        loadFollowings(),  // **主动加载关注列表**
        loadFollowers()    // **主动加载粉丝列表**
      ]);
      console.log('[checkLoginStatusAndLoadData] Core data loaded/refreshed.');
    } catch (error) {
      console.error('[checkLoginStatusAndLoadData] Error loading core data:', error);
      // 根据需要处理加载错误，例如显示提示
      uni.showToast({ title: '加载用户数据时出错', icon: 'none' });
    }
  } else {
    // 如果未登录
    console.log('[checkLoginStatusAndLoadData] Not logged in.');
    userInfo.value = {
      avatarUrl: '/static/default-avatar.png',
      username: '游客',
      status: '点击登录',
      location: '未知',
      fansCount: 0,
      followCount: 0
    };
    notes.value = [];
    evaluations.value = [];
    followings.value = [];
    followers.value = [];
    // 未登录时，确保标签页在 'note'
    if (activeTab.value !== 'note') {
        activeTab.value = 'note';
    }
  }
}

// 跳转到登录页
const goToLogin = () => {
  uni.navigateTo({
    url: '/pages/login/login'
  })
}

// 加载用户信息
const loadUserInfo = async () => {
  try {
    const token = uni.getStorageSync('token')
    if (!token) {
        console.log('[loadUserInfo] No token found, skipping fetch.');
        // Ensure logged out state is reflected if token disappears
        if (isLoggedIn.value) {
            checkLoginStatusAndLoadData();
        }
        return;
    }
    console.log('[loadUserInfo] Token found, fetching user info...');

    // 获取用户基本信息
    const userRes = await uni.request({
      url: getFullUrl('/user/me'),
      method: 'GET',
      header: { 'authorization': token }
    })

    if (userRes.statusCode === 200 && userRes.data.success) {
      const user = userRes.data.data
      
      // 获取用户详细信息 Snowflake ID
      const infoRes = await uni.request({
        url: getFullUrl(`/user/info/${user.id}`),
        method: 'GET',
        header: { 'authorization': token }
      })

      if (infoRes.data && infoRes.data.success) {
          console.log('[loadUserInfo] Received user info data:', JSON.stringify(infoRes.data.data));
          console.log(`[loadUserInfo] Fans count from API: ${infoRes.data.data.fans}, Followee count from API: ${infoRes.data.data.followee}`);
      } else {
          console.error('[loadUserInfo] Failed to get detailed user info or API returned error:', infoRes);
      }

      // 设置用户信息
      userInfo.value = {
        ...userInfo.value,
        username: user.nickName || '未设置昵称',
        avatarUrl: user.icon || '/static/default-avatar.png',
        status: infoRes.data.success ? infoRes.data.data.introduce || '未设置签名' : '未设置签名',
        location: infoRes.data.success ? infoRes.data.data.city || '未设置城市' : '未设置城市',
        fansCount: infoRes.data.success ? infoRes.data.data.fans || 0 : 0,
        followCount: infoRes.data.success ? infoRes.data.data.followee || 0 : 0
      }
      console.log('[loadUserInfo] Updated userInfo value:', JSON.stringify(userInfo.value));

    } else {
        console.error('[loadUserInfo] Failed to get basic user info:', userRes);
    }
  } catch (error) {
    console.error('获取用户信息失败 (catch block):', error)
    uni.showToast({
      title: '获取用户信息失败',
      icon: 'none'
    })
    checkLoginStatusAndLoadData();
  }
}

// 加载评价列表
const loadEvaluations = async () => {
  console.log('>>> loadEvaluations function called'); // 添加日志确认函数调用
  try {
    const token = uni.getStorageSync('token')
    if (!token) {
      evaluations.value = []
      return
    }

    const res = await uni.request({
      url: getFullUrl('/blog/comments/of/me'),
      method: 'GET',
      header: {
        'authorization': token
      },
      data: {
        current: 1
      }
    })

    if (res.statusCode === 200 && res.data.success) {
      evaluations.value = res.data.data
    } else {
      console.error('获取评价列表失败:', res.data)
      uni.showToast({
        title: res.data.message || '获取评价列表失败',
        icon: 'none'
      })
    }
  } catch (error) {
    console.error('获取评价列表失败:', error)
    uni.showToast({
      title: '获取评价列表失败',
      icon: 'none'
    })
  }
}

// 删除评价
const deleteEvaluation = async (evaluationId) => {
  try {
    const token = uni.getStorageSync('token')
    if (!token) {
      uni.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }

    uni.showModal({
      title: '提示',
      content: '确定要删除这条评价吗？',
      success: async (res) => {
        if (res.confirm) {
          const deleteRes = await uni.request({
            url: getFullUrl(`/evaluation/${evaluationId}`),
            method: 'DELETE',
            header: {
              'authorization': token
            }
          })

          if (deleteRes.statusCode === 200 && deleteRes.data.success) {
            uni.showToast({
              title: '删除成功',
              icon: 'success'
            })
            // 重新加载评价列表
            await loadEvaluations()
          } else {
            uni.showToast({
              title: deleteRes.data.message || '删除失败',
              icon: 'none'
            })
          }
        }
      }
    })
  } catch (error) {
    console.error('删除评价失败:', error)
    uni.showToast({
      title: '删除失败',
      icon: 'none'
    })
  }
}

// 点赞评价
const likeEvaluation = async (evaluationId) => {
  try {
    const token = uni.getStorageSync('token')
    if (!token) {
      uni.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }

    const res = await uni.request({
      url: getFullUrl(`/evaluation/like/${evaluationId}`),
      method: 'PUT',
      header: {
        'authorization': token
      }
    })

    if (res.statusCode === 200 && res.data.success) {
      // 重新加载评价列表以更新点赞状态
      await loadEvaluations()
    } else {
      uni.showToast({
        title: res.data.message || '操作失败',
        icon: 'none'
      })
    }
  } catch (error) {
    console.error('点赞失败:', error)
    uni.showToast({
      title: '操作失败',
      icon: 'none'
    })
  }
}

// 页面导航
const navigateTo = (page) => {
  currentPage.value = page
  if (page === 'home') {
    uni.switchTab({ url: '/pages/index/index' }) // 跳转到首页
  } else if (page === 'message') {
    uni.switchTab({ url: '/pages/message/message' })
  } else if (page === 'note') {
    uni.switchTab({ url: '/pages/note/note' }) // 跳转到笔记发布页
  } else if (page === 'personal') {
    uni.switchTab({ url: '/pages/my/my' })
  }
}

// 跳转到博客详情页
const goToBlogDetail = (blogId) => {
  uni.navigateTo({
    url: `/pages/blog/detail?id=${blogId}`
  })
}

// 编辑资料
const editProfile = () => {
  uni.navigateTo({
    url: '/pages/editProfile/editProfile'
  })
}

// 退出登录
const logout = () => {
  uni.showModal({
    title: '提示',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        console.log('[logout] User confirmed logout.');
        uni.removeStorageSync('token'); // 清除 token
        uni.removeStorageSync('userBackgroundUrl'); // 可选：清除背景设置

        // Update state immediately using the check function
        checkLoginStatusAndLoadData();

        uni.showToast({
          title: '已退出登录',
          icon: 'success'
        });
      }
    }
  })
}

// 加载关注列表
const loadFollowings = async () => {
  try {
    const token = uni.getStorageSync('token')
    if (!token) {
      followings.value = []
      return
    }

    const res = await uni.request({
      url: getFullUrl('/follow/followings'),
      method: 'GET',
      header: {
        'authorization': token
      }
    })

    if (res.statusCode === 200 && res.data.success) {
      followings.value = res.data.data
    } else {
      console.error('获取关注列表失败:', res.data)
      uni.showToast({
        title: res.data.message || '获取关注列表失败',
        icon: 'none'
      })
    }
  } catch (error) {
    console.error('获取关注列表失败:', error)
    uni.showToast({
      title: '获取关注列表失败',
      icon: 'none'
    })
  }
}

// 加载粉丝列表
const loadFollowers = async () => {
  try {
    const token = uni.getStorageSync('token')
    if (!token) {
      followers.value = []
      return
    }

    const res = await uni.request({
      url: getFullUrl('/follow/followers'),
      method: 'GET',
      header: {
        'authorization': token
      }
    })

    if (res.statusCode === 200 && res.data.success) {
      followers.value = res.data.data
    } else {
      console.error('获取粉丝列表失败:', res.data)
      uni.showToast({
        title: res.data.message || '获取粉丝列表失败',
        icon: 'none'
      })
    }
  } catch (error) {
    console.error('获取粉丝列表失败:', error)
    uni.showToast({
      title: '获取粉丝列表失败',
      icon: 'none'
    })
  }
}

// 跳转到用户主页
const goToUserPage = (userId) => {
  uni.navigateTo({
    url: `/pages/userInfo/userInfo?id=${userId}`
  })
}

// 取消关注
const unfollowUser = async (userId) => {
  try {
    const token = uni.getStorageSync('token')
    if (!token) {
      uni.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }

    uni.showModal({
      title: '提示',
      content: '确定要取消关注吗？',
      success: async (res) => {
        if (res.confirm) {
          const res = await uni.request({
            url: getFullUrl(`/follow/${userId}/false`),
            method: 'PUT',
            header: {
              'authorization': token
            }
          })

          if (res.statusCode === 200 && res.data.success) {
            uni.showToast({
              title: '取消关注成功',
              icon: 'success'
            })
            // 重新加载关注列表
            await loadFollowings()
            // 更新用户信息中的关注数
            userInfo.value.followCount = (userInfo.value.followCount || 0) - 1
          } else {
            uni.showToast({
              title: res.data.message || '取消关注失败',
              icon: 'none'
            })
          }
        }
      }
    })
  } catch (error) {
    console.error('取消关注失败:', error)
    uni.showToast({
      title: '取消关注失败',
      icon: 'none'
    })
  }
}

// 切换标签页
const changeTab = (tab) => {
  console.log(`[changeTab] Changing tab to: ${tab}, Logged in: ${isLoggedIn.value}`);
  activeTab.value = tab;
  
  // Data loading still only happens if logged in
  if (isLoggedIn.value) {
      if (tab === 'follow') {
          console.log('[changeTab] Loading followings.');
          loadFollowings();
      } else if (tab === 'fans') {
          console.log('[changeTab] Loading followers.');
          loadFollowers();
      } else if (tab === 'note') {
          console.log('[changeTab] Loading notes.');
          loadNotes();
      } else if (tab === 'evaluation') {
          console.log('[changeTab] Loading evaluations.');
          loadEvaluations();
      }
  }
}

// 更换背景图片
const changeBackground = () => {
  uni.chooseImage({
    count: 1, // 只选择一张图片
    sizeType: ['compressed'], // 可以指定是原图还是压缩图，默认二者都有
    sourceType: ['album'], // 从相册选择
    success: (res) => {
      const tempFilePath = res.tempFilePaths[0];
      backgroundUrl.value = tempFilePath;
      // 将选择的图片路径保存到本地存储
      uni.setStorageSync('userBackgroundUrl', tempFilePath);
    },
    fail: (err) => {
      // 用户取消选择或其他错误
      console.log('ChooseImage fail:', err);
      // 可以选择性地提示用户
      // uni.showToast({ title: '选择图片失败', icon: 'none' });
    }
  });
}

// 页面加载时执行
onMounted(() => {
  console.log('[onMounted] Component mounted.');
  const storedBackgroundUrl = uni.getStorageSync('userBackgroundUrl');
  if (storedBackgroundUrl) {
    backgroundUrl.value = storedBackgroundUrl;
  }

  // Don't call checkLoginStatusAndLoadData here, let onShow handle it initially
  // checkLoginStatusAndLoadData();

  // Set up event listeners
  console.log('[onMounted] Setting up event listeners.');
  uni.$on('refreshUserInfo', checkLoginStatusAndLoadData) // Use the refactored function
  uni.$on('notePublished', loadNotes)
  uni.$on('commentPublished', loadEvaluations)
  uni.$on('loginSuccess', checkLoginStatusAndLoadData) // Use the refactored function
});

// 页面显示时执行 (onShow)
onShow(() => {
  console.log('[onShow] Page became visible.');
  checkLoginStatusAndLoadData(); // Check status every time the page is shown
  // Optionally trigger data load for the current tab if logged in
  if (isLoggedIn.value) {
      console.log(`[onShow] Page visible and logged in. Active tab: ${activeTab.value}. Triggering data load for this tab.`);
      changeTab(activeTab.value); // Call changeTab to load data for the current tab
  }
})

// 页面卸载时移除事件监听
onUnmounted(() => {
  console.log('[onUnmounted] Component unmounted. Removing event listeners.');
  uni.$off('refreshUserInfo', checkLoginStatusAndLoadData)
  uni.$off('notePublished', loadNotes)
  uni.$off('commentPublished', loadEvaluations)
  uni.$off('loginSuccess', checkLoginStatusAndLoadData)
})

// 页面滚动监听
onPageScroll((e) => {
  showStatusBarBg.value = e.scrollTop > 0
})

// 选择并上传头像
const chooseAvatar = async () => {
  try {
    const res = await uni.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera']
    })

    if (res.tempFilePaths && res.tempFilePaths.length > 0) {
      uni.showLoading({ title: '上传中...' })
      
      const token = uni.getStorageSync('token')
      
      // 修改为正确的完整请求路径
      const uploadRes = await new Promise((resolve, reject) => {
        uni.uploadFile({
          url: getFullUrl('/user/info/avatar'), // 修改这里，使用正确的完整路径
          filePath: res.tempFilePaths[0],
          name: 'file',
          header: {
            'authorization': token
          },
          success: (uploadRes) => {
            resolve(uploadRes)
          },
          fail: (error) => {
            reject(error)
          }
        })
      })

      const result = typeof uploadRes.data === 'string' ? JSON.parse(uploadRes.data) : uploadRes.data

      if (result.success) {
        userInfo.value.icon = result.data // 获取返回的阿里云OSS的URL
        uni.showToast({
          title: '头像上传成功',
          icon: 'success'
        })
      } else {
        throw new Error(result.message || '上传失败')
      }
    }
  } catch (error) {
    console.error('头像上传失败:', error)
    uni.showToast({
      title: error.message || '头像上传失败',
      icon: 'none'
    })
  } finally {
    uni.hideLoading()
  }
}

// 保存用户信息时的修改
const saveUserInfo = async () => {
  try {
    const token = uni.getStorageSync('token')
    if (!token) {
      uni.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }

    // 构造符合后端 UserInfoDTO 的数据结构
    const userInfoData = {
      nickName: userInfo.value.nickName,
      icon: userInfo.value.icon,
      gender: userInfo.value.gender,
      city: userInfo.value.city,
      signature: userInfo.value.signature // 这里对应后端的 introduce 字段
    }

    console.log('准备提交的用户信息:', userInfoData) // 添加日志

    const res = await uni.request({
      url: getFullUrl('/user'),
      method: 'PUT',
      header: {
        'authorization': token,
        'content-type': 'application/json'
      },
      data: userInfoData
    })

    console.log('服务器响应:', res) // 添加日志

    if (res.statusCode === 200 && res.data.success) {
      uni.showToast({
        title: '保存成功',
        icon: 'success'
      })
      // 触发更新事件
      uni.$emit('userInfoUpdated')
      // 返回上一页
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
    } else {
      throw new Error(res.data.message || '保存失败')
    }
  } catch (error) {
    console.error('保存用户信息失败:', error)
    uni.showToast({
      title: error.message || '保存失败',
      icon: 'none'
    })
  }
}
</script>

<style lang="scss">
.personal-home {
  background-color: #f5f5f5;
  min-height: 100vh;
  padding-bottom: 60px;
  /* 移除 padding-top 和 box-sizing */
}

.status-bar-bg {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background-image: url('/static/bgt2.png');
  background-size: cover;
  background-position: center;
  z-index: 10; /* 确保在内容之上 */
  transition: opacity 0.3s; /* 可选：添加过渡效果 */
}

.background-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 340px;
  overflow: hidden;
  z-index: 1;
  
  .bg-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: blur(10px);
    transform: scale(1.1);
  }
  
  .bg-mask {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      180deg, 
      rgba(0,0,0,0.2) 0%, 
      rgba(0,0,0,0.4) 100%
    );
  }
}

.content-wrapper {
  position: relative;
  z-index: 2;
  padding-bottom: 60px;
  margin-top: -30px; /* 恢复负边距 */
}

.header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px 12px; /* 保持顶部固定 padding 为 0 */
  /* padding-top 由 inline style 控制 */
  
  .left-section {
    .title {
      font-size: 22px;
      font-weight: 600;
      color: #fff;
    }
  }
  
  .right-section {
    .setting-btn {
      background: rgba(255, 255, 255, 0.2);
      padding: 6px 12px;
      border-radius: 16px;
      
      text {
        color: #fff;
        font-size: 14px;
      }
    }
  }
}

.user-info-section {
  padding: 0 16px 12px;
  display: flex;
  align-items: flex-start;
  margin-top: 10px;
  
  .user-avatar {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    overflow: hidden;
    border: 2px solid rgba(255, 255, 255, 0.8);
    margin-right: 16px;
    
    image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
  
  .user-details {
    flex: 1;
    position: relative;
    
    .user-name {
      font-size: 20px;
      font-weight: 600;
      color: #fff;
      margin-bottom: 4px;
    }
    
    .user-status {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.9);
      margin-bottom: 8px;
    }
    
    .user-location {
      font-size: 13px;
      color: rgba(255, 255, 255, 0.8);
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      
      .iconfont {
        margin-right: -1px;
      }
    }
    
    .action-buttons {
      display: flex;
      gap: 12px;

      button {
        height: 32px;
        line-height: 32px;
        font-size: 14px;
        border-radius: 16px;
        padding: 0 16px;
      }

      .edit-button {
        background: rgba(255, 255, 255, 0.2);
        color: #fff;
        border: 1px solid rgba(255, 255, 255, 0.3);
      }

      .logout-button {
        background: #ff2442;
        color: #fff;
        border: none;
      }
      
      // Style for the container when only login button is present - Absolute Positioning
      &.login-only {
        position: absolute;
        top: 25px;
        right: 30px;  /* Increased value to move further left */
        width: auto;
        gap: 0;
      }

      .login-prompt-button {
        background-color: #ff4d4f; /* Red background */
        color: white;
        border: none;
        padding: 0 40px; /* Increased padding to make button bigger */
      }
    }
  }
}

.stats-section {
  background: #fff;
  border-radius: 12px 12px 0 0;
  margin-top: -4px;
  padding: 20px 0;
  display: flex;
  justify-content: space-around;
  
  .stat-item {
    text-align: center;
    
    .stat-number {
      font-size: 18px;
      font-weight: 600;
      color: #333;
      display: block;
      margin-bottom: 4px;
    }
    
    .stat-label {
      font-size: 12px;
      color: #999;
    }
  }
}

.tab-bar {
  display: flex;
  background-color: white;
  border-bottom: 1px solid #eaeaea;
  
  .tab {
    flex: 1;
    text-align: center;
    padding: 12px 0;
    font-size: 15px;
    color: #666;
    
    &.active {
      color: #e43d33;
      border-bottom: 2px solid #e43d33;
    }
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  background-color: white;
  
  .empty-image {
    width: 160px;
    height: 160px;
    margin-bottom: 20px;
    border-radius: 50%;
    padding: 10px;
    box-sizing: border-box;
    background-color: #fff;
    object-fit: contain;
  }
  
  .empty-text {
    font-size: 16px;
    color: #888;
    margin-bottom: 20px;
    text-align: center;
  }
  
  .empty-button {
    background-color: #e43d33;
    color: white;
    border: none;
    border-radius: 20px;
    padding: 8px 20px;
    font-size: 14px;
  }
}

.notes-container,
.evaluations-container,
.fans-container,
.follow-container {
  background-color: white;
  min-height: 300px;
}

.note-item {
  padding: 12px 15px;
  border-bottom: 1px solid #f0f0f0;
  background-color: white;
  
  &:last-child {
    border-bottom: none;
  }
  
  .note-content {
    .note-title {
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 5px;
      display: block;
    }
    
    .note-text {
      font-size: 14px;
      margin-bottom: 8px;
      display: block;
      color: #333;
    }

    .note-images {
      display: flex;
      flex-wrap: wrap;
      margin: 10px 0;
      
      .note-image {
        width: calc(33.33% - 6px);
        height: 100px;
        margin: 3px;
        border-radius: 4px;
        object-fit: cover;
      }
    }
    
    .note-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .note-time {
        color: #888;
        font-size: 12px;
      }
      
      .note-interaction {
        display: flex;
        align-items: center;
        
        .interaction-item {
          display: flex;
          align-items: center;
          margin-right: 15px;
          
          .interaction-icon {
            width: 16px;
            height: 16px;
            margin-right: 4px;
          }
          
          .interaction-count {
            font-size: 12px;
            color: #888;
          }
        }
        
        .delete-btn {
          padding: 2px 8px;
          background-color: #ff4d4f;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 12px;
        }
      }
    }
  }
}

.evaluation-item {
  padding: 15px;
  border-bottom: 1px solid #f0f0f0;
  background-color: white;
  
  .evaluation-content {
    .blog-info {
      margin-bottom: 15px;
      padding: 10px;
      background-color: #f8f8f8;
      border-radius: 8px;
      
      .blog-header {
        display: flex;
        align-items: center;
        margin-bottom: 10px;
        
        .blog-user-avatar {
          width: 40rpx;
          height: 40rpx;
          border-radius: 50%;
          margin-right: 10rpx;
        }
        
        .blog-user-name {
          font-size: 24rpx;
          color: #666;
        }
      }
      
      .blog-preview {
        .blog-title {
          font-size: 28rpx;
          font-weight: bold;
          color: #333;
          margin-bottom: 5px;
          display: block;
        }
        
        .blog-content {
          font-size: 24rpx;
          color: #666;
          margin-bottom: 8px;
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
        
        .blog-images {
          display: flex;
          flex-wrap: wrap;
          
          .blog-image {
            width: 120rpx;
            height: 120rpx;
            margin: 5rpx;
            border-radius: 4px;
            object-fit: cover;
          }
        }
      }
    }
    
    .comment-section {
      .comment-text {
        font-size: 28rpx;
        color: #333;
        line-height: 1.5;
        margin-bottom: 10px;
      }
      
      .comment-meta {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        
        .comment-time {
          font-size: 24rpx;
          color: #999;
        }
      }
    }
  }
}

.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 50px;
  background-color: white;
  display: flex;
  border-top: 1px solid #eaeaea;
  
  .nav-item {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 14px;
    color: #666;
    
    &.active {
      color: #07C160;
    }
  }
}

.not-login-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  background-color: white;
  margin-bottom: 10px;
  
  .default-avatar {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    margin-bottom: 20px;
  }
  
  .login-tip {
    font-size: 16px;
    color: #666;
    margin-bottom: 20px;
  }
  
  .login-button {
    background-color: #e43d33;
    color: white;
    border: none;
    border-radius: 20px;
    padding: 8px 30px;
    font-size: 16px;
  }
}

.follow-list {
  padding: 15px;
  background-color: white;
  
  .follow-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px;
    margin-bottom: 10px;
    background-color: #f8f8f8;
    border-radius: 8px;
    transition: all 0.3s ease;
    
    &:active {
      background-color: #f0f0f0;
    }
    
    .follow-user-info {
      display: flex;
      align-items: center;
      flex: 1;
      
      .follow-avatar {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        margin-right: 12px;
        border: 2px solid #f0f0f0;
      }
      
      .follow-info {
        flex: 1;
        
        .follow-name {
          font-size: 16px;
          font-weight: bold;
          color: #333;
          margin-bottom: 4px;
          display: block;
        }
        
        .follow-signature {
          font-size: 12px;
          color: #666;
          display: block;
        }
      }
    }
    
    .unfollow-btn {
      padding: 4px 12px;
      font-size: 12px;
      color: #ff4d4f;
      background-color: white;
      border: 1px solid #ff4d4f;
      border-radius: 4px;
      margin-left: 10px;
      
      &:active {
        background-color: #fff1f0;
      }
    }
  }
}

.evaluation-empty-image {
  width: 120px !important; /* 使用 !important 确保覆盖通用样式 */
  height: 120px !important;
}
</style>