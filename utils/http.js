var config = require("config.js")
const util = require("util.js")
// 判断是否已经存在刷新token接口
var hasTokenReq = false
//统一的网络请求方法
function request(params, isGetTonken) {
  // 全局变量
  var globalData = getApp().globalData
  globalData.isLanding = false
  // 如果正在进行登陆，就将非登陆请求放在队列中等待登陆完毕后进行调用
  if (!isGetTonken && globalData.isLanding) {
    globalData.requestQueue.push(params)
    return
  }
  wx.request({
    url: config.domain + params.url, //接口请求地址
    data: params.data,
    header: {
      "content-type": params.contentType? params.contentType :  "application/x-www-form-urlencoded",
      "qclAuth": wx.getStorageSync("token") ? wx.getStorageSync("token") : "",
      "Authorization": "Basic cWNsOmExMjM0NTY3OA==",
      "userType": "miniApp"
    },
    method: params.method == undefined ? "POST" : params.method,
    dataType: "json",
    responseType: params.responseType == undefined ? "text" : params.responseType,
    success: function (res) {
      if (res.statusCode == 200) {
        //如果有定义了params.callBack，则调用 params.callBack(res.data)
        if (params.callBack) {
          params.callBack(res.data)
        }
      } else if (res.statusCode == 401) {
        wx.navigateTo({
          url: "/pages/login/login",
        })
      } else if (res.statusCode == 500) {
        wx.showToast({
          title: "服务器出了点小差",
          icon: "none"
        })
        wx.hideLoading()
      } else if (res.statusCode == 501) {
        // 添加到请求队列
        globalData.requestQueue.push(params)
        if (!globalData.isLanding) {
          globalData.isLanding = true
          //重新获取token,再次请求接口
          // 判断是否已经存在token请求
          if (hasTokenReq) return
          getNewToken()
        }
      } else if (res.statusCode == 400) {
        wx.showToast({
          title: res.data,
          icon: "none"
        })
        wx.hideLoading()
      } else if (res.statusCode == 404) {
        wx.hideLoading()
        wx.showToast({
          title: "服务器出了点小差",
          icon: "none"
        })
      } else {
        //如果有定义了params.errCallBack，则调用 params.errCallBack(res.data)
        if (params.errCallBack) {
          params.errCallBack(res)
        }
      }
      // if (!globalData.isLanding) {
      //   wx.hideLoading()
      // }
    },
    fail: function (err) {
      wx.hideLoading()
      wx.showToast({
        title: "服务器出了点小差",
        icon: "none"
      })
      if (params.failCallBack) {
        params.failCallBack(err)
      }
    }
  })
}

//获取新的token
let getNewToken = function () {
  // 标记已经存在token请求
  hasTokenReq = true
  request({
    url: "/qcl-auth/oauth/token",
    method: "post",
    data: {
      grant_type: "refresh_token",
      scope: "all",
      refresh_token: wx.getStorageSync("refresh_token") //把token存入缓存，请求接口数据时要用
    },
    callBack: result => {
      if (result.userStutas == 0) {
        wx.showModal({
          showCancel: false,
          title: "提示",
          content: "您已被禁用，不能购买，请联系客服"
        })
        wx.setStorageSync("token", "")
        wx.setStorageSync("refresh_token", "")
      } else {
        wx.setStorageSync("token", result.token_type + " " + result.access_token) //把token存入缓存，请求接口数据时要用
        wx.setStorageSync("refresh_token", result.refresh_token) //把token存入缓存，请求接口数据时要用
      }
      var globalData = getApp().globalData
      globalData.isLanding = false
      // 请求token完成，将标志位放开
      hasTokenReq = false
      // 请求队列去重复
      globalData.requestQueue = util.formatArray(globalData.requestQueue)
      while (globalData.requestQueue.length) {
        request(globalData.requestQueue.pop())
      }
    }
  }, true)
}
//通过code获取token,并保存到缓存
var getToken = function () {
  wx.login({
    success: res => {
      // 发送 res.code 到后台换取 openId, sessionKey, unionId
      request({
        login: true,
        url: "/login?grant_type=mini_app",
        data: {
          principal: res.code
        },
        callBack: result => {
          // 没有获取到用户昵称，说明服务器没有保存用户的昵称，也就是用户授权的信息并没有传到服务器
          if (!result.nickName) {
            updateUserInfo()
          }
          if (result.userStutas == 0) {
            wx.showModal({
              showCancel: false,
              title: "提示",
              content: "您已被禁用，不能购买，请联系客服"
            })
            wx.setStorageSync("token", "")
          } else {
            wx.setStorageSync("token", "bearer" + result.access_token) //把token存入缓存，请求接口数据时要用
          }
          var globalData = getApp().globalData
          globalData.isLanding = false
          while (globalData.requestQueue.length) {
            request(globalData.requestQueue.pop())
          }
        }
      }, true)

    }
  })
}

// 更新用户头像昵称
function updateUserInfo() {
  wx.getUserProfile({
    success: (res) => {
      var userInfo = JSON.parse(res.rawData)
      request({
        url: "/p/user/setUserInfo",
        method: "PUT",
        data: {
          avatarUrl: userInfo.avatarUrl,
          nickName: userInfo.nickName
        }
      })
    }
  })
}

//获取购物车商品数量
function getCartCount() {
  var params = {
    url: "/qcl-shop/shopCart/prodCount",
    method: "GET",
    data: {
      shopId: config.shopId()
    },
    callBack: function (res) {
      if (res > 0) {
        wx.setTabBarBadge({
          index: 2,
          text: res + "",
        })
        var app = getApp()
        app.globalData.totalCartCount = res
      } else {
        wx.removeTabBarBadge({
          index: 2
        })
        var app = getApp()
        app.globalData.totalCartCount = 0
      }
    }
  }
  request(params)
}

//将浏览过的商品存入缓存
function getlookedPro(pro){

  var promise = new Promise(() => {
    var visitedPro = wx.getStorageSync('lookedPro')
    if (!visitedPro){
      visitedPro = []
    }
    else{
      for (var i=0; i < visitedPro.length; i++){
        if (visitedPro[i].shopId == pro.shopId){
          if (visitedPro[i].prodId == pro.prodId){
            visitedPro.splice(i, 1)
            break
          }
        }
      }
    }
    visitedPro.unshift(pro)
    //设置本地缓存数据长度为20
    if (visitedPro.length > 20){
      visitedPro.splice(20, visitedPro.length-20)
    }
    wx.setStorageSync("lookedPro", visitedPro)
  })
  return promise
}

//倒计时
var interval = class {

  startCountDown(millisecond, ths){
    var that = ths;
    var inetrval = setInterval(function(){
      if (millisecond>0){
        var second = millisecond/1000
        var hour = parseInt(second/3600)
        second = second % 3600
        var minute = parseInt(second/60)
        second = second % 60
        var sec = parseInt(second)
        if (hour < 10){
          hour = "0" + hour
        }
        if (minute < 10){
          minute = "0" + minute
        }
        if (sec < 10){
          sec = "0" + sec
        }
        that.setData({
          hour: hour,
          minute: minute,
          second: sec
        })
        millisecond -= 100
      }else{
        clearInterval(inetrval)
        that.setData({
          hour: "00",
          minute: "00",
          second:"00"
        })
      }
    },100)
    return inetrval
  }

  popinterval(inetrvalId){
    clearInterval(inetrvalId)
  }

}

exports.getToken = getToken
exports.request = request
exports.getCartCount = getCartCount
exports.updateUserInfo = updateUserInfo
exports.getlookedPro = getlookedPro
exports.interval = interval