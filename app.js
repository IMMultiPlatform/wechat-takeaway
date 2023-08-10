//app.js
App({
  onLaunch: function () {
    wx.removeStorageSync('location')
  },
  onUnload: function () {
  },
  globalData: {
    // 定义全局请求队列
    requestQueue: [],
    // 是否正在进行登陆
    isLanding: true,
    // 购物车商品数量
    totalCartCount: 0
  }
})
