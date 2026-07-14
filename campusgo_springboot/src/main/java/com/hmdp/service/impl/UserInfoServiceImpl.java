package com.hmdp.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.hmdp.dto.Result;
import com.hmdp.entity.UserInfo;
import com.hmdp.mapper.UserInfoMapper;
import com.hmdp.service.IBlogService;
import com.hmdp.service.IUserInfoService;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * <p>
 *  服务实现类
 * </p>
 *
 * @author 虎哥
 * @since 2021-12-24
 */
@Service
public class UserInfoServiceImpl extends ServiceImpl<UserInfoMapper, UserInfo> implements IUserInfoService {
    @Autowired
    private IBlogService blogService;

    @Override
    public Result updateUserInfo(UserInfo userInfo) {
        try {
            // 更新用户信息
            boolean success = updateById(userInfo);
            if (success) {
                return Result.ok();
            }
            return Result.fail("更新用户信息失败");
        } catch (Exception e) {
            log.error("更新用户信息失败", e);
            return Result.fail("更新用户信息失败");
        }
    }

    @Override
    public Result getUserInfo(Long userId) {
        try {
            // 获取用户信息
            UserInfo userInfo = getById(userId);
            if (userInfo == null) {
                return Result.fail("用户信息不存在");
            }
            return Result.ok(userInfo);
        } catch (Exception e) {
            log.error("获取用户信息失败", e);
            return Result.fail("获取用户信息失败");
        }
    }

    @Override
    public UserInfo getByUserId(Long userId) {
        LambdaQueryWrapper<UserInfo> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(UserInfo::getUserId, userId);
        return this.getOne(queryWrapper);
    }
}
