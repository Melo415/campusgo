"use strict";
const common_vendor = require("../../common/vendor.js");
const config_api_config = require("../../config/api.config.js");
const _sfc_main = {
  __name: "note",
  setup(__props) {
    const noteTitle = common_vendor.ref("");
    const noteContent = common_vendor.ref("");
    const selectedImages = common_vendor.ref([]);
    const selectedCategory = common_vendor.ref("");
    const categories = common_vendor.ref(["美食", "饮品", "娱乐", "我不要上课"]);
    const publishNote = async () => {
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
        if (!noteTitle.value || !noteContent.value) {
          common_vendor.index.showToast({
            title: "请填写标题和正文",
            icon: "none"
          });
          return;
        }
        const blogData = {
          title: noteTitle.value,
          content: noteContent.value,
          images: selectedImages.value.length > 0 ? selectedImages.value.join(",") : "",
          shopId: 1,
          category: selectedCategory.value || ""
        };
        common_vendor.index.__f__("log", "at pages/note/note.vue:116", "发送的数据:", blogData);
        const res = await common_vendor.index.request({
          url: config_api_config.getFullUrl("/blog"),
          method: "POST",
          header: {
            "authorization": token,
            "content-type": "application/json"
          },
          data: blogData
        });
        common_vendor.index.__f__("log", "at pages/note/note.vue:129", "响应数据:", res);
        if (res.statusCode === 200 && res.data.success) {
          common_vendor.index.showToast({
            title: "发布成功",
            icon: "success"
          });
          common_vendor.index.setStorageSync("needRefreshHome", true);
          common_vendor.index.$emit("notePublished");
          setTimeout(() => {
            common_vendor.index.switchTab({
              url: "/pages/index/index"
            });
          }, 1500);
          noteTitle.value = "";
          noteContent.value = "";
          selectedCategory.value = "";
          selectedImages.value = [];
        } else {
          common_vendor.index.showToast({
            title: res.data.message || "发布失败",
            icon: "none"
          });
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/note/note.vue:161", "发布失败:", error);
        common_vendor.index.showToast({
          title: "发布失败",
          icon: "none"
        });
      }
    };
    const chooseImage = () => {
      common_vendor.index.chooseImage({
        count: 9 - selectedImages.value.length,
        sizeType: ["compressed"],
        sourceType: ["album", "camera"],
        success: (res) => {
          selectedImages.value = [...selectedImages.value, ...res.tempFilePaths];
        }
      });
    };
    const previewImage = (index) => {
      common_vendor.index.previewImage({
        urls: selectedImages.value,
        current: index
      });
    };
    const deleteImage = (index) => {
      selectedImages.value.splice(index, 1);
    };
    const selectCategory = (category) => {
      selectedCategory.value = category;
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: noteTitle.value,
        b: common_vendor.o(($event) => noteTitle.value = $event.detail.value),
        c: noteContent.value,
        d: common_vendor.o(($event) => noteContent.value = $event.detail.value),
        e: common_vendor.f(categories.value, (category, index, i0) => {
          return {
            a: common_vendor.t(category),
            b: index,
            c: selectedCategory.value === category ? 1 : "",
            d: common_vendor.o(($event) => selectCategory(category), index)
          };
        }),
        f: common_vendor.f(selectedImages.value, (image, index, i0) => {
          return {
            a: image,
            b: common_vendor.o(($event) => previewImage(index), index),
            c: common_vendor.o(($event) => deleteImage(index), index),
            d: index
          };
        }),
        g: selectedImages.value.length < 1
      }, selectedImages.value.length < 1 ? {
        h: common_vendor.o(chooseImage)
      } : {}, {
        i: common_vendor.o(publishNote),
        j: common_vendor.o((...args) => _ctx.handleScroll && _ctx.handleScroll(...args))
      });
    };
  }
};
wx.createPage(_sfc_main);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/note/note.js.map
