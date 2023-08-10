// pages/wallet/page/index.js
const http = require('../../../utils/http')
Page({

  /**
   * 页面的初始数据
   */
  data: {
    cardList: [],
    walletNum: "",
    WithdrawCashShowFlag: false
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
    this.getWalletInfo()
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

  getWalletInfo: function () {
    let params = {
      url: '/qcl-user/my/blanceRefresh',
      method: 'GET',
      data: {},
      callBack: (res) => {
        let walletNum = res.data.blance
        let WithdrawCashShowFlag = walletNum > 0
        this.setData({
          walletNum: walletNum,
          WithdrawCashShowFlag: WithdrawCashShowFlag
        })
      }
    }
    http.request(params)
  },

  gotoRecharge: function () {
    wx.vibrateShort({
      type: "heavy"
    })
    wx.navigateTo({
      url: "/pages/re-charge/re-charge"
    })
  },
  
  gotoRecord: function () {
    wx.navigateTo({
      url: "/pages/wallet/wallet-record/wallet-record"
    })
  },

  gotoCashOut: function () {
    wx.vibrateShort({
      type: "heavy"
    })
    wx.navigateTo({
      url: "/pages/cash-out/cash-out"
    })
  }
    
})