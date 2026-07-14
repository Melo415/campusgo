import { addNotification, getNotifications } from './storage';
import { getWebSocketUrl } from '@/config/api.config'

class WebSocketClient {
    constructor() {
        this.ws = null;
        this.connected = false;
        this.messageHandlers = new Set();
        this.reconnectTimer = null;
    }

    connect() {
        const token = uni.getStorageSync('token');
        if (!token) {
            console.error('WebSocket连接失败: 未找到token');
            return;
        }

        try {
            console.log('开始建立WebSocket连接...');
            const wsUrl = getWebSocketUrl('/ws/notification') + `?token=${token}`;
            console.log('WebSocket URL:', wsUrl);
            
            // 确保之前的连接已关闭
            if (this.connected) {
                uni.closeSocket();
            }

            uni.connectSocket({
                url: wsUrl,
                success: () => {
                    console.log('WebSocket连接创建成功');
                },
                fail: (error) => {
                    console.error('WebSocket连接创建失败:', error);
                }
            });

            uni.onSocketOpen(() => {
                console.log('WebSocket连接已打开');
                this.connected = true;
                if (this.reconnectTimer) {
                    clearTimeout(this.reconnectTimer);
                    this.reconnectTimer = null;
                }
            });

            uni.onSocketMessage((res) => {
                console.log('收到WebSocket消息:', res.data);
                try {
                    const message = JSON.parse(res.data);
                    // 只通知处理器，不在这里直接添加通知
                    this.messageHandlers.forEach(handler => handler(message));
                } catch (error) {
                    console.error('处理WebSocket消息失败:', error);
                }
            });

            uni.onSocketError((error) => {
                console.error('WebSocket错误:', error);
                this.connected = false;
                this.reconnect();
            });

            uni.onSocketClose(() => {
                console.log('WebSocket连接已关闭');
                this.connected = false;
                this.reconnect();
            });

        } catch (error) {
            console.error('WebSocket连接过程出错:', error);
            this.connected = false;
        }
    }

    reconnect() {
        if (!this.reconnectTimer) {
            console.log('准备重新连接...');
            this.reconnectTimer = setTimeout(() => {
                this.connect();
            }, 5000);
        }
    }

    addMessageHandler(handler) {
        this.messageHandlers.add(handler);
        console.log('添加消息处理器, 当前处理器数量:', this.messageHandlers.size);
    }

    removeMessageHandler(handler) {
        this.messageHandlers.delete(handler);
        console.log('移除消息处理器, 当前处理器数量:', this.messageHandlers.size);
    }
}

// 导出单例
export const wsClient = new WebSocketClient(); 