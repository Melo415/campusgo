"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const common_vendor = require("./common/vendor.js");
if (!Math) {
  "./pages/index/index.js";
  "./pages/my/my.js";
  "./pages/message/message.js";
  "./pages/foodList/foodList.js";
  "./pages/footMassageList/footMassageList.js";
  "./pages/hairCut/hairCut.js";
  "./pages/login/login.js";
  "./pages/note/note.js";
  "./pages/register/register.js";
  "./pages/blog/detail.js";
  "./pages/entertainment/entertainment.js";
  "./pages/canteen/canteen.js";
  "./pages/userInfo/userInfo.js";
  "./pages/editProfile/editProfile.js";
}
const _sfc_main = {
  onLaunch: function() {
    common_vendor.index.__f__("warn", "at App.vue:4", "当前组件仅支持 uni_modules 目录结构 ，请升级 HBuilderX 到 3.1.0 版本以上！");
    common_vendor.index.__f__("log", "at App.vue:5", "App Launch");
  },
  onShow: function() {
    common_vendor.index.__f__("log", "at App.vue:8", "App Show");
  },
  onHide: function() {
    common_vendor.index.__f__("log", "at App.vue:11", "App Hide");
  }
};
function createApp() {
  const app = common_vendor.createSSRApp(_sfc_main);
  return {
    app
  };
}
createApp().app.mount("#app");
exports.createApp = createApp;
//# sourceMappingURL=../.sourcemap/mp-weixin/app.js.map
