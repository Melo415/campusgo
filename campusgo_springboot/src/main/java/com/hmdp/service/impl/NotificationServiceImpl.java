package com.hmdp.service.impl;

import com.hmdp.dto.NotificationMessage;
import com.hmdp.entity.Blog;
import com.hmdp.entity.User;
import com.hmdp.enums.NotificationTypeEnum;
import com.hmdp.handler.NotificationWebSocketHandler;
import com.hmdp.service.IBlogService;
import com.hmdp.service.INotificationService;
import com.hmdp.service.IUserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.time.LocalDateTime;

@Slf4j
@Service
public class NotificationServiceImpl implements INotificationService {

    @Resource
    private NotificationWebSocketHandler webSocketHandler;

    @Resource
    private IBlogService blogService;

    @Resource
    private IUserService userService;

    @Override
    public void sendLikeNotification(Long fromUserId, Long blogId) {
        // 1.获取博客信息
        Blog blog = blogService.getById(blogId);
        if (blog == null) {
            return;
        }

        // 2.获取点赞人信息
        User fromUser = userService.getById(fromUserId);
        if (fromUser == null) {
            return;
        }

        // 3.构建通知消息
        NotificationMessage message = new NotificationMessage();
        message.setType(NotificationTypeEnum.LIKE.getType());
        message.setFromUserId(fromUserId);
        message.setToUserId(blog.getUserId());
        message.setBlogId(blogId);
        message.setContent(fromUser.getNickName() + "点赞了你的博客");
        message.setCreateTime(LocalDateTime.now());

        // 4.发送通知
        webSocketHandler.sendMessage(blog.getUserId(), message);
    }

    @Override
    public void sendFollowNotification(Long fromUserId, Long toUserId) {


        // 1.获取关注人信息
        User fromUser = userService.getById(fromUserId);
        if (fromUser == null) {
            return;
        }


        // 2.构建通知消息
        NotificationMessage message = new NotificationMessage();

        message.setType(NotificationTypeEnum.FOLLOW.getType());

        message.setFromUserId(fromUserId);

        message.setToUserId(toUserId);

        message.setContent(fromUser.getNickName() + "关注了你");

        message.setCreateTime(LocalDateTime.now());

        // 3.发送通知
        webSocketHandler.sendMessage(toUserId, message);
    }
}
