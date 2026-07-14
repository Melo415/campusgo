package com.hmdp.handler;

import cn.hutool.json.JSONUtil;
import com.hmdp.dto.NotificationMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.WebSocketMessage;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@Slf4j
public class NotificationWebSocketHandler implements WebSocketHandler {

    /**
     * 用户ID和Session的映射关系
     */
    private static final Map<Long, WebSocketSession> USER_SESSIONS = new ConcurrentHashMap<>();

    /**
     * 当一个新的 WebSocket 连接建立成功后，该方法会被调用
     * @param session
     */
    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        // 从session中获取用户ID
        Long userId = (Long) session.getAttributes().get("userId");
        if (userId != null) {
            USER_SESSIONS.put(userId, session);
            log.info("用户{}建立WebSocket连接", userId);
        }
    }

    /**
     * 当服务器接收到客户端发送的 WebSocket 消息时，该方法会被调用
     * @param session
     * @param message
     */
    @Override
    public void handleMessage(WebSocketSession session, WebSocketMessage<?> message) {
        // 处理接收到的消息，这里暂时只打印日志
        log.info("收到消息：{}", message.getPayload());
    }


    /**
     * 当 WebSocket 连接在传输过程中发生错误时，该方法会被调用
     * @param session
     * @param exception
     */
    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        Long userId = (Long) session.getAttributes().get("userId");
        log.error("用户{}的WebSocket连接发生错误", userId, exception);
    }

    /**
     * 当 WebSocket 连接关闭时，该方法会被调用
     * @param session
     * @param closeStatus
     */
    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus closeStatus) {
        Long userId = (Long) session.getAttributes().get("userId");
        if (userId != null) {
            USER_SESSIONS.remove(userId);
            log.info("用户{}断开WebSocket连接", userId);
        }
    }


    @Override
    public boolean supportsPartialMessages() {
        return false;
    }



    /**
     * 发送消息给指定用户
     */
    public void sendMessage(Long userId, NotificationMessage message) {

        WebSocketSession session = USER_SESSIONS.get(userId);
        if (session != null && session.isOpen()) {
            try {

                session.sendMessage(new TextMessage(JSONUtil.toJsonStr(message)));
                log.info("发送消息给用户{}：{}", userId, message);
                
            } catch (IOException e) {
                log.error("发送消息给用户{}失败", userId, e);
            }
        } else {
            log.warn("用户{}的WebSocket连接不存在或已关闭", userId);
        }
    }
}
