<template>
	<view class="register-container">
		<view class="register-header">
			<text class="title">校内Go</text>
			<text class="subtitle">欢迎注册</text>
		</view>
		<view class="register-form">
			<input type="text" placeholder="请输入手机号" v-model="phone" />
			<input type="password" placeholder="请设置密码" v-model="password" />
			<input type="password" placeholder="请确认密码" v-model="confirmPassword" />
			<button class="register-btn" @click="register">立即注册</button>
		</view>
		
		<view class="login-link">
			<text @click="goToLogin">已有账号？去登录</text>
		</view>
	</view>
</template>

<script setup>
	import { getFullUrl } from '../../config/api.config'
	import {
		ref
	} from 'vue'

	const phone = ref('')
	const password = ref('')
	const confirmPassword = ref('')

	// 注册
	const register = async () => {
		// 表单验证
		if (!phone.value || !password.value || !confirmPassword.value) {
			uni.showToast({
				title: '请填写完整信息',
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

		// 验证密码
		if (password.value.length < 6) {
			uni.showToast({
				title: '密码长度不能小于6位',
				icon: 'none'
			})
			return
		}

		// 验证两次密码是否一致
		if (password.value !== confirmPassword.value) {
			uni.showToast({
				title: '两次输入的密码不一致',
				icon: 'none'
			})
			return
		}

		try {
			const res = await uni.request({
				url: getFullUrl('/user/register'),
				method: 'POST',
				data: {
					phone: phone.value,
					password: password.value
				},
				header: {
					'Content-Type': 'application/json'
				},
				timeout: 5000
			})

			// 解析响应数据
			const result = res.data

			// 检查业务状态
			if (res.statusCode === 200 && result.success) {
				// 只有当 success 为 true 时才是真正的注册成功
				uni.showToast({
					title: '注册成功',
					icon: 'success'
				})

				// 注册成功后跳转到登录页面
				setTimeout(() => {
					uni.navigateTo({
						url: '/pages/login/login'
					})
				}, 1500)
			} else {
				// 显示后端返回的具体错误信息
				throw new Error(result.errorMsg || '注册失败')
			}
		} catch (error) {
			let errorMsg = '注册失败'
			if (error.errMsg && error.errMsg.includes('timeout')) {
				errorMsg = '请求超时，请检查网络连接'
			} else if (error.errMsg && error.errMsg.includes('request:fail')) {
				errorMsg = '无法连接到服务器，请稍后再试'
			} else if (error.message) {
				errorMsg = error.message // 这里会显示后端返回的 errorMsg，比如"该手机号已注册"
			}

			uni.showToast({
				title: errorMsg,
				icon: 'none',
				duration: 3000
			})
		}
	}

	// 跳转到登录页面
	const goToLogin = () => {
		uni.navigateTo({
			url: '/pages/login/login'
		})
	}
</script>

<style scoped>
	.register-container {
		padding: 40px 20px;
		background-color: #f5f5f5;
		height: 100vh;
	}

	.register-header {
		text-align: center;
		margin-bottom: 40px;
	}

	.title {
		font-size: 28px;
		font-weight: bold;
		color: #333;
		display: block;
		margin-bottom: 10px;
	}

	.subtitle {
		font-size: 16px;
		color: #666;
	}

	.register-form {
		width: 100%;
		max-width: 400px;
		margin: 0 auto;
	}

	.register-form input {
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

	.register-form input:focus {
	    border-color: #e43d33;
	    box-shadow: 0 2px 8px rgba(228, 61, 51, 0.1);
	}

	.register-btn {
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
		box-shadow: 0 2px 4px rgba(228, 61, 51, 0.2);
		height: 50px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.register-btn:active {
		transform: scale(0.98);
		box-shadow: 0 1px 2px rgba(228, 61, 51, 0.2);
	}

	.login-link {
		text-align: center;
		margin-top: 20px;
		font-size: 14px;
	}

	.login-link text {
		color: #e43d33;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.login-link text:active {
		opacity: 0.8;
	}
</style> 