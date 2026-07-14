import request from '@/utils/request'

// 获取当前登录用户信息
export function getCurrentUser() {
  return request({
    url: '/user/me',
    method: 'get'
  })
}

// 获取用户详细信息
export function getUserInfo(userId) {
  return request({
    url: `/user/info/${userId}`,
    method: 'get'
  })
}

// 获取用户基本信息
export function queryUserById(userId) {
  return request({
    url: `/user/${userId}`,
    method: 'get'
  })
} 