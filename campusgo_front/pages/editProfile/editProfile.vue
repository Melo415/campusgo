<template>
  <view class="edit-profile">
    <!-- 页面标题 -->
    <view class="page-header">
      <!-- <text class="back-btn" @click="goBack">返回</text> -->
		<view class="header-icon-container">
			<image class="header-icon" src="/static/geren.png" mode="aspectFit" ></image>
		</view>	
      <text class="save-btn" @click="saveProfile">保存</text>
    </view>

    <!-- 编辑表单 -->
    <view class="form-container">
      <!-- 头像上传 -->
      <view class="form-item avatar-upload">
        <text class="label">头像</text>
        <view class="avatar-preview" @click="chooseAvatar">
          <image :src="formData.icon || '/static/default-avatar.png'" class="avatar" mode="aspectFill"></image>
          <text class="upload-tip">点击更换头像</text>
        </view>
      </view>

      <!-- 昵称 -->
      <view class="form-item">
        <text class="label">昵称</text>
        <input 
          class="input" 
          v-model="formData.nickName" 
          placeholder="请输入昵称"
          maxlength="20"
        />
      </view>

      <!-- 个性签名 -->
      <view class="form-item">
        <text class="label">个性签名</text>
        <textarea 
          class="textarea" 
          v-model="formData.signature" 
          placeholder="请输入个性签名"
          maxlength="100"
        />
      </view>

      <!-- 城市 -->
      <view class="form-item">
        <text class="label">住在哪里呢</text>
        <input 
          class="input" 
          v-model="formData.city" 
          placeholder="请输入所在城市"
          maxlength="20"
        />
      </view>

      <!-- 性别 -->
      <view class="form-item">
        <text class="label">性别</text>
        <view class="gender-select">
          <view 
            class="gender-option" 
            :class="{ active: formData.gender === '男' }"
            @click="formData.gender = '男'"
          >
            男
          </view>
          <view 
            class="gender-option" 
            :class="{ active: formData.gender === '女' }"
            @click="formData.gender = '女'"
          >
            女
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getFullUrl } from '../../config/api.config'

// 表单数据
const formData = ref({
  icon: '',
  nickName: '',
  signature: '',
  city: '',
  gender: ''
})

// 返回上一页
const goBack = () => {
  uni.navigateBack()
}

