package com.hmdp.enums;

import lombok.Getter;

@Getter
public enum NotificationTypeEnum {
    LIKE(1, "点赞"),
    COMMENT(2, "评论"),
    FOLLOW(3, "关注");
    
    private final Integer type;
    private final String desc;
    
    NotificationTypeEnum(Integer type, String desc) {
        this.type = type;
        this.desc = desc;
    }
}
