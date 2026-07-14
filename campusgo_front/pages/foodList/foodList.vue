<template>
  <view class="food-list-container">
    <!-- 筛选栏 - 重新设计UI -->
    <view class="filter-bar">
      <view 
        class="filter-item"
        v-for="(filter, index) in filters"
        :key="index"
        @click="toggleFilter(index)"
        :class="{ active: activeFilter === index }"
      >
        <!-- 在人气左侧添加图标 -->
        <image v-if="index === 0" class="filter-icon filter-icon-left" src="/static/rq.png" mode="aspectFit"></image>
        <text>{{ filter.name }}</text>
        <uni-icons 
          :type="filter.expanded ? 'arrowup' : 'arrowdown'" 
          size="20"
          :color="activeFilter === index ? '#07C160' : '#666'"
        ></uni-icons>
        <!-- 在评分右侧添加图标 -->
        <image v-if="index === 1" class="filter-icon filter-icon-right" src="/static/pf.png" mode="aspectFit"></image>
        
        <!-- 下拉菜单 -->
        <view class="dropdown" v-if="filter.expanded">
          <view 
            class="dropdown-item"
            v-for="(option, i) in filter.options"
            :key="i"
            @click.stop="selectOption(index, i)"
            :class="{ selected: filter.selectedIndex === i }"
          >
            {{ option }}
          </view>
        </view>
      </view>
    </view>

    <!-- 美食列表 -->
    <scroll-view 
      class="food-items"
      scroll-y
      @scrolltolower="loadMore"
      :refresher-enabled="true"
      :refresher-triggered="isRefreshing"
      @refresherrefresh="onRefresh"
    >
      <view
        class="food-item"
        v-for="(item, index) in filteredList"
        :key="index"
        @click="goToDetail(item.id)"
      >
        <view class="food-image">
          <image :src="item.image" mode="aspectFill"></image>
		  
          <view class="rating-tag">
            <uni-icons type="star-filled" size="14" color="#FFD700"></uni-icons>
            <text>{{ item.rating }}</text>
          </view>
        </view>

        <view class="food-details">
          <view class="food-name">{{ item.name }}</view>
          <view class="review-count">
            <uni-icons type="compose" size="12" color="#999"></uni-icons>
            {{ item.comments }}条评价
          </view>
		  
          <view class="price">
            <uni-icons type="wallet-filled" size="12" color="#FF6B00"></uni-icons>
            ￥{{ item.avgPrice }}/人
          </view>
		  
          <view class="address">
            <uni-icons type="location" size="12" color="#666"></uni-icons>
            {{ item.address }}
          </view>
        </view>
      </view>
      
      <!-- 加载更多提示 -->
      <view class="loading-more" v-if="isLoading">
        <text>加载中...</text>
      </view>
      <view class="no-more" v-if="noMore">
        <text>没有更多了</text>
      </view>
    </scroll-view>
  </view>
</template>


<script setup>
import { ref, computed, onMounted } from 'vue';
import { getFullUrl } from '../../config/api.config'

const foodList = ref([]);
const currentPage = ref(1);
const isLoading = ref(false);
const noMore = ref(false);
const isRefreshing = ref(false);
const typeId = ref(1);
const token = uni.getStorageSync('token');

