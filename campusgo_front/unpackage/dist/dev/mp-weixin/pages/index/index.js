"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const config_api_config = require("../../config/api.config.js");
const baseURL = "/static/images";
const _sfc_main = {
  __name: "index",
  setup(__props) {
    const hotBlogs = common_vendor.ref([]);
    const currentPage = common_vendor.ref(1);
    const isLoading = common_vendor.ref(false);
    const hasMore = common_vendor.ref(true);
    const isRefreshing = common_vendor.ref(false);
    const scrollTop = common_vendor.ref(0);
    const minTime = common_vendor.ref(9223372036854775807n);
    const getFullImageUrl = (url) => {
      if (!url)
        return "/static/default-avatar.png";
      if (url.startsWith("http"))
        return url;
      if (url.startsWith("/static"))
        return url;
      const normalizedUrl = url.replace(/\\/g, "/");
      return baseURL + "/" + normalizedUrl;
    };
    const getHotBlogs = async (isLoadMore = false) => {
      if (isLoading.value || !isLoadMore && !hasMore.value)
        return;
      try {
        isLoading.value = true;
        const token = common_vendor.index.getStorageSync("token");
        const res = await common_vendor.index.request({
          url: `${config_api_config.getFullUrl("/blog/hot")}?lastScore=${minTime.value.toString()}`,
          method: "GET",
          header: {
            "authorization": token
          }
        });
        common_vendor.index.__f__("log", "at pages/index/index.vue:167", "API 响应:", res);
        if (res.statusCode === 200 && res.data.success) {
          const scrollResult = res.data.data;
          if (scrollResult && Array.isArray(scrollResult.list)) {
            const newBlogs = scrollResult.list;
            if (newBlogs.length === 0) {
              hasMore.value = true;
              return;
            }
            if (isLoadMore) {
              hotBlogs.value = [...hotBlogs.value, ...newBlogs];
            } else {
              hotBlogs.value = newBlogs;
            }
            hasMore.value = newBlogs.length === 10;
            if (isLoadMore && hasMore.value) {
              currentPage.value++;
            } else if (!isLoadMore) {
              currentPage.value = 2;
            }
            minTime.value = BigInt(scrollResult.minTime) || minTime.value;
          } else {
            common_vendor.index.__f__("error", "at pages/index/index.vue:203", "数据结构不正确:", scrollResult);
            common_vendor.index.showToast({
              title: "数据结构不正确",
              icon: "none"
            });
          }
        } else {
          common_vendor.index.__f__("error", "at pages/index/index.vue:210", "请求失败:", res.data.errorMsg);
          common_vendor.index.showToast({
            title: res.data.errorMsg || "请求失败",
            icon: "none"
          });
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:217", "获取热门博客失败:", error);
        common_vendor.index.showToast({
          title: "获取热门博客失败",
          icon: "none"
        });
      } finally {
        isLoading.value = false;
        isRefreshing.value = false;
      }
    };
    const goToBlogDetail = (blogId) => {
      common_vendor.index.__f__("log", "at pages/index/index.vue:230", "跳转到博客详情，ID:", blogId);
      if (!blogId) {
        common_vendor.index.showToast({
          title: "参数错误",
          icon: "none"
        });
        return;
      }
      common_vendor.index.navigateTo({
        url: `/pages/blog/detail?id=${blogId}`,
        success: () => {
          common_vendor.index.__f__("log", "at pages/index/index.vue:242", "页面跳转成功");
        },
        fail: (err) => {
          common_vendor.index.__f__("error", "at pages/index/index.vue:245", "页面跳转失败:", err);
          common_vendor.index.showToast({
            title: "页面跳转失败",
            icon: "none"
          });
        }
      });
    };
    const toggleLike = async (blog) => {
      try {
        const token = common_vendor.index.getStorageSync("token");
        if (!token) {
          common_vendor.index.showToast({
            title: "请先登录",
            icon: "none"
          });
          return;
        }
        const res = await common_vendor.index.request({
          url: config_api_config.getFullUrl(`/blog/like/${blog.id}`),
          method: "PUT",
          header: {
            "authorization": token
          }
        });
        if (res.statusCode === 200 && res.data.success) {
          const blogRes = await common_vendor.index.request({
            url: config_api_config.getFullUrl(`/blog/${blog.id}`),
            method: "GET",
            header: {
              "authorization": token
            }
          });
          if (blogRes.statusCode === 200 && blogRes.data.success) {
            const updatedBlog = blogRes.data.data;
            const index = hotBlogs.value.findIndex((item) => item.id === blog.id);
            if (index !== -1) {
              const originalBlog = hotBlogs.value[index];
              updatedBlog.comments = updatedBlog.comments || originalBlog.comments || 0;
              hotBlogs.value[index] = updatedBlog;
            }
            common_vendor.index.showToast({
              title: updatedBlog.isLike ? "点赞成功" : "取消点赞",
              icon: "none"
            });
          }
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:302", "操作失败:", error);
        common_vendor.index.showToast({
          title: "操作失败",
          icon: "none"
        });
      }
    };
    const goToFoodList = (type) => {
      if (type === "entertainment") {
        common_vendor.index.navigateTo({
          url: "/pages/entertainment/entertainment"
        });
      } else if (type === "canteen") {
        common_vendor.index.navigateTo({
          url: "/pages/canteen/canteen"
        });
      } else {
        common_vendor.index.navigateTo({
          url: `/pages/foodList/foodList?type=${type}`
        });
      }
    };
    const onRefresh = async () => {
      isRefreshing.value = true;
      hasMore.value = true;
      currentPage.value = 1;
      await getHotBlogs(false);
    };
    const onLoadMore = async () => {
      if (!hasMore.value || isLoading.value)
        return;
      await getHotBlogs(true);
    };
    const handleScroll = (e) => {
      scrollTop.value = e.detail.scrollTop;
    };
    common_vendor.onMounted(() => {
      getHotBlogs(false);
    });
    common_vendor.onUnmounted(() => {
      common_vendor.index.offReachBottom(onReachBottom);
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_assets._imports_0,
        b: scrollTop.value > 20 ? 1 : "",
        c: common_assets._imports_1,
        d: common_assets._imports_2,
        e: common_assets._imports_3,
        f: common_assets._imports_4,
        g: common_assets._imports_5,
        h: common_vendor.o(($event) => goToFoodList("new")),
        i: common_assets._imports_6,
        j: common_vendor.o(($event) => goToFoodList("old")),
        k: common_assets._imports_7,
        l: common_vendor.o(($event) => goToFoodList("entertainment")),
        m: common_assets._imports_8,
        n: common_vendor.o(($event) => goToFoodList("canteen")),
        o: common_vendor.f(hotBlogs.value, (blog, index, i0) => {
          return common_vendor.e({
            a: blog.images
          }, blog.images ? {
            b: getFullImageUrl(blog.images.split(",")[0])
          } : {}, {
            c: blog.icon ? getFullImageUrl(blog.icon) : "/static/default-avatar.png",
            d: common_vendor.t(blog.name),
            e: common_vendor.t(blog.title),
            f: common_vendor.t(blog.content),
            g: blog.isLike ? "/static/liked.png" : "/static/like.png",
            h: common_vendor.t(blog.liked),
            i: common_vendor.o(($event) => toggleLike(blog), blog.id),
            j: common_vendor.t(blog.comments),
            k: blog.id,
            l: common_vendor.o(($event) => goToBlogDetail(blog.id), blog.id)
          });
        }),
        p: common_assets._imports_1$1,
        q: isLoading.value
      }, isLoading.value ? {} : {}, {
        r: !hasMore.value && !isLoading.value
      }, !hasMore.value && !isLoading.value ? {} : {}, {
        s: isRefreshing.value,
        t: common_vendor.o(onRefresh),
        v: common_vendor.o(onLoadMore),
        w: common_vendor.o(handleScroll)
      });
    };
  }
};
wx.createPage(_sfc_main);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/index/index.js.map
