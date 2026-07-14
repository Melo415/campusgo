<template>
	<view class="shop-detail-container">
		<!-- 返回按钮 -->
		<!-- <view class="nav-bar">
			<uni-icons type="back" size="24" color="#333" @click="goBack"></uni-icons>
		</view> -->

		<!-- 商铺图片 -->
		<view class="shop-image">
			<image :src="shopInfo.images[0]" mode="aspectFill"></image>
		</view>

		<!-- 商铺基本信息 -->
		<view class="shop-info">
			<view class="shop-name">{{ shopInfo.name || '开罗日料'}}</view>
			
			<view class="rating-row">
				<view class="rating">
					<uni-icons type="star-filled" size="16" color="#FFD700"></uni-icons>
					<text>{{ shopInfo.rating || 5 }}</text>
				</view>
				<view class="review-count">
					<uni-icons type="compose" size="14" color="#999"></uni-icons>
					<text>{{ shopInfo.comments || 99 }}条评价</text>
				</view>
				<view class="price">
					<uni-icons type="wallet-filled" size="14" color="#FF6B00"></uni-icons>
					<text>￥{{ shopInfo.avgPrice || 88 }}/人</text>
				</view>
			</view>

			<view class="address">
				<uni-icons type="location" size="14" color="#666"></uni-icons>
				<text>{{ shopInfo.address || '平壤' }}</text>
			</view>
		</view>

		<!-- 评论区域 -->
		<view class="reviews-section">
			<view class="section-title">用户评价 ({{ rootComments.length }})</view>
			<view class="review-list">
				<view class="review-item" v-for="(comment, index) in rootComments" :key="index">
					<view class="review-header">
						<image 
							:src="comment.icon ? getFullImageUrl(comment.icon) : '/static/default-avatar.png'" 
							class="user-avatar" 
							mode="aspectFill"
							@click="goToUserInfo(comment.userId)"
						></image>
						<view class="review-info">
							<view class="user-name" @click="goToUserInfo(comment.userId)">{{ comment.nickName }}</view>
							<view class="review-time">{{ formatTime(comment.createTime) }}</view>
						</view>
					</view>
					<view class="review-content">
						<text v-if="comment.targetNickName" class="reply-to">回复 {{ comment.targetNickName }}：</text>
						{{ comment.content }}
					</view>
					<view class="review-actions">
						<text class="reply-btn" @click="showReplyInput(comment)">回复</text>
					</view>
					
					<!-- 子评论列表 -->
					<view v-if="getSubComments(comment.id).length > 0" class="sub-comments">
						<view v-for="(subComment, subIndex) in getSubComments(comment.id)" :key="subIndex" class="sub-comment-item">
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
								<text v-if="subComment.answerId" class="reply-to" @click="goToUserInfo(getReplyToUserId(subComment))">
									回复 {{ getReplyToName(subComment) }}：
								</text>
								{{ subComment.content }}
							</view>
							<view class="review-actions">
								<text class="reply-btn" @click="showReplyInput(subComment)">回复</text>
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

		<!-- 加载状态 -->
		<view class="loading" v-if="isLoading">
			<text>加载中...</text>
		</view>
	</view>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { getFullUrl } from '../../config/api.config';

const shopId = ref('');
const token = uni.getStorageSync('token');
const commentContent = ref('');
const comments = ref([]);
const currentReplyComment = ref(null);
const replyPlaceholder = ref('说点什么...');

const shopInfo = ref({
	name: '',
	images: ['/static/loading.png'],
	rating: 0,
	comments: 0,
	avgPrice: 0,
	address: ''
});
const isLoading = ref(true);

// 获取完整图片URL
const getFullImageUrl = (url) => {
	if (!url) return '/static/default-avatar.png';
	if (url.startsWith('http')) return url;
	if (url.startsWith('/static')) return url;
	return '/static/images/' + url;
};

