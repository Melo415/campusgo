"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const config_api_config = require("../../config/api.config.js");
const baseURL = "/static/images";
const _sfc_main = {
  __name: "detail",
  setup(__props) {
    const blog = common_vendor.ref({});
    const likes = common_vendor.ref([]);
    const comments = common_vendor.ref([]);
    const commentContent = common_vendor.ref("");
    const replyPlaceholder = common_vendor.ref("写下你的评论...");
    const currentReplyComment = common_vendor.ref(null);
    const isFollowed = common_vendor.ref(false);
    const currentUserId = common_vendor.ref(null);
    const isSelfBlog = common_vendor.computed(() => {
      return currentUserId.value && blog.value.userId === currentUserId.value;
    });
    const isLiked = common_vendor.computed(() => {
      return blog.value.isLike || false;
    });
    const likeCount = common_vendor.computed(() => {
      return blog.value.liked || 0;
    });
    const commentCount = common_vendor.computed(() => {
      return blog.value.comments || 0;
    });
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
    const previewImage = (index) => {
      const images = blog.value.images.split(",").map((img) => getFullImageUrl(img));
      common_vendor.index.previewImage({
        urls: images,
        current: index
      });
    };
    const toggleLike = async () => {
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
          url: config_api_config.getFullUrl(`/blog/like/${blog.value.id}`),
          method: "PUT",
          header: {
            "authorization": token
          }
        });
        if (res.statusCode === 200 && res.data.success) {
          const blogRes = await common_vendor.index.request({
            url: config_api_config.getFullUrl(`/blog/${blog.value.id}`),
            method: "GET",
            header: {
              "authorization": token
            }
          });
          if (blogRes.statusCode === 200 && blogRes.data.success) {
            blog.value = blogRes.data.data;
            getLikesList();
            common_vendor.index.showToast({
              title: blog.value.isLike ? "点赞成功" : "取消点赞",
              icon: "none"
            });
          }
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/blog/detail.vue:236", "操作失败:", error);
        common_vendor.index.showToast({
          title: "操作失败",
          icon: "none"
        });
      }
    };
    const getBlogDetail = async (id) => {
      try {
        const token = common_vendor.index.getStorageSync("token");
        const res = await common_vendor.index.request({
          url: config_api_config.getFullUrl(`/blog/${id}`),
          method: "GET",
          header: {
            "authorization": token
          }
        });
        if (res.statusCode === 200 && res.data.success) {
          blog.value = res.data.data;
          common_vendor.index.__f__("log", "at pages/blog/detail.vue:258", "博客详情数据:", blog.value);
          if (blog.value.isLike === void 0) {
            blog.value.isLike = false;
          }
          getLikesList();
          getComments();
          checkFollowStatus();
        } else if (res.statusCode === 401) {
          common_vendor.index.showToast({
            title: "请先登录",
            icon: "none"
          });
          setTimeout(() => {
            common_vendor.index.navigateTo({
              url: "/pages/login/login"
            });
          }, 1500);
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/blog/detail.vue:281", "获取博客详情失败:", error);
        common_vendor.index.showToast({
          title: "获取博客详情失败",
          icon: "none"
        });
      }
    };
    const getLikesList = async () => {
      try {
        const token = common_vendor.index.getStorageSync("token");
        const res = await common_vendor.index.request({
          url: config_api_config.getFullUrl(`/blog/likes/${blog.value.id}`),
          method: "GET",
          header: {
            "authorization": token
          }
        });
        if (res.statusCode === 200 && res.data.success) {
          likes.value = res.data.data;
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/blog/detail.vue:305", "获取点赞列表失败:", error);
      }
    };
    const getComments = async () => {
      try {
        const token = common_vendor.index.getStorageSync("token");
        const res = await common_vendor.index.request({
          url: config_api_config.getFullUrl(`/blog/comments/${blog.value.id}`),
          method: "GET",
          header: {
            "authorization": token
          }
        });
        if (res.statusCode === 200 && res.data.success) {
          comments.value = res.data.data;
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/blog/detail.vue:325", "获取评论列表失败:", error);
        common_vendor.index.showToast({
          title: "获取评论列表失败",
          icon: "none"
        });
      }
    };
    const showReplyInput = (comment) => {
      currentReplyComment.value = comment;
      replyPlaceholder.value = `回复 ${comment.nickName}：`;
      common_vendor.index.pageScrollTo({
        scrollTop: 999999,
        duration: 300
      });
    };
    const submitComment = async () => {
      if (!commentContent.value.trim()) {
        common_vendor.index.showToast({
          title: "请输入评论内容",
          icon: "none"
        });
        return;
      }
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
        const commentData = {
          blogId: blog.value.id,
          content: commentContent.value
        };
        if (currentReplyComment.value) {
          commentData.parentId = currentReplyComment.value.parentId || currentReplyComment.value.id;
          commentData.answerId = currentReplyComment.value.id;
          commentData.targetUserId = currentReplyComment.value.userId;
        }
        common_vendor.index.__f__("log", "at pages/blog/detail.vue:381", "准备提交评论:", commentData);
        const res = await common_vendor.index.request({
          url: currentReplyComment.value ? config_api_config.getFullUrl("/blog/comments/reply") : config_api_config.getFullUrl("/blog/comments"),
          method: "POST",
          header: {
            "authorization": token
          },
          data: commentData
        });
        common_vendor.index.__f__("log", "at pages/blog/detail.vue:392", "评论提交响应:", res);
        if (res.statusCode === 200 && res.data.success) {
          common_vendor.index.showToast({
            title: "评论成功",
            icon: "success"
          });
          commentContent.value = "";
          currentReplyComment.value = null;
          replyPlaceholder.value = "写下你的评论...";
          await getComments();
          blog.value.comments = (blog.value.comments || 0) + 1;
        } else {
          common_vendor.index.__f__("error", "at pages/blog/detail.vue:408", "评论失败:", res.data);
          common_vendor.index.showToast({
            title: res.data.message || "评论失败",
            icon: "none"
          });
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/blog/detail.vue:415", "评论失败:", error);
        common_vendor.index.showToast({
          title: "评论失败",
          icon: "none"
        });
      }
    };
    const checkFollowStatus = async () => {
      try {
        const token = common_vendor.index.getStorageSync("token");
        if (!token || !blog.value.userId)
          return;
        const res = await common_vendor.index.request({
          url: config_api_config.getFullUrl(`/follow/or/not/${blog.value.userId}`),
          method: "GET",
          header: {
            "authorization": token
          }
        });
        if (res.statusCode === 200 && res.data.success) {
          isFollowed.value = res.data.data;
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/blog/detail.vue:441", "获取关注状态失败:", error);
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
          url: config_api_config.getFullUrl(`/follow/${blog.value.userId}/${!isFollowed.value}`),
          method: "PUT",
          header: {
            "authorization": token
          }
        });
        if (res.statusCode === 200 && res.data.success) {
          isFollowed.value = !isFollowed.value;
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
        common_vendor.index.__f__("error", "at pages/blog/detail.vue:483", "关注操作失败:", error);
        common_vendor.index.showToast({
          title: "操作失败",
          icon: "none"
        });
      }
    };
    const getCurrentUser = async () => {
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
          currentUserId.value = res.data.data.id;
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/blog/detail.vue:509", "获取当前用户信息失败:", error);
      }
    };
    const goToUserInfo = (userId) => {
      if (!userId) {
        common_vendor.index.showToast({
          title: "用户信息错误",
          icon: "none"
        });
        return;
      }
      common_vendor.index.navigateTo({
        url: `/pages/userInfo/userInfo?id=${userId}`,
        success: () => {
          common_vendor.index.__f__("log", "at pages/blog/detail.vue:526", "跳转到用户信息页面成功");
        },
        fail: (err) => {
          common_vendor.index.__f__("error", "at pages/blog/detail.vue:529", "跳转到用户信息页面失败:", err);
          common_vendor.index.showToast({
            title: "跳转失败",
            icon: "none"
          });
        }
      });
    };
    common_vendor.onMounted(() => {
      var _a;
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      const options = ((_a = currentPage.$page) == null ? void 0 : _a.options) || {};
      const id = options.id;
      common_vendor.index.__f__("log", "at pages/blog/detail.vue:545", "当前页面参数:", options);
      common_vendor.index.__f__("log", "at pages/blog/detail.vue:546", "博客ID:", id);
      if (id) {
        getCurrentUser();
        getBlogDetail(id);
      } else {
        common_vendor.index.__f__("error", "at pages/blog/detail.vue:552", "未获取到博客ID");
        common_vendor.index.showToast({
          title: "参数错误",
          icon: "none"
        });
      }
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.t(blog.value.title),
        b: blog.value.icon ? getFullImageUrl(blog.value.icon) : "/static/default-avatar.png",
        c: common_vendor.t(blog.value.name),
        d: common_vendor.t(formatTime(blog.value.createTime)),
        e: !isSelfBlog.value
      }, !isSelfBlog.value ? {
        f: common_vendor.t(isFollowed.value ? "已关注" : "关注"),
        g: isFollowed.value ? 1 : "",
        h: common_vendor.o(toggleFollow)
      } : {}, {
        i: common_vendor.o(($event) => goToUserInfo(blog.value.userId)),
        j: blog.value.images
      }, blog.value.images ? {
        k: common_vendor.f(blog.value.images.split(","), (img, index, i0) => {
          return {
            a: index,
            b: getFullImageUrl(img),
            c: common_vendor.o(($event) => previewImage(index), index)
          };
        })
      } : {}, {
        l: common_vendor.t(blog.value.content),
        m: blog.value.isLike ? "/static/liked.png" : "/static/like.png",
        n: common_vendor.t(likeCount.value),
        o: isLiked.value ? 1 : "",
        p: common_vendor.o(toggleLike),
        q: common_assets._imports_1$1,
        r: common_vendor.t(commentCount.value),
        s: likes.value.length > 0
      }, likes.value.length > 0 ? {
        t: common_vendor.f(likes.value, (user, index, i0) => {
          return {
            a: user.icon ? getFullImageUrl(user.icon) : "/static/default-avatar.png",
            b: common_vendor.t(user.nickName),
            c: index
          };
        })
      } : {}, {
        v: common_vendor.t(comments.value.length),
        w: common_vendor.f(comments.value, (comment, index, i0) => {
          return common_vendor.e({
            a: comment.icon ? getFullImageUrl(comment.icon) : "/static/default-avatar.png",
            b: common_vendor.t(comment.nickName),
            c: common_vendor.t(formatTime(comment.createTime)),
            d: comment.targetNickName
          }, comment.targetNickName ? {
            e: common_vendor.t(comment.targetNickName)
          } : {}, {
            f: common_vendor.t(comment.content),
            g: common_vendor.o(($event) => showReplyInput(comment), index),
            h: comment.children && comment.children.length > 0
          }, comment.children && comment.children.length > 0 ? {
            i: common_vendor.f(comment.children, (subComment, subIndex, i1) => {
              return common_vendor.e({
                a: subComment.icon ? getFullImageUrl(subComment.icon) : "/static/default-avatar.png",
                b: common_vendor.t(subComment.nickName),
                c: common_vendor.t(formatTime(subComment.createTime)),
                d: subComment.targetNickName
              }, subComment.targetNickName ? {
                e: common_vendor.t(subComment.targetNickName)
              } : {}, {
                f: common_vendor.t(subComment.content),
                g: common_vendor.o(($event) => showReplyInput(subComment), subIndex),
                h: subIndex
              });
            })
          } : {}, {
            j: index
          });
        }),
        x: replyPlaceholder.value,
        y: common_vendor.o(submitComment),
        z: commentContent.value,
        A: common_vendor.o(($event) => commentContent.value = $event.detail.value),
        B: common_vendor.o(submitComment)
      });
    };
  }
};
wx.createPage(_sfc_main);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/blog/detail.js.map
