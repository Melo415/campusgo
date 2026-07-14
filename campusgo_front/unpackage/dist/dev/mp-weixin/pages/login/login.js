"use strict";
const common_vendor = require("../../common/vendor.js");
const config_api_config = require("../../config/api.config.js");
const _sfc_main = {
  __name: "login",
  setup(__props) {
    const loginType = common_vendor.ref("password");
    const username = common_vendor.ref("");
    const password = common_vendor.ref("");
    const phone = common_vendor.ref("");
    const code = common_vendor.ref("");
    const countdown = common_vendor.ref(0);
    const switchLoginType = (type) => {
      loginType.value = type;
    };
    const getVerificationCode = async () => {
      var _a;
      if (!phone.value) {
        common_vendor.index.showToast({
          title: "请输入手机号",
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
      try {
        const phoneValue = phone.value;
        const urlWithParams = config_api_config.getFullUrl(`/user/code?phone=${phoneValue}`);
        const res = await common_vendor.index.request({
          url: urlWithParams,
          method: "POST",
          // 不再在 data 中传递 phone
          // data: { phone: phone.value }, 
          timeout: 5e3
        });
        if (res.statusCode === 200) {
          common_vendor.index.showToast({
            title: "验证码已发送",
            icon: "none"
          });
          countdown.value = 60;
          const timer = setInterval(() => {
            countdown.value--;
            if (countdown.value <= 0)
              clearInterval(timer);
          }, 1e3);
        } else {
          throw new Error(((_a = res.data) == null ? void 0 : _a.message) || "发送失败");
        }
      } catch (error) {
        let errorMsg = "验证码发送失败";
        if (error.errMsg && error.errMsg.includes("timeout")) {
          errorMsg = "请求超时，请检查网络连接";
        } else if (error.errMsg && error.errMsg.includes("request:fail")) {
          errorMsg = "无法连接到服务器，请稍后再试";
        } else if (error.message) {
          errorMsg = error.message;
        }
        common_vendor.index.__f__("error", "at pages/login/login.vue:126", errorMsg);
        common_vendor.index.showToast({
          title: errorMsg,
          icon: "none"
        });
        common_vendor.index.showToast({
          title: errorMsg,
          icon: "none",
          duration: 3e3
        });
        countdown.value = 0;
      }
    };
    const loginWithPassword = async () => {
      if (!username.value || !password.value) {
        common_vendor.index.showToast({
          title: "请输入用户名和密码",
          icon: "none"
        });
        return;
      }
      try {
        common_vendor.index.__f__("log", "at pages/login/login.vue:154", "开始登录请求...");
        const res = await common_vendor.index.request({
          url: config_api_config.getFullUrl("/user/login"),
          method: "POST",
          data: {
            phone: username.value,
            password: password.value
          },
          header: {
            "Content-Type": "application/json"
          },
          timeout: 5e3
        });
        common_vendor.index.__f__("log", "at pages/login/login.vue:168", "登录响应:", res);
        if (res.statusCode === 200) {
          const result = res.data;
          if (!result.success) {
            throw new Error(result.errorMsg || "登录失败");
          }
          const token = result.data;
          if (!token) {
            throw new Error("未获取到token");
          }
          common_vendor.index.__f__("log", "at pages/login/login.vue:182", "获取到的token:", token);
          common_vendor.index.setStorageSync("token", token);
          common_vendor.index.showToast({
            title: "登录成功",
            icon: "success"
          });
          setTimeout(() => {
            common_vendor.index.switchTab({
              url: "/pages/index/index"
            });
          }, 1500);
        } else {
          throw new Error("服务器错误");
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/login/login.vue:201", "登录错误:", error);
        let errorMsg = "登录失败";
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
    const loginWithSms = async () => {
      if (!phone.value || !code.value) {
        common_vendor.index.showToast({
          title: "请输入手机号和验证码",
          icon: "none"
        });
        return;
      }
      try {
        const res = await common_vendor.index.request({
          url: config_api_config.getFullUrl("/user/login"),
          method: "POST",
          data: {
            phone: phone.value,
            code: code.value
          },
          header: {
            "Content-Type": "application/json"
          },
          timeout: 5e3
        });
        if (res.statusCode === 200) {
          const result = res.data;
          if (!result.success) {
            throw new Error(result.errorMsg || "登录失败");
          }
          const token = result.data;
          if (!token) {
            throw new Error("未获取到token");
          }
          common_vendor.index.setStorageSync("token", token);
          common_vendor.index.showToast({
            title: "登录成功",
            icon: "success"
          });
          setTimeout(() => {
            common_vendor.index.switchTab({
              url: "/pages/index/index"
            });
          }, 1500);
        } else {
          throw new Error("服务器错误");
        }
      } catch (error) {
        let errorMsg = "登录失败";
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
    const goToRegister = () => {
      common_vendor.index.navigateTo({
        url: "/pages/register/register"
      });
    };
    common_vendor.onLoad(() => {
      phone.value = "13800138000";
    });
    return (_ctx, _cache) => {
      return {
        a: loginType.value === "password" ? 1 : "",
        b: common_vendor.o(($event) => switchLoginType("password")),
        c: loginType.value === "sms" ? 1 : "",
        d: common_vendor.o(($event) => switchLoginType("sms")),
        e: username.value,
        f: common_vendor.o(($event) => username.value = $event.detail.value),
        g: password.value,
        h: common_vendor.o(($event) => password.value = $event.detail.value),
        i: common_vendor.o(loginWithPassword),
        j: loginType.value === "password" ? 1 : "",
        k: phone.value,
        l: common_vendor.o(($event) => phone.value = $event.detail.value),
        m: code.value,
        n: common_vendor.o(($event) => code.value = $event.detail.value),
        o: common_vendor.t(countdown.value > 0 ? `${countdown.value}s后重新获取` : "获取验证码"),
        p: common_vendor.o(getVerificationCode),
        q: countdown.value > 0,
        r: common_vendor.o(loginWithSms),
        s: loginType.value === "sms" ? 1 : "",
        t: common_vendor.o(goToRegister)
      };
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-e4e4508d"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/login/login.js.map
