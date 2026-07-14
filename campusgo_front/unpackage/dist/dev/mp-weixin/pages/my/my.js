"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const config_api_config = require("../../config/api.config.js");
const baseURL = "/static/images";
const _sfc_main = {
  __name: "my",
  setup(__props) {
    const statusBarHeight = common_vendor.index.getSystemInfoSync().statusBarHeight;
    const showStatusBarBg = common_vendor.ref(false);
    const isLoggedIn = common_vendor.ref(false);
    const userInfo = common_vendor.ref({
      avatarUrl: "",
      username: "",
      status: "",
      location: "",
      fansCount: 0,
      followCount: 0
    });
    const activeTab = common_vendor.ref("note");
    common_vendor.ref("personal");
    const notes = common_vendor.ref([]);
    const evaluations = common_vendor.ref([]);
    const followings = common_vendor.ref([]);
    const followers = common_vendor.ref([]);
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
    const loadNotes = async () => {
      try {
        const token = common_vendor.index.getStorageSync("token");
        if (!token) {
          notes.value = [];
          return;
        }
        const res = await common_vendor.index.request({
          url: config_api_config.getFullUrl("/blog/of/me"),
          method: "GET",
          header: {
            "authorization": token
          },
          data: {
            current: 1
          }
        });
        if (res.statusCode === 200 && res.data.success) {
          notes.value = res.data.data;
        } else {
          common_vendor.index.__f__("error", "at pages/my/my.vue:316", "获取笔记列表失败:", res.data);
          common_vendor.index.showToast({
            title: res.data.message || "获取笔记列表失败",
            icon: "none"
          });
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/my/my.vue:323", "获取笔记列表失败:", error);
        common_vendor.index.showToast({
          title: "获取笔记列表失败",
          icon: "none"
        });
      }
    };
    const deleteNote = async (noteId) => {
      try {
        const token = common_vendor.index.getStorageSync("token");
        if (!token) {
          common_vendor.index.showToast({
            title: "请先登录",
            icon: "none"
          });
          return;
        }
        common_vendor.index.showModal({
          title: "提示",
          content: "确定要删除这条笔记吗？",
          success: async (res) => {
            if (res.confirm) {
              const deleteRes = await common_vendor.index.request({
                url: config_api_config.getFullUrl(`/blog/${noteId}`),
                method: "DELETE",
                header: {
                  "authorization": token
                }
              });
              if (deleteRes.statusCode === 200 && deleteRes.data.success) {
                common_vendor.index.showToast({
                  title: "删除成功",
                  icon: "success"
                });
                await loadNotes();
              } else {
                common_vendor.index.showToast({
                  title: deleteRes.data.message || "删除失败",
                  icon: "none"
                });
              }
            }
          }
        });
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/my/my.vue:373", "删除笔记失败:", error);
        common_vendor.index.showToast({
          title: "删除失败",
          icon: "none"
        });
      }
    };
    const checkLoginStatus = () => {
      const token = common_vendor.index.getStorageSync("token");
      isLoggedIn.value = !!token;
      if (isLoggedIn.value) {
        loadUserInfo();
      }
    };
    const loadUserInfo = async () => {
      try {
        const token = common_vendor.index.getStorageSync("token");
        if (!token)
          return;
        const userRes = await common_vendor.index.request({
          url: config_api_config.getFullUrl("/user/me"),
          method: "GET",
          header: {
            "authorization": token
          }
        });
        if (userRes.statusCode === 200 && userRes.data.success) {
          const user = userRes.data.data;
          const infoRes = await common_vendor.index.request({
            url: config_api_config.getFullUrl(`/user/info/${user.id}`),
            method: "GET",
            header: {
              "authorization": token
            }
          });
          userInfo.value = {
            ...userInfo.value,
            username: user.nickName || "未设置昵称",
            avatarUrl: user.icon || "/static/default-avatar.png",
            status: infoRes.data.success ? infoRes.data.data.introduce || "未设置签名" : "未设置签名",
            location: infoRes.data.success ? infoRes.data.data.city || "未设置城市" : "未设置城市",
            fansCount: infoRes.data.success ? infoRes.data.data.fans || 0 : 0,
            followCount: infoRes.data.success ? infoRes.data.data.followee || 0 : 0
          };
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/my/my.vue:436", "获取用户信息失败:", error);
        isLoggedIn.value = false;
        common_vendor.index.showToast({
          title: "获取用户信息失败",
          icon: "none"
        });
      }
    };
    const loadEvaluations = async () => {
      try {
        const token = common_vendor.index.getStorageSync("token");
        if (!token) {
          evaluations.value = [];
          return;
        }
        const res = await common_vendor.index.request({
          url: config_api_config.getFullUrl("/blog/comments/of/me"),
          method: "GET",
          header: {
            "authorization": token
          },
          data: {
            current: 1
          }
        });
        if (res.statusCode === 200 && res.data.success) {
          evaluations.value = res.data.data;
        } else {
          common_vendor.index.__f__("error", "at pages/my/my.vue:468", "获取评价列表失败:", res.data);
          common_vendor.index.showToast({
            title: res.data.message || "获取评价列表失败",
            icon: "none"
          });
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/my/my.vue:475", "获取评价列表失败:", error);
        common_vendor.index.showToast({
          title: "获取评价列表失败",
          icon: "none"
        });
      }
    };
    const goToBlogDetail = (blogId) => {
      common_vendor.index.navigateTo({
        url: `/pages/blog/detail?id=${blogId}`
      });
    };
    const editProfile = () => {
      common_vendor.index.navigateTo({
        url: "/pages/editProfile/editProfile"
      });
    };
    const logout = () => {
      common_vendor.index.showModal({
        title: "提示",
        content: "确定要退出登录吗？",
        success: (res) => {
          if (res.confirm) {
            common_vendor.index.showToast({
              title: "已退出登录",
              icon: "success"
            });
            common_vendor.index.redirectTo({
              url: "/pages/login/login"
            });
          }
        }
      });
    };
    const loadFollowings = async () => {
      try {
        const token = common_vendor.index.getStorageSync("token");
        if (!token) {
          followings.value = [];
          return;
        }
        const res = await common_vendor.index.request({
          url: config_api_config.getFullUrl("/follow/followings"),
          method: "GET",
          header: {
            "authorization": token
          }
        });
        if (res.statusCode === 200 && res.data.success) {
          followings.value = res.data.data;
        } else {
          common_vendor.index.__f__("error", "at pages/my/my.vue:638", "获取关注列表失败:", res.data);
          common_vendor.index.showToast({
            title: res.data.message || "获取关注列表失败",
            icon: "none"
          });
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/my/my.vue:645", "获取关注列表失败:", error);
        common_vendor.index.showToast({
          title: "获取关注列表失败",
          icon: "none"
        });
      }
    };
    const loadFollowers = async () => {
      try {
        const token = common_vendor.index.getStorageSync("token");
        if (!token) {
          followers.value = [];
          return;
        }
        const res = await common_vendor.index.request({
          url: config_api_config.getFullUrl("/follow/followers"),
          method: "GET",
          header: {
            "authorization": token
          }
        });
        if (res.statusCode === 200 && res.data.success) {
          followers.value = res.data.data;
        } else {
          common_vendor.index.__f__("error", "at pages/my/my.vue:673", "获取粉丝列表失败:", res.data);
          common_vendor.index.showToast({
            title: res.data.message || "获取粉丝列表失败",
            icon: "none"
          });
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/my/my.vue:680", "获取粉丝列表失败:", error);
        common_vendor.index.showToast({
          title: "获取粉丝列表失败",
          icon: "none"
        });
      }
    };
    const goToUserPage = (userId) => {
      common_vendor.index.navigateTo({
        url: `/pages/userInfo/userInfo?id=${userId}`
      });
    };
    const unfollowUser = async (userId) => {
      try {
        const token = common_vendor.index.getStorageSync("token");
        if (!token) {
          common_vendor.index.showToast({
            title: "请先登录",
            icon: "none"
          });
          return;
        }
        common_vendor.index.showModal({
          title: "提示",
          content: "确定要取消关注吗？",
          success: async (res) => {
            if (res.confirm) {
              const res2 = await common_vendor.index.request({
                url: config_api_config.getFullUrl(`/follow/${userId}/false`),
                method: "PUT",
                header: {
                  "authorization": token
                }
              });
              if (res2.statusCode === 200 && res2.data.success) {
                common_vendor.index.showToast({
                  title: "取消关注成功",
                  icon: "success"
                });
                await loadFollowings();
                userInfo.value.followCount = (userInfo.value.followCount || 0) - 1;
              } else {
                common_vendor.index.showToast({
                  title: res2.data.message || "取消关注失败",
                  icon: "none"
                });
              }
            }
          }
        });
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/my/my.vue:739", "取消关注失败:", error);
        common_vendor.index.showToast({
          title: "取消关注失败",
          icon: "none"
        });
      }
    };
    const changeTab = (tab) => {
      activeTab.value = tab;
      if (tab === "follow") {
        loadFollowings();
      } else if (tab === "fans") {
        loadFollowers();
      }
    };
    common_vendor.onMounted(() => {
      checkLoginStatus();
      if (isLoggedIn.value) {
        loadNotes();
        loadEvaluations();
        loadFollowings();
        loadFollowers();
      }
      common_vendor.index.$on("refreshUserInfo", loadUserInfo);
      common_vendor.index.$on("notePublished", loadNotes);
    });
    common_vendor.onUnmounted(() => {
      common_vendor.index.$off("refreshUserInfo");
      common_vendor.index.$off("notePublished", loadNotes);
    });
    common_vendor.onPageScroll((e) => {
      showStatusBarBg.value = e.scrollTop > 0;
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: showStatusBarBg.value
      }, showStatusBarBg.value ? {
        b: common_vendor.unref(statusBarHeight) + "px"
      } : {}, {
        c: common_assets._imports_0$1,
        d: common_vendor.unref(statusBarHeight) + 32 + "px",
        e: userInfo.value.avatarUrl || "/static/default-avatar.png",
        f: common_vendor.t(userInfo.value.username),
        g: common_vendor.t(userInfo.value.status),
        h: common_vendor.t(userInfo.value.location),
        i: common_vendor.o(editProfile),
        j: common_vendor.o(logout),
        k: common_vendor.t(notes.value.length),
        l: common_vendor.t(followings.value.length),
        m: common_vendor.t(followers.value.length),
        n: activeTab.value === "note" ? 1 : "",
        o: common_vendor.o(($event) => changeTab("note")),
        p: activeTab.value === "evaluation" ? 1 : "",
        q: common_vendor.o(($event) => changeTab("evaluation")),
        r: activeTab.value === "fans" ? 1 : "",
        s: common_vendor.o(($event) => changeTab("fans")),
        t: activeTab.value === "follow" ? 1 : "",
        v: common_vendor.o(($event) => changeTab("follow")),
        w: activeTab.value === "note"
      }, activeTab.value === "note" ? common_vendor.e({
        x: notes.value.length === 0
      }, notes.value.length === 0 ? {
        y: common_assets._imports_1$2,
        z: common_vendor.o(($event) => _ctx.navigateTo("note"))
      } : {
        A: common_vendor.f(notes.value, (note, index, i0) => {
          return common_vendor.e({
            a: common_vendor.t(note.title),
            b: common_vendor.t(note.content),
            c: note.images
          }, note.images ? {
            d: common_vendor.f(note.images.split(","), (img, imgIndex, i1) => {
              return {
                a: imgIndex,
                b: getFullImageUrl(img),
                c: common_vendor.o(($event) => previewImage(img, note.images.split(",")), imgIndex)
              };
            })
          } : {}, {
            e: common_vendor.t(formatTime(note.createTime)),
            f: note.isLike ? "/static/liked.png" : "/static/like.png",
            g: common_vendor.t(note.liked),
            h: common_vendor.t(note.comments),
            i: common_vendor.o(($event) => deleteNote(note.id), index),
            j: index,
            k: common_vendor.o(($event) => goToBlogDetail(note.id), index)
          });
        }),
        B: common_assets._imports_1$1
      }) : {}, {
        C: activeTab.value === "evaluation"
      }, activeTab.value === "evaluation" ? common_vendor.e({
        D: evaluations.value.length === 0
      }, evaluations.value.length === 0 ? {
        E: common_assets._imports_1$1
      } : {
        F: common_vendor.f(evaluations.value, (evaluation, index, i0) => {
          return common_vendor.e({
            a: evaluation.blogUserIcon || "/static/default-avatar.png",
            b: common_vendor.t(evaluation.blogUserName),
            c: common_vendor.t(evaluation.blogTitle),
            d: common_vendor.t(evaluation.blogContent),
            e: evaluation.blogImages
          }, evaluation.blogImages ? {
            f: common_vendor.f(evaluation.blogImages.split(","), (img, imgIndex, i1) => {
              return {
                a: imgIndex,
                b: getFullImageUrl(img),
                c: common_vendor.o(($event) => previewImage(img, evaluation.blogImages.split(",")), imgIndex)
              };
            })
          } : {}, {
            g: common_vendor.o(($event) => goToBlogDetail(evaluation.blogId), index),
            h: common_vendor.t(evaluation.content),
            i: common_vendor.t(formatTime(evaluation.createTime)),
            j: index
          });
        })
      }) : {}, {
        G: activeTab.value === "fans"
      }, activeTab.value === "fans" ? common_vendor.e({
        H: followers.value.length === 0
      }, followers.value.length === 0 ? {
        I: common_assets._imports_3$1
      } : {
        J: common_vendor.f(followers.value, (user, k0, i0) => {
          return common_vendor.e({
            a: user.icon || "/static/default-avatar.png",
            b: common_vendor.t(user.nickName),
            c: user.signature
          }, user.signature ? {
            d: common_vendor.t(user.signature)
          } : {}, {
            e: user.id,
            f: common_vendor.o(($event) => goToUserPage(user.id), user.id)
          });
        })
      }) : {}, {
        K: activeTab.value === "follow"
      }, activeTab.value === "follow" ? common_vendor.e({
        L: followings.value.length === 0
      }, followings.value.length === 0 ? {
        M: common_assets._imports_4$1,
        N: common_vendor.o(($event) => _ctx.navigateTo("home"))
      } : {
        O: common_vendor.f(followings.value, (user, k0, i0) => {
          return common_vendor.e({
            a: user.icon || "/static/default-avatar.png",
            b: common_vendor.t(user.nickName),
            c: user.signature
          }, user.signature ? {
            d: common_vendor.t(user.signature)
          } : {}, {
            e: common_vendor.o(($event) => unfollowUser(user.id), user.id),
            f: user.id,
            g: common_vendor.o(($event) => goToUserPage(user.id), user.id)
          });
        })
      }) : {});
    };
  }
};
_sfc_main.__runtimeHooks = 1;
wx.createPage(_sfc_main);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/my/my.js.map
