"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const config_api_config = require("../../config/api.config.js");
const _sfc_main = {
  __name: "editProfile",
  setup(__props) {
    const formData = common_vendor.ref({
      icon: "",
      nickName: "",
      signature: "",
      city: "",
      gender: ""
    });
    const goBack = () => {
      common_vendor.index.navigateBack();
    };
    const chooseAvatar = () => {
      common_vendor.index.chooseImage({
        count: 1,
        sizeType: ["compressed"],
        sourceType: ["album", "camera"],
        success: async (res) => {
          try {
            const token = common_vendor.index.getStorageSync("token");
            if (!token) {
              common_vendor.index.showToast({
                title: "请先登录",
                icon: "none"
              });
              return;
            }
            const uploadRes = await common_vendor.index.uploadFile({
              url: config_api_config.getFullUrl("/upload"),
              filePath: res.tempFilePaths[0],
              name: "file",
              header: {
                "authorization": token
              }
            });
            if (uploadRes.statusCode === 200) {
              const result = JSON.parse(uploadRes.data);
              if (result.success) {
                formData.value.icon = result.data;
                common_vendor.index.showToast({
                  title: "头像上传成功",
                  icon: "success"
                });
              } else {
                throw new Error(result.message || "上传失败");
              }
            } else {
              throw new Error("上传失败");
            }
          } catch (error) {
            common_vendor.index.__f__("error", "at pages/editProfile/editProfile.vue:138", "上传头像失败:", error);
            common_vendor.index.showToast({
              title: "上传头像失败",
              icon: "none"
            });
          }
        }
      });
    };
    const saveProfile = async () => {
      try {
        const token = common_vendor.index.getStorageSync("token");
        if (!token) {
          common_vendor.index.showToast({
            title: "请先登录",
            icon: "none"
          });
          return;
        }
        if (!formData.value.nickName) {
          common_vendor.index.showToast({
            title: "请输入昵称",
            icon: "none"
          });
          return;
        }
        const requestData = {
          nickName: formData.value.nickName,
          icon: formData.value.icon,
          signature: formData.value.signature,
          city: formData.value.city,
          gender: formData.value.gender === "男" ? true : false
        };
        const res = await common_vendor.index.request({
          url: config_api_config.getFullUrl("/user/info"),
          method: "PUT",
          header: {
            "authorization": token,
            "Content-Type": "application/json"
          },
          data: requestData
        });
        if (res.statusCode === 200 && res.data.success) {
          common_vendor.index.showToast({
            title: "保存成功",
            icon: "success"
          });
          common_vendor.index.$emit("refreshUserInfo");
          setTimeout(() => {
            common_vendor.index.navigateBack();
          }, 1500);
        } else {
          common_vendor.index.showToast({
            title: res.data.message || "保存失败",
            icon: "none"
          });
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/editProfile/editProfile.vue:206", "保存资料失败:", error);
        common_vendor.index.showToast({
          title: "保存失败",
          icon: "none"
        });
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
          formData.value = {
            icon: user.icon || "",
            nickName: user.nickName || "",
            signature: infoRes.data.success ? infoRes.data.data.introduce || "" : "",
            city: infoRes.data.success ? infoRes.data.data.city || "" : "",
            gender: infoRes.data.success ? infoRes.data.data.gender ? "男" : "女" : ""
          };
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/editProfile/editProfile.vue:251", "获取用户信息失败:", error);
        common_vendor.index.showToast({
          title: "获取用户信息失败",
          icon: "none"
        });
      }
    };
    common_vendor.onMounted(() => {
      loadUserInfo();
    });
    return (_ctx, _cache) => {
      return {
        a: common_vendor.o(goBack),
        b: common_assets._imports_0$6,
        c: common_vendor.o(saveProfile),
        d: formData.value.icon || "/static/default-avatar.png",
        e: common_vendor.o(chooseAvatar),
        f: formData.value.nickName,
        g: common_vendor.o(($event) => formData.value.nickName = $event.detail.value),
        h: formData.value.signature,
        i: common_vendor.o(($event) => formData.value.signature = $event.detail.value),
        j: formData.value.city,
        k: common_vendor.o(($event) => formData.value.city = $event.detail.value),
        l: formData.value.gender === "男" ? 1 : "",
        m: common_vendor.o(($event) => formData.value.gender = "男"),
        n: formData.value.gender === "女" ? 1 : "",
        o: common_vendor.o(($event) => formData.value.gender = "女")
      };
    };
  }
};
wx.createPage(_sfc_main);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/editProfile/editProfile.js.map
