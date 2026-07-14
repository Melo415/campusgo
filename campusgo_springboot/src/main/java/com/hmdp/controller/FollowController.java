package com.hmdp.controller;


import com.hmdp.dto.Result;
import com.hmdp.service.IFollowService;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;

/**
 * <p>
 *  前端控制器
 * </p>
 *
 * @author 虎哥
 * @since 2021-12-22
 */
@RestController
@RequestMapping("/follow")
public class FollowController {

    @Resource
    private IFollowService followService;

    @PutMapping("/{id}/{isFollow}")
    public Result follow(@PathVariable("id") Long followUserId,@PathVariable("isFollow") Boolean isFollow){

        return followService.follow(followUserId,isFollow);

    }

    @GetMapping("/or/not/{id}")
    public Result isFollow(@PathVariable("id") Long followUserId){

        return followService.isFollow(followUserId);
    }


    @GetMapping("/common/{id}")
    public Result followCommons(@PathVariable("id") Long id){

        return followService.followCommons(id);
    }

    /**
     * 查询关注列表
     * @return
     */
    @GetMapping("/followings")
    public Result followings() {
        return followService.queryFollowings();
    }


    /**
     * 查询粉丝列表
     * @return
     */
    @GetMapping("/followers")
    public Result followers() {
        return followService.queryFollowers();
    }

     /**
     * 查询用户的关注数量和粉丝数量
     * @param userId 用户ID
     * @return 关注数量和粉丝数量
     */
    @GetMapping("/count/{userId}")
    public Result queryFollowCount(@PathVariable("userId") Long userId) {
        return followService.queryFollowCount(userId);
    }

}
