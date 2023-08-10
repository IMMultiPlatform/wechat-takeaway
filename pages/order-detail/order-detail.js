// pages/order-detail/order-detail.js

var http = require("../../utils/http.js")
const util = require("../../utils/util")
Page({

  /**
   * 页面的初始数据
   */
  data: {
    orderItemDtos: [],
    remarks: "",
    actualTotal: 0,
    userAddrDto: null,
    orderNumber: "",
    createTime: "",
    status: 0,
    productTotalAmount: 0,
    transfee: 0,
    reduceAmount: 0,
    prodid: "",
    orderType: 0,
    showPayFlag: false,
    arrivedTime: '',
    shopName: '',
    packingFee: '',
    riderLat: "",
    riderLng: "",
    riderMobile: "",
    riderShopId: "",
    shopLat: "",
    shopLng: "",
    shopMobile: "",
    // 地图渲染气泡
    markers: [
      {
        id: 1,
        latitude: "",
        longitude: "",
        name: "商家",
        iconPath: "../../images/icon/shop.png",
        width: 22,
        height: 22,
        zIndex: 10,
        callout: {
          content: "店铺",
          display: "ALWAYS",
          color: "#fff",
          bgColor: "#26B6B7",
          padding: 5,
          borderRadius: 5
        }
      },
      {
        id: 2,
        latitude: "",
        longitude: "",
        name: "骑手",
        iconPath: "",
        width: 33,
        height: 33,
        zIndex: 20,
        callout: {
          content: "骑手\r",
          display: "ALWAYS",
          color: "#fff",
          bgColor: "#26B6B7",
          padding: 5,
          borderRadius: 5
        }
      },
      {
        id: 3,
        latitude: "",
        longitude: "",
        name: "收货地址",
        iconPath: "../../images/icon/shouhuo.png",
        width: 33,
        height: 33,
        zIndex: 10,
        callout: {
          content: "收货地址",
          display: "ALWAYS",
          color: "#fff",
          bgColor: "#26B6B7",
          padding: 5,
          borderRadius: 5
        }
      }
    ],
    mapScale: 15,
    riderName: "",
    showMapFlag: false,
    centerLng: 0,
    centerLat: 0,
    includePoints: [],
    intervalHandle: '',
    mapCtx: null,
    polyline: [],
    payType: 3
  },

  //跳转商品详情页
  toProdPage: function (e) {
    var prodid = e.currentTarget.dataset.prodid
    wx.navigateTo({
      url: "/pages/prod/prod?prodid=" + prodid,
    })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let intervalHandle = setInterval(() => {
      this.loadOrderDetail(options.orderNum)
    }, 5000)
    let mapCtx = wx.createMapContext("orderMap")
    this.setData({
      orderNumber: options.orderNum,
      intervalHandle: intervalHandle,
      mapCtx: mapCtx
    })
  },
  // 获取路线坐标点集合
  setLineWay: function (reqPoint) {
    // 获取路线经纬度
    let pointParams = {
      from: reqPoint.from,
      to: reqPoint.to,
      mode: "bicycling"
    }
    util.getMapLinePoint(pointParams).then((res) => {
      let coors = res.result.routes[0].polyline
      let distance = res.result.routes[0].distance
      let duration = res.result.routes[0].duration
      let points = [{
        longitude: coors[1],
        latitude: coors[0]
      }]
      // 解压经纬度
      let n = 1
      for (var i = 2; i < coors.length; i++) {
        coors[i] = coors[i - 2] + coors[i] / 1000000
        if (!points[n]){
          let item = {
            latitude: coors[i]
          }
          points.push(item)
          continue
        } else {
          points[n].longitude = coors[i]
          n++
        }
      }
      let polyline = [{
        points: points,
        width: 5,
        color: "#26B6B7"
      }]
      // 在骑手的头标上加距离
      let markers = this.data.markers
      if (distance > 100) {
        distance = (distance / 1000).toFixed(2)
        distance = String(distance) + "公里"
      } else if(distance < 100 && distance > 0) {
        distance = String(distance) + "米"
      } else {
        distance = ""
      }
      markers[1].callout.content = `骑手\n${distance}`
      this.setData({
        polyline: polyline,
        markers: markers
      })
    }).catch((res) => {
      console.log(res)
    })
  },
  // 判断地图是否显示，以及显示的放大倍数
  judgeMaplg: function (res) {
    let status = res.status
    let reqPoint = ""
    let polyline = this.data.polyline
    let param = {
      mapScale: 15,
      showMapFlag: false,
      centerLng: res.shopLng,
      centerLat: res.shopLat,
      includePoints: {
        points: [],
        padding: [80, 50, 50, 50]
      },
      riderIconPath: "../../images/icon/rider.png"
    }
    switch(status) {
      case 1:
        // 待支付
        return param;
      case 2:
        // 已支付
        param.includePoints.points.push({
          longitude: res.shopLng,
          latitude: res.shopLat
        })
        param.includePoints.points.push({
          longitude: res.userAddrDto.longitude,
          latitude: res.userAddrDto.latitude
        })
        if (res.riderLng && res.riderLng != '0') {
          // 骑手已接单
          param.includePoints.points.push({
            longitude: res.riderLng,
            latitude: res.riderLat
          })
          reqPoint = {
            from: {
              longitude: res.riderLng,
              latitude: res.riderLat
            },
            to: {
              longitude: res.shopLng,
              latitude: res.shopLat
            }
          }
          // 判断骑手和商店的经度，来决定骑手的朝向
          if (res.riderLng <= res.shopLng) {
            param.riderIconPath = "../../images/icon/rider.png"
          } else {
            param.riderIconPath = "../../images/icon/rider_rebase.png"
          }
          this.setLineWay(reqPoint)
        } else {
          // 骑手未接单
          reqPoint = {
            from: {
              longitude: res.shopLng,
              latitude: res.shopLat
            },
            to: {
              longitude: res.userAddrDto.longitude,
              latitude: res.userAddrDto.latitude
            }
          }
          if (polyline && polyline.length == 0) {
            this.setLineWay(reqPoint)
          }
        }
        param.showMapFlag = true
        return param;
      case 3:
        // 已取件，配送中
        param.includePoints.points.push({
          longitude: res.userAddrDto.longitude,
          latitude: res.userAddrDto.latitude
        })
        if (res.riderLng && res.riderLng != '0') {
          param.includePoints.points.push({
            longitude: res.riderLng,
            latitude: res.riderLat
          })
          reqPoint = {
            from: {
              longitude: res.riderLng,
              latitude: res.riderLat
            },
            to: {
              longitude: res.userAddrDto.longitude,
              latitude: res.userAddrDto.latitude
            }
          }
          this.setLineWay(reqPoint)
          // 判断骑手和用户的经度，来决定骑手的朝向
          if (res.riderLng <= res.userAddrDto.longitude) {
            param.riderIconPath = "../../images/icon/rider.png"
          } else {
            param.riderIconPath = "../../images/icon/rider_rebase.png"
          }
          param.centerLat = res.riderLat
          param.centerLng = res.riderLng
        }
        param.mapScale = 17
        param.showMapFlag = true
        return param;
      case 4:
        // 配送中
        param.includePoints.points.push({
          longitude: res.userAddrDto.longitude,
          latitude: res.userAddrDto.latitude
        })
        if (res.riderLng && res.riderLng != '0') {
          param.includePoints.points.push({
            longitude: res.riderLng,
            latitude: res.riderLat
          })
          reqPoint = {
            from: {
              longitude: res.riderLng,
              latitude: res.riderLat
            },
            to: {
              longitude: res.userAddrDto.longitude,
              latitude: res.userAddrDto.latitude
            }
          }
          this.setLineWay(reqPoint)
          // 判断骑手和用户的经度，来决定骑手的朝向
          if (res.riderLng <= res.userAddrDto.longitude) {
            param.riderIconPath = "../../images/icon/rider.png"
          } else {
            param.riderIconPath = "../../images/icon/rider_rebase.png"
          }
          param.centerLat = res.riderLat
          param.centerLng = res.riderLng
        }
        param.mapScale = 17
        param.showMapFlag = true
        return param;
      case 5:
        // 已送达
        param.includePoints.points.push({
          longitude: res.userAddrDto.longitude,
          latitude: res.userAddrDto.latitude
        })
        param.mapScale = 17
        param.centerLat = res.userAddrDto.latitude
        param.centerLng = res.userAddrDto.longitude
        param.showMapFlag = true
        clearInterval(this.data.intervalHandle)
        return param;
        default: 
        clearInterval(this.data.intervalHandle)
        return param;
    }
  },
  /**
   * 加载订单数据
   */
  loadOrderDetail: function (orderNum) {
    //加载订单详情
    var params = {
      url: "/qcl-shop/myOrder/orderDetail",
      method: "GET",
      data: {
        orderNumber: orderNum
      },
      callBack: (res) => {
        // 判断地图是否显示
        let mapData = this.judgeMaplg(res)
        let mapCtx = this.data.mapCtx
        mapCtx.includePoints(mapData.includePoints)
        // 整理地图数据
        let markers = this.data.markers
        // 初始化店铺和用户收货地址的经纬度
        if (!markers[0].latitude) {
          markers[0].latitude = res.shopLat
          markers[0].longitude = res.shopLng
          markers[2].latitude = res.userAddrDto.latitude
          markers[2].longitude = res.userAddrDto.longitude
        }
        markers[1].latitude = res.riderLat
        markers[1].longitude = res.riderLng
        markers[1].iconPath = mapData.riderIconPath

        // 已送达状态下需要隐藏骑手
        if (res.status == 5) {
          markers[1].latitude = 0
          markers[1].longitude = 0
        }
        // 中心点初始化
        if (this.data.centerLat == 0) {
          this.setData({
            centerLat: mapData.centerLat,
            centerLng: mapData.centerLng
          })
        }
        this.setData({
          orderNumber: orderNum,
          arrivedTime: res.arrivedTime,
          actualTotal: res.actualTotal,
          userAddrDto: res.userAddrDto,
          remarks: res.remarks,
          orderItemDtos: res.orderItemDtos,
          createTime: res.createTime,
          status: res.status,
          productTotalAmount: res.total + res.reduceAmount,
          transfee: res.deliveryFee,
          reduceAmount: res.reduceAmount,
          shopName: res.shopName,
          packingFee: res.packingFee,
          riderLat: res.riderLat,
          riderLng: res.riderLng,
          riderMobile: res.riderMobile,
          riderShopId: res.riderShopId,
          shopLat: res.shopLat,
          shopLng: res.shopLng,
          shopMobile: res.shopMobile,
          markers: markers,
          riderName: res.riderName,
          showMapFlag: mapData.showMapFlag,
          mapScale: mapData.mapScale,
          includePoints: mapData.includePoints,
          payType: res.payType
        })
      }
    }
    http.request(params)
  },

  // 联系商家
  callShopHandle: function() {
    wx.makePhoneCall({
      phoneNumber: this.data.shopMobile
    })
  },

  // 联系骑手
  callRiderHandle: function() {
    wx.makePhoneCall({
      phoneNumber: this.data.riderMobile
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
    this.loadOrderDetail(this.data.orderNumber)
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
    clearInterval(this.data.intervalHandle)
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


  // 一键复制事件
  copyBtn: function (e) {
    var ths = this
    wx.setClipboardData({
      //准备复制的数据
      data: ths.data.orderNumber,
      success: function (res) {
        wx.showToast({
          title: "复制成功",
        })
      }
    })
  },
  /**
   * 取消订单
   */
  onCancelOrder: function (e) {
    var ordernum = this.data.orderNumber
    wx.showModal({
      title: "",
      content: "要取消此订单？",
      confirmColor: "#3e62ad",
      cancelColor: "#3e62ad",
      cancelText: "否",
      confirmText: "是",
      success: (res) => {
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
            callBack: (res) => {
              this.loadOrderDetail(this.data.orderNumber)
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
    let orderNumbers = this.data.orderNumber
    let actualTotal = this.data.actualTotal
    this.setData({
      showPayFlag: true,
      orderNumbers: orderNumbers,
      actualTotal: actualTotal
    })
  },

  // 支付成功跳转
  paySuccess: function () {
    // console.log("支付成功");
    wx.redirectTo({
      url: "/pages/pay-result/pay-result?sts=1&orderNumbers=" + this.data.orderNumber + "&orderType=" + this.data.orderType,
    })
  },

  // 支付失败
  payFailed: function () {
    wx.redirectTo({
      url: "/pages/pay-result/pay-result?sts=0&orderNumbers=" + this.data.orderNumber + "&orderType=" + this.data.orderType,
    })
  },
  toDeliveryPage: function (e) {
    wx.navigateTo({
      url: "/pages/express-delivery/express-delivery?orderNum=" + this.data.orderNumber
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
              orderNumber: this.data.orderNumber
            },
            callBack: function (res) {
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
  },
  // 再来一单
  onBuyAgain: function () {
    wx.showLoading()
    var params = {
      url: "/qcl-shop/shopCart/anotherOrder",
      method: "POST",
      data: {
        orderNumber: this.data.orderNumber
      },
      callBack: function (res) {
        wx.switchTab({
          url: '/pages/basket/basket'
        })
      }
    }
    http.request(params)
  }
})