// 格式化时间
const formatTime = (time) => {
	if (!time) return '';
	let date;
	if (Array.isArray(time) && time.length >= 6) {
		date = new Date(time[0], time[1] - 1, time[2], time[3], time[4], time[5]);
	} else {
		date = new Date(time);
	}
	if (isNaN(date.getTime())) {
		console.error('Invalid time format for date:', time);
		return '日期无效';
	}
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

// 获取商铺详情
const getShopDetail = async () => {
	try {
		const res = await uni.request({
			url: getFullUrl(`/shop/${shopId.value}`),
			method: 'GET',
			header: {
				'authorization': token
			}
		});

		if (res.statusCode === 200 && res.data.success) {
			const data = res.data.data;
			shopInfo.value = {
				name: data.name,
				images: data.images ? [data.images.split(',')[0]] : ['/static/loading.png'],
				rating: (data.score / 10).toFixed(1),
				comments: data.comments || 0,
				avgPrice: data.avgPrice || 0,
				address: data.address || '暂无地址'
			};
			// 设置导航栏标题为商铺名称
			uni.setNavigationBarTitle({
				title: data.name || '商铺详情'
			});
			console.log('商铺信息:', shopInfo.value);
		} else {
			uni.showToast({
				title: '获取商铺信息失败',
				icon: 'none'
			});
		}
	} catch (error) {
		console.error('请求出错:', error);
		uni.showToast({
			title: '网络请求失败',
			icon: 'none'
		});
	} finally {
		isLoading.value = false;
	}
};

// 获取用户信息
const getUserInfo = async (userId) => {
	try {
		const res = await uni.request({
			url: getFullUrl(`/user/${userId}`),
			method: 'GET',
			header: {
				'authorization': token
			}
		});
		
		if (res.statusCode === 200 && res.data.success) {
			return res.data.data;
		}
		return null;
	} catch (error) {
		console.error('获取用户信息失败:', error);
		return null;
	}
};

// 获取评论列表
const getComments = async () => {
	try {
		const res = await uni.request({
			url: getFullUrl(`/shop/comment/${shopId.value}`),
			method: 'GET',
			header: {
				'authorization': token
			}
		});
		
		if (res.statusCode === 200 && res.data.success) {
			const commentsData = res.data.data;
			
			// 处理每条评论的用户信息
			for (const comment of commentsData) {
				// 获取评论作者信息
				const userInfo = await getUserInfo(comment.userId);
				if (userInfo) {
					comment.nickName = userInfo.nickName;
					comment.icon = userInfo.icon;
				}
				
				// 获取被回复者信息
				if (comment.targetUserId) {
					const targetUserInfo = await getUserInfo(comment.targetUserId);
					if (targetUserInfo) {
						comment.targetNickName = targetUserInfo.nickName;
					}
				}
			}
			
			comments.value = commentsData;
			console.log('评论列表:', comments.value);
		}
	} catch (error) {
		console.error('获取评论列表失败:', error);
		uni.showToast({
			title: '获取评论列表失败',
			icon: 'none'
		});
	}
};

// 显示回复输入框
const showReplyInput = (comment) => {
	currentReplyComment.value = comment;
	replyPlaceholder.value = `回复 ${comment.nickName}：`;
	// 滚动到输入框
	uni.pageScrollTo({
		scrollTop: 999999,
		duration: 300
	});
};

// 提交评论
const submitComment = async () => {
	if (!commentContent.value.trim()) {
		uni.showToast({
			title: '请输入评论内容',
			icon: 'none'
		});
		return;
	}

	try {
		const token = uni.getStorageSync('token');
		if (!token) {
			uni.showToast({
				title: '请先登录',
				icon: 'none'
			});
			setTimeout(() => {
				uni.navigateTo({
					url: '/pages/login/login'
				});
			}, 1500);
			return;
		}

		const commentData = {
			shopId: shopId.value,
			content: commentContent.value
		};

		// 如果是回复评论
		if (currentReplyComment.value) {
			commentData.parentId = currentReplyComment.value.parentId || currentReplyComment.value.id;
			commentData.answerId = currentReplyComment.value.id;
			commentData.targetUserId = currentReplyComment.value.userId;
		}

		const res = await uni.request({
			url: getFullUrl('/shop/comment'),
			method: 'POST',
			header: {
				'authorization': token
			},
			data: commentData
		});

		if (res.statusCode === 200 && res.data.success) {
			uni.showToast({
				title: '评论成功',
				icon: 'success'
			});
			// 清空输入框和回复状态
			commentContent.value = '';
			currentReplyComment.value = null;
			replyPlaceholder.value = '说点什么...';
			// 重新获取评论列表
			await getComments();
		} else {
			console.error('评论失败:', res.data);
			uni.showToast({
				title: res.data.message || '评论失败',
				icon: 'none'
			});
		}
	} catch (error) {
		console.error('评论失败:', error);
		uni.showToast({
			title: '评论失败',
			icon: 'none'
		});
	}
};

// 跳转到用户信息页面
const goToUserInfo = (userId) => {
	if (!userId) {
		uni.showToast({
			title: '用户信息错误',
			icon: 'none'
		});
		return;
	}
	
	uni.navigateTo({
		url: `/pages/userInfo/userInfo?id=${userId}`,
		success: () => {
			console.log('跳转到用户信息页面成功');
		},
		fail: (err) => {
			console.error('跳转到用户信息页面失败:', err);
			uni.showToast({
				title: '跳转失败',
				icon: 'none'
			});
		}
	});
};

// 返回上一页
const goBack = () => {
	uni.navigateBack();
};

// 获取一级评论列表
const rootComments = computed(() => {
	return comments.value.filter(comment => comment.parentId === 0);
});

// 获取子评论列表
const getSubComments = (parentId) => {
	return comments.value.filter(comment => comment.parentId === parentId);
};

// 获取被回复者的昵称
const getReplyToName = (comment) => {
	if (!comment.answerId) return '';
	// 在评论列表中查找被回复的评论
	const targetComment = comments.value.find(c => c.id === comment.answerId);
	return targetComment ? targetComment.nickName : '';
};

// 获取被回复者的用户ID
const getReplyToUserId = (comment) => {
	if (!comment.answerId) return '';
	// 在评论列表中查找被回复的评论
	const targetComment = comments.value.find(c => c.id === comment.answerId);
	return targetComment ? targetComment.userId : '';
};

onMounted(() => {
	const pages = getCurrentPages();
	const currentPage = pages[pages.length - 1];
	const options = currentPage.$page?.options || {};
	
	shopId.value = options.id;
	if (shopId.value) {
		getShopDetail();
		getComments(); // 获取评论列表
	} else {
		uni.showToast({
			title: '商铺ID不存在',
			icon: 'none'
		});
	}
});
</script>

<style lang="scss">
.shop-detail-container {
	min-height: 100vh;
	background-color: #f8f8f8;
	padding-bottom: 60px;
}

.nav-bar {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	padding: 10px 15px;
	background-color: rgba(255, 255, 255, 0.9);
	z-index: 100;
	backdrop-filter: blur(10px);
}

.shop-image {
	width: 100%;
	height: 300px;
	overflow: hidden;
	
	image {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
}

.shop-info {
	background-color: white;
	padding: 20px;
	margin-top: -20px;
	border-radius: 20px 20px 0 0;
	box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.05);
	
	.shop-name {
		font-size: 24px;
		font-weight: bold;
		color: #333;
		margin-bottom: 10px;
		padding-top: 10px;
		position: relative;
		
	}
	
	.rating-row {
		display: flex;
		align-items: center;
		margin-bottom: 12px;
		
		.rating, .review-count, .price {
			display: flex;
			align-items: center;
			margin-right: 20px;
			
			.uni-icons {
				margin-right: 4px;
			}
			
			text {
				font-size: 14px;
				color: #666;
			}
		}
		
		.rating text {
			color: #FFD700;
			font-weight: 500;
		}
		
		.price text {
			color: #FF6B00;
			font-weight: 500;
		}
	}
	
	.address {
		display: flex;
		align-items: center;
		font-size: 14px;
		color: #666;
		
		.uni-icons {
			margin-right: 6px;
		}
	}
}

.reviews-section {
	background-color: white;
	margin-top: 10px;
	padding: 20px;
	
	.section-title {
		font-size: 18px;
		font-weight: bold;
		color: #333;
		margin-bottom: 15px;
		display: flex;
		align-items: center;
		
		&::before {
			content: '';
			display: inline-block;
			width: 3px;
			height: 15px;
			background-color: #2979ff;
			margin-right: 5px;
			border-radius: 1.5px;
		}
	}
	
	.review-list {
		.review-item {
			padding: 15px 0;
			border-bottom: 1px solid #eee;
			
			&:last-child {
				border-bottom: none;
			}
			
			.review-header {
				display: flex;
				align-items: center;
				margin-bottom: 10px;
				
				.user-avatar {
					width: 40px;
					height: 40px;
					border-radius: 50%;
					margin-right: 10px;
				}
				
				.review-info {
					flex: 1;
					
					.user-name {
						font-size: 16px;
						color: #333;
						font-weight: 500;
					}
					
					.review-time {
						font-size: 12px;
						color: #999;
						margin-top: 4px;
					}
				}
			}
			
			.review-content {
				font-size: 14px;
				color: #666;
				line-height: 1.5;
				padding-left: 50px;
				margin-bottom: 10px;
				
				.reply-to {
					color: #2979ff;
					margin-right: 5px;
				}
			}

			.review-actions {
				padding-left: 50px;
				margin-bottom: 10px;
				
				.reply-btn {
					display: inline-block;
					font-size: 12px;
					color: #666;
					padding: 4px 12px;
					background-color: #f5f5f5;
					border-radius: 10px;
					
					&:active {
						opacity: 0.7;
					}
				}
			}
		}
	}
}

.sub-comments {
	margin-left: 20px;
	padding-left: 20px;
	border-left: 1px solid #f5f5f5;
	
	.sub-comment-item {
		padding: 10px 0;
		border-bottom: 1px solid #f5f5f5;
		
		&:last-child {
			border-bottom: none;
		}
		
		.sub-comment-header {
			display: flex;
			align-items: center;
			margin-bottom: 8px;
			
			.sub-comment-avatar {
				width: 30px;
				height: 30px;
				border-radius: 50%;
				margin-right: 8px;
			}
			
			.sub-comment-info {
				display: flex;
				flex-direction: column;
				
				.sub-comment-name {
					font-size: 14px;
					color: #333;
					font-weight: 500;
				}
				
				.sub-comment-time {
					font-size: 12px;
					color: #999;
					margin-top: 2px;
				}
			}
		}
		
		.sub-comment-content {
			font-size: 14px;
			color: #666;
			line-height: 1.4;
			padding-left: 38px;
			margin-bottom: 8px;
			
			.reply-to {
				color: #2979ff;
				margin-right: 5px;
				cursor: pointer;
				
				&:active {
					opacity: 0.7;
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
	padding: 10px 15px;
	display: flex;
	align-items: center;
	box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
	
	.comment-input {
		flex: 1;
		height: 36px;
		background-color: #f5f5f5;
		border-radius: 18px;
		padding: 0 15px;
		font-size: 14px;
		margin-right: 10px;
	}
	
	.submit-btn {
		width: 60px;
		height: 36px;
		background-color: #2979ff;
		color: #fff;
		border-radius: 18px;
		font-size: 14px;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		
		&:active {
			opacity: 0.8;
		}
	}
}

.loading {
	text-align: center;
	padding: 20px;
	color: #999;
	font-size: 14px;
}
</style>
