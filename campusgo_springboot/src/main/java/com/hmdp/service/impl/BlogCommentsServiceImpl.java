package com.hmdp.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.hmdp.dto.BlogCommentsDTO;
import com.hmdp.dto.Result;
import com.hmdp.dto.UserDTO;
import com.hmdp.entity.Blog;
import com.hmdp.entity.BlogComments;
import com.hmdp.entity.User;
import com.hmdp.mapper.BlogCommentsMapper;
import com.hmdp.service.IBlogCommentsService;
import com.hmdp.service.IBlogService;
import com.hmdp.service.IUserService;
import com.hmdp.utils.UserHolder;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class BlogCommentsServiceImpl extends ServiceImpl<BlogCommentsMapper, BlogComments> implements IBlogCommentsService {

    @Autowired
    private IUserService userService;

    @Autowired
    private IBlogService blogService;

    @Override
    public Result saveComment(BlogComments comment) {
        // 1.获取登录用户
        Long userId = UserHolder.getUser().getId();
        comment.setUserId(userId);
        
        // 2.保存评论
        boolean isSuccess = save(comment);
        if (!isSuccess) {
            return Result.fail("评论失败");
        }
        
        // 3.更新博客的评论数量
        blogService.update()
                .setSql("comments = comments + 1")
                .eq("id", comment.getBlogId())
                .update();
        
        return Result.ok(comment.getId());
    }

    @Override
    public Result  queryCommentsByBlogId(Long blogId) {
        // 1. 查询一级评论
        List<BlogComments> comments = query().eq("blog_id", blogId)
                .eq("parent_id", 0)
                .orderByDesc("create_time")
                .list();
        if (comments.isEmpty()) {
            return Result.ok(comments);
        }
        // 2. 查询评论用户信息并转换为DTO
        List<BlogCommentsDTO> commentDTOS = comments.stream().map(comment -> {
            BlogCommentsDTO commentDTO = new BlogCommentsDTO();
            BeanUtils.copyProperties(comment, commentDTO);
            // 查询评论用户信息
            User user = userService.getById(comment.getUserId());
            if (user != null) {
                commentDTO.setNickName(user.getNickName());
                commentDTO.setIcon(user.getIcon());
            } else {
                commentDTO.setNickName("未知用户");
                commentDTO.setIcon("/static/default-avatar.png");
            }
            // 查询子评论
            List<BlogComments> children = query().eq("parent_id", comment.getId())
                    .orderByDesc("create_time")
                    .list();
            if (!children.isEmpty()) {
                List<BlogCommentsDTO> childDTOS = children.stream().map(child -> {
                    BlogCommentsDTO childDTO = new BlogCommentsDTO();
                    BeanUtils.copyProperties(child, childDTO);
                    // 查询评论用户信息
                    User childUser = userService.getById(child.getUserId());
                    if (childUser != null) {
                        childDTO.setNickName(childUser.getNickName());
                        childDTO.setIcon(childUser.getIcon());
                    } else {
                        childDTO.setNickName("未知用户");
                        childDTO.setIcon("/static/default-avatar.png");
                    }
                    // 查询被回复用户信息
                    if (child.getAnswerId() != null && child.getAnswerId() > 0) {
                        BlogComments answerComment = getById(child.getAnswerId());
                        if (answerComment != null) {
                            User targetUser = userService.getById(answerComment.getUserId());
                            if (targetUser != null) {
                                childDTO.setTargetUserId(targetUser.getId());
                                childDTO.setTargetNickName(targetUser.getNickName());
                            }
                        }
                    }
                    return childDTO;
                }).collect(Collectors.toList());
                commentDTO.setChildren(childDTOS);
            }
            return commentDTO;
        }).collect(Collectors.toList());
        return Result.ok(commentDTOS);
    }

    @Override
    public Result deleteComment(Long id, Long id1) {
        return null;
    }

    @Override
    public Result queryUserComments(Long userId) {
        // 1. 查询用户的一级评论（parent_id = 0）
        List<BlogComments> comments = query()
                .eq("user_id", userId)
                .eq("parent_id", 0)
                .orderByDesc("create_time")
                .list();

        if (comments.isEmpty()) {
            return Result.ok(comments);
        }

        // 2. 查询评论用户信息并转换为DTO
        List<BlogCommentsDTO> commentDTOS = comments.stream().map(comment -> {

            BlogCommentsDTO commentDTO = new BlogCommentsDTO();

            BeanUtils.copyProperties(comment, commentDTO);

            // 查询评论用户信息
            User user = userService.getById(comment.getUserId());
            if (user != null) {
                commentDTO.setNickName(user.getNickName());
                commentDTO.setIcon(user.getIcon());
            } else {
                commentDTO.setNickName("未知用户");
                commentDTO.setIcon("/static/default-avatar.png");
            }

            // 查询博客信息
            Blog blog = blogService.getById(comment.getBlogId());
            if (blog != null) {
                commentDTO.setBlogTitle(blog.getTitle());
                commentDTO.setBlogContent(blog.getContent());
                commentDTO.setBlogImages(blog.getImages());

                // 查询博客作者信息
                User blogUser = userService.getById(blog.getUserId());
                if (blogUser != null) {
                    commentDTO.setBlogUserName(blogUser.getNickName());
                    commentDTO.setBlogUserIcon(blogUser.getIcon());
                }
            }

            // 设置点赞数
            commentDTO.setLiked(comment.getLiked());

            // 查询该评论的回复数量
            int replyCount = query()
                    .eq("parent_id", comment.getId())
                    .count();
            commentDTO.setReplyCount(replyCount);

            return commentDTO;
        }).collect(Collectors.toList());

        return Result.ok(commentDTOS);
    }
}
