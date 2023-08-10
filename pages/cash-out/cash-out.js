// pages/cash-out/cash-out.js
var http = require("../../utils/http.js");

Page({

  /**
   * 页面的初始数据
   */
  data: {
    inputStatus: false,
    //钱包余额
    walletMoney:0,
    //今日剩余提现金额
    leftDrawlMoney:2000,
    //提现金额
    cashOutMoney:"",
    //提现次数
    cashOutTatol: 0

  },

  //获取用户输入内容
  inputMoney:function(e){
    var flag = false
    var num = e.detail.value

    if (e.detail.value > 0){
      flag = true
    }
    
    var index = e.detail.value.indexOf('.')
    if (index != -1){
      if (index == 0){
        // num = e.detail.value.substring(0, e.detail.value.length - 1);
        e.detail.value = "0."
        num = e.detail.value
      }
      else{
        if (/^(\d?)+(\.\d{0,2})?$/.test(e.detail.value)) { //正则验证，提现金额小数点后不能大于两位数字
          num = e.detail.value;
        } else {
          num = e.detail.value.substring(0, e.detail.value.length - 1);
        }
      }
    }
    wx.vibrateShort({
      type: "heavy"
    })
    this.setData({
      cashOutMoney : num,
      inputStatus: flag
    })
  },

  //获取用户的钱包余额
  getEnableCash: function () {
    wx.showLoading()
    let params = {
      url: '/qcl-user/my/blanceRefresh',
      method: 'GET',
      data: {},
      callBack: (res) => {
        let walletMoney = res.data.blance
        this.setData({
          walletMoney: walletMoney
        })
        wx.hideLoading()
      }
    }
    http.request(params)
  },

  //提现确认按钮
  cashOutConfirm:function(){
    var ths = this
    var inputMoney = ths.data.cashOutMoney
    var lftDwMoney = ths.data.leftDrawlMoney
    var chOutTatol = ths.data.cashOutTatol
    var wltMoney = ths.data.walletMoney
    wx.vibrateShort({
      type: "heavy"
    })
    if (inputMoney > wltMoney){
      wx.showToast({
        title: '输入金额超过钱包余额！',
        icon: "none"
      })
      return
    }
    if (inputMoney > lftDwMoney){
      wx.showToast({
        title: '输入金额超过今日可提现金额！',
        icon: "none"
      })
      return
    }
    if (chOutTatol > 5){
      wx.showToast({
        title: '今日提现次数已达5次！',
        icon: 'none'
      })
      return
    }
    wx.showLoading({
      mask: true
    })
    var params = {
      url: "/qcl-user/userWithdrawCash/wxcashout",
      contentType: "application/x-www-form-urlencoded",
      method: "POST",
      data: {amount: inputMoney},
      callBack:function(res){
        //提现成功
        if (res.code == 200){
          lftDwMoney  = lftDwMoney - inputMoney
          wltMoney = wltMoney - inputMoney
          chOutTatol += 1
          ths.setData({
            leftDrawlMoney : lftDwMoney,
            walletMoney : wltMoney,
            cashOutTatol : chOutTatol
          })
          wx.hideLoading()
          wx.showToast({
            title: '提现成功！',
          })
          //返回上一页
          wx.navigateBack({
            delta: 1
          })
        } else {
          wx.hideLoading()
          wx.showModal({
            title: "",
            content: res.msg,
            confirmColor: "#26B6B7",
            showCancel: false
          })
        }
      }
    }
    http.request(params)
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
    this.getEnableCash()
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