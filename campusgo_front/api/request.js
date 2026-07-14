// api/request.js
export const http = (options) => {
  return new Promise((resolve, reject) => {
    uni.request({
      url: 'https://your-api.com' + options.url,
      method: options.method || 'GET',
      header: {
        'Content-Type': 'application/json',
        'Authorization': uni.getStorageSync('token')
      },
      success: (res) => {
        if (res.data.code === 200) {
          resolve(res.data)
        } else {
          reject(res.data)
        }
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}