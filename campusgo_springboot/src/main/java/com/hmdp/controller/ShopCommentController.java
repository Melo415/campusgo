package com.hmdp.controller;

import com.hmdp.dto.Result;
import com.hmdp.dto.ShopCommentDTO;
import com.hmdp.dto.UserDTO;
import com.hmdp.entity.ShopComment;
import com.hmdp.service.IShopCommentService;
import com.hmdp.utils.UserHolder;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/shop/comment")
public class ShopCommentController {

    @Resource
    private IShopCommentService shopCommentService;

    /**
     * 新增评论
     */
    @PostMapping
    public Result addComment(@RequestBody ShopCommentDTO dto) {
        if (dto.getShopId() == null) {
            return Result.fail("缺少店铺ID");
        }
        if (dto.getContent() == null || dto.getContent().trim().isEmpty()) {
            return Result.fail("评论内容不能为空");
        }
        // 用户登录校验
        UserDTO user = UserHolder.getUser();
        if (user == null) {
            return Result.fail("用户未登录");
        }
        ShopComment comment = new ShopComment();
        comment.setShopId(dto.getShopId());
        comment.setParentId(dto.getParentId() == null ? 0L : dto.getParentId());
        comment.setAnswerId(dto.getAnswerId());
        comment.setContent(dto.getContent());
        comment.setUserId(user.getId());
        comment.setCreateTime(LocalDateTime.now());
        comment.setUpdateTime(LocalDateTime.now());
        shopCommentService.save(comment);
        return Result.ok();
    }

    /**
     * 查询某个店铺底下的所有评论 全量查询
     * @param shopId
     * @return
     */
    @GetMapping("/{shopId}")
    public Result queryCommentsByShop(@PathVariable("shopId") Long shopId) {
        List<ShopComment> comments = shopCommentService
                .lambdaQuery()
                .eq(ShopComment::getShopId, shopId)
                .orderByDesc(ShopComment::getLiked)
                .orderByDesc(ShopComment::getCreateTime)
                .list();
        return Result.ok(comments);
    }
}
