"use strict";
const common_vendor = require("../common/vendor.js");
const NOTIFICATIONS_KEY = "notifications";
const getNotifications = () => {
  try {
    const notifications = common_vendor.index.getStorageSync(NOTIFICATIONS_KEY);
    return notifications ? JSON.parse(notifications) : [];
  } catch (error) {
    common_vendor.index.__f__("error", "at utils/storage.js:9", "获取通知失败:", error);
    return [];
  }
};
const addNotification = (notification) => {
  try {
    const notifications = getNotifications();
    notifications.unshift(notification);
    common_vendor.index.setStorageSync(NOTIFICATIONS_KEY, JSON.stringify(notifications));
  } catch (error) {
    common_vendor.index.__f__("error", "at utils/storage.js:21", "添加通知失败:", error);
  }
};
const markAllAsRead = () => {
  try {
    const notifications = getNotifications();
    const updatedNotifications = notifications.map((notification) => ({
      ...notification,
      read: true
    }));
    common_vendor.index.setStorageSync(NOTIFICATIONS_KEY, JSON.stringify(updatedNotifications));
  } catch (error) {
    common_vendor.index.__f__("error", "at utils/storage.js:35", "标记已读失败:", error);
  }
};
const deleteNotification = (index) => {
  try {
    const notifications = getNotifications();
    notifications.splice(index, 1);
    common_vendor.index.setStorageSync(NOTIFICATIONS_KEY, JSON.stringify(notifications));
  } catch (error) {
    common_vendor.index.__f__("error", "at utils/storage.js:46", "删除通知失败:", error);
  }
};
const clearAllNotifications = () => {
  try {
    common_vendor.index.setStorageSync(NOTIFICATIONS_KEY, JSON.stringify([]));
  } catch (error) {
    common_vendor.index.__f__("error", "at utils/storage.js:55", "清空通知失败:", error);
  }
};
const getUnreadCount = () => {
  try {
    const notifications = getNotifications();
    return notifications.filter((notification) => !notification.read).length;
  } catch (error) {
    common_vendor.index.__f__("error", "at utils/storage.js:65", "获取未读数量失败:", error);
    return 0;
  }
};
exports.addNotification = addNotification;
exports.clearAllNotifications = clearAllNotifications;
exports.deleteNotification = deleteNotification;
exports.getNotifications = getNotifications;
exports.getUnreadCount = getUnreadCount;
exports.markAllAsRead = markAllAsRead;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/storage.js.map
