package com.hmdp.config;

import org.springframework.amqp.core.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    // 秒杀订单队列
    public static final String SECKILL_ORDER_QUEUE = "seckill.order.queue1";
    // 秒杀订单交换机
    public static final String SECKILL_ORDER_EXCHANGE = "seckill.order.exchange";
    // 秒杀订单路由键
    public static final String SECKILL_ORDER_ROUTING_KEY = "seckill.order";

    @Bean
    public Queue seckillOrderQueue() {
        return new Queue(SECKILL_ORDER_QUEUE, true);
    }

    @Bean
    public DirectExchange seckillOrderExchange() {
        return new DirectExchange(SECKILL_ORDER_EXCHANGE);
    }

    @Bean
    public Binding bindingSeckillOrder() {
        return BindingBuilder.bind(seckillOrderQueue())
                .to(seckillOrderExchange())
                .with(SECKILL_ORDER_ROUTING_KEY);
    }
}
