<template>
	<view class="login-container">
		<view class="login-header">
			<text class="title">校内Go</text>
		</view>
		<view class="login-methods">
			<text :class="{ active: loginType === 'password' }" @click="switchLoginType('password')">账号密码登录</text>
			<!-- <text :class="{ active: loginType === 'sms' }" @click="switchLoginType('sms')">短信验证码登录</text> -->
			<text :class="{ active: loginType === 'sms' }" @click="showSmsModal">短信验证码登录</text>
		</view>
		<view class="login-form">
			<!-- 账号密码登录表单 -->
			<view :class="{ 'v-show': loginType === 'password' }">
				<input type="text" placeholder="请输入手机号" v-model="username" />
				<input type="password" placeholder="请输入密码" v-model="password" />
				<button class="login-btn" @click="loginWithPassword">立即登录</button>
			</view>

			<!-- 短信验证码登录表单 -->
			<view :class="{ 'v-show': loginType === 'sms' }">
				<input type="text" placeholder="请输入手机号" v-model="phone" />
				<view class="code-input">
					<input type="text" placeholder="请输入验证码" v-model="code" />
					<button class="get-code-btn" @click="getVerificationCode" :disabled="countdown > 0">
						{{ countdown > 0 ? `${countdown}s后重新获取` : '获取验证码' }}
					</button>
				</view>
				<button class="login-btn" @click="loginWithSms">立即登录</button>
			</view>
		</view>
		<view class="register-link">
			<text @click="goToRegister">去注册</text>
		</view>
		<view class="third-party-login">
			<text>第三方账号登录</text>
			<view class="third-party-icons">
				<!-- <image src="../../static/wechat.png" class="icon"></image>
				<image src="../../static/qq.png" class="icon"></image>
				<image src="../../static/weibo.png" class="icon"></image> -->
			</view>
		</view>
	</view>
</template>

