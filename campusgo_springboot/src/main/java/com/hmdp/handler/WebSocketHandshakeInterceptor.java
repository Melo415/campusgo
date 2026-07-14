package com.hmdp.handler;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.util.StrUtil;
import com.hmdp.dto.UserDTO;
import com.hmdp.utils.RedisConstants;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;

@Slf4j
public class WebSocketHandshakeInterceptor implements HandshakeInterceptor {

    private StringRedisTemplate stringRedisTemplate;

    public WebSocketHandshakeInterceptor(StringRedisTemplate stringRedisTemplate) {
        this.stringRedisTemplate = stringRedisTemplate;
    }

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                   WebSocketHandler wsHandler, Map<String, Object> attributes) {
        if (request instanceof ServletServerHttpRequest) {
            ServletServerHttpRequest servletRequest = (ServletServerHttpRequest) request;

            log.info("开始WebSocket握手...");

            // 优先从 URL 参数中获取 token
            String token = servletRequest.getServletRequest().getParameter("token");

            // 如果 URL 参数中没有，则从 header 中获取
            if (StrUtil.isBlank(token)) {
                token = servletRequest.getServletRequest().getHeader("authorization");
            }

            if (StrUtil.isBlank(token)) {
                return false;
            }

            // 基于token获取redis中的用户
            String key = RedisConstants.LOGIN_USER_KEY + token;
            Map<Object, Object> userMap = stringRedisTemplate.opsForHash().entries(key);
            if (userMap.isEmpty()) {
                return false;
            }

            // 将查询到的Hash数据转为UserDTO
            UserDTO userDTO = BeanUtil.fillBeanWithMap(userMap, new UserDTO(), false);

            // 存入session属性
            attributes.put("userId", userDTO.getId());
            return true;
        }
        return false;
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                             WebSocketHandler wsHandler, Exception exception) {
    }
}
