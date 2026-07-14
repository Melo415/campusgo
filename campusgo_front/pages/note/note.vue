<template>
  <view class="note-page-wrapper">
    <scroll-view scroll-y="true" @scroll="handleScroll" class="note-scroll-view">
      <view class="note-container">
        <!-- 标题区域 -->
        <view class="note-header">
          <text class="title">分享一下在西电的日常~</text>
        </view>
        
        <!-- 提示信息 -->
        <view class="note-tip">
          <text>地点+吃喝玩乐更棒棒呢~</text>
        </view>
        
        <!-- 标题输入框 -->
        <view class="title-input">
          <input 
            v-model="noteTitle" 
            placeholder="填写地点让大家知道在哪里~"
            placeholder-class="placeholder"
          />
        </view>
        
        <!-- 正文输入框 -->
        <view class="content-input">
          <textarea 
            v-model="noteContent" 
            placeholder="吃喝玩乐样样都有~"
            placeholder-class="placeholder"
          />
        </view>
        
        <!-- 吃喝玩乐选择 -->
        <view class="category-section">
          <view class="category-list">
            <view 
              v-for="(category, index) in categories" 
              :key="index" 
              class="category-item"
              :class="{ active: selectedCategory === category }"
              @click="selectCategory(category)"
            >
              <text>{{ category }}</text>
            </view>
          </view>
        </view>
        
        <!-- 图片上传区域 -->
        <view class="image-upload">
          <view class="image-list">
            <view v-for="(image, index) in selectedImages" :key="index" class="image-item">
              <image :src="image" mode="aspectFill" @click="previewImage(index)"></image>
              <view class="delete-btn" @click.stop="deleteImage(index)">×</view>
            </view>
            <view v-if="selectedImages.length < 9" class="upload-btn" @click="chooseImage">
              <text>+</text>
            </view>
          </view>
        </view>
        
        <!-- 底部操作栏 -->
        <view class="action-bar">
          <button class="publish-btn" @click="publishNote" size="default">发布笔记</button>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getFullUrl } from '../../config/api.config'  

const noteTitle = ref('')
const noteContent = ref('')
const selectedImages = ref([])
const selectedCategory = ref('')
const categories = ref(['美食', '饮品', '娱乐', '我不要上课'])

const publishNote = async () => {
  try {
    // 检查登录状态
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

    // 检查必填项
    if (!noteTitle.value || !noteContent.value) {
      uni.showToast({
        title: '请填写标题和正文',
        icon: 'none'
      })
      return
    }

    // 构建请求数据
    const blogData = {
      title: noteTitle.value,
      content: noteContent.value,
      images: selectedImages.value.length > 0 ? selectedImages.value.join(',') : '',
      shopId: 1,
      category: selectedCategory.value || ''
    }

    console.log('发送的数据:', blogData) // 添加日志

    // 发送请求
    const res = await uni.request({
      url: getFullUrl('/blog'),
      method: 'POST',
      header: {
        'authorization': token,
        'content-type': 'application/json'
      },
      data: blogData
    })

    console.log('响应数据:', res) // 添加日志

    if (res.statusCode === 200 && res.data.success) {
      uni.showToast({
        title: '发布成功',
        icon: 'success'
      })
      
      // 设置刷新标志，表示需要刷新首页
      uni.setStorageSync('needRefreshHome', true)
      // 触发笔记发布事件
      uni.$emit('notePublished')
      
      // 返回首页
      setTimeout(() => {
        uni.switchTab({
          url: '/pages/index/index'
        })
      }, 1500)

      // 清空输入内容
      noteTitle.value = ''
      noteContent.value = ''
      selectedCategory.value = ''
      selectedImages.value = []
    } else {
      uni.showToast({
        title: res.data.message || '发布失败',
        icon: 'none'
      })
    }
  } catch (error) {
    console.error('发布失败:', error)
    uni.showToast({
      title: '发布失败',
      icon: 'none'
    })
  }
}

