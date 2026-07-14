package com.hmdp.service.impl;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.bean.copier.CopyOptions;
import cn.hutool.core.util.RandomUtil;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.hmdp.dto.LoginFormDTO;
import com.hmdp.dto.RegisterFormDTO;
import com.hmdp.dto.Result;
import com.hmdp.dto.UserDTO;
import com.hmdp.entity.User;
import com.hmdp.entity.UserInfo;
import com.hmdp.mapper.UserMapper;
import com.hmdp.service.IUserInfoService;
import com.hmdp.service.IUserService;
import com.hmdp.utils.PasswordEncoder;
import com.hmdp.utils.RegexUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import javax.servlet.http.HttpSession;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import static com.hmdp.utils.RedisConstants.*;
import static com.hmdp.utils.SystemConstants.USER_NICK_NAME_PREFIX;

/**
 * <p>
 * 服务实现类
 * </p>
 *
 * @author 虎哥
 * @since 2021-12-22
 */
@Slf4j
@Service
public class UserServiceImpl extends ServiceImpl<UserMapper, User> implements IUserService {

    @Resource
    private StringRedisTemplate stringRedisTemplate;

    @Resource
    private IUserInfoService userInfoService;


    @Override
    public Result sendCode(String phone, HttpSession session) {
        if (RegexUtils.isPhoneInvalid(phone)) {
            return Result.fail("手机号格式错误！");
        }

        String code = RandomUtil.randomNumbers(6);
        stringRedisTemplate.opsForValue().set(LOGIN_CODE_KEY + phone, code, LOGIN_CODE_TTL, TimeUnit.MINUTES);
        log.debug("发送短信验证码成功,验证码: {}", code);
        return Result.ok();
    }

    /**
     * 根据前端的请求 来判断登录方式
     * @param loginForm
     * @param session
     * @return
     */
    @Override
    public Result login(LoginFormDTO loginForm, HttpSession session) {


        String phone = loginForm.getPhone();
        if (RegexUtils.isPhoneInvalid(phone)) {
            return Result.fail("手机号格式错误！");
        }


        if (loginForm.getCode() != null) {
            return loginByCode(loginForm, session);
        } else if (loginForm.getPassword() != null) {
            return loginByPassword(loginForm, session);
        }

        return Result.fail("请输入验证码或密码");
    }
    /**
     * 短信验证码登录
     * @param loginForm
     * @param session
     * @return
     */
    private Result loginByCode(LoginFormDTO loginForm, HttpSession session) {

        String phone = loginForm.getPhone();

        String cacheCode = stringRedisTemplate.opsForValue().get(LOGIN_CODE_KEY + phone);

        String code = loginForm.getCode();
        if (cacheCode == null || !cacheCode.equals(code)) {
            return Result.fail("验证码错误");
        }

        User user = query().eq("phone", phone).one();
        if (user == null) {
            //user = createWithphone(phone);
            return Result.fail("用户名不存在，请先注册！");
        }

        return getResult(user);
    }


    /**
     * 账号密码登录 前 进行注册
     * @param registerForm
     * @return
     */
    @Override
    public Result register(RegisterFormDTO registerForm) {
        String phone = registerForm.getPhone();
        if (RegexUtils.isPhoneInvalid(phone)) {
            return Result.fail("手机号格式错误！");
        }
        // 检查手机号是否已注册
        User user = query().eq("phone", phone).one();
        if (user != null) {
            return Result.fail("该手机号已注册");
        }

        // 创建新用户
        user = new User();
        user.setPhone(phone);
        // 对密码进行加密
        String encryptedPassword = PasswordEncoder.encode(registerForm.getPassword());
        user.setPassword(encryptedPassword);
        user.setNickName(USER_NICK_NAME_PREFIX + RandomUtil.randomString(10));
        save(user);

        // 创建用户详细信息
        UserInfo userInfo = new UserInfo();
        userInfo.setUserId(user.getId());
        userInfo.setIntroduce("这个人很懒，什么都没写~");
        userInfo.setCity("未设置城市");
        userInfo.setFans(0);
        userInfo.setFollowee(0);
        userInfo.setGender(false);
        userInfo.setLevel(false);
        userInfo.setCredits(0);
        userInfo.setCreateTime(LocalDateTime.now());
        userInfo.setUpdateTime(LocalDateTime.now());

        userInfoService.save(userInfo);

        return Result.ok();
    }
/*    @Override
    public Result register(RegisterFormDTO registerForm) {

        String phone = registerForm.getPhone();
        if (RegexUtils.isPhoneInvalid(phone)) {
            return Result.fail("手机号格式错误！");
        }
        // 检查手机号是否已注册
        User user = query().eq("phone", phone).one();
        if (user != null) {
            return Result.fail("该手机号已注册");
        }

        // 创建新用户
        user = new User();
        user.setPhone(phone);
        user.setPassword(registerForm.getPassword());
        user.setNickName(USER_NICK_NAME_PREFIX + RandomUtil.randomString(10));
        save(user);

        *//*user=createWithphone(phone);
        user.setPassword(registerForm.getPassword());*//*
        return Result.ok();
    }*/


    /**
     * 账号密码登录
     * @param loginForm
     * @param session
     * @return
     */
    private Result loginByPassword(LoginFormDTO loginForm, HttpSession session) {
        String phone = loginForm.getPhone();
        User user = query().eq("phone", phone).one();
        if (user == null) {
            return Result.fail("用户不存在");
        }
        // 验证密码
        if (!PasswordEncoder.matches(user.getPassword(), loginForm.getPassword())) {
            return Result.fail("密码错误");
        }
        return getResult(user);
    }

    private Result getResult(User user) {

        //相当于创建令牌  存在redis里面
        String token = UUID.randomUUID().toString();

        UserDTO userDTO = BeanUtil.copyProperties(user, UserDTO.class);

        Map<String, Object> userMap = BeanUtil.beanToMap(userDTO, new HashMap<>(),
                CopyOptions.create()
                        .setIgnoreNullValue(true)
                        .setFieldValueEditor((fieldName, fieldValue) -> fieldValue.toString()));


        String tokenKey = LOGIN_USER_KEY + token;

        stringRedisTemplate.opsForHash().putAll(tokenKey, userMap);

        stringRedisTemplate.expire(tokenKey, LOGIN_USER_TTL, TimeUnit.MINUTES);

        return Result.ok(token);

    }


    private User createWithphone(String phone) {
        User user = new User();
        user.setPhone(phone);
        user.setNickName(USER_NICK_NAME_PREFIX + RandomUtil.randomString(10));
        save(user);
        return user;
    }
}
