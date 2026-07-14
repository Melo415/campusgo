"use strict";
const common_vendor = require("../../common/vendor.js");
const config_api_config = require("../../config/api.config.js");
const _sfc_main = {
  __name: "register",
  setup(__props) {
    const phone = common_vendor.ref("");
    const password = common_vendor.ref("");
    const confirmPassword = common_vendor.ref("");
    const register = async () => {
      var _a;
      if (!phone.value || !password.value || !confirmPassword.value) {
        common_vendor.index.showToast({
          title: "请填写完整信息",
          icon: "none"
        });
        return;
      }
      if (!/^1[3-9]\d{9}$/.test(phone.value)) {
        common_vendor.index.showToast({
          title: "手机号格式错误",
          icon: "none"
        });
        return;
      }
      if (password.value.length < 6) {
        common_vendor.index.showToast({
          title: "密码长度不能小于6位",
          icon: "none"
        });
        return;
      }
      if (password.value !== confirmPassword.value) {
        common_vendor.index.showToast({
          title: "两次输入的密码不一致",
          icon: "none"
        });
        return;
      }
      try {
        const res = await common_vendor.index.request({
          url: config_api_config.getFullUrl("/user/register"),
          method: "POST",
          data: {
            phone: phone.value,
            password: password.value
          },
          header: {
            "Content-Type": "application/json"
          },
          timeout: 5e3
        });
        if (res.statusCode === 200) {
          common_vendor.index.showToast({
            title: "注册成功",
            icon: "success"
          });
          setTimeout(() => {
            common_vendor.index.navigateTo({
              url: "/pages/login/login"
            });
          }, 1500);
        } else {
          throw new Error(((_a = res.data) == null ? void 0 : _a.message) || "注册失败");
        }
      } catch (error) {
        let errorMsg = "注册失败";
        if (error.errMsg && error.errMsg.includes("timeout")) {
          errorMsg = "请求超时，请检查网络连接";
        } else if (error.errMsg && error.errMsg.includes("request:fail")) {
          errorMsg = "无法连接到服务器，请稍后再试";
        } else if (error.message) {
          errorMsg = error.message;
        }
        common_vendor.index.showToast({
          title: errorMsg,
          icon: "none",
          duration: 3e3
        });
      }
    };
    const goToLogin = () => {
      common_vendor.index.navigateTo({
        url: "/pages/login/login"
      });
    };
    return (_ctx, _cache) => {
      return {
        a: phone.value,
        b: common_vendor.o(($event) => phone.value = $event.detail.value),
        c: password.value,
        d: common_vendor.o(($event) => password.value = $event.detail.value),
        e: confirmPassword.value,
        f: common_vendor.o(($event) => confirmPassword.value = $event.detail.value),
        g: common_vendor.o(register),
        h: common_vendor.o(goToLogin)
      };
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-bac4a35d"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/register/register.js.map
