// components/production/production.js
var http = require("../../utils/http.js")
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    item: {
      type: Object
    },
    sts: {
      type: Number
    },
  },


  /**
   * 组件的初始数据
   */
  data: {},

  /**
   * 组件的方法列表
   */
  methods: {
    toProdPage: function (e) {
      var prodid = e.currentTarget.dataset.prodid
      wx.navigateTo({
        url: "/pages/prod/prod?prodid=" + prodid,
      })
    },
    // 防止冒泡
    addBasketPrevent: function() {
      
    }
  }
})