// 选择头像
const chooseAvatar = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: async (res) => {
      try {
        const token = uni.getStorageSync('token')
        if (!token) {
          uni.showToast({
            title: '请先登录',
            icon: 'none'
          })
          return
        }

        uni.showLoading({
          title: '上传中...'
        })

        // 上传头像
        const uploadRes = await uni.uploadFile({
          url: getFullUrl('/user/info/avatar'),
          filePath: res.tempFilePaths[0],
          name: 'file',
          header: {
            'authorization': token
          }
        })

        // 解析响应数据
        const result = JSON.parse(uploadRes.data)
        
        if (result.success) {
          // 更新表单数据中的头像
          formData.value.icon = result.data
          uni.showToast({
            title: '头像上传成功',
            icon: 'success'
          })
        } else {
          // 显示后端返回的具体错误信息
          uni.showToast({
            title: result.errorMsg || '上传失败',
            icon: 'none'
          })
        }
      } catch (error) {
        console.error('上传头像失败:', error)
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

// 保存资料
const saveProfile = async () => {
  try {
    const token = uni.getStorageSync('token')
    if (!token) {
      uni.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }

    // 表单验证
    if (!formData.value.nickName) {
      uni.showToast({
        title: '请输入昵称',
        icon: 'none'
      })
      return
    }

    // 准备请求数据
    const requestData = {
      nickName: formData.value.nickName,
      icon: formData.value.icon,
      signature: formData.value.signature,
      city: formData.value.city,
      gender: formData.value.gender
    }

    const res = await uni.request({
      url: getFullUrl('/user/info'), // 确保这个接口路径也是正确的
      method: 'PUT',
      header: {
        'authorization': token,
        'Content-Type': 'application/json'
      },
      data: requestData
    })

    if (res.statusCode === 200 && res.data.success) {
      uni.showToast({
        title: '保存成功',
        icon: 'success'
      })
      // 发送刷新事件
      uni.$emit('refreshUserInfo')
      // 延迟返回，让用户看到保存成功的提示
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
    } else {
      throw new Error(res.data.message || '保存失败')
    }
  } catch (error) {
    console.error('保存资料失败:', error)
    uni.showToast({
      title: error.message || '保存失败',
      icon: 'none'
    })
  }
}

// 加载用户信息
const loadUserInfo = async () => {
  try {
    const token = uni.getStorageSync('token')
    if (!token) return

    // 获取用户基本信息
    const userRes = await uni.request({
      url: getFullUrl('/user/me'),
      method: 'GET',
      header: {
        'authorization': token
      }
    })

    if (userRes.statusCode === 200 && userRes.data.success) {
      const user = userRes.data.data
      
      // 获取用户详细信息
      const infoRes = await uni.request({
        url: getFullUrl(`/user/info/${user.id}`),
        method: 'GET',
        header: {
          'authorization': token
        }
      })

      // 设置表单数据
      formData.value = {
        icon: user.icon || '',
        nickName: user.nickName || '',
        signature: infoRes.data.success ? infoRes.data.data.introduce || '' : '',
        city: infoRes.data.success ? infoRes.data.data.city || '' : '',
        gender: infoRes.data.success ? (infoRes.data.data.gender ? '男' : '女') : ''
      }
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    uni.showToast({
      title: '获取用户信息失败',
      icon: 'none'
    })
  }
}

// 页面加载时获取用户信息
onMounted(() => {
  loadUserInfo()
})
</script>

<style lang="scss">
.edit-profile {
  background-color: #f5f5f5;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 30rpx;
  padding-top: calc(var(--status-bar-height) + 20rpx); /* 考虑状态栏高度 */
  background-color: #ffffff;
  border-bottom: 1rpx solid #eaeaea;
  position: sticky;
  top: 0;
  z-index: 99;
  
  .back-btn,
  .save-btn {
    font-size: 30rpx;
    color: #666;
	flex-shrink: 0;
  }
  
  .save-btn {
    color: #07C160;
    font-weight: 500;
  }
  
  .title {
    font-size: 34rpx;
    font-weight: bold;
    color: #333;
  }
  
  /* 新增：控制标题图片样式 */
  .header-icon {
	/* display: block;
	margin: 0 auto; */
    width: 150rpx; /* 调整宽度 */
    height: 80rpx; /* 调整高度 */
	 position: absolute;
	  left: 50%;
	  top: 50%; /* 如果希望垂直也居中于整个header的高度 */
	  transform: translate(-50%, -50%); /* 精确居中 */
  }
}

.form-container {
  padding: 15px;
  background-color: #fff;

  .form-item {
    margin-bottom: 20px;

    .label {
      display: block;
      font-size: 14px;
      color: #333;
      margin-bottom: 8px;
    }

    .input {
      width: 100%;
      height: 40px;
      padding: 0 10px;
      border: 1px solid #eee;
      border-radius: 4px;
      font-size: 14px;
    }

    .textarea {
      width: 100%;
      height: 80px;
      padding: 10px;
      border: 1px solid #eee;
      border-radius: 4px;
      font-size: 14px;
    }
  }

  .avatar-upload {
    .avatar-preview {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-top: 10px;

      .avatar {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        margin-bottom: 8px;
      }

      .upload-tip {
        font-size: 12px;
        color: #999;
      }
    }
  }

  .gender-select {
    display: flex;
    gap: 20px;

    .gender-option {
      flex: 1;
      height: 40px;
      line-height: 40px;
      text-align: center;
      border: 1px solid #eee;
      border-radius: 4px;
      font-size: 14px;
      color: #666;

      &.active {
        background-color: #07C160;
        color: #fff;
        border-color: #07C160;
      }
    }
  }
}
</style>