<script setup>
	import {
		ref
	} from 'vue'
	import {
		onLoad
	} from '@dcloudio/uni-app'
	import { getFullUrl } from '../../config/api.config'
	import { wsClient } from '@/utils/websocket'

	const loginType = ref('password') // 默认使用账号密码登录
	const username = ref('')
	const password = ref('')
	const phone = ref('')
	const code = ref('')
	const countdown = ref(0)
	
	const goBack = () => {
	  uni.navigateBack();
	}
	
	// 切换登录方式
	const switchLoginType = (type) => {
		loginType.value = type
	}

	// 获取 phone 的值，这里假设 phone 是一个包含值的对象，实际情况可能不同

	// 获取验证码
	const getVerificationCode = async () => {
		if (!phone.value) {
			uni.showToast({
				title: '请输入手机号',
				icon: 'none'
			})
			return
		}

		// 验证手机号格式
		if (!/^1[3-9]\d{9}$/.test(phone.value)) {
			uni.showToast({
				title: '手机号格式错误',
				icon: 'none'
			})
			return
		}

		try {
			const phoneValue = phone.value;
			const urlWithParams = getFullUrl(`/user/code?phone=${phoneValue}`);
			const res = await uni.request({
				url: urlWithParams,
				method: 'POST',
				// 不再在 data 中传递 phone
				// data: { phone: phone.value }, 
				timeout: 5000
			});

			// 处理响应
			if (res.statusCode === 200) {
				uni.showToast({
					title: '验证码已发送',
					icon: 'none'
				})
				// 开始倒计时
				countdown.value = 60
				const timer = setInterval(() => {
					countdown.value--
					if (countdown.value <= 0) clearInterval(timer)
				}, 1000)
			} else {
				throw new Error(res.data?.message || '发送失败')
			}
		} catch (error) {
			// 统一处理错误
			let errorMsg = '验证码发送失败'
			if (error.errMsg && error.errMsg.includes('timeout')) {
				errorMsg = '请求超时，请检查网络连接'
			} else if (error.errMsg && error.errMsg.includes('request:fail')) {
				errorMsg = '无法连接到服务器，请稍后再试'
			} else if (error.message) {
				errorMsg = error.message
			}
			console.error(errorMsg);
			uni.showToast({
				title: errorMsg,
				icon: 'none'
			});

			uni.showToast({
				title: errorMsg,
				icon: 'none',
				duration: 3000
			})

			// 重置倒计时按钮状态
			countdown.value = 0
		}
	}

	// 账号密码登录
	const loginWithPassword = async () => {
		if (!username.value || !password.value) {
			uni.showToast({
				title: '请输入用户名和密码',
				icon: 'none'
			})
			return
		}

		try {
			console.log('开始登录请求...')
			const res = await uni.request({
				url: getFullUrl('/user/login'),
				method: 'POST',
				data: {
					phone: username.value,
					password: password.value
				},
				header: {
					'Content-Type': 'application/json'
				},
				timeout: 5000
			})

			console.log('登录响应:', res)

			if (res.statusCode === 200) {
				const result = res.data
				if (!result.success) {
					throw new Error(result.errorMsg || '登录失败')
				}
				
				// 获取token
				const token = result.data
				if (!token) {
					throw new Error('未获取到token')
				}
				
				console.log('获取到的token:', token)
				
				// 存储token
				uni.setStorageSync('token', token)
				
				uni.showToast({
					title: '登录成功',
					icon: 'success'
				})

				// 初始化WebSocket连接
				wsClient.connect()
				
				setTimeout(() => {
					uni.switchTab({
						url: '/pages/index/index'
					})
				}, 1500)
			} else {
				throw new Error('服务器错误')
			}
		} catch (error) {
			console.error('登录错误:', error)
			let errorMsg = '登录失败'
			if (error.errMsg && error.errMsg.includes('timeout')) {
				errorMsg = '请求超时，请检查网络连接'
			} else if (error.errMsg && error.errMsg.includes('request:fail')) {
				errorMsg = '无法连接到服务器，请稍后再试'
			} else if (error.message) {
				errorMsg = error.message
			}

			uni.showToast({
				title: errorMsg,
				icon: 'none',
				duration: 3000
			})
		}
	}

	// 短信验证码登录
	const loginWithSms = async () => {
		if (!phone.value || !code.value) {
			uni.showToast({
				title: '请输入手机号和验证码',
				icon: 'none'
			})
			return
		}

		try {
			const res = await uni.request({
				url: getFullUrl('/user/login'),
				method: 'POST',
				data: {
					phone: phone.value,
					code: code.value
				},
				header: {
					'Content-Type': 'application/json'
				},
				timeout: 5000
			})

			if (res.statusCode === 200) {
				const result = res.data
				if (!result.success) {
					throw new Error(result.errorMsg || '登录失败')
				}
				
				// 获取token
				const token = result.data
				if (!token) {
					throw new Error('未获取到token')
				}
				
				// 存储token
				uni.setStorageSync('token', token)
				
				uni.showToast({
					title: '登录成功',
					icon: 'success'
				})

				// 初始化WebSocket连接
				wsClient.connect()
				
				setTimeout(() => {
					uni.switchTab({
						url: '/pages/index/index'
					})
				}, 1500)
			} else {
				throw new Error('服务器错误')
			}
		} catch (error) {
			let errorMsg = '登录失败'
			if (error.errMsg && error.errMsg.includes('timeout')) {
				errorMsg = '请求超时，请检查网络连接'
			} else if (error.errMsg && error.errMsg.includes('request:fail')) {
				errorMsg = '无法连接到服务器，请稍后再试'
			} else if (error.message) {
				errorMsg = error.message
			}

			uni.showToast({
				title: errorMsg,
				icon: 'none',
				duration: 3000
			})
		}
	}

	// 跳转注册页面保持不变
	const goToRegister = () => {
		uni.navigateTo({
			url: '/pages/register/register'
		})
	}

	onLoad(() => {
		//phone.value = '13800138000'
	})

	// 登录成功后的处理
	const handleLoginSuccess = (token) => {
		// 1. 保存token
		uni.setStorageSync('token', token)
		
		// 2. 初始化WebSocket连接
		wsClient.connect()
		
		// 3. 跳转到首页
		uni.switchTab({
			url: '/pages/index/index'
		})
	}

	// 显示短信验证码登录提示
	const showSmsModal = () => {
		uni.showModal({
			title: '提示',
			content: '短信验证码正在施工中',
			confirmText: '我知道了',
			showCancel: false,
			success: (res) => {
				if (res.confirm) {
					switchLoginType('password')
				}
			}
		})
	}
