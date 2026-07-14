package com.hmdp.service.impl;

import cn.hutool.core.util.BooleanUtil;
import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONUtil;
import com.hmdp.dto.Result;
import com.hmdp.entity.Shop;
import com.hmdp.mapper.ShopMapper;
import com.hmdp.service.IShopService;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.annotation.Resource;
import java.util.concurrent.TimeUnit;

import static com.hmdp.utils.RedisConstants.*;

/**
 * <p>
 *  服务实现类
 * </p>
 *
 * @author 虎哥
 * @since 2021-12-22
 */
@Service
public class ShopServiceImpl extends ServiceImpl<ShopMapper, Shop> implements IShopService {

    @Resource
    private StringRedisTemplate stringRedisTemplate;

    //缓存穿透逻辑 缓存空值
    /*public Result queryById(Long id) {

        String key =CACHE_SHOP_KEY+id;
        //1.从redis中查询商铺缓存
        String shopJson =stringRedisTemplate.opsForValue().get(key);

        //2.判断是否存在
        if(StrUtil.isNotBlank(shopJson)){
            //3.存在，直接返回
            Shop shop = JSONUtil.toBean(shopJson,Shop.class);
            return Result.ok(shop);
        }
        if(shopJson!=null){

            return Result.fail("店铺信息不存在");
        }


        //4.不存在，根据id查询数据库
        Shop shop =getById(id);

        //5.不存在，返回错误
        if(shop==null){
            stringRedisTemplate.opsForValue().set(key,"",CACHE_NULL_TTL,TimeUnit.MINUTES);
            return Result.fail("店铺不存在！");
        }
        //6.存在，写入redis
        stringRedisTemplate.opsForValue().set(key,JSONUtil.toJsonStr(shop),CACHE_SHOP_TTL, TimeUnit.MINUTES);

        //7.返回
        return Result.ok(shop);
    }*/



    public Shop queryWithMutex(Long id){

        String key =CACHE_SHOP_KEY+id;
        //1.从redis中查询商铺缓存
        String shopJson =stringRedisTemplate.opsForValue().get(key);

        //2.判断是否存在
        if(StrUtil.isNotBlank(shopJson)){
            //3.存在，直接返回
            Shop shop = JSONUtil.toBean(shopJson,Shop.class);
            return shop;
        }
        if(shopJson!=null){

//            return Result.fail("店铺信息不存在");
            return null;
        }

        String lockKey="lock:shop:"+id;
        Shop shop = null;
        try {
            boolean isLock=tryLock(lockKey);
            if (!isLock){

                Thread.sleep(50);
                return queryWithMutex(id);
            }


            //4.不存在，根据id查询数据库
            shop = getById(id);

            //5.不存在，返回错误
            if(shop==null){
                stringRedisTemplate.opsForValue().set(key,"",CACHE_NULL_TTL,TimeUnit.MINUTES);
                /*return Result.fail("店铺不存在！");*/
                return null;
            }
            //6.存在，写入redis
            stringRedisTemplate.opsForValue().set(key,JSONUtil.toJsonStr(shop),CACHE_SHOP_TTL, TimeUnit.MINUTES);
        } catch (InterruptedException e) {

            throw new RuntimeException(e);
        }finally {

            unLock(lockKey);
        }

        //7.返回
        return shop;

    }
    @Override
    public Result queryById(Long id) {

        Shop shop=queryWithMutex(id);
        if(shop==null){
            return Result.fail("店铺不存在！");
        }

        return Result.ok(shop);
    }

    private boolean tryLock(String key){

        Boolean flag=stringRedisTemplate.opsForValue().setIfAbsent(key,"1",10,TimeUnit.SECONDS);
        return BooleanUtil.isTrue(flag);
    }

    private void unLock(String key){
        stringRedisTemplate.delete(key);
    }




    @Override
    @Transactional  //通过事务控制原子性
    public Result update(Shop shop) {
        Long id =shop.getId();
        if(id==null){
            return Result.fail("店铺id不能为空");
        }
        //1.更新数据库
        //使用mybatis-plus
        updateById(shop);

        //2.删除缓存
        stringRedisTemplate.delete(CACHE_SHOP_KEY+id);

        return Result.ok();
    }
}
