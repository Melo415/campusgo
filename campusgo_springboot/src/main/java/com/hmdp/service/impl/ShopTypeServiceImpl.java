package com.hmdp.service.impl;

import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONUtil;
import com.hmdp.dto.Result;
import com.hmdp.entity.ShopType;
import com.hmdp.mapper.ShopTypeMapper;
import com.hmdp.service.IShopTypeService;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * <p>
 *  服务实现类
 * </p>
 *
 * @author 虎哥
 * @since 2021-12-22
 */
@Service
public class ShopTypeServiceImpl extends ServiceImpl<ShopTypeMapper, ShopType> implements IShopTypeService {


    @Resource
    private StringRedisTemplate stringRedisTemplate;
    private static final String SHOP_TYPE_KEY = "cache:shop-type:list";
    @Override
    public Result queryTypeList() {

        // 1. 从 Redis 中查询店铺类型列表缓存
        String typeListJson = stringRedisTemplate.opsForValue().get(SHOP_TYPE_KEY);


        // 2. 判断是否存在
        if (StrUtil.isNotBlank(typeListJson)) {
            // 3. 存在，直接返回
            List<ShopType> typeList = JSONUtil.toList(typeListJson, ShopType.class);
            return Result.ok(typeList);
        }

        // 4. 不存在，根据条件查询数据库
        List<ShopType> typeList = this
                .query().orderByAsc("sort").list();

        // 5. 不存在，返回错误（这里列表为空不认为是错误，只是没有数据）
        if (typeList.isEmpty()) {
            return Result.fail("未找到店铺类型数据！");
        }
        // 6. 存在，写入 Redis
        stringRedisTemplate.opsForValue().set(SHOP_TYPE_KEY, JSONUtil.toJsonStr(typeList), 1, TimeUnit.HOURS);

        // 7. 返回
        return Result.ok(typeList);
    }
}
