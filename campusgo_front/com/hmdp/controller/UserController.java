package com.hmdp.controller;

import com.hmdp.dto.UserDTO;
import com.hmdp.service.IUserService;
import com.hmdp.util.BeanUtil;
import com.hmdp.util.Result;
import com.hmdp.util.UserHolder;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;

@RestController
@RequestMapping("/user")
public class UserController {
    @Resource
    private IUserService userService;

    @GetMapping("/me")
    public Result me() {
        // 获取当前登录的用户ID
        UserDTO userDTO = UserHolder.getUser();
        if (userDTO == null) {
            return Result.fail("用户未登录");
        }
        
        // 从数据库查询最新用户信息
        User user = userService.getById(userDTO.getId());
        if (user == null) {
            return Result.fail("用户不存在");
        }
        
        // 转换为UserDTO返回
        UserDTO newUserDTO = BeanUtil.copyProperties(user, UserDTO.class);
        return Result.ok(newUserDTO);
    }
} 