const getFoodList = async (page = 1, isRefresh = false) => {
  if (isLoading.value) return;
  isLoading.value = true;
  
  try {
    console.log('开始请求数据...', page);
    const res = await uni.request({
      url: getFullUrl('/shop/of/type'),
      method: 'GET',
      data: {
        typeId: typeId.value,
        current: page
      },
      header: {
		'authorization': token
      }
    });

    console.log('请求响应:', res);
    
    if (res.statusCode === 200 && res.data.success) {
      console.log('后端返回的数据:', res.data.data);
      const newData = res.data.data.map(shop => ({
        id: shop.id,
        name: shop.name,
        image: shop.images ? shop.images.split(',')[0] : '/static/loading.png',
        comments: shop.comments || 0,
        avgPrice: shop.avgPrice || 0,
        address: shop.address || '暂无地址',
        rating: (shop.score / 10).toFixed(1) || 0,
        distance: 0,
        category: shop.area || '其他'
      }));

      if (isRefresh) {
        foodList.value = newData;
      } else {
        foodList.value = [...foodList.value, ...newData];
      }

      // 判断是否还有更多数据
      noMore.value = newData.length < 5;
    } else {
      console.error('请求失败:', res.data);
      uni.showToast({
        title: '获取数据失败',
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
    isRefreshing.value = false;
  }
};

const goBack = () => {
  uni.navigateBack();
};

onMounted(() => {
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  const options = currentPage.$page?.options || {};
  
  typeId.value = options.typeId ? parseInt(options.typeId) : 1;
  
  getFoodList(1);
});

// 筛选器数据
const filters = ref([
  // {
  //   name: '美食',
  //   expanded: false,
  //   selectedIndex: 0,
  //   options: ['全部', '川菜', '粤菜', '湘菜', '东北菜', '江浙菜', '火锅', '日料', '西餐'],
  //   key: 'category'
  // },
  // {
  //   name: '距离',
  //   expanded: false,
  //   selectedIndex: 0,
  //   options: ['全部', '1km内', '3km内', '5km内'],
  //   key: 'distance'
  // },
  {
    name: '人气榜',
    expanded: false,
    selectedIndex: 0,
    options: ['默认排序', '评价最多', '人气最高'], // 保留人气选项
    key: 'comments'
  },
  {
    name: '评分榜',
    expanded: false,
    selectedIndex: 0,
    options: ['全部', '4.5分以上', '4.0分以上', '3.5分以上'],
    key: 'rating'
  }
]);

const activeFilter = ref(null);

// 切换筛选器展开状态
const toggleFilter = (index) => {
  filters.value.forEach((filter, i) => {
    filter.expanded = i === index ? !filter.expanded : false;
  });
  activeFilter.value = filters.value[index].expanded ? index : null;
};

// 选择筛选选项
const selectOption = (filterIndex, optionIndex) => {
  filters.value[filterIndex].selectedIndex = optionIndex;
  filters.value[filterIndex].expanded = false;
  activeFilter.value = null;
};

// 根据筛选条件过滤列表
const filteredList = computed(() => {
  return foodList.value.filter(item => {
    // 移除美食筛选逻辑
    // if (filters.value[0].selectedIndex > 0) { ... }
    
    // 移除距离筛选逻辑
    // if (filters.value[1].selectedIndex > 0) { ... }
    
    // 评分筛选 (现在索引是 1)
    if (filters.value[1].selectedIndex > 0) {
      const minRating = parseFloat(filters.value[1].options[filters.value[1].selectedIndex]);
      if (item.rating < minRating) return false;
    }
    
    return true;
  }).sort((a, b) => {
    // 人气排序 (现在索引是 0)
    if (filters.value[0].selectedIndex > 0) {
      const sortBy = filters.value[0].options[filters.value[0].selectedIndex];
      if (sortBy === '评价最多') return b.comments - a.comments;
      // 移除收藏最多
      if (sortBy === '人气最高') return (b.comments * 0.6 + b.rating * 0.4) - (a.comments * 0.6 + a.rating * 0.4);
    }
    return 0; // 默认不排序
  });
});

// 跳转到详情页
const goToDetail = (id) => {
  console.log('跳转到餐厅详情:', id);
  uni.navigateTo({ url: `/pages/foodShop/detail?id=${id}` });
};

// 加载更多
const loadMore = () => {
  if (isLoading.value || noMore.value) return;
  currentPage.value += 1;
  getFoodList(currentPage.value);
};

// 下拉刷新
const onRefresh = () => {
  isRefreshing.value = true;
  currentPage.value = 1;
  noMore.value = false;
  getFoodList(1, true);
};
</script>

<style lang="scss">
.food-list-container {
  background-color: #f8f8f8;
  min-height: 100vh;
  padding-bottom: 20px;
}

.filter-bar {
  display: flex;
  justify-content: space-evenly;
  padding: 8px 20px; /* 减小上下内边距 */
  background-color: white;
  z-index: 10;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  
  .filter-item {
    display: flex;
    align-items: center;
    color: black;
    font-size: 15px; /* 减小字体大小 */
    font-weight: 500;
    padding: 6px 12px; /* 减小内边距 */
    border-radius: 16px; /* 减小圆角 */
    transition: all 0.3s;
    position: relative;
    
    .filter-icon {
      width: 18px; /* 减小图标大小 */
      height: 18px;
    }
    .filter-icon-left {
      margin-right: 4px; /* 减小右边距 */
    }
    .filter-icon-right {
      margin-left: 4px; /* 减小左边距 */
    }
    
    &.active {
      color: #07C160;
      background-color: rgba(7, 193, 96, 0.1);
    }
    
    .dropdown {
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      width: 120px; /* 减小下拉菜单宽度 */
      background-color: white;
      border-radius: 8px; /* 减小圆角 */
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
      margin-top: 4px; /* 减小上边距 */
      overflow: hidden;
      z-index: 100;
      animation: fadeIn 0.3s ease;
      
      .dropdown-item {
        padding: 8px 12px; /* 减小内边距 */
        font-size: 13px; /* 减小字体大小 */
        color: #666;
        border-bottom: 1px solid #f0f0f0;
        transition: all 0.2s;
        
        &:last-child {
          border-bottom: none;
        }
        
        &:hover, &.selected {
          background-color: #f8f8f8;
          color: #07C160;
        }
      }
    }
  }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translate(-50%, 10px); }
  to { opacity: 1; transform: translate(-50%, 0); }
}

.loading-more, .no-more {
  text-align: center;
  padding: 15px 0;
  color: #999;
  font-size: 14px;
}

.food-items {
  height: calc(100vh - 100px); /* 调整高度以适应新的filter-bar高度 */
  padding: 15px;
}

.food-item {
  display: flex;
  margin-bottom: 15px;
  padding: 15px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s, box-shadow 0.3s;
  
  &:active {
    transform: scale(0.98);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  }
  
  .food-image {
    width: 100px;
    height: 100px;
    border-radius: 8px;
    overflow: hidden;
    position: relative;
    flex-shrink: 0;
    
    image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .rating-tag {
      position: absolute;
      bottom: 8px;
      left: 8px;
      background-color: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 12px;
      display: flex;
      align-items: center;
      backdrop-filter: blur(2px);
      
      text {
        margin-left: 3px;
      }
    }
  }
  
  .food-details {
    flex: 1;
    margin-left: 15px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    
    .food-name {
      font-size: 17px;
      font-weight: bold;
      color: #333;
      margin-bottom: 6px;
      display: -webkit-box;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    
    .review-count, .price, .address {
      display: flex;
      align-items: center;
      font-size: 13px;
      color: #666;
      margin-bottom: 5px;
      
      .uni-icons {
        margin-right: 6px;
      }
    }
    
    .price {
      color: #FF6B00;
      font-weight: 500;
    }
  }
}
</style>