// pages/submit-order/submit-order.js
const config = require("../../utils/config.js")
var http = require("../../utils/http.js")
var util = require("../../utils/util.js")
Page({

  /**
   * 页面的初始数据
   */
  data: {
    popupShow: false,
    couponSts: 1,
    couponList: [],
    // 订单入口 0购物车 1立即购买
    orderEntry: "0",
    userAddr: null,
    orderItems: [],
    coupon: {
      totalLength: 0,
      canUseCoupons: [],
      noCanUseCoupons: []
    },
    actualTotal: 0,
    total: 0,
    totalCount: 0,
    transfee: 0,
    reduceAmount: 0,
    remark: "",
    couponIds: [],
    isIphoneX: util.isIphoneX,
    // 唤起支付窗口
    showPayFlag: false,
    // 获取支付列表
    payMethodList: [],
    orderNumber: '',
    // 是否能提交订单
    canSubmit: false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.setData({
      orderEntry: options.orderEntry,
    })
  },
  //下单预处理，获取商品预计送达时间
  preSubmit: function() {
    wx.showLoading({
      mask: true
    })
    var addrId = 0
    if (this.data.userAddr != null) {
      addrId = this.data.userAddr.addrId
    }
    let orderItem = {}
    if (this.data.orderEntry === '1') {
      orderItem = JSON.parse(wx.getStorageSync("orderItem"))
    } else if (this.data.orderEntry === '0') {
      orderItem = JSON.parse(wx.getStorageSync("basketIds"))
    }
    var params = {
      url: "/qcl-shop/order/preOrder",
      method: "POST",
      contentType: 'application/json',
      data: {
        preOrderItemParams: [{
          prodCounts: [orderItem.prodCount],
          prodIds: [orderItem.prodId],
          shopId: config.shopId(),
          addressId: addrId
        }]
      },
      callBack: (res) => {
        this.setData({
          preOrderData: res.data
        })
        this.loadOrderData()
      }
    }
    http.request(params)
  },

  //加载订单数据
  loadOrderData: function () {
    var addrId = 0
    if (this.data.userAddr != null) {
      addrId = this.data.userAddr.addrId
    }
    var params = {
      url: "/qcl-shop/order/mimiConfirm",
      method: "POST",
      contentType: 'application/json',
      data: {
        addrId: addrId,
        orderItem: this.data.orderEntry === "1" ? JSON.parse(wx.getStorageSync("orderItem")) : undefined,
        basketIds: this.data.orderEntry === "0" ? JSON.parse(wx.getStorageSync("basketIds")) : undefined,
        couponIds: this.data.couponIds,
        userChangeCoupon: 1,
        dvyTime: this.data.preOrderData.orderArrivedTime,
        dvyId: 1,
        shopId: config.shopId()
      },
      callBack: result => {
        let orderItems = []
        let res = result.data
         if (result.code == 500) {
          this.setData({
            orderItems: [],
            actualTotal: 0,
            total: 0,
            totalCount: 0,
            userAddr: this.data.userAddr,
            transfee: 0,
            shopReduce: 0,
            canSubmit: false
          })
          wx.hideLoading()
          wx.showModal({
            title: "",
            content: result.msg + '，请重新选择地址',
            confirmColor: "#26B6B7",
            mask: true,
            success(res) {
              if (res.confirm) {
                //用户点击确定按钮
              } else if (res.cancel) {
                //console.log('用户点击取消')
              }
            }
          })
          return
         }
        res.shopCartOrders[0].shopCartItemDiscounts.forEach(itemDiscount => {
          orderItems = orderItems.concat(itemDiscount.shopCartItems)
        })
        if (res.shopCartOrders[0].coupons) {
          let canUseCoupons = []
          let unCanUseCoupons = []
          res.shopCartOrders[0].coupons.forEach(coupon => {
            if (coupon.canUse) {
              canUseCoupons.push(coupon)
            } else {
              unCanUseCoupons.push(coupon)
            }
          })
          this.setData({
            coupons: {
              totalLength: res.shopCartOrders[0].coupons.length,
              canUseCoupons: canUseCoupons,
              unCanUseCoupons: unCanUseCoupons
            }
          })
        }

        this.setData({
          orderItems: orderItems,
          actualTotal: res.actualTotal,
          total: res.total,
          totalCount: res.totalCount,
          userAddr: res.userAddr,
          transfee: res.totalTransfee,
          shopReduce: res.shopCartOrders[0].shopReduce,
          canSubmit: true,
        })
        wx.hideLoading()
      },
      errCallBack: res => {
        wx.hideLoading()
        this.chooseCouponErrHandle(res)
      }
    }
    http.request(params)

  },

  /**
   * 优惠券选择出错处理方法
   */
  chooseCouponErrHandle(res) {
    // 优惠券不能共用处理方法
    if (res.statusCode == 601) {
      wx.showToast({
        title: res.data,
        icon: "none",
        duration: 3000,
        success: res => {
          this.setData({
            couponIds: []
          })
        }
      })
      setTimeout(() => {
        this.loadOrderData()
      }, 2500)
    }
  },

  /**
   * 提交订单
   */
  toPay: function () {
    wx.vibrateShort({
      type: "heavy"
    })
    if (!this.data.userAddr) {
      wx.showToast({
        title: "请选择地址",
        icon: "none"
      })
      return
    }

    this.submitOrder()
  },

  getRemark: function (e) {
    let str = e.detail.value
    str = str.replace(/\s*/g,"")
    this.setData({
      remark: str
    })
  },

  submitOrder: function () {
    // 下单按钮是否可用
    if (!this.data.canSubmit) {
      return
    }
    wx.showLoading({
      mask: true
    })

    var params = {
      url: "/qcl-shop/order/submit",
      method: "POST",
      contentType: "application/json",
      data: {
        orderShopParam: [{
          remarks: this.data.remark,
          shopId: config.shopId()
        }],
        appType: "wxMiniApp"
      },
      callBack: res => {
        this.setData({
          orderNumber: res.data.orderNumbers
        })
        this.callPayHandle()
        wx.hideLoading()
      }
    }
    http.request(params)
  },
  // 唤起支付窗口
  callPayHandle: function() {
    this.setData({
      showPayFlag: true
    })
  },
  // 关闭支付窗口
  closePayHandle: function() {
    this.setData({
      showPayFlag: false
    })
  },

  // 支付成功跳转
  paySuccess: function() {
    // console.log("支付成功");
    wx.redirectTo({
      url: "/pages/pay-result/pay-result?sts=1&orderNumbers=" + this.data.orderNumber + "&orderType=" + this.data.orderType,
    })
  },

  // 支付失败
  payFailed: function() {
    wx.redirectTo({
      url: "/pages/pay-result/pay-result?sts=0&orderNumbers=" + this.data.orderNumber + "&orderType=" + this.data.orderType,
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
    var pages = getCurrentPages()
    var currPage = pages[pages.length - 1]
    if (currPage.data.selAddress == "yes") {
      this.setData({ //将携带的参数赋值
        userAddr: currPage.data.item
      })
    }
    //下单预处理
    this.preSubmit()
    //获取订单数据
    // this.loadOrderData()
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

  changeCouponSts: function (e) {
    this.setData({
      couponSts: e.currentTarget.dataset.sts
    })
  },

  showCouponPopup: function () {
    this.setData({
      popupShow: true
    })
  },

  closePopup: function () {
    this.setData({
      popupShow: false
    })
  },

  /**
   * 去地址页面
   */
  toAddrListPage: function () {
    wx.navigateTo({
      url: "/pages/delivery-address/delivery-address?order=0",
    })
  },
  /**
   * 确定选择好的优惠券
   */
  choosedCoupon: function () {
    this.loadOrderData()
    this.setData({
      popupShow: false
    })
  },

  /**
   * 优惠券子组件发过来
   */
  checkCoupon: function (e) {
    var ths = this
    let index = ths.data.couponIds.indexOf(e.detail.couponId)
    if (index === -1) {
      ths.data.couponIds.push(e.detail.couponId)
    } else {
      ths.data.couponIds.splice(index, 1)
    }
  }
})
