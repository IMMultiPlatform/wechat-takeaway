//index.js
//获取应用实例
var http = require("../../utils/http.js")
var interval = new http.interval()
var config = require("../../utils/config.js")
const util = require("../../utils/util")
const app = getApp()
const chooseLocation = requirePlugin('chooseLocation')

Page({
  data: {
    indicatorDots: true,
    indicatorColor: "#d1e5fb",
    indicatorActiveColor: "#1b7dec",
    autoplay: true,
    interval: 2000,
    duration: 1000,
    indexImgs: [],
    seq: 0,
    news: [],
    taglist: [],
    taglistTmp: [{
      id: 1,
      seq: 3,
      style: 1,
      title: "店铺上新",
      prods: []
    }, ],
    classfyListOne: [],
    classfyListTwo: [],
    sts: 0,
    scrollTop: false,
    // 透明度
    opacity: 1,
    // 定位城市
    locationCity: '',
    topPx: util.translatePx(33 * 2),
    seckillProds:[],
    millisecond:0,
    startTime: 0,
    hour: "00",
    minute: "00",
    second: "00",
    intervalId: 0
  },
  //事件处理函数
  bindViewTap: function () {
    wx.navigateTo({
      url: "../logs/logs"
    })
  },
  onLoad: function () {
  },
  // 页面滚动到指定位置指定元素固定在顶部
  onPageScroll: function (e) { //监听页面滚动
    let scrollTop = this.data.scrollTop
    let topPx = this.data.topPx
    let flag = e.scrollTop > topPx
    let opacity = (100 - (e.scrollTop * 4)) / 100
    this.setData({
      opacity: opacity
    })
    if (scrollTop === flag) return
    this.setData({
      scrollTop: flag
    })
  },

  toProdPage: function (e) {
    var prodid = e.currentTarget.dataset.prodid
    if (prodid) {
      wx.navigateTo({
        url: "/pages/prod/prod?prodid=" + prodid,
      })
    }
  },

  toCouponCenter: function () {
    wx.showToast({
      icon: "none",
      title: "该功能未开源"
    })
  },

  // 跳转搜索页
  toSearchPage: function () {
    wx.navigateTo({
      url: "/pages/search-page/search-page",
    })
  },

  //跳转商品活动页面
  toClassifyPage: function (e) {
    var url = "/pages/prod-classify/prod-classify?sts=" + e.currentTarget.dataset.sts
    var id = e.currentTarget.dataset.id
    var title = e.currentTarget.dataset.title
    url = `${url}&title=${title? title : ''}`
    if (id) {
      url += "&tagid=" + id + "&title=" + title
    }
    wx.navigateTo({
      url: url
    })
  },

  //跳转公告列表页面
  onNewsPage: function () {
    wx.navigateTo({
      url: "/pages/recent-news/recent-news",
    })
  },

  onShow: function () {
    this.getAllData()
    this.getIndexSeckillProds()
    .then(this.secondKill)
    // 判断定位逻辑
    this.locationJudge()
  },

  onHide: function() {
    //页面被隐藏时删除定时器
    if (this.data.millisecond > 0){
      interval.popinterval(this.data.intervalId)
      this.setData({
        hour: "",
        minute: "",
        second: ""
      })
    }
  },

  onUnload: function(){
    //删除定时器
    if (this.data.millisecond > 0){
      interval.popinterval(this.data.intervalId)
    }
  },

  // 首页的定位逻辑
  locationJudge: function () {
    const location = chooseLocation.getLocation()
    if(location) {
      // 如果走的是地址选择，那就直接按照选择的地址来，将选择的地址信息存到缓存
      let locationParam = {
        latitude: location.latitude,
        longitude: location.longitude,
        nation: location.nation,
        province: location.province,
        city:location.city,
        district: location.district,
        name: location.name,
        fromFlag: 'chooseLocation'
      }
      wx.setStorageSync('location', locationParam)
    }
    // 读取地址缓存
    let locationInfo = wx.getStorageSync('location')
    // 判断地址缓存来源，优先级是选择的地址大于定位的
    if (locationInfo.fromFlag === 'chooseLocation') {
      let locationCity = locationInfo.name ? locationInfo.name : "兴义市"
      this.setData({
        locationCity: locationCity
      })
      return
    } else {
      let locationInfoTmp = wx.getStorageSync('location')
      // 如果定位过，那就避免重复定位，浪费资源
      if (locationInfoTmp.fromFlag === 'location') {
        let locationInfoTmp = wx.getStorageSync('location')
        let locationCity = locationInfoTmp.district ? locationInfoTmp.district : "兴义市"
        this.setData({
          locationCity: locationCity
        })
        return
      } 
      util.judgeUserLocation().then((res) => {
        let userlocationInfo = wx.getStorageSync('location')
        let locationCity = userlocationInfo.district ? userlocationInfo.district : "兴义市"
        this.setData({
          locationCity: locationCity
        })
      })
    }
  },
  chooseMap: function() {
    let userlocationInfo = wx.getStorageSync('location')
    let location = ''
    if (userlocationInfo) {
      location = JSON.stringify({
        latitude: userlocationInfo.latitude,
        longitude: userlocationInfo.longitude
      })
    }
    wx.navigateTo({
      url: 'plugin://chooseLocation/index?key=' + config.mapKey + '&referer=' + config.referer + '&location=' + location + '&category=' + config.category
    })
  },
  getAllData() {
    this.getIndexImgs()
    this.getNoticeList()
    // 获取首页分类
    this.getTag()
    http.getCartCount() //重新计算购物车总数量
    this.getClassfyList()
  },
  //加载轮播图
  getIndexImgs() {
    //加载轮播图
    var params = {
      url: "/qcl-shop/home/indexImgs",
      method: "GET",
      data: {
        shopId: config.shopId()
      },
      callBack: (res) => {
        this.setData({
          indexImgs: res.data,
          seq: res.data
        })
      }
    }
    http.request(params)
  },
  getNoticeList() {
    // 加载公告
    var params = {
      url: `/qcl-shop/notice/noticeList/${config.shopId()}`,
      method: "GET",
      data: {},
      callBack: (res) => {
        this.setData({
          news: res.data.records,
        })
      }
    }
    http.request(params)
  },

  // 加载首页分类标签图标
  getClassfyList() {
    var params = {
      url: `/qcl-shop/category/categoryListInfo`,
      method: "GET",
      data: {
        shopId: config.shopId()
      },
      callBack: (res) => {
        let classfyList = res.data
        let classfyListOne = classfyList.slice(0, 8)
        let classfyListTwo = classfyList.slice(8, 15)
        this.setData({
          classfyListOne: classfyListOne,
          classfyListTwo: classfyListTwo
        })
      }
    }
    http.request(params)
  },


  // 加载商品标题分组列表
  getTag() {
    var params = {
      url: "/qcl-shop/prodtag/prodTagList",
      method: "GET",
      data: {},
      callBack: (res) => {
        this.setData({
          taglist: res,
        })
        let taglistTmp = this.data.taglistTmp
        for (var i = 0; i < taglistTmp.length; i++) {
          this.getTagProd(taglistTmp[i].id, i)
        }
      }
    }
    http.request(params)
  },

  getTagProd(id, index) {
    var param = {
      url: "/qcl-shop/prod/lastedProdByShop",
      method: "GET",
      data: {
        size: 10,
        current: 1,
        shopId: config.shopId()
      },
      callBack: (res) => {
        var taglistTmp = this.data.taglistTmp
        taglistTmp[index].prods = res.records
        this.setData({
          taglistTmp: taglistTmp,
        })
      }
    }
    http.request(param)
  },

  //获取首页最新的5条秒杀商品
  getIndexSeckillProds:function() {
    var ths = this
    var promise = new Promise(function(resolve){
      var param = {
        url: "/qcl-shop/seckill/indexList",
        method: "GET",
        contentType: "application/x-www-form-urlencoded",
        data:{
          shopId: 1611,
        },
        callBack:(result) => {
          var shopId = config.shopId()
          var res = []
          var starttime = 0
          var millisecond = 0
          if (result.length == 0){
            resolve(millisecond)
            return
          }
          for (let i = 0; i < result.length; i ++){
            if (result[i].shopId == shopId){
              res.push(result[i])
            }
          }
          if (res.length > 0){
            starttime = new Date(res[0].startTime).getHours()
            millisecond = new Date(res[0].endTime).getTime() - new Date().getTime()
          }
          ths.setData({
            seckillProds: res,
            startTime: starttime,
            millisecond: millisecond
          })
          resolve(millisecond)
        }
      }
      http.request(param)
    })
    return promise
  },

  //设置距本场结束时间倒计时
  secondKill:function(millisecond){
    let ths = this
    var p = new Promise(function(){
      var intervalId = interval.startCountDown(millisecond,ths)
      ths.setData({
        intervalId : intervalId
      })
    })
    return p
  },

  //跳转到商品秒杀主页
  toSeckillprods:function(){
    wx.navigateTo({
      url: "/pages/seckill-prod/seckill-prod",
    })
  },

  //跳转到秒杀商品详情页
  toskprod:function(e){
    let prodid = e.currentTarget.dataset.prodid
    wx.navigateTo({
      url: "/pages/prod/prod?prodid=" + prodid,
    })
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  // onPullDownRefresh: function () {
  //     wx.request({
  //       url: '',
  //       data: {},
  //       method: 'GET',
  //       success: function (res) { },
  //       fail: function (res) { },
  //       complete: function (res) {
  //         wx.stopPullDownRefresh();
  //       }
  //     })
  // },

  onPullDownRefresh: function () {

    // wx.showNavigationBarLoading() //在标题栏中显示加载

    //模拟加载
    var ths = this
    setTimeout(function () {

      ths.getAllData()

      // wx.hideNavigationBarLoading() //完成停止加载

      wx.stopPullDownRefresh() //停止下拉刷新

    }, 100)

  },

  /**
   * 跳转至商品详情
   */
  showProdInfo: function (e) {
    let relation = e.currentTarget.dataset.relation
    if (relation) {
      wx.navigateTo({
        url: "pages/prod/prod",
      })
    }
  }
})
