// pages/pay-result/pay-result.js
const http = require("../../utils/http")
Page({

  /**
   * 页面的初始数据
   */
  data: {
    sts: 0,
    orderNumbers: "",
    showPayFlag: false,
    actualTotal: ""
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.setData({
      sts: options.sts,
      orderNumbers: options.orderNumbers
    })
    this.loadOrderDetail(options.orderNumbers)
  },
  // 获取订单详情
  loadOrderDetail: function (orderNum) {
    var ths = this
    wx.showLoading({
      mask: true
    })
    //加载订单详情
    var params = {
      url: "/qcl-shop/myOrder/orderDetail",
      method: "GET",
      data: {
        orderNumber: orderNum
      },
      callBack: function (res) {
        ths.setData({
          actualTotal: res.actualTotal
        })
        wx.hideLoading()
      }
    }
    http.request(params)
  },

  // 重新支付
  payAgain: function () {
    this.setData({
      showPayFlag: true
    })
  },

  toOrderList: function () {
    wx.redirectTo({
      url: `/pages/order-detail/order-detail?orderNum=${this.data.orderNumbers}`
    })
  },
  toIndex: function () {
    wx.switchTab({
      url: "/pages/index/index"
    })
  },
  // 支付成功跳转
  paySuccess: function () {
    this.setData({
      sts: 1
    })
  },
  // 支付失败
  payFailed: function () {
    this.setData({
      sts: 0
    })
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  }
})
