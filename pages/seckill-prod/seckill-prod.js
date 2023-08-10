// pages/seckill-prod/seckill-prod.js
var config = require("../../utils/config.js")
var http = require("../../utils/http.js")
var interval = new http.interval()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    //记录当前时间
    thisTime:0,
    hour: "00",
    minute: "00",
    second: "00",
    startTime: "",
    endTime: 0,
    //记录本场秒杀商品
    seckillProds: [],
     //用户点击时，被点击时间段的秒杀状态（开始为ture）
    seckillSts: true,
    //倒计时时长
    millisecond: 0,
    //秒杀场次
    secKillList:[],
    //用户点击查看的秒查场次
    clickSts: "",
    //记录当前页面的状态（切入页面:ture、切入后台:false、卸载页面:false）
    isClose: false,
    intervalId: 0
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
    this.getshopseckillTimeList()
    .then(this.getseckillProds)
    .then(this.secondKill)
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    if (this.data.millisecond > 0){
      interval.popinterval(this.data.intervalId)
    }
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    if (this.data.millisecond){
      interval.popinterval(this.data.intervalId)
    }
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

  //获取店铺秒杀场次
  getshopseckillTimeList:function(){
    var ths = this
    var promise = new Promise(function(resolve){
      var params = {
        url: "/qcl-shop/appshop/seckillTime/list",
        method: "GET",
        data: {
          shopId:1611
        },
        callBack:function(result){
          if (result.data.length == 0){
            resolve(ths.data.startTime)
            return
          }
          ths.setData({
            secKillList:result.data,
            startTime: result.data[0]
          })
          resolve(ths.data.startTime)
        }
      }
      http.request(params)
    })
    return promise
  },

  //查询、获取秒杀商品
  getseckillProds:function(starttime){
    var ths = this
    var promise = new Promise(function(resolve){
      if (starttime == undefined || starttime == ""){
        resolve(ths.data.millisecond)
        return
      }
      wx.showLoading()
      var param = {
        url: "/qcl-shop/seckill/pageProd",
        method: "GET",
        contentType: "application/x-www-form-urlencoded",
        data:{
          shopId: config.shopId(),
          startHour: starttime
        },
        callBack:function(res){
          var prods = res.records
          if (prods.length > 0){
            //计算商品购买率
            for (let i = 0; i < prods.length; i++){
              var progressValue = 0
              progressValue = prods[i].seckillOriginStocks - prods[i].seckillTotalStocks
              progressValue /= prods[i].seckillOriginStocks
              progressValue *= 100
              progressValue = progressValue.toFixed(2)
              prods[i].progressValue = progressValue
              //计算商品折扣
              var seckillDiscount =(1 - ((prods[i].price - prods[i].seckillPrice) / prods[i].price)) * 10
              prods[i].seckillDiscount = seckillDiscount.toFixed(2)
            }
            if (ths.data.startTime == starttime){
              ths.data.millisecond = new Date(prods[0].endTime).getTime() - new Date().getTime()
            }
          }
          ths.setData({
            seckillProds: prods,
          })
          resolve(ths.data.millisecond)
        }
      }
      wx.hideLoading()
      http.request(param)
    })
    return promise
  },

   //设置距本场结束时间倒计时
   secondKill:function(millisecond){
    let ths = this
    var p = new Promise(function(){
      var intervalId = interval.startCountDown(millisecond, ths)
      ths.setData({
        intervalId : intervalId
      })
    })
    return p
  },

  toback:function(){
    wx.navigateBack({
      delta: 1,
    })
  },

  //用户点击行为，查看秒杀商品
  getseckillProd:function(e){
    let starttime = e.currentTarget.dataset.time
    let ths = this
    ths.getseckillProds(starttime)
  
    let nowtime = new Date().getHours()
    let thstime = Number(starttime.split(":")[0])
    let flag = true
    if (thstime <= nowtime && nowtime <= thstime + 2){
      flag = true
    }else{
      flag = false
    }
    ths.setData({
      seckillSts: flag,
      clickSts:starttime
    })
  },
})