package com.hmdp.controller;


import cn.hutool.core.bean.BeanUtil;
import com.hmdp.dto.*;
import com.hmdp.entity.User;
import com.hmdp.entity.UserInfo;
import com.hmdp.service.IBlogService;
import com.hmdp.service.IUserInfoService;
import com.hmdp.service.IUserService;
import com.hmdp.utils.UserHolder;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import javax.servlet.http.HttpSession;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * <p>
 * 前端控制器
 * </p>
 *
 * @author 虎哥
 * @since 2021-12-22
 */

@Slf4j
@RestController
@RequestMapping("/user")
//@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class UserController {

    @Resource
    private IUserService userService;

    @Resource
    private IUserInfoService userInfoService;

    @Resource
    private IBlogService blogService;
    /**
     * 发送手机验证码
     */
    @PostMapping("/code")
    public Result sendCode(@RequestParam("phone") String phone, HttpSession session) {
        //  发送短信验证码并保存验证码
        return userService.sendCode(phone, session);
    }


  /*  @PostMapping("code")
    public Result sendCode(@RequestBody  String phone, HttpSession session) {
        //  发送短信验证码并保存验证码
        return userService.sendCode(phone,session);
    }*/

    /**
     * 登录功能
     *
     * @param loginForm 登录参数，包含手机号、验证码；或者手机号、密码
     */
    @PostMapping("/login")
    public Result login(@RequestBody LoginFormDTO loginForm, HttpSession session) {
        //  实现登录功能

        return userService.login(loginForm, session);
    }

    /**
     * 注册功能
     *
     * @param registerForm 注册参数，包含手机号、密码、验证码
     */
    @PostMapping("/register")
    public Result register(@RequestBody RegisterFormDTO registerForm) {
        return userService.register(registerForm);
    }

    /**
     * 登出功能
     *
     * @return 无
     */
    @PostMapping("/logout")
    public Result logout() {
        // TODO 实现登出功能
        return Result.fail("功能未完成");
    }



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

    /*@GetMapping("/me")
    public Result me() {
        // 获取当前登录的用户并返回
        UserDTO user = UserHolder.getUser();
        return Result.ok(user);
    }*/

    /*
        @GetMapping("/info/{id}")
        public Result info(@PathVariable("id") Long userId){
            // 查询详情
            UserInfo info = userInfoService.getById(userId);
            if (info == null) {
                // 没有详情，应该是第一次查看详情
                return Result.ok();
            }
            info.setCreateTime(null);
            info.setUpdateTime(null);
            // 返回
            return Result.ok(info);
        }*/
/*    @GetMapping("/info/{id}")
    public Result info(@PathVariable("id") Long userId) {
        try {
            // 1. 获取用户基本信息
            User user = userService.getById(userId);
            if (user == null) {
                return Result.fail("用户不存在");
            }

            // 2. 获取用户详细信息
            UserInfo info = userInfoService.getById(userId);
            if (info == null) {
                // 如果用户信息不存在，创建默认信息
                info = new UserInfo();
                info.setUserId(userId);
                info.setIntroduce("这个人很懒，什么都没写~");
                info.setCity("未设置城市");
                info.setFans(0);
                info.setFollowee(0);
                info.setGender(false);
                info.setLevel(false);
                info.setCredits(0);
                userInfoService.save(info);
            }

            // 3. 获取用户笔记数
            Integer notes = blogService.query()
                    .eq("user_id", userId)
                    .count();

            // 4. 封装返回数据
            Map<String, Object> result = new HashMap<>();
            result.put("id", user.getId());
            result.put("nickName", user.getNickName());
            result.put("icon", user.getIcon());
            result.put("signature", info.getIntroduce());
            result.put("city", info.getCity());
            result.put("fans", info.getFans());
            result.put("follows", info.getFollowee());
            result.put("notes", notes);
            result.put("gender", info.getGender());
            result.put("birthday", info.getBirthday());
            result.put("credits", info.getCredits());
            result.put("level", info.getLevel());

            return Result.ok(result);
        } catch (Exception e) {
            log.error("获取用户信息失败", e);
            return Result.fail("获取用户信息失败");
        }
    }*/

    @GetMapping("/{id}")
    public Result queryUserById(@PathVariable("id") Long userId) {

        User user = userService.getById(userId);

        if (user == null) {
            return Result.ok();
        }
        UserDTO userDTO = BeanUtil.copyProperties(user, UserDTO.class);
        return Result.ok(userDTO);
    }

/*    @PutMapping("/info")
    public Result updateUserInfo(@RequestBody UserInfoDTO userInfoDTO) {
        try {
            // 获取当前登录用户
            UserDTO user = UserHolder.getUser();
            if (user == null) {
                return Result.fail("用户未登录");
            }

            // 更新用户基本信息
            user.setNickName(userInfoDTO.getNickName());
            user.setIcon(userInfoDTO.getIcon());

            // 更新用户详细信息
            UserInfo userInfo = userInfoService.getByUserId(user.getId());

            if (userInfo == null) {
                userInfo = new UserInfo();
                userInfo.setUserId(user.getId());
            }
            userInfo.setIntroduce(userInfoDTO.getSignature());
            userInfo.setCity(userInfoDTO.getCity());
            userInfo.setGender(Boolean.valueOf(userInfoDTO.getGender()));
            userInfo.setUpdateTime(LocalDateTime.now());

            if (userInfo.getUserId() == null) {
                userInfoService.save(userInfo);
            } else {
                userInfoService.updateById(userInfo);
            }

            return Result.ok();
        } catch (Exception e) {
            log.error("更新用户信息失败", e);
            return Result.fail("更新用户信息失败");
        }
    }*/
}
