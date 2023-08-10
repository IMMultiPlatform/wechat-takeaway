var http = require("../../utils/http.js")
const util = require("../../utils/util")
Page({

  /**
   * 页面的初始数据
   */
  data: {},
  getUserProfile: function (e) {
    // http.updateUserInfo()
    wx.showLoading({
      mask: true,
      title: "拼命加载中"
    })
    wx.vibrateShort({
      type: "heavy"
    })
    wx.getUserProfile({
      lang: "zh_CN",
      desc: "用于完善会员资料",
      success: (res) => {
        this.wxUserLogin(res)
      },
      fail: (res) => {
      }
    })
  },

  wxUserLogin: function (res) {
      wx.login({
        success: function (result) {
          var params = {
            url: "/qcl-auth/oauth/token",
            method: "post",
            data: {
              grant_type: "minicode",
              wxcode: result.code,
              scope: "all",
              avatarUrl: res.userInfo.avatarUrl,
              city: res.userInfo.city,
              country: res.userInfo.country,
              language: res.userInfo.language,
              nickName: res.userInfo.nickName,
              province: res.userInfo.province,
              gender: res.userInfo.gender
            },
            callBack: (res) => {
              wx.setStorageSync("token", res.token_type + " " + res.access_token)
              wx.setStorageSync("refresh_token", res.refresh_token) //把token存入缓存，请求接口数据时要用
              // 获取定位授权
              util.getUserLocation().then((res) => {
                wx.hideLoading()
                wx.navigateBack({
                  delta: 1
                })
              }).catch((res) => {
                wx.hideLoading()
                wx.navigateBack({
                  delta: 1
                })
              })
              // 清除全局队列
              var globalData = getApp().globalData
              globalData.requestQueue = []
            }
          }
          http.request(params)
        }
      })
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

  passwordUserLogin: function () {
    wx.showLoading()
      wx.login({
        success: function (result) {
          var params = {
            url: "/qcl-auth/oauth/token",
            method: "post",
            data: {
              grant_type: "password",
              username: "15210296267",
              password: "e10adc3949ba59abbe56e057f20f883e",
              wx_code: result.code,
              scope: "all"
            },
            callBack: (res) => {
              wx.setStorageSync("token", res.token_type + " " + res.access_token)
              wx.setStorageSync("refresh_token", res.refresh_token) //把token存入缓存，请求接口数据时要用
              wx.hideLoading()
              wx.navigateBack({
                delta: 1
              })
              // 清除全局队列
              var globalData = getApp().globalData
              globalData.requestQueue = []
            }
          }
          http.request(params)
        }
      })
  }
})
