"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const config_api_config = require("../../config/api.config.js");
if (!Array) {
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  _easycom_uni_icons2();
}
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
if (!Math) {
  _easycom_uni_icons();
}
const _sfc_main = {
  __name: "foodList",
  setup(__props) {
    const foodList = common_vendor.ref([]);
    const getFoodList = async () => {
      try {
        common_vendor.index.__f__("log", "at pages/foodList/foodList.vue:86", "开始请求数据...");
        const res = await common_vendor.index.request({
          url: config_api_config.getFullUrl("/shop/of/type"),
          method: "GET",
          data: {
            typeId: 1,
            current: 1
          },
          header: {
            "Content-Type": "application/json"
          }
        });
        common_vendor.index.__f__("log", "at pages/foodList/foodList.vue:99", "请求响应:", res);
        if (res.statusCode === 200 && res.data.success) {
          common_vendor.index.__f__("log", "at pages/foodList/foodList.vue:102", "后端返回的数据:", res.data.data);
          foodList.value = res.data.data.map((shop) => ({
            id: shop.id,
            name: shop.name,
            image: shop.images ? shop.images.split(",")[0] : "https://img.zcool.cn/community/01b7205d8b8b2ca8012187f8c5f2e0.jpg@1280w_1l_2o_100sh.jpg",
            // 默认图片
            comments: shop.comments || 0,
            avgPrice: shop.avgPrice || 0,
            address: shop.address || "暂无地址",
            rating: (shop.score / 10).toFixed(1) || 0,
            // 将score转换为评分
            distance: 0,
            // 暂时没有距离数据
            category: shop.area || "其他"
            // 使用area作为分类
          }));
          common_vendor.index.__f__("log", "at pages/foodList/foodList.vue:115", "转换后的数据:", foodList.value);
        } else {
          common_vendor.index.__f__("error", "at pages/foodList/foodList.vue:117", "请求失败:", res.data);
          common_vendor.index.showToast({
            title: "获取数据失败",
            icon: "none"
          });
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/foodList/foodList.vue:124", "请求出错:", error);
        common_vendor.index.showToast({
          title: "网络请求失败",
          icon: "none"
        });
      }
    };
    common_vendor.onMounted(() => {
      getFoodList();
    });
    const filters = common_vendor.ref([
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
        name: "人气榜",
        expanded: false,
        selectedIndex: 0,
        options: ["默认排序", "评价最多", "人气最高"],
        // 保留人气选项
        key: "comments"
      },
      {
        name: "评分榜",
        expanded: false,
        selectedIndex: 0,
        options: ["全部", "4.5分以上", "4.0分以上", "3.5分以上"],
        key: "rating"
      }
    ]);
    const activeFilter = common_vendor.ref(null);
    const toggleFilter = (index) => {
      filters.value.forEach((filter, i) => {
        filter.expanded = i === index ? !filter.expanded : false;
      });
      activeFilter.value = filters.value[index].expanded ? index : null;
    };
    const selectOption = (filterIndex, optionIndex) => {
      filters.value[filterIndex].selectedIndex = optionIndex;
      filters.value[filterIndex].expanded = false;
      activeFilter.value = null;
    };
    const filteredList = common_vendor.computed(() => {
      return foodList.value.filter((item) => {
        if (filters.value[1].selectedIndex > 0) {
          const minRating = parseFloat(filters.value[1].options[filters.value[1].selectedIndex]);
          if (item.rating < minRating)
            return false;
        }
        return true;
      }).sort((a, b) => {
        if (filters.value[0].selectedIndex > 0) {
          const sortBy = filters.value[0].options[filters.value[0].selectedIndex];
          if (sortBy === "评价最多")
            return b.comments - a.comments;
          if (sortBy === "人气最高")
            return b.comments * 0.6 + b.rating * 0.4 - (a.comments * 0.6 + a.rating * 0.4);
        }
        return 0;
      });
    });
    const goToDetail = (id) => {
      common_vendor.index.__f__("log", "at pages/foodList/foodList.vue:219", "跳转到餐厅详情:", id);
    };
    return (_ctx, _cache) => {
      return {
        a: common_vendor.f(filters.value, (filter, index, i0) => {
          return common_vendor.e({
            a: index === 0
          }, index === 0 ? {
            b: common_assets._imports_0$3
          } : {}, {
            c: common_vendor.t(filter.name),
            d: "1a129699-0-" + i0,
            e: common_vendor.p({
              type: filter.expanded ? "arrowup" : "arrowdown",
              size: "20",
              color: activeFilter.value === index ? "#07C160" : "#666"
            }),
            f: index === 1
          }, index === 1 ? {
            g: common_assets._imports_1$3
          } : {}, {
            h: filter.expanded
          }, filter.expanded ? {
            i: common_vendor.f(filter.options, (option, i, i1) => {
              return {
                a: common_vendor.t(option),
                b: i,
                c: common_vendor.o(($event) => selectOption(index, i), i),
                d: filter.selectedIndex === i ? 1 : ""
              };
            })
          } : {}, {
            j: index,
            k: common_vendor.o(($event) => toggleFilter(index), index),
            l: activeFilter.value === index ? 1 : ""
          });
        }),
        b: common_vendor.f(filteredList.value, (item, index, i0) => {
          return {
            a: item.image,
            b: "1a129699-1-" + i0,
            c: common_vendor.t(item.rating),
            d: common_vendor.t(item.name),
            e: "1a129699-2-" + i0,
            f: common_vendor.t(item.comments),
            g: "1a129699-3-" + i0,
            h: common_vendor.t(item.avgPrice),
            i: "1a129699-4-" + i0,
            j: common_vendor.t(item.address),
            k: index,
            l: common_vendor.o(($event) => goToDetail(item.id), index)
          };
        }),
        c: common_vendor.p({
          type: "star-filled",
          size: "14",
          color: "#FFD700"
        }),
        d: common_vendor.p({
          type: "compose",
          size: "12",
          color: "#999"
        }),
        e: common_vendor.p({
          type: "money",
          size: "14",
          color: "#FF6B00"
        }),
        f: common_vendor.p({
          type: "location",
          size: "12",
          color: "#666"
        })
      };
    };
  }
};
wx.createPage(_sfc_main);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/foodList/foodList.js.map
