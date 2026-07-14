package com.hmdp.controller;

import com.hmdp.dto.Result;
import com.hmdp.dto.UserDTO;
import com.hmdp.entity.BlogComments;
import com.hmdp.service.IBlogCommentsService;
import com.hmdp.utils.UserHolder;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;

@RestController
@RequestMapping("/blog/comments")
public class BlogCommentsController {
    @Resource
    private IBlogCommentsService commentService;

    @PostMapping
    public Result saveComment(@RequestBody BlogComments comment) {
        return commentService.saveComment(comment);
    }

    @PostMapping("/reply")
    public Result replyComment(@RequestBody BlogComments comment) {
        return commentService.saveComment(comment);
    }


    @GetMapping("/{blogId}")
    public Result queryCommentsByBlogId(@PathVariable("blogId") Long blogId) {
        return commentService.queryCommentsByBlogId(blogId);
    }


    @GetMapping("/of/me")
    public Result queryMyComments() {
        // 获取登录用户
        UserDTO user = UserHolder.getUser();
        if (user == null) {
            return Result.fail("未登录");
        }
        return commentService.queryUserComments(user.getId());
    }

    // ... existing code ...

    @DeleteMapping("/{id}")
    public Result deleteComment(@PathVariable("id") Long id) {
        // 获取登录用户
        UserDTO user = UserHolder.getUser();
        if (user == null) {
            return Result.fail("未登录");
        }
        return commentService.deleteComment(id, user.getId());
    }
}
