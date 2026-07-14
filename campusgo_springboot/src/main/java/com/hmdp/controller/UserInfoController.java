package com.hmdp.controller;

import com.hmdp.dto.Result;
import com.hmdp.dto.UserDTO;
import com.hmdp.dto.UserInfoDTO;
import com.hmdp.entity.User;
import com.hmdp.entity.UserInfo;
import com.hmdp.service.IUserInfoService;
import com.hmdp.service.IUserService;
import com.hmdp.utils.AliOSSUtils;
import com.hmdp.utils.UserHolder;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.annotation.Resource;
import java.time.LocalDateTime;

@Slf4j
@RestController
@RequestMapping("/user/info")
public class UserInfoController {

    @Resource
    private IUserInfoService userInfoService;

    @Resource
    private IUserService userService;

    @Resource
    private AliOSSUtils aliOSSUtils;

    /**
     * 上传用户头像
     */
    @PostMapping("/avatar")
    public Result uploadAvatar(@RequestParam("file") MultipartFile file) {
        try {
            UserDTO user = UserHolder.getUser();
            if (user == null) {
                return Result.fail("用户未登录");
            }

            if (file.getSize() > 2 * 1024 * 1024) {
                return Result.fail("图片大小不能超过2MB");
            }

            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                return Result.fail("只能上传图片文件");
            }

            String originalFilename = file.getOriginalFilename();
            if (originalFilename == null) {
                return Result.fail("文件格式错误");
            }
            String suffix = originalFilename.substring(originalFilename.lastIndexOf("."));
            if (!suffix.equalsIgnoreCase(".jpg") &&
                    !suffix.equalsIgnoreCase(".jpeg") &&
                    !suffix.equalsIgnoreCase(".png") &&
                    !suffix.equalsIgnoreCase(".gif")) {
                return Result.fail("只支持jpg、jpeg、png、gif格式的图片");
            }

            String avatarUrl = aliOSSUtils.upload(file);

            User userEntity = new User();
            userEntity.setId(user.getId());
            userEntity.setIcon(avatarUrl);
            userService.updateById(userEntity);

            return Result.ok(avatarUrl);
        } catch (Exception e) {
            log.error("上传头像失败", e);
            return Result.fail("上传头像失败：" + e.getMessage());
        }
    }

    /**
     * 更新用户信息
     */
    @PutMapping
    public Result updateUserInfo(@RequestBody UserInfoDTO userInfoDTO) {
        try {
            UserDTO user = UserHolder.getUser();
            if (user == null) {
                return Result.fail("用户未登录");
            }

            User userEntity = new User();
            userEntity.setId(user.getId());
            userEntity.setNickName(userInfoDTO.getNickName());
            userEntity.setIcon(userInfoDTO.getIcon());
            userService.updateById(userEntity);

            UserInfo userInfo = userInfoService.getByUserId(user.getId());

            boolean isNew = false;
            if (userInfo == null) {
                userInfo = new UserInfo();
                userInfo.setUserId(user.getId());
                userInfo.setCreateTime(LocalDateTime.now());
                isNew = true;
            }

            userInfo.setIntroduce(userInfoDTO.getSignature());
            userInfo.setCity(userInfoDTO.getCity());
            userInfo.setGender("男".equals(userInfoDTO.getGender()));
            userInfo.setUpdateTime(LocalDateTime.now());

            if (isNew) {
                userInfoService.save(userInfo);
            } else {
                userInfoService.updateById(userInfo);
            }

            return Result.ok();
        } catch (Exception e) {
            log.error("更新用户信息失败", e);
            return Result.fail("更新用户信息失败");
        }
    }

    /**
     * 获取用户详细信息
     */
    @GetMapping("/{userId}")
    public Result getUserInfo(@PathVariable Long userId) {
        try {
            UserInfo userInfo = userInfoService.getByUserId(userId);
            if (userInfo == null) {
                return Result.fail("用户信息不存在");
            }
            return Result.ok(userInfo);
        } catch (Exception e) {
            log.error("获取用户信息失败", e);
            return Result.fail("获取用户信息失败");
        }
    }
}