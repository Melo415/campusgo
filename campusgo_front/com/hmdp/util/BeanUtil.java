package com.hmdp.util;

import org.springframework.beans.BeanUtils;

public class BeanUtil {
    public static <T> T copyProperties(Object source, Class<T> targetClass) {
        try {
            T target = targetClass.newInstance();
            BeanUtils.copyProperties(source, target);
            return target;
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
} 