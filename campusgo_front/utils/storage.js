const NOTIFICATIONS_KEY = 'notifications';
const MESSAGE_CALLBACKS = new Set();

// 获取所有通知
export const getNotifications = () => {
    try {
        const notifications = uni.getStorageSync(NOTIFICATIONS_KEY);
        return notifications ? JSON.parse(notifications) : [];
    } catch (error) {
        console.error('获取通知失败:', error);
        return [];
    }
};

// 添加新通知
export const addNotification = (notification) => {
    try {
        console.log('准备添加新通知:', notification);
        const notifications = getNotifications();
        
        // 检查是否重复
        const messageId = `${notification.fromUserId}_${notification.type}_${notification.createTime}`;
        const isDuplicate = notifications.some(existing => 
            `${existing.fromUserId}_${existing.type}_${existing.createTime}` === messageId
        );

        if (!isDuplicate) {
            console.log('添加新通知:', notification);
            notifications.unshift(notification);
            uni.setStorageSync(NOTIFICATIONS_KEY, JSON.stringify(notifications));
            notifyMessageUpdate();
        } else {
            console.log('跳过重复通知');
        }
    } catch (error) {
        console.error('添加通知失败:', error);
    }
};

// 标记所有消息为已读
export const markAllAsRead = () => {
    try {
        const notifications = getNotifications();
        const updatedNotifications = notifications.map(notification => ({
            ...notification,
            read: true
        }));
        uni.setStorageSync(NOTIFICATIONS_KEY, JSON.stringify(updatedNotifications));
        notifyMessageUpdate();
    } catch (error) {
        console.error('标记已读失败:', error);
    }
};

// 删除单条通知
export const deleteNotification = (index) => {
    try {
        const notifications = getNotifications();
        notifications.splice(index, 1);
        uni.setStorageSync(NOTIFICATIONS_KEY, JSON.stringify(notifications));
        notifyMessageUpdate();
    } catch (error) {
        console.error('删除通知失败:', error);
    }
};

// 清空所有通知
export const clearAllNotifications = () => {
    try {
        uni.setStorageSync(NOTIFICATIONS_KEY, JSON.stringify([]));
        notifyMessageUpdate();
    } catch (error) {
        console.error('清空通知失败:', error);
    }
};

// 获取未读消息数量
export const getUnreadCount = () => {
    try {
        const notifications = getNotifications();
        return notifications.filter(notification => !notification.read).length;
    } catch (error) {
        console.error('获取未读数量失败:', error);
        return 0;
    }
};

// 注册消息更新回调
export const onMessageUpdate = (callback) => {
    MESSAGE_CALLBACKS.add(callback);
};

// 移除消息更新回调
export const offMessageUpdate = (callback) => {
    MESSAGE_CALLBACKS.delete(callback);
};

// 触发消息更新通知
const notifyMessageUpdate = () => {
    const unreadCount = getUnreadCount();
    console.log('通知消息更新, 未读数量:', unreadCount);
    MESSAGE_CALLBACKS.forEach(callback => callback(unreadCount));
};

// 标记单条消息为已读
export const markAsRead = (index) => {
    try {
        const notifications = getNotifications();
        if (notifications[index]) {
            notifications[index].read = true;
            uni.setStorageSync(NOTIFICATIONS_KEY, JSON.stringify(notifications));
        }
    } catch (error) {
        console.error('标记已读失败:', error);
    }
};

// 获取最新的一条通知
export const getLatestNotification = () => {
    try {
        const notifications = getNotifications();
        return notifications[0] || null;
    } catch (error) {
        console.error('获取最新通知失败:', error);
        return null;
    }
};
