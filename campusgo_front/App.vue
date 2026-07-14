<script>
	import { onMessageUpdate, getUnreadCount } from '@/utils/storage'
	import { wsClient } from '@/utils/websocket'

	export default {
		onLaunch: function() {
			console.warn('当前组件仅支持 uni_modules 目录结构 ，请升级 HBuilderX 到 3.1.0 版本以上！')
			console.log('App onLaunch')

			// 检查登录状态
			const token = uni.getStorageSync('token')
			if (token) {
				// 已登录，初始化WebSocket连接
				wsClient.connect()
				
				// 监听消息更新
				onMessageUpdate((unreadCount) => {
					console.log('收到消息更新通知, 未读数量:', unreadCount)
					this.updateMessageBadge(unreadCount)
				})
				
				// 初始检查未读消息
				this.updateMessageBadge()
			}
		},
		onShow: function() {
			console.log('App Show')

			// 每次切换到前台时检查未读消息
			const token = uni.getStorageSync('token')
			if (token) {
				const pages = getCurrentPages()
				const currentPage = pages[pages.length - 1]
				if (currentPage && this.isTabBarPage(currentPage.route)) {
					this.updateMessageBadge()
				}
			}
		},
		onHide: function() {
			console.log('App Hide')
		},
		methods: {
			// 判断是否为TabBar页面
			isTabBarPage(route) {
				const tabBarPages = [
					'pages/index/index',
					'pages/message/message',
					'pages/note/note',
					'pages/my/my'
				]
				return tabBarPages.includes(route)
			},
			updateMessageBadge(count) {
				const unreadCount = count ?? getUnreadCount()
				// 获取当前页面路径
				const pages = getCurrentPages()
				const currentPage = pages[pages.length - 1]
				
				if (!currentPage || !this.isTabBarPage(currentPage.route)) {
					return
				}

				if (unreadCount > 0) {
					uni.showTabBarRedDot({
						index: 1,
						success: () => {
							console.log('显示消息红点成功')
						},
						fail: (error) => {
							console.error('显示消息红点失败:', error)
						}
					})
				} else {
					uni.hideTabBarRedDot({
						index: 1,
						success: () => {
							console.log('隐藏消息红点成功')
						},
						fail: (error) => {
							console.error('隐藏消息红点失败:', error)
						}
					})
				}
			}
		}
	}
</script>

<style lang="scss">
	/*每个页面公共css */
	@import '@/uni_modules/uni-scss/index.scss';
	/* #ifndef APP-NVUE */
	@import '@/static/customicons.css';
	// 设置整个项目的背景色
	page {
		background-color: #f5f5f5;
	}

	/* #endif */
	.example-info {
		font-size: 14px;
		color: #333;
		padding: 10px;
	}
</style>