// 选择图片并上传到阿里云OSS
const chooseImage = () => {
  uni.chooseImage({
    count: 9 - selectedImages.value.length,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: async (res) => {
      try {
        // 显示上传中提示
        uni.showLoading({
          title: '上传中...'
        })
        
        // 准备上传文件
        const files = res.tempFilePaths.map(path => {
          return {
            name: 'files',
            uri: path
          }
        })
        
        // 获取token
        const token = uni.getStorageSync('token')
        if (!token) {
          uni.showToast({
            title: '请先登录',
            icon: 'none'
          })
          return
        }

        // 上传图片到阿里云OSS
        const uploadRes = await uni.uploadFile({
          url: getFullUrl('/blog/upload'),
          files: files,
          header: {
            'authorization': token
          }
        })

        // 解析响应数据
        const result = JSON.parse(uploadRes.data)
        
        if (result.success) {
          // 添加上传成功的图片URL到已选图片列表
          selectedImages.value = [...selectedImages.value, ...result.data]
          uni.showToast({
            title: '上传成功',
            icon: 'success'
          })
        } else {
          // 显示后端返回的具体错误信息
          uni.showToast({
            title: result.errorMsg || '图片上传失败',
            icon: 'none'
          })
        }
      } catch (error) {
        console.error('上传过程出错:', error)
        // 如果是解析错误或其他错误，显示通用错误信息
        uni.showToast({
          title: '上传失败，请稍后重试',
          icon: 'none'
        })
      } finally {
        uni.hideLoading()
      }
    },
    fail: (error) => {
      console.error('选择图片失败:', error)
      uni.showToast({
        title: '选择图片失败',
        icon: 'none'
      })
    }
  })
}

// 预览图片
const previewImage = (index) => {
  uni.previewImage({
    urls: selectedImages.value,
    current: index
  })
}

// 删除图片
const deleteImage = (index) => {
  selectedImages.value.splice(index, 1)
}

// 选择分类
const selectCategory = (category) => {
  selectedCategory.value = category
}
</script>

<style lang="scss">
.note-page-wrapper {
  min-height: 100vh;
  display: flex;
}

.note-scroll-view {
  flex: 1;
  height: 100%;
  box-sizing: border-box;
}

.note-container {
  padding: 30rpx;
  background-color: #f5f5f5;
}

.note-header {
  margin-bottom: 30rpx;
  
  .title {
    font-size: 44rpx;
    font-weight: bold;
    color: #333333;
  }
}

.note-tip {
  background-color: #fff8e6;
  padding: 20rpx;
  border-radius: 10rpx;
  margin-bottom: 40rpx;
  font-size: 28rpx;
  color: #ff9500;
}

.title-input {
  position: relative;
  margin-bottom: 40rpx;
  border: 2rpx solid #eaeaea;
  border-radius: 16rpx;
  background-color: #ffffff;
  padding: 0 30rpx;

  input {
    width: 100%;
    padding: 24rpx 0;
    font-size: 32rpx;
  }
}

.content-input {
  margin-bottom: 40rpx;
  border: 2rpx solid #eaeaea;
  border-radius: 16rpx;
  background-color: #ffffff;
  padding: 0 30rpx;

  textarea {
    width: 100%;
    height: 300rpx;
    padding: 24rpx 0;
    font-size: 32rpx;
  }
}

.category-section {
  margin-bottom: 40rpx;
  
  .category-list {
    display: flex;
    flex-wrap: wrap;
    gap: 20rpx;
    margin-top: 20rpx;
  }
  
  .category-item {
    padding: 16rpx 32rpx;
    background-color: #ffffff;
    border-radius: 40rpx;
    font-size: 28rpx;
    color: #666666;
    border: 2rpx solid #eaeaea;
    
    &.active {
      background-color: #ff9500;
      color: #ffffff;
      border: none;
    }
  }
}

.image-upload {
  margin-bottom: 40rpx;
  
  .image-list {
    display: flex;
    flex-wrap: wrap;
    gap: 20rpx;
  }
  
  .image-item {
    position: relative;
    width: calc(32% - 14rpx);
    aspect-ratio: 1/1;
    
    image {
      width: 100%;
      height: 100%;
      border-radius: 16rpx;
    }
  }
  
  .delete-btn {
    position: absolute;
    top: -20rpx;
    right: -20rpx;
    width: 48rpx;
    height: 48rpx;
    background-color: rgba(0, 0, 0, 0.5);
    color: #ffffff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 40rpx;
  }
  
  .upload-btn {
    width: calc(32% - 14rpx);
    aspect-ratio: 1/1;
    background-color: #ffffff;
    border-radius: 16rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 80rpx;
    color: #999999;
    border: 2rpx dashed #eaeaea;
  }
}

.action-bar {
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  //background-color: #ffffff;
  padding: 5rpx 10rpx;
  //border-top: 2rpx solid #eaeaea;
  z-index: 990;
  
  .publish-btn {
    background-color: #ff9500;
    color: #ffffff;
    border-radius: 40rpx;
    padding: 20rpx 0;
    margin-bottom: 30rpx;
    font-size: 32rpx;
  }
}

.placeholder {
  color: #999999;
}
</style>