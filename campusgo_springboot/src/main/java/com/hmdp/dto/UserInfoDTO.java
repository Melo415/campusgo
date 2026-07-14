package com.hmdp.dto;

import lombok.Data;

@Data
public class UserInfoDTO {
    private String nickName;    // 昵称
    private String icon;        // 头像
    private String signature;   // 个性签名
    private String city;        // 城市
    private String gender;      // 性别
}
