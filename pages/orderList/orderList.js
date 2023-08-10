var http = require("../../utils/http.js")
var config = require("../../utils/config.js")

Page({

  /**
   * 页面的初始数据
   */
  data: {
    list: [],
    current: 1,
    pages: 0,
    sts: 0,
    showPayFlag: false,
    orderNumbers: "",
    actualTotal: 0,
    orderType: 0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    if (options.sts) {
      this.setData({
        sts: options.sts
      })
      this.loadOrderData(options.sts, 1)
    } else {
      this.loadOrderData(0, 1)
    }
  },

  /**
   * 加载订单数据
   */
  loadOrderData: function (sts, current) {
    var ths = this
    wx.showLoading()
    //加载订单列表
    var params = {
      url: "/qcl-shop/myOrder/myOrder",
      method: "GET",
      data: {
        current: current,
        size: 10,
        status: sts,
      },
      callBack: function (res) {
        //console.log(res);
        var list = []
        if (res.current == 1) {
          list = res.records
        } else {
          list = ths.data.list
          Array.prototype.push.apply(list, res.records)
        }
        ths.setData({
          list: list,
          pages: res.pages,
          current: res.current
        })
        wx.hideLoading()
      }
    }
    http.request(params)
  },

  /**
   * 状态点击事件
   */
  onStsTap: function (e) {
    var sts = e.currentTarget.dataset.sts
    this.setData({
      sts: sts
    })
    this.loadOrderData(sts, 1)
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
    if (this.data.current < this.data.pages) {
      this.loadOrderData(this.data.sts, this.data.current + 1)
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },


  /**
   * 查看物流
   */
  toDeliveryPage: function (e) {
    wx.navigateTo({
      url: "/pages/express-delivery/express-delivery?orderNum=" + e.currentTarget.dataset.ordernum
    })
  },

  /**
   * 取消订单
   */
  onCancelOrder: function (e) {
    var ordernum = e.currentTarget.dataset.ordernum
    var ths = this
    wx.showModal({
      title: "",
      content: "要取消此订单？",
      confirmColor: "#3e62ad",
      cancelColor: "#3e62ad",
      cancelText: "否",
      confirmText: "是",
      success(res) {
        if (res.confirm) {
          wx.showLoading({
            mask: true
          })

          var params = {
            url: "/qcl-shop/myOrder/cancel",
            method: "POST",
            data: {
              orderNumber: ordernum
            },
            callBack: function (res) {
              //console.log(res);
              ths.loadOrderData(ths.data.sts, 1)
              wx.hideLoading()
            }
          }
          http.request(params)
        } else if (res.cancel) {
          //console.log('用户点击取消')
        }
      }
    })

  },
  /**
   * 付款
   */
  onPayAgain: function (e) {
    let orderNumbers = e.currentTarget.dataset.orderinfo.orderNumber
    let actualTotal = e.currentTarget.dataset.orderinfo.actualTotal
    this.setData({
      showPayFlag: true,
      orderNumbers: orderNumbers,
      actualTotal: actualTotal
    })
  },

  // 支付成功跳转
  paySuccess: function() {
    {
      // console.log("支付成功");
      wx.redirectTo({
        url: "/pages/pay-result/pay-result?sts=1&orderNumbers=" + this.data.orderNumber + "&orderType=" + this.data.orderType,
      })
    }
  },

  // 支付失败
  payFailed: function() {
    wx.redirectTo({
      url: "/pages/pay-result/pay-result?sts=0&orderNumbers=" + this.data.orderNumber + "&orderType=" + this.data.orderType,
    })
  },


  /**
   * 查看订单详情
   */
  toOrderDetailPage: function (e) {
    wx.navigateTo({
      url: "/pages/order-detail/order-detail?orderNum=" + e.currentTarget.dataset.ordernum,
    })
  },

  /**
   * 确认收货
   */
  onConfirmReceive: function (e) {
    var ths = this
    wx.showModal({
      title: "",
      content: "我已收到货？",
      confirmColor: "#eb2444",
      success(res) {
        if (res.confirm) {
          wx.showLoading({
            mask: true
          })

          var params = {
            url: "/qcl-shop/myOrder/receipt",
            method: "POST",
            data: {
              orderNumber: e.currentTarget.dataset.ordernum
            },
            callBack: function (res) {
              //console.log(res);
              ths.loadOrderData(ths.data.sts, 1)
              wx.hideLoading()
            }
          }
          http.request(params)
        } else if (res.cancel) {
          //console.log('用户点击取消')
        }
      }
    })
  },
//删除已完成||已取消的订单
  delOrderList: function (e) {
    var ths = this
    wx.showModal({
      title: "",
      content: "确定要删除此订单吗？",
      confirmColor: "#eb2444",
      success(res) {
        if (res.confirm) {
          var ordernum = e.currentTarget.dataset.ordernum
          wx.showLoading()
          var params = {
            url: "/qcl-shop/myOrder/delete",
            method: "POST",
            data: {
              orderNumber: ordernum
            },
            callBack: function (res) {
              ths.loadOrderData(ths.data.sts, 1)
              wx.hideLoading()
            }
          }
          http.request(params)
        } else if (res.cancel) {
          console.log("用户点击取消")
        }
      }
    })
  }
})
