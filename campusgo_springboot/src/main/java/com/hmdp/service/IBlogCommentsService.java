package com.hmdp.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.hmdp.dto.Result;
import com.hmdp.entity.BlogComments;

public interface IBlogCommentsService extends IService<BlogComments> {
    Result saveComment(BlogComments comment);
    Result queryCommentsByBlogId(Long blogId);

    /**
     * 查询用户的评价列表
     * @param userId 用户ID
     * @return 评价列表结果
     */
    Result queryUserComments(Long userId);

    Result deleteComment(Long id, Long id1);
}
