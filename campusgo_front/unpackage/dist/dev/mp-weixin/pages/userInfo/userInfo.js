"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const config_api_config = require("../../config/api.config.js");
const baseURL = "/static/images";
const _sfc_main = {
  __name: "userInfo",
  setup(__props) {
    const userInfo = common_vendor.ref({});
    const isSelf = common_vendor.ref(false);
    const isFollowed = common_vendor.ref(false);
    const blogs = common_vendor.ref([]);
    const getFullImageUrl = (url) => {
      if (!url)
        return "/static/default-avatar.png";
      if (url.startsWith("http"))
        return url;
      if (url.startsWith("/static"))
        return url;
      return baseURL + "/" + url;
    };
    const formatTime = (time) => {
      if (!time)
        return "";
      const date = new Date(time);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    };
    const previewImage = (current, urls) => {
      const fullUrls = urls.map((url) => getFullImageUrl(url));
      common_vendor.index.previewImage({
        urls: fullUrls,
        current: getFullImageUrl(current)
      });
    };
    const loadUserInfo = async (userId) => {
      try {
        const token = common_vendor.index.getStorageSync("token");
        if (!token)
          return;
        const res = await common_vendor.index.request({
          url: config_api_config.getFullUrl(`/user/${userId}`),
          method: "GET",
          header: {
            "authorization": token
          }
        });
        common_vendor.index.__f__("log", "at pages/userInfo/userInfo.vue:135", "获取用户信息API响应:", res.data.data);
        if (res.statusCode === 200 && res.data.success) {
          userInfo.value = res.data.data;
          const blogRes = await common_vendor.index.request({
            url: config_api_config.getFullUrl(`/blog/of/user?id=${userId}`),
            method: "GET",
            header: {
              "authorization": token
            },
            data: {
              current: 1
            }
          });
          common_vendor.index.__f__("log", "at pages/userInfo/userInfo.vue:151", "获取用户笔记数量API响应:", blogRes.data.data);
          if (blogRes.statusCode === 200 && blogRes.data.success) {
            userInfo.value.notes = blogRes.data.data.length;
          }
          const followRes = await common_vendor.index.request({
            url: config_api_config.getFullUrl(`/follow/followings`),
            method: "GET",
            header: {
              "authorization": token
            }
          });
          common_vendor.index.__f__("log", "at pages/userInfo/userInfo.vue:164", "获取用户关注数量API响应:", followRes.data.data);
          if (followRes.statusCode === 200 && followRes.data.success) {
            userInfo.value.follows = followRes.data.data || 0;
          }
          const fansRes = await common_vendor.index.request({
            url: config_api_config.getFullUrl(`/follow/followers`),
            method: "GET",
            header: {
              "authorization": token
            }
          });
          common_vendor.index.__f__("log", "at pages/userInfo/userInfo.vue:176", "获取用户粉丝数量API响应:", fansRes.data.data);
          if (fansRes.statusCode === 200 && fansRes.data.success) {
            userInfo.value.fans = fansRes.data.data || 0;
          }
          checkIfSelf(userId);
          checkFollowStatus(userId);
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/userInfo/userInfo.vue:186", "获取用户信息失败:", error);
        common_vendor.index.showToast({
          title: "获取用户信息失败",
          icon: "none"
        });
      }
    };
    const checkIfSelf = async (userId) => {
      try {
        const token = common_vendor.index.getStorageSync("token");
        if (!token)
          return;
        const res = await common_vendor.index.request({
          url: config_api_config.getFullUrl("/user/me"),
          method: "GET",
          header: {
            "authorization": token
          }
        });
        if (res.statusCode === 200 && res.data.success) {
          isSelf.value = res.data.data.id === userId;
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/userInfo/userInfo.vue:212", "检查用户身份失败:", error);
      }
    };
    const checkFollowStatus = async (userId) => {
      try {
        const token = common_vendor.index.getStorageSync("token");
        if (!token)
          return;
        const res = await common_vendor.index.request({
          url: config_api_config.getFullUrl(`/follow/or/not/${userId}`),
          method: "GET",
          header: {
            "authorization": token
          }
        });
        if (res.statusCode === 200 && res.data.success) {
          isFollowed.value = res.data.data;
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/userInfo/userInfo.vue:234", "获取关注状态失败:", error);
      }
    };
    const toggleFollow = async () => {
      try {
        const token = common_vendor.index.getStorageSync("token");
        if (!token) {
          common_vendor.index.showToast({
            title: "请先登录",
            icon: "none"
          });
          setTimeout(() => {
            common_vendor.index.navigateTo({
              url: "/pages/login/login"
            });
          }, 1500);
          return;
        }
        const res = await common_vendor.index.request({
          url: config_api_config.getFullUrl(`/follow/${userInfo.value.id}/${!isFollowed.value}`),
          method: "PUT",
          header: {
            "authorization": token
          }
        });
        if (res.statusCode === 200 && res.data.success) {
          isFollowed.value = !isFollowed.value;
          userInfo.value.fans = isFollowed.value ? (userInfo.value.fans.length || 0) + 1 : (userInfo.value.fans.length || 1) - 1;
          common_vendor.index.showToast({
            title: isFollowed.value ? "关注成功" : "已取消关注",
            icon: "success"
          });
        } else {
          common_vendor.index.showToast({
            title: res.data.message || "操作失败",
            icon: "none"
          });
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/userInfo/userInfo.vue:281", "关注操作失败:", error);
        common_vendor.index.showToast({
          title: "操作失败",
          icon: "none"
        });
      }
    };
    const loadUserBlogs = async (userId) => {
      try {
        const token = common_vendor.index.getStorageSync("token");
        if (!token)
          return;
        const res = await common_vendor.index.request({
          url: config_api_config.getFullUrl(`/blog/of/user?id=${userId}`),
          method: "GET",
          header: {
            "authorization": token
          },
          data: {
            current: 1
          }
        });
        if (res.statusCode === 200 && res.data.success) {
          blogs.value = res.data.data;
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/userInfo/userInfo.vue:310", "获取用户博客列表失败:", error);
        common_vendor.index.showToast({
          title: "获取博客列表失败",
          icon: "none"
        });
      }
    };
    const goToBlogDetail = (blogId) => {
      common_vendor.index.navigateTo({
        url: `/pages/blog/detail?id=${blogId}`
      });
    };
    common_vendor.onMounted(() => {
      var _a;
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      const options = ((_a = currentPage.$page) == null ? void 0 : _a.options) || {};
      const userId = options.id;
      if (userId) {
        loadUserInfo(userId);
        loadUserBlogs(userId);
      } else {
        common_vendor.index.showToast({
          title: "参数错误",
          icon: "none"
        });
      }
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: userInfo.value.icon || "/static/default-avatar.png",
        b: common_vendor.t(userInfo.value.nickName || "匿名"),
        c: common_vendor.t(userInfo.value.signature || "这个人很懒，什么都没写~"),
        d: common_vendor.t(userInfo.value.follows.length || 0),
        e: common_vendor.t(userInfo.value.fans.length || 0),
        f: common_vendor.t(userInfo.value.notes || 0),
        g: !isSelf.value
      }, !isSelf.value ? {
        h: common_vendor.t(isFollowed.value ? "已关注" : "关注"),
        i: isFollowed.value ? 1 : "",
        j: common_vendor.o(toggleFollow)
      } : {}, {
        k: blogs.value.length === 0
      }, blogs.value.length === 0 ? {
        l: common_assets._imports_0$5
      } : {
        m: common_vendor.f(blogs.value, (blog, k0, i0) => {
          return common_vendor.e({
            a: common_vendor.t(blog.title),
            b: common_vendor.t(blog.content),
            c: blog.images
          }, blog.images ? {
            d: common_vendor.f(blog.images.split(","), (img, index, i1) => {
              return {
                a: index,
                b: getFullImageUrl(img),
                c: common_vendor.o(($event) => previewImage(img, blog.images.split(",")), index)
              };
            })
          } : {}, {
            e: common_vendor.t(formatTime(blog.createTime)),
            f: blog.isLike ? "/static/liked.png" : "/static/like.png",
            g: common_vendor.t(blog.liked),
            h: common_vendor.t(blog.comments),
            i: blog.id,
            j: common_vendor.o(($event) => goToBlogDetail(blog.id), blog.id)
          });
        }),
        n: common_assets._imports_1$1
      });
    };
  }
};
wx.createPage(_sfc_main);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/userInfo/userInfo.js.map
