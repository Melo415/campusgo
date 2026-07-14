package com.hmdp;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.StringRedisTemplate;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest
class HmDianPingApplicationTests {


    @Autowired
    private StringRedisTemplate stringRedisTemplate;

    @Test
    public void testRedisOperations() {
        // 1. 设置一个键值对
        String key = "testKey";
        String value = "testValue";
        stringRedisTemplate.opsForValue().set(key, value);

        Map<String,String> map=new HashMap<>();
        map.put("name","zhangsan");
        map.put("age","19");
        stringRedisTemplate.opsForHash().putAll("user1",map);

        // 2. 获取键对应的值并验证
        String retrievedValue = stringRedisTemplate.opsForValue().get(key);
        assertNotNull(retrievedValue);
        assertEquals(value, retrievedValue);

        // 3. 设置键的过期时间
        stringRedisTemplate.expire(key, 100, TimeUnit.SECONDS);

        // 4. 删除键
    /*    Boolean deleted = stringRedisTemplate.delete(key);
        assertEquals(true, deleted);*/
    }

}
