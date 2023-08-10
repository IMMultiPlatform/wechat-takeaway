const config = require("./config")
const qqMap = require("./qqmap-wx-jssdk.min")
const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return [year, month, day].map(formatNumber).join("/") + " " + [hour, minute, second].map(formatNumber).join(":")
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : "0" + n
}

const formatHtml = content => {
  content = content.replace(/\<img/gi, "<img style=\"width:100% !important;height:auto !important;margin:0;display:flex;\" ")
  content = content.replace(/\<td/gi, "<td  cellspacing=\"0\" cellpadding=\"0\" border=\"0\" style=\"display:block;vertical-align:top;margin: 0px; padding: 0px; border: 0px;outline-width:0px;\" ")
  content = content.replace(/width=/gi, "sss=")
  content = content.replace(/height=/gi, "sss=")
  content = content.replace(/ \/\>/gi, " style=\"max-width:100% !important;height:auto !important;margin:0;display:block;\" \/\>")
  return content
}

const formatArray = function (arr=[]) {
  let arrTmp = new Set(arr)
  return [...arrTmp]
}

// 判断全面屏手机
let isIphoneX = function () {
  let sys = wx.getSystemInfoSync()
  if (sys && sys.safeArea && sys.safeArea.top) {
    return (sys.safeArea.top > 20)
  }
  return false
}

// rpx -> px
let translatePx = function (rpx) {
  if (!rpx) {
    return 0
  }
  let sys = wx.getSystemInfoSync()
  if (sys && sys.screenWidth) {
    let scale = sys.screenWidth / 375
    let px = (scale * rpx) / 2
    return px
  }
}

// 获取小程序当前的页面url
let getCurruntUrl = function () {
  let pageArr = getCurrentPages()
  let url = ''
  if (pageArr && pageArr.length && pageArr[pageArr.length - 1].route) {
    url = pageArr[pageArr.length - 1].route
  }
  return url
}

// 暴露腾讯地图的实例
let qqMapObj = new qqMap({
  key: config.mapKey
})

// 获取用户定位信息
let getUserLocation = function () {
  let promise = new Promise((resolve, reject) => {
    wx.getLocation({
      type: 'gcj02',
      success(res) {
        qqMapObj.reverseGeocoder({
          location: {
            latitude: res.latitude,
            longitude: res.longitude
          },
          success: (result) => {
            resolve(result)
          },
          fail: (result) => {
            reject(result)
          }
        })
      },
      fail(res) {
        reject(res)
      }
    })
  })
  return promise
}

// 判断有没有获取过授权
let judgeUserLocation = function () {
  let promise = new Promise((reslove, reject) => {
    wx.getSetting({
      success: (res) => {
        // 判断是否已经获取用户定位授权
        if (res.authSetting.hasOwnProperty('scope.userLocation') && res.authSetting['scope.userLocation']) {
          getUserLocation().then((res) => {
            // 定位获得的数据，fromFlag是定位数据来源value是location表示来自于定位，chooseLocation表示来自于地图选择
            let locationParam = {
              latitude: res.result.location.lat,
              longitude: res.result.location.lng,
              nation: res.result.ad_info.nation,
              province: res.result.ad_info.province,
              city: res.result.ad_info.city,
              district: res.result.ad_info.district,
              name: res.result.address,
              fromFlag: 'location'
            }
            wx.setStorageSync('location', locationParam)
            reslove(res)
          }).catch((res) => {
            reject(res)
          })
          // 判断已经询问过用户定位授权，但是用户拒绝
        } else if (res.authSetting.hasOwnProperty('scope.userLocation') && !res.authSetting['scope.userLocation']) {
          wx.showModal({
            title: "",
            content: "定位未授权，将会影响用户体验，是否跳转到授权设置页面？",
            confirmColor: "#26B6B7",
            success: (res) => {
              if (res.confirm) {
                wx.openSetting({
                  withSubscriptions: true,
                })
              }
            }
          })
        }
      }
    })
  })
  return promise
}

// 获取两个点之间的坐标轨迹
const getMapLinePoint = function (params) {
  let promise = new Promise((resolve, reject) => {
    qqMapObj.direction({
      from: params.from,
      to: params.to,
      mode: params.mode,
      success: (res) => {
        resolve(res)
      },
      fail: (res) => {
        reject(res)
      }
    })
  })
  return promise
}

// 判断当前页面是不是在路由首页
let isFirstPage = function () {
  return function () {
    let pageArr = getCurrentPages()
    if (pageArr && pageArr.length) {
      return (pageArr.length <= 1)
    }
    return true 
  }
}

module.exports = {
  formatTime: formatTime,
  formatHtml: formatHtml,
  formatArray: formatArray,
  isIphoneX: isIphoneX(),
  getCurruntUrl: getCurruntUrl,
  qqMapObj: qqMapObj,
  getUserLocation: getUserLocation,
  judgeUserLocation: judgeUserLocation,
  getMapLinePoint: getMapLinePoint,
  translatePx: translatePx,
  isFirstPage: isFirstPage
}
