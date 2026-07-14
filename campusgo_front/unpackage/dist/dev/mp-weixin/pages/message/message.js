"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_websocket = require("../../utils/websocket.js");
const utils_storage = require("../../utils/storage.js");
const common_assets = require("../../common/assets.js");
const _sfc_main = {
  setup() {
    const notifications = common_vendor.ref(utils_storage.getNotifications());
    const isRefreshing = common_vendor.ref(false);
    const unreadCount = common_vendor.ref(utils_storage.getUnreadCount());
    const formatNotification = (notification) => {
      switch (notification.type) {
        case 3:
          return `关注了你`;
        case 1:
          return `点赞了你的博客`;
        case 2:
          return `评论了你的博客: ${notification.content}`;
        default:
          return notification.content;
      }
    };
    const formatTime = (time) => {
      if (!time)
        return "";
      const date = new Date(time);
      const now = /* @__PURE__ */ new Date();
      const diff = now - date;
      if (diff < 6e4) {
        return "刚刚";
      }
      if (diff < 36e5) {
        return `${Math.floor(diff / 6e4)}分钟前`;
      }
      if (diff < 864e5) {
        return `${Math.floor(diff / 36e5)}小时前`;
      }
      return date.toLocaleDateString();
    };
    const handleNewMessage = (message) => {
      const notification = {
        ...message,
        read: false,
        fromUserIcon: message.fromUserIcon || "/static/default-avatar.png",
        fromUserName: message.fromUserName || "用户",
        createTime: (/* @__PURE__ */ new Date()).toISOString()
      };
      utils_storage.addNotification(notification);
      notifications.value = utils_storage.getNotifications();
      unreadCount.value = utils_storage.getUnreadCount();
    };
    const handleMarkAllAsRead = () => {
      utils_storage.markAllAsRead();
      notifications.value = utils_storage.getNotifications();
      unreadCount.value = 0;
    };
    const handleDeleteNotification = (index) => {
      utils_storage.deleteNotification(index);
      notifications.value = utils_storage.getNotifications();
      unreadCount.value = utils_storage.getUnreadCount();
    };
    const handleClearAll = () => {
      common_vendor.index.showModal({
        title: "提示",
        content: "确定要清空所有消息吗？",
        success: (res) => {
          if (res.confirm) {
            utils_storage.clearAllNotifications();
            notifications.value = [];
            unreadCount.value = 0;
          }
        }
      });
    };
    const onRefresh = async () => {
      isRefreshing.value = true;
      notifications.value = utils_storage.getNotifications();
      unreadCount.value = utils_storage.getUnreadCount();
      setTimeout(() => {
        isRefreshing.value = false;
      }, 1e3);
    };
    common_vendor.onMounted(() => {
      utils_websocket.wsClient.connect();
      utils_websocket.wsClient.addMessageHandler(handleNewMessage);
    });
    common_vendor.onUnmounted(() => {
      utils_websocket.wsClient.removeMessageHandler(handleNewMessage);
    });
    return {
      notifications,
      isRefreshing,
      unreadCount,
      formatNotification,
      formatTime,
      onRefresh,
      handleMarkAllAsRead,
      handleDeleteNotification,
      handleClearAll
    };
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $setup.notifications.length === 0
  }, $setup.notifications.length === 0 ? {
    b: common_assets._imports_0$2
  } : {}, {
    c: common_vendor.f($setup.notifications, (notification, index, i0) => {
      return {
        a: notification.fromUserIcon || "/static/default-avatar.png",
        b: common_vendor.t(notification.fromUserName || "用户"),
        c: common_vendor.t($setup.formatTime(notification.createTime)),
        d: common_vendor.t($setup.formatNotification(notification)),
        e: index,
        f: !notification.read ? 1 : ""
      };
    }),
    d: $setup.isRefreshing,
    e: common_vendor.o((...args) => $setup.onRefresh && $setup.onRefresh(...args))
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/message/message.js.map
