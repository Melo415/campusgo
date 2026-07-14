package com.hmdp.service.impl;

import com.hmdp.dto.SeckillOrderMessage;
import com.hmdp.entity.VoucherOrder;
import com.hmdp.service.ISeckillVoucherService;
import com.hmdp.service.IVoucherOrderService;
import com.rabbitmq.client.Channel;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.annotation.Resource;
import java.io.IOException;

@Service
@Slf4j
public class SeckillOrderConsumer {

    @Resource
    private IVoucherOrderService voucherOrderService;
    @Resource
    private ISeckillVoucherService seckillVoucherService;

    @RabbitListener(queues = "seckill.order.queue")
    @Transactional
    public void handleSeckillOrder(SeckillOrderMessage message, Message msg, Channel channel) throws IOException {
        try {
            log.info("收到秒杀订单消息：{}", message);

            // 扣减库存
            boolean success = seckillVoucherService.update()
                .setSql("stock = stock - 1")
                .eq("voucher_id", message.getVoucherId())
                .gt("stock", 0)
                .update();

            if (!success) {
                log.error("库存不足，订单创建失败：{}", message);
                channel.basicAck(msg.getMessageProperties().getDeliveryTag(), false);
                return;
            }

            // 创建订单
            VoucherOrder voucherOrder = new VoucherOrder();
            voucherOrder.setId(message.getOrderId());
            voucherOrder.setUserId(message.getUserId());
            voucherOrder.setVoucherId(message.getVoucherId());
            voucherOrderService.save(voucherOrder);



            // 手动确认消息
            channel.basicAck(msg.getMessageProperties().getDeliveryTag(), false);
            log.info("秒杀订单处理成功：{}", message);
        } catch (Exception e) {
            log.error("秒杀订单处理失败：{}", message, e);
            // 处理失败，拒绝消息并重新入队
            channel.basicNack(msg.getMessageProperties().getDeliveryTag(), false, true);
        }
    }
}
