package com.hmdp.service;

public interface INotificationService {
    /**
     * 发送点赞通知
     * @param fromUserId 点赞人的ID
     * @param blogId 被点赞的博客ID
     */
    void sendLikeNotification(Long fromUserId, Long blogId);

    /**
     * 发送关注通知
     * @param fromUserId 关注人的ID
     * @param toUserId 被关注人的ID
     */
    void sendFollowNotification(Long fromUserId, Long toUserId);
}
