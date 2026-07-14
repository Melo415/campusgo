package com.hmdp.config;

import com.hmdp.handler.NotificationWebSocketHandler;
import com.hmdp.handler.WebSocketHandshakeInterceptor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

import javax.annotation.Resource;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    @Resource
    private StringRedisTemplate stringRedisTemplate;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {

        registry.addHandler(webSocketHandler(), "/ws/notification")
                .addInterceptors(new WebSocketHandshakeInterceptor(stringRedisTemplate))
                .setAllowedOrigins("*");

    }

    @Bean
    public WebSocketHandler webSocketHandler() {
        return new NotificationWebSocketHandler();
    }
}
