"use strict";
const config = {
  // 基础URL
  // baseURL: 'http://8.152.200.214:8081',
  baseURL: "http://localhost:8081",
  // 博客相关接口
  blog: {
    hot: "/blog/hot",
    detail: "/blog",
    like: "/blog/like",
    comments: "/blog/comments",
    ofMe: "/blog/of/me"
  },
  // 用户相关接口
  user: {
    me: "/user/me",
    info: "/user/info",
    follow: "/follow",
    unfollow: "/follow"
  },
  // 评价相关接口
  evaluation: {
    list: "/evaluation",
    like: "/evaluation/like"
  }
};
const getFullUrl = (endpoint) => {
  return config.baseURL + endpoint;
};
exports.getFullUrl = getFullUrl;
//# sourceMappingURL=../../.sourcemap/mp-weixin/config/api.config.js.map
