package com.hmdp.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class BlogCommentsDTO {
    /**
     * 评论id
     */
    private Long id;

    /**
     * 用户id
     */
    private Long userId;

    /**
     * 用户昵称
     */
    private String nickName;

    /**
     * 用户头像
     */
    private String icon;

    /**
     * 探店id
     */
    private Long blogId;

    /**
     * 博客标题
     */
    private String blogTitle;

    /**
     * 博客内容
     */
    private String blogContent;

    /**
     * 博客图片
     */
    private String blogImages;

    /**
     * 博客作者昵称
     */
    private String blogUserName;

    /**
     * 博客作者头像
     */
    private String blogUserIcon;

    /**
     * 关联的1级评论id，如果是一级评论，则值为0
     */
    private Long parentId;

    /**
     * 回复的评论id
     */
    private Long answerId;

    /**
     * 回复的目标用户id
     */
    private Long targetUserId;

    /**
     * 回复的目标用户昵称
     */
    private String targetNickName;

    /**
     * 回复的内容
     */
    private String content;

    /**
     * 点赞数
     */
    private Integer liked;

    /**
     * 回复数量
     */
    private Integer replyCount;

    /**
     * 创建时间
     */
    private LocalDateTime createTime;

    /**
     * 子评论列表
     */
    private List<BlogCommentsDTO> children;
}
