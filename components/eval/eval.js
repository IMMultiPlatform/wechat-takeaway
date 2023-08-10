// components/eval/eval.js
const http = require('../../utils/http.js')
const config = require('../../utils/config.js')
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    commentShow: {
      type: Boolean,
      value: false
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    prodCommData: {},
    prodCommPage: {
      current: 0,
      pages: 0,
      records: []
    },
    littleCommPage: [],
    evaluate: -1
  },

  /**
   * 组件的方法列表
   */
  methods: {
    getProdCommData() {
      http.request({
        url: "/qcl-shop/prodComm/shopCommData",
        method: "GET",
        data: {
          shopId: config.shopId()
        },
        callBack: (res) => {
          this.setData({
            prodCommData: res
          })
          this.triggerEvent("getEvalCount", res.number)
        }
      })
    },
    // 预览图片
    previewHandle: function(e) {
      let urls = e.currentTarget.dataset.urllist
      let current = e.currentTarget.dataset.url
      wx.previewImage({
        current: current, 
        urls: urls 
      })
    },
    // 获取部分评论
    getLittleProdComm() {
      if (this.data.prodCommPage.records.length) {
        return
      }
      this.getProdCommPage()
    },
    getMoreCommPage(e) {
      this.getProdCommPage()
    },
    // 获取分页获取评论
    getProdCommPage(e) {
      if (e) {
        if (e.currentTarget.dataset.evaluate === this.data.evaluate) {
          return
        }
        this.setData({
          prodCommPage: {
            current: 0,
            pages: 0,
            records: []
          },
          evaluate: e.currentTarget.dataset.evaluate
        })
      }
      http.request({
        url: "/qcl-shop/prodComm/prodCommPageByShop",
        method: "GET",
        data: {
          shopId: config.shopId(),
          size: 10,
          current: this.data.prodCommPage.current + 1,
          evaluate: this.data.evaluate
        },
        callBack: (res) => {
          res.records.forEach(item => {
            if (item.pics) {
              item.pics = item.pics.split(",")
            }
          })
          let records = this.data.prodCommPage.records
          records = records.concat(res.records)
          this.setData({
            prodCommPage: {
              current: res.current,
              pages: res.pages,
              records: records
            }
          })
          // 如果商品详情中没有评论的数据，截取两条到商品详情页商品详情
          if (!this.data.littleCommPage.length) {
            this.setData({
              littleCommPage: records.slice(0, 2)
            })
          }
        }
      })
    }
  },
  lifetimes: {
    attached: function() {
      this.getProdCommData()
      this.getLittleProdComm()
      // 在组件实例进入页面节点树时执行
    },
    detached: function() {
      // 在组件实例被从页面节点树移除时执行
    },
  }
})
