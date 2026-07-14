package com.hmdp.service.impl;

import cn.hutool.core.bean.BeanUtil;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.hmdp.dto.Result;
import com.hmdp.dto.UserDTO;
import com.hmdp.entity.Follow;
import com.hmdp.entity.User;
import com.hmdp.mapper.FollowMapper;
import com.hmdp.service.IFollowService;
import com.hmdp.service.INotificationService;
import com.hmdp.service.IUserService;
import com.hmdp.utils.UserHolder;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.util.*;
import java.util.stream.Collectors;

/**
 * <p>
 *  服务实现类
 * </p>
 *
 * @author 虎哥
 * @since 2021-12-22
 */
@Service
public class FollowServiceImpl extends ServiceImpl<FollowMapper, Follow> implements IFollowService {

    @Resource
    private StringRedisTemplate stringRedisTemplate;

    @Resource
    private IUserService userService;

    @Resource
    private FollowMapper followMapper;

    @Resource
    private INotificationService notificationService;

    @Override
    public Result follow(Long followUserId, Boolean isFollow) {
        // 1.获取登录用户
        Long userId = UserHolder.getUser().getId();
        String key = "follows:" + userId;

        // 2.判断是关注还是取关
        if (isFollow) {
            // 3.关注前先检查是否已关注（幂等性处理，避免重复插入和重复推送通知）
            Integer count = query().eq("user_id", userId).eq("follow_user_id", followUserId).count();
            if (count > 0) {
                // 已经关注过了，直接返回，不重复操作
                return Result.ok();
            }

            // 4.关注，新增数据
            Follow follow = new Follow();
            follow.setUserId(userId);
            follow.setFollowUserId(followUserId);
            boolean isSuccess = save(follow);

            if (isSuccess) {
                // 把关注用户的id，放入redis的set集合
                stringRedisTemplate.opsForSet().add(key, followUserId.toString());

                // 发送关注通知
                notificationService.sendFollowNotification(userId, followUserId);
            }
        } else {
            // 5.取关，删除 delete from tb_follow where user_id = ? and follow_user_id = ?
            boolean isSuccess = remove(new QueryWrapper<Follow>()
                    .eq("user_id", userId).eq("follow_user_id", followUserId));

            if (isSuccess) {
                // 把关注用户的id从Redis集合中移除
                stringRedisTemplate.opsForSet().remove(key, followUserId.toString());
            }
        }
        return Result.ok();
    }

    @Override
    public Result followCommons(Long id) {

        Long userId =UserHolder.getUser().getId();
        String key="follows:"+userId;
        String key2="follows:"+id;

        Set<String> intersect = stringRedisTemplate.opsForSet().intersect(key, key2);
        if (intersect == null || intersect.isEmpty()) {
            return Result.ok(java.util.Collections.emptyList());
        }

        List<Long> ids = intersect.stream().map(Long::valueOf).collect(Collectors.toList());

        List<UserDTO> users = userService.listByIds(ids)
                .stream()
                .map(user -> BeanUtil.copyProperties(user, UserDTO.class))
                .collect(Collectors.toList());

        return Result.ok(users);

    }

    @Override
    public Result isFollow(Long followUserId) {

        Long userId =UserHolder.getUser().getId();

        Integer count = query().eq("user_id", userId).eq("follow_user_id", followUserId).count();

        return Result.ok(count>0);
    }


    @Override
    public Result queryFollowers() {
        // 1.获取当前登录用户
        Long userId = UserHolder.getUser().getId();

        // 2.查询所有关注了当前用户的用户
        List<Follow> follows = query()
                .eq("follow_user_id", userId)
                .list();

        // 3.如果没有粉丝，直接返回空集合
        if (follows.isEmpty()) {
            return Result.ok(Collections.emptyList());
        }

        // 4.获取所有粉丝的用户id
        List<Long> followerIds = follows.stream()
                .map(Follow::getUserId)
                .collect(Collectors.toList());

        // 5.查询用户信息
        List<UserDTO> users = userService.listByIds(followerIds)
                .stream()
                .map(user -> BeanUtil.copyProperties(user, UserDTO.class))
                .collect(Collectors.toList());

        return Result.ok(users);
    }


    /**
     * 查询当前用户关注了哪些人
     * @return
     */
    @Override

    public Result queryFollowings() {


        // 1.获取当前用户
        Long userId = UserHolder.getUser().getId();
        // 2.查询关注列表
        List<Follow> follows = query()
                .eq("user_id", userId)
                .list();
        // 3.获取关注用户的ID列表
        List<Long> followUserIds = follows.stream()
                .map(Follow::getFollowUserId)
                .collect(Collectors.toList());

        if (followUserIds.isEmpty()) {
            return Result.ok(Collections.emptyList());
        }
        // 4.查询用户信息
        List<User> users = userService.listByIds(followUserIds);
        // 5.转换为UserDTO
        List<UserDTO> userDTOs = users.stream()
                .map(user -> BeanUtil.copyProperties(user, UserDTO.class))
                .collect(Collectors.toList());
        // 6.返回
        return Result.ok(userDTOs);
    }

    @Override
    public Result queryFollowCount(Long userId) {
        // 1.查询关注数量
        Integer followCount = query()
                .eq("user_id", userId)
                .count();

        // 2.查询粉丝数量
        Integer followerCount = query()
                .eq("follow_user_id", userId)
                .count();


        // 3.返回结果
        Map<String, Integer> result = new HashMap<>();
        result.put("followCount", followCount);
        result.put("followerCount", followerCount);

        return Result.ok(result);
    }

}
