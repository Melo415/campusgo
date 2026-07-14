package com.hmdp.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.hmdp.dto.Result;
import com.hmdp.dto.UserDTO;
import com.hmdp.entity.Follow;
import com.hmdp.entity.User;
import com.hmdp.mapper.FollowMapper;
import com.hmdp.service.IFollowService;
import com.hmdp.service.IUserService;
import com.hmdp.utils.UserHolder;
import org.springframework.stereotype.Service;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.BeanUtil;

import javax.annotation.Resource;
import java.util.List;
import java.util.stream.Collectors;
import java.util.Collections;

@Service
public class FollowServiceImpl implements IFollowService {
    @Resource
    private FollowMapper followMapper;
    
    @Resource
    private IUserService userService;

    @Override
    public Result follow(Long followUserId, Boolean isFollow) {
        // ... 现有的follow方法实现 ...
        return null;
    }

    @Override
    public Result isFollow(Long followUserId) {
        // ... 现有的isFollow方法实现 ...
        return null;
    }

    @Override
    public Result followCommons(Long id) {
        // ... 现有的followCommons方法实现 ...
        return null;
    }

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
} 