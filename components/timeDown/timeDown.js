// components/timeDown/timeDown.js

var http = require("../../utils/http.js")
var interval = new http.interval()

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    //商品原价
    originalPrice: {
      type: Number
    },
    //商品秒杀价
    sedkillPrice: {
      type: Number
    },
    hour:{
      type: String,
      value: "00"
    },
    minute:{
      type: String,
      value: "00"
    },
    second:{
      type: String,
      value: "00"
    },
    millisecond:{
      type: Number,
      value: 7200000
    },
    inetervalId:{
      type: Number,
      value: 0
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
  },

  lifetimes: {
    attached:function(){
      var ths = this
      var inetervalId = interval.startCountDown(ths.data.millisecond, ths)
      this.setData({
        inetervalId:inetervalId
      })
    }
  },

  pageLifetimes: {
    hide: function() {
      interval.popinterval(this.data.intervalId)
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    
  }
})
