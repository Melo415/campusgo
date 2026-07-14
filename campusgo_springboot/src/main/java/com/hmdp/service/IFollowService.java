package com.hmdp.service;

import com.hmdp.dto.Result;
import com.hmdp.entity.Follow;
import com.baomidou.mybatisplus.extension.service.IService;

/**
 * <p>
 *  服务类
 * </p>
 *
 * @author 虎哥
 * @since 2021-12-22
 */
public interface IFollowService extends IService<Follow> {

    Result follow(Long followUserId, Boolean isFollow);

    Result isFollow(Long followUserId);

    Result followCommons(Long id);
    
    Result queryFollowings();

    Result queryFollowers();

     /**
     * 查询用户的关注数量和粉丝数量
     * @param userId 用户ID
     * @return 关注数量和粉丝数量
     */
    Result queryFollowCount(Long userId);
}
