"use strict";
const common_vendor = require("../common/vendor.js");
class WebSocketClient {
  constructor() {
    this.ws = null;
    this.connected = false;
    this.messageHandlers = /* @__PURE__ */ new Set();
  }
  connect() {
    const token = localStorage.getItem("token");
    if (!token) {
      common_vendor.index.__f__("error", "at utils/websocket.js:11", "未找到token，WebSocket连接失败");
      return;
    }
    try {
      if (this.ws) {
        this.ws.close();
      }
      const wsUrl = `ws://localhost:8081/ws/notification?token=${token}`;
      this.ws = new WebSocket(wsUrl);
      this.ws.onopen = () => {
        common_vendor.index.__f__("log", "at utils/websocket.js:25", "WebSocket连接已建立");
        this.connected = true;
      };
      this.ws.onclose = () => {
        common_vendor.index.__f__("log", "at utils/websocket.js:30", "WebSocket连接已关闭");
        this.connected = false;
        setTimeout(() => {
          this.connect();
        }, 5e3);
      };
      this.ws.onerror = (error) => {
        common_vendor.index.__f__("error", "at utils/websocket.js:39", "WebSocket发生错误:", error);
        this.connected = false;
      };
      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.messageHandlers.forEach((handler) => handler(message));
        } catch (error) {
          common_vendor.index.__f__("error", "at utils/websocket.js:48", "处理WebSocket消息时发生错误:", error);
        }
      };
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/websocket.js:52", "创建WebSocket连接时发生错误:", error);
      this.connected = false;
    }
  }
  addMessageHandler(handler) {
    this.messageHandlers.add(handler);
  }
  removeMessageHandler(handler) {
    this.messageHandlers.delete(handler);
  }
  close() {
    if (this.ws) {
      this.ws.close();
    }
  }
}
const wsClient = new WebSocketClient();
exports.wsClient = wsClient;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/websocket.js.map
