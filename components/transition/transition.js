// components/transition/transition.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    showFlag: {
      type: Boolean,
      value: false
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    animatedFlag: true,
    showFlagComputed: false
  },

  /**
   * 组件的方法列表
   */
  methods: {

  },
  observers: {
    'showFlag': function(showFlag) {
      let showFlagComputed = this.data.showFlagComputed
      if (showFlag && !showFlagComputed) {
        this.setData({
          showFlagComputed: showFlag,
          animatedFlag: true
        })
      } else if (!showFlag && showFlagComputed) {
        this.setData({
          animatedFlag: false
        })
        setTimeout(() => {
          this.setData({
            showFlagComputed: false,
            animatedFlag: true
          })
        }, 400)
      }
      
    }
  }
})
