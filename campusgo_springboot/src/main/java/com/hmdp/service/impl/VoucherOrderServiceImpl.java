package com.hmdp.service.impl;

import com.hmdp.dto.Result;
import com.hmdp.dto.SeckillOrderMessage;
import com.hmdp.entity.SeckillVoucher;
import com.hmdp.entity.VoucherOrder;
import com.hmdp.mapper.VoucherOrderMapper;
import com.hmdp.service.ISeckillVoucherService;
import com.hmdp.service.IVoucherOrderService;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.hmdp.utils.RedisIdWorker;
import com.hmdp.utils.SimpleRedisLock;
import com.hmdp.utils.UserHolder;
import org.springframework.aop.framework.AopContext;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.annotation.Resource;
import java.time.LocalDateTime;

/**
 * <p>
 *  服务实现类
 * </p>
 *
 * @author 虎哥
 * @since 2021-12-22
 */
@Service
public class VoucherOrderServiceImpl extends ServiceImpl<VoucherOrderMapper, VoucherOrder> implements IVoucherOrderService {

    @Resource
    private RedisIdWorker redisIdWorker;
    @Resource
    private ISeckillVoucherService seckillVoucherService;

    @Resource
    private StringRedisTemplate stringRedisTemplate;
    @Resource
    private RabbitTemplate rabbitTemplate;

    @Override
    public Result seckillVoucher(Long voucherId) {
        // 1. 先从Redis预减库存
        Long stock = stringRedisTemplate.opsForValue().decrement("seckill:stock:" + voucherId);
        if (stock < 0) {
            // 库存不足，回滚Redis中的库存
            stringRedisTemplate.opsForValue().increment("seckill:stock:" + voucherId);
            return Result.fail("库存不足");
        }

        // 2. 查询数据库中的优惠券信息
        SeckillVoucher voucher = seckillVoucherService.getById(voucherId);
        if(voucher == null) {
            // 回滚Redis库存
            stringRedisTemplate.opsForValue().increment("seckill:stock:" + voucherId);
            return Result.fail("优惠券不存在");
        }

        // 3. 检查时间
        if(voucher.getBeginTime().isAfter(LocalDateTime.now())){
            // 回滚Redis库存
            stringRedisTemplate.opsForValue().increment("seckill:stock:" + voucherId);
            return Result.fail("秒杀尚未开始！");
        }
        if (voucher.getEndTime().isBefore(LocalDateTime.now())){
            // 回滚Redis库存
            stringRedisTemplate.opsForValue().increment("seckill:stock:" + voucherId);
            return Result.fail("秒杀已经结束！");
        }

        // 4. 获取用户ID
        Long userId = UserHolder.getUser().getId();

        // 5. 创建锁对象
        SimpleRedisLock lock = new SimpleRedisLock("order:"+userId,stringRedisTemplate);
        boolean isLock = lock.tryLock(1200);

        if(!isLock){
            // 回滚Redis库存
            stringRedisTemplate.opsForValue().increment("seckill:stock:" + voucherId);
            return Result.fail("不允许重复下单");
        }

        try {
            // 6. 创建订单消息
            long orderId = redisIdWorker.nextId("order");
            SeckillOrderMessage message = new SeckillOrderMessage();
            message.setUserId(userId);
            message.setVoucherId(voucherId);
            message.setOrderId(orderId);

            // 7. 发送消息到RabbitMQ
            rabbitTemplate.convertAndSend(
                "seckill.order.exchange",
                "seckill.order",
                message
            );

            return Result.ok(orderId);
        } finally {
            // 释放锁
            lock.unlock();
        }
    }


    /**
     * 添加注解  默认只有运行时异常会进行事务回滚
     * @param voucherId
     * @return
     */
    @Transactional(rollbackFor = Exception.class)
    public Result createVoucherOrder(Long voucherId) {
        //5.一人一单
        Long userId= UserHolder.getUser().getId();


        //5.1.查询订单
        int count = query().eq("user_id",userId).eq("voucher_id", voucherId).count();
        //5.2判断是否存在
        if(count>0){
            //用户已经购买过
            return Result.fail("用户已经购买过一次了");
        }


        //6.扣减库存
        boolean success =seckillVoucherService.update()
                .setSql("stock=stock-1")
                .eq("voucher_id", voucherId).gt("stock",0)
                .update();


        if(!success){
            return Result.fail("库存不足！");
        }
        //7.创建订单
        VoucherOrder voucherOrder =new VoucherOrder();
        //7.1订单id
        long orderId = redisIdWorker.nextId("order");
        voucherOrder.setId(orderId);
        //7.2用户id
        voucherOrder.setUserId(userId);

        voucherOrder.setVoucherId(voucherId);
        save(voucherOrder);

        return Result.ok(orderId);
    }
    }

