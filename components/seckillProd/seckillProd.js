// components/seckillProd/seckillProd.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    //进度条的值
    progressValue:{
      type: Number,
      value: 40.00
    },
    item:{
      type: Object,
    },
    sts:{
      type: Boolean,
      value: true
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
  },

  /**
   * 组件的方法列表
   */
  methods: {
    goBuy:function(e){
      let prodid = e.currentTarget.dataset.prodid
      wx.navigateTo({
        url: "/pages/prod/prod?prodid=" + prodid,
      })
    }
  }
})
