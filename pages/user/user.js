// pages/user/user.js

var http = require("../../utils/http.js")
Page({

  /**
   * 页面的初始数据
   */
  data: {
    orderAmount: "",
    sts: "",
    collectionCount: 0,
    visitedConut:0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
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
    //加载订单数字
    var ths = this
    // var status = ths.data.status
    var params = {
      url: "/qcl-shop/myOrder/myOrderRedNum",
      method: "GET",
      data: {},
      callBack: function (res) {
        ths.setData({
          orderAmount: res.data
        })
      }
    }
    http.request(params)
    this.showCollectionCount()
    this.showVisitedNum()
    http.getCartCount()
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

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },

  toDistCenter: function () {
    wx.showToast({
      icon: "none",
      title: "该功能未开源"
    })
  },
  // 跳转钱包
  toWallet: function () {
    wx.navigateTo({
      url: "/pages/wallet/page/index",
    })
  },

  toCouponCenter: function () {
    wx.showToast({
      icon: "none",
      title: "该功能未开源"
    })
  },

  toMyCouponPage: function () {
    wx.showToast({
      icon: "none",
      title: "该功能未开源"
    })
  },

  toAddressList: function () {
    wx.navigateTo({
      url: "/pages/delivery-address/delivery-address",
    })
  },

  // 跳转绑定手机号
  toBindingPhone: function () {
    wx.navigateTo({
      url: "/pages/binding-phone/binding-phone",
    })
  },

  toOrderListPage: function (e) {
    var sts = e.currentTarget.dataset.sts
    wx.navigateTo({
      url: "/pages/orderList/orderList?sts=" + sts,
    })
  },
  /**
   * 查询所有的收藏量
   */
  showCollectionCount: function () {
    var ths = this
    var params = {
      url: "/qcl-shop/collection/count",
      method: "GET",
      data: {},
      callBack: function (res) {
        ths.setData({
          collectionCount: res
        })
      }
    }
    http.request(params)
  },
  /**
   * 我的收藏跳转
   */
  myCollectionHandle: function () {
    var url = "/pages/prod-classify/prod-classify?sts=5"
    var id = 0
    var title = "我的收藏商品"
    if (id) {
      url += "&tagid=" + id + "&title=" + title
    }
    wx.navigateTo({
      url: url
    })
  },
  /**
   * 查询所有的浏览量
   */
  showVisitedNum: function () {
    var ths = this
    var lookedProd = wx.getStorageSync('lookedPro')
    ths.setData({
      visitedConut: lookedProd.length
    })
      
  },
  /**
   * 我的足迹跳转
   */
  myLookedProd: function () {
    var url = "/pages/prod-classify/prod-classify?sts=10"
    var id = 0
    var title = "我的足迹"
    if (id) {
      url += "&tagid=" + id + "&title=" + title
    }
    wx.navigateTo({
      url: url
    })
  }


})
