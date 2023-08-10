// pages/re-charge/re-charge.js
var http = require("../../utils/http.js")
Page({

  /**
   * 页面的初始数据
   */
  data: {
    inputFlag: false,
    reChargeNum: '',
    autoFocus: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    setTimeout(() => {
      this.setData({
        autoFocus: true
      })
    }, 200)
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

  },

  // 输入金额
  inputHandle: function (e) {
    let inputStr = e.detail.value
    let strArray = []
    strArray = inputStr.split(".")
    inputStr = ''
    strArray.forEach((item, i) => {
      if (i === 0 && strArray.length > 1) {
        inputStr = ''
        inputStr = item + '.'
        return
      }
      inputStr += item
    })
    strArray = inputStr.split(".")
    strArray.forEach((item, i) => {
      if (i === 0 && strArray.length > 1) {
        inputStr = ''
        inputStr = item + '.'
        return
      } else if (i === 1) {
        inputStr += item.substring(0,2)
      }
    })

    let inputFlag = Number(inputStr) > 0
    wx.vibrateShort({
      type: "heavy"
    })
    this.setData({
      inputFlag: inputFlag,
      reChargeNum: inputStr
    })
  },

  // 充值控制按钮
  reChargeHanle: function () {
    let reChargeNum = this.data.reChargeNum
    wx.vibrateShort({
      type: "heavy"
    })
    if (!reChargeNum) {
      wx.showToast({
        icon: 'none',
        title: '请输入需要提现的金额',
      })
    } else if (reChargeNum < 0.01) {
      wx.showToast({
        icon: 'none',
        title: '单次充值金额不能少于0.01元',
      })
    } else {
      wx.showModal({
        title: "请确认充值信息",
        content: `您的充值金额为${reChargeNum}，你确认充值吗？`,
        confirmColor: "#26B6B7",
        confirmText: "确认充值",
        success: (res) => {
          if (res.confirm) {
            this.reChargeSubmit()
          }
        }
      })
    }
  },

  // 提交充值
  reChargeSubmit: function() {
    wx.showLoading({
      mask: true
    })
    wx.vibrateShort({
      type: "heavy"
    })
    let params = {
      url: '/qcl-shop/pay/balanceIncrease',
      method: 'POST',
      data: {
        flag: 0,
        payAmount: parseFloat(this.data.reChargeNum),
        payType: 1,
        soreType: 1
      },
      callBack: (res) => {
        console.log(res)
        if (res.code == 200) {
          // 用返回的参数调起微信支付
          let payData = res.data
          wx.requestPayment({
            appId: payData.appId,
            nonceStr: payData.nonceStr,
            package: payData.package,
            paySign: payData.paySign,
            timeStamp: payData.timeStamp,
            signType: payData.signType,
            success: (result) => {
              // 支付成功，返回上一页
              wx.hideLoading()
              wx.navigateBack({
                delta: 1
              })
            },
            fail: (result) => {
              // 支付失败
              if (result.errMsg == "requestPayment:fail cancel") {
                
              } else {
                // 其他错误提示
                wx.showModal({
                  title: "",
                  content: result.errMsg,
                  confirmColor: "#26B6B7",
                  showCancel: false
                })
              }
              wx.hideLoading()
            }
          })
          return
        }
        wx.showModal({
          title: "",
          content: res.msg,
          confirmColor: "#26B6B7",
          confirmText: "确认",
          showCancel: false
        })
        wx.hideLoading()
      }
    }
    http.request(params)
  }
})