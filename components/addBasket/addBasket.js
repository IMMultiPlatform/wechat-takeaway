// components/addBasket/addBasket.js
const http = require("../../utils/http")
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    width: {
      type: Number,
      value: ''
    },
    height: {
      type: Number,
      value: ''
    },
    prodInfo: {
      type: Object,
      value: {}
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    clickFlag: false
  },

  /**
   * 组件的方法列表
   */
  methods: {
    addBasket: function () {
      wx.vibrateShort({
        type: "heavy"
      })
      this.setData({
        clickFlag: true
      })
      setTimeout(() => {
        this.setData({
          clickFlag: false
        })
      }, 400)
      // 判断是否存在skuId,不存在skuId就跳转商详页
      if (!this.data.prodInfo.skuList || this.data.prodInfo.skuList.length == 0) {
        wx.navigateTo({
          url: "/pages/prod/prod?prodid=" + this.data.prodInfo.prodId,
        })
        return
      }
      this.addBasketRequest()
    },
    addBasketRequest: function () {
      wx.showLoading({
        mask: true
      })
      var params = {
        url: "/qcl-shop/shopCart/changeItem",
        method: "POST",
        contentType: 'application/json',
        data: {
          basketId: 0,
          count: 1,
          prodId: this.data.prodInfo.prodId,
          shopId: this.data.prodInfo.shopId,
          skuId: this.data.prodInfo.skuList[0].skuId
        },
        callBack: function (res) {
          //console.log(res);
          wx.hideLoading()
          if (res.code == 500) {
            wx.showToast({
              title: res.data,
              icon: "none"
            })
            return
          }
          let app = getApp()
          app.globalData.totalCartCount += 1
          wx.setTabBarBadge({
            index: 2,
            text: app.globalData.totalCartCount + "",
          })
          wx.hideLoading()
          wx.showToast({
            title: "加入购物车成功",
            icon: "none"
          })
        }
      }
      http.request(params)
    }
  }
})