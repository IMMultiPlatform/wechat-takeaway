// components/specDlg/specDlg.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    skuList: {
      type: Array,
      value: []
    },
    skuShow: {
      type: Boolean,
      value: false
    },
    price: {
      type: Number,
      value: 0
    },
    basketChooseArr: {
      type: Object,
      value: {}
    },
    choosedCategoryId: {
      type: String,
      value: ""
    },
    prodId: {
      type: Number,
      value: 0
    },
    categoryIndex: {
      type: Number,
      value: 0
    },
    shopId: {
      type: Number,
      value: 0
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    skuGroup: {},
    findSku: true,
    defaultSku: undefined,
    selectedProp: [],
    selectedPropObj: {},
    propKeys: [],
    allProperties: [],
    skuAnimat: true
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 根据skuList进行数据组装
     */
    groupSkuProp: function () {
      var skuList = this.data.skuList

      //当后台返回只有一个SKU时，且SKU属性值为空时，即该商品没有规格选项，该SKU直接作为默认选中SKU
      if (skuList.length == 1 && skuList[0].properties == "") {
        this.setData({
          defaultSku: skuList[0]
        })
        return
      }
      var skuGroup = {} //所有的规格名(包含规格名下的规格值集合）对象，如 {"颜色"：["金色","银色"],"内存"：["64G","256G"]}
      var allProperties = [] //所有SKU的属性值集合，如 ["颜色:金色;内存:64GB","颜色:银色;内存:64GB"]
      var propKeys = [] //所有的规格名集合，如 ["颜色","内存"]
      for (var i = 0; i < skuList.length; i++) {

        //找到和商品价格一样的那个SKU，作为默认选中的SKU
        var defaultSku = this.data.defaultSku
        var isDefault = false
        if (!defaultSku && skuList[i].price == this.data.price) {
          defaultSku = skuList[i]
          isDefault = true
          this.setData({
            defaultSku: defaultSku
          })
        }
        var properties = skuList[i].properties //如：版本:公开版;颜色:金色;内存:64GB
        allProperties.push(properties)
        var propList = properties.split(";") // 如：["版本:公开版","颜色:金色","内存:64GB"]

        var selectedPropObj = this.data.selectedPropObj
        for (var j = 0; j < propList.length; j++) {

          var propval = propList[j].split(":") //如 ["版本","公开版"]
          var props = skuGroup[propval[0]] //先取出 规格名 对应的规格值数组

          //如果当前是默认选中的sku，把对应的属性值 组装到selectedProp
          if (isDefault) {
            propKeys.push(propval[0])
            selectedPropObj[propval[0]] = propval[1]
          }

          if (props == undefined) {
            props = [] //假设还没有版本，新建个新的空数组
            props.push(propval[1]) //把 "公开版" 放进空数组
          } else {
            if (!this.array_contain(props, propval[1])) { //如果数组里面没有"公开版"
              props.push(propval[1]) //把 "公开版" 放进数组
            }
          }
          skuGroup[propval[0]] = props //最后把数据 放回版本对应的值
        }
        this.setData({
          selectedPropObj: selectedPropObj,
          propKeys: propKeys
        })
      }
      this.parseSelectedObjToVals()
      this.setData({
        skuGroup: skuGroup,
        allProperties: allProperties
      })
    },

    //将已选的 {key:val,key2:val2}转换成 [val,val2]
    parseSelectedObjToVals: function () {
      var selectedPropObj = this.data.selectedPropObj
      var selectedProperties = ""
      var selectedProp = []
      for (var key in selectedPropObj) {
        selectedProp.push(selectedPropObj[key])
        selectedProperties += key + ":" + selectedPropObj[key] + ";"
      }
      selectedProperties = selectedProperties.substring(0, selectedProperties.length - 1)
      this.setData({
        selectedProp: selectedProp
      })

      var findSku = false
      for (var i = 0; i < this.data.skuList.length; i++) {
        if (this.data.skuList[i].properties == selectedProperties) {
          findSku = true
          this.setData({
            defaultSku: this.data.skuList[i],
          })
          break
        }
      }
      this.setData({
        findSku: findSku
      })
    },

    //点击选择规格
    toChooseItem: function (e) {
      var val = e.currentTarget.dataset.val
      var key = e.currentTarget.dataset.key
      var selectedPropObj = this.data.selectedPropObj
      selectedPropObj[key] = val
      this.setData({
        selectedPropObj: selectedPropObj
      })
      this.parseSelectedObjToVals()
    },

    //判断数组是否包含某对象
    array_contain: function (array, obj) {
      for (var i = 0; i < array.length; i++) {
        if (array[i] == obj) //如果要求数据类型也一致，这里可使用恒等号===
          return true
      }
      return false
    },
    // 规格弹窗关闭
    closeSku: function () {
      this.setData({
        skuAnimat: false
      })
      setTimeout(() => {
        this.setData({
          skuShow: false,
          skuAnimat: true,
          defaultSku: undefined,
          skuGroup: {},
          findSku: true,
          selectedProp: [],
          selectedPropObj: {},
          propKeys: [],
          allProperties: []
        })
      }, 400);
    },
    // 防止滚动冒泡
    preventTouchMove: function () {},
    /**
     * 减数量
     */
    onCountMinus: function () {
      let basketChooseArr = this.data.basketChooseArr
      let prodId = this.data.prodId
      let reqSkuId = this.data.defaultSku.skuId
      let prodCount = -1
      let shopId = this.data.shopId
      let choosedCategoryId = this.data.choosedCategoryId
      let basketId = basketChooseArr[choosedCategoryId].prod[prodId].sku[reqSkuId].basketId
      let specParam = {
        prodId: prodId,
        reqSkuId: reqSkuId,
        prodCount: prodCount,
        shopId: shopId,
        basketId: basketId,
        choosedCategoryId: choosedCategoryId
      }
      this.triggerEvent('specCountMinus', specParam)
    },

    /**
     * 加数量
     */
    onCountPlus: function (e) {
      let categoryIndex = this.data.categoryIndex
      let prodId = this.data.prodId
      let reqSkuId = this.data.defaultSku.skuId
      let prodCount = 1
      let shopId = this.data.shopId
      let clickDetail = e.detail
      let specParam = {
        prodCount: prodCount,
        reqSkuId: reqSkuId,
        shopId: shopId,
        prodId: prodId,
        index: categoryIndex,
        clickDetail: clickDetail
      }
      this.triggerEvent('specCountPlus', specParam)
    }
  },
  observers: {
    'skuList': function (skuList) {
      this.groupSkuProp()
    }
  }
})