</script>

<style scoped>
	.login-container {
		padding: 40px 20px;
		background-color: #f5f5f5;
		height: 100vh;
	}

	.login-header {
		text-align: center;
		margin-bottom: 40px;
	}

	.title {
		font-size: 28px;
		font-weight: bold;
		color: #333;
	}

	.login-methods {
		display: flex;
		justify-content: center;
		margin-bottom: 30px;
	}

	.login-methods text {
		padding: 10px 20px;
		font-size: 16px;
		color: #666;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.login-methods .active {
		color: #e43d33;
		border-bottom: 2px solid #e43d33;
		font-weight: bold;
	}

	.login-form {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 100%;
		max-width: 400px;
		margin: 0 auto;
		position: relative;
		min-height: 300px;
	}

	.login-form > view {
		width: 100%;
		position: absolute;
		top: 0;
		left: 0;
		opacity: 0;
		visibility: hidden;
		transition: all 0.3s ease;
		transform: translateY(20px);
	}

	.login-form > view.v-show {
		opacity: 1;
		visibility: visible;
		transform: translateY(0);
	}

	.login-form input {
		width: 100%;
		padding: 15px;
		margin-bottom: 20px;
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		font-size: 16px;
		background-color: #fff;
		transition: all 0.3s ease;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
		height: 50px;
		box-sizing: border-box;
	}

	.login-form input:focus {
		border-color: #e43d33;
		box-shadow: 0 2px 8px rgba(228, 61, 51, 0.1);
		outline: none;
	}

	.code-input {
		width: 100%;
		display: flex;
		gap: 10px;
		margin-bottom: 20px;
	}

	.code-input input {
		flex: 1;
		margin: 0;
	}

	.get-code-btn {
		width: 140px;
		padding: 0;
		background-color: #fff;
		color: #e43d33;
		border: 1px solid #e43d33;
		border-radius: 8px;
		font-size: 14px;
		height: 50px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.3s ease;
	}

	.get-code-btn:not([disabled]):active {
		transform: scale(0.98);
	}

	.get-code-btn[disabled] {
		color: #999;
		border-color: #ccc;
		background-color: #f5f5f5;
	}

	.login-btn {
		width: 100%;
		padding: 15px;
		background-color: #e43d33;
		color: #fff;
		border: none;
		border-radius: 8px;
		font-size: 16px;
		font-weight: 500;
		margin-top: 20px;
		transition: all 0.3s ease;
		box-shadow: 0 2px 4px rgba(228, 61, 51, 0.25);
		height: 50px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.login-btn:active {
		transform: scale(0.98);
		box-shadow: 0 1px 2px rgba(228, 61, 51, 0.2);
	}

	.register-link {
		text-align: center;
		margin-top: 20px;
		font-size: 14px;
	}

	.register-link text {
		color: #e43d33;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.register-link text:active {
		opacity: 0.8;
	}

	.third-party-login {
		margin-top: 40px;
		text-align: center;
	}

	.third-party-login text {
		color: #999;
		font-size: 14px;
		display: block;
		margin-bottom: 15px;
	}

	.third-party-icons {
		display: flex;
		justify-content: center;
		gap: 20px;
	}

	.icon {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		transition: all 0.3s ease;
	}

	.icon:active {
		transform: scale(0.95);
	}
</style>