// API 配置
const config = {
  // 基础URL
  baseURL: 'http://localhost:8081',
  //baseURL: 'http://8.152.200.214:8081',

  
  
  // 博客相关接口
  blog: {
    hot: '/blog/hot',
    detail: '/blog',
    like: '/blog/like',
    comments: '/blog/comments',
    ofMe: '/blog/of/me'
  },
  
  // 用户相关接口
  user: {
    me: '/user/me',
    info: '/user/info',
    follow: '/follow',
    unfollow: '/follow'
  },
  
  // 评价相关接口
  evaluation: {
    list: '/evaluation',
    like: '/evaluation/like'
  }
}

// 获取完整URL
const getFullUrl = (endpoint) => {
  return config.baseURL + endpoint
}

// WebSocket服务器地址
// 注意：WebSocket地址也需要跟随baseURL切换
export const WS_BASE_URL = config.baseURL.replace('http', 'ws')

// 获取WebSocket URL
export const getWebSocketUrl = (path) => {
    return `${WS_BASE_URL}${path}`
}

export { config, getFullUrl } 