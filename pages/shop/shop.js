// pages/shop/shop.js
const util = require("../../utils/util.js")
const config = require("../../utils/config.js")
const http = require("../../utils/http.js")
const basketAnimat = require("../../utils/basketAnimat")
Page({

  /**
   * 页面的初始数据
   */
  data: {
    needNaviback: !(util.isFirstPage()),
    // 店铺是否被关注
    isLikedShop: false,
    scrollControl: false,
    topBarFixed: false,
    topBarOpacity: 0,
    tabLineLeft: 0,
    choosedTab: "prod",
    swiperIndex: 0,
    query: "",
    tabArr: [{
      id: "prodTab",
      index: 0,
      tap: "prod"
    },{
      id: "evalTab",
      index: 1,
      tap: "eval"
    },{
      id: "shopTab",
      index: 0,
      tap: "shop"
    }],
    evalCount: 0,
    showFlag: false,
    searchWidth: 0,
    showSearchFlag: false,
    // 轮播图属性数据
    indicatorDots: true,
    indicatorColor: "#d1e5fb",
    indicatorActiveColor: "#1b7dec",
    autoplay: true,
    interval: 3500,
    duration: 1000,
    indexImgs: [],
    // 左侧菜单属性
    leftTabSelTop: 0,
    leftTabIndex: 0,
    shopCategoryList: [],
    categoryProdList: [],
    categoryName: "",
    // 当下的分类id
    choosedCategoryId: "",
    // 用户购物操作缓存
    basketChooseArr: {},
    categoryIndex: 0,
    // 购物车返回数据
    shopCartItems: [],
    finalMoney: 0,
    totalMoney: 0,
    subtractMoney: 0,
    // 购物车弹窗的变量
    shopCartItemDiscounts: [],
    basketDlgShow: false,
    basketDlgAnimat: true,
    shopInfo: {},
    // 规格弹窗
    skuShow: false,
    choosedSkuList: [],
    categoryIndex: 0,
    shopId: config.shopId(),
    menuScrollTop: 0,
    // 购物车底部按钮
    btnBasket: {
      left: 0,
      top: 0
    },
    clickAddBtn: {
      left: 0,
      top: 0
    },
    animateElmLeft: -50,
    animateElmTop: 0,
    canvasShow: false,
    // 起送逻辑
    minimumOrderAmount: 0,
    // 满减提示
    baskeTips: "",
    discountList: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // dom节点初始化
    wx.createIntersectionObserver().relativeTo("#topBar").observe("#tabShim", (res) => {
      let flag = (res.intersectionRatio > 0)
      this.setData({
        // topBarFixed: flag,
        scrollControl: flag,
        topBarOpacity: 1
      })
    })
    wx.createSelectorQuery().select('#btn-basket').boundingClientRect((rect) => {
      this.setData({
        btnBasket: rect
      })
    }).exec()
    // 加载页面数据
    // this.initUserData()
    //this.getIndexImgs()
    this.getCategoryList()
  },

  // 获取评论数量
  getEvalCount: function(e) {
    let evalCount = e.detail
    if (!evalCount) {
      evalCount = 0
    }
    this.setData({
      evalCount: evalCount
    })
  },

  // 获取店铺满减信息
  fetchDiscountData: function() {
    var params = {
      url: "/qcl-shop/discount/getDiscountByShopId",
      method: "GET",
      data: {
        shopId: config.shopId()
      },
      callBack: (res) => {
        let discountList = []
        if (res.data.length && res.data[0].discounts) {
          discountList = res.data[0].discounts
        }
        this.setData({
          discountList: discountList
        })
      }
    }
    http.request(params)
  },

  // 获取购物车数据
  fetchBasketData: function () {
    var params = {
      url: "/qcl-shop/shopCart/info",
      method: "POST",
      data: {
        shopId: config.shopId()
      },
      callBack: res => {
        if (res.length > 0) {
          var shopCartItems = res[0].shopCartItemDiscounts[0].shopCartItems
          var shopCartItemDiscounts = res[0].shopCartItemDiscounts
          let basketChooseArr = {}
          // 这里将购物车已选中的数据存入对象中，方便通过索引直接访问到形如
          for (let i = 0; i < shopCartItems.length; i++) {
            let choosedCategoryId = shopCartItems[i].categoryId
            if (!basketChooseArr[choosedCategoryId]) {
              basketChooseArr[choosedCategoryId] = {
                count: 0,
                prod: {},
                categoryId: choosedCategoryId
              }
            }
            // 计算种类数量
            basketChooseArr[choosedCategoryId].count += shopCartItems[i].prodCount
            if (!basketChooseArr[choosedCategoryId].prod[shopCartItems[i].prodId]) {
              basketChooseArr[choosedCategoryId].prod[shopCartItems[i].prodId]={
                sku: {},
                prodSkuCount: 0
              }
            }
            // 计算sku维度的总量
            basketChooseArr[choosedCategoryId].prod[shopCartItems[i].prodId].prodSkuCount += shopCartItems[i].prodCount
            basketChooseArr[choosedCategoryId].prod[shopCartItems[i].prodId].sku[shopCartItems[i].skuId] = shopCartItems[i]
          }
          this.setData({
            shopCartItemDiscounts: shopCartItemDiscounts,
            basketChooseArr: basketChooseArr
          })
        } else {
          this.setData({
            shopCartItemDiscounts: [],
            basketChooseArr: {}
          })
        }
        // 计算总价
        this.calTotalPrice()
      }
    }
    http.request(params)
  },

  /**
   * 计算购物车总额
   */
  calTotalPrice: function () {
    var shopCartItemDiscounts = this.data.shopCartItemDiscounts
    var shopCartIds = []
    for (var i = 0; i < shopCartItemDiscounts.length; i++) {
      var cItems = shopCartItemDiscounts[i].shopCartItems
      for (var j = 0; j < cItems.length; j++) {
        shopCartIds.push(cItems[j].basketId)
      }
    }

    var ths = this
    var params = {
      url: `/qcl-shop/shopCart/totalPay?shopid=${config.shopId()}`,
      method: "POST",
      data: shopCartIds,
      contentType: 'application/json',
      callBack: function (res) {
        let baskeTips = ""
        if (res.shopCartAmountDtos && res.shopCartAmountDtos.length > 0 && res.shopCartAmountDtos[0].discountDesc) {
          baskeTips = res.shopCartAmountDtos[0].discountDesc
        }
        ths.setData({
          finalMoney: res.finalMoney,
          totalMoney: res.totalMoney,
          subtractMoney: res.subtractMoney,
          baskeTips: baskeTips
        })
      }
    }
    http.request(params)

  },

  initUserData: function () {
    let Basket = wx.getStorageSync('shopBasketData')
    if (!Basket) {
      this.data.basketChooseArr = {}
      return
    }
    let basketChooseArr = Basket[config.shopId()] ? Basket[config.shopId()] : {}
    this.data.basketChooseArr = basketChooseArr
  },
  // 加载分类列表
  getCategoryList: function () {
    var ths = this
    var params = {
      url: "/qcl-shop/category/categoryListInfo",
      method: "GET",
      data: {
        shopId: config.shopId()
      },
      callBack: function (res) {
        // 组装分类列表，实时渲染提示标
        ths.setData({
          shopCategoryList: res.data,
          categoryName: res.data[0].categoryName,
          choosedCategoryId: res.data[0].categoryId
        })
        ths.getProdList(res.data[0].categoryId)
      }
    }
    http.request(params)
  },

  getProdList(categoryId) {
    //加载分类列表
    this.setData({
      showEmpty: false
    })
    wx.showLoading()
    var params = {
      url: `/qcl-shop/category/productInfoList`,
      method: "GET",
      data: {
        categoryId: categoryId,
        shopId: config.shopId()
      },
      callBack: (res) => {
        // 渲染数据
        this.setData({
          categoryProdList: res.data
        })
        wx.hideLoading()
      }
    }
    http.request(params)
  },

  /**
   * 改变购物车数量接口
   */
  homeUpdateCount: function (prodCount, reqSkuId, shopId, prodId, index) {
    var params = {
      url: "/qcl-shop/shopCart/changeItem",
      method: "POST",
      contentType: 'application/json',
      data: {
        count: prodCount,
        skuId: reqSkuId,
        shopId: shopId,
        prodId: prodId
      },
      callBack:(res) => {
        if (res.code == 500) {
          wx.hideToast()
          wx.showToast({
            title: res.msg,
            icon: "none"
          })
          return
        }
        let shopCartItemDiscounts = this.data.shopCartItemDiscounts
        let shopCartItems = []
        if (!shopCartItemDiscounts || shopCartItemDiscounts.length <= 0 ||
          !shopCartItemDiscounts[0].shopCartItems) {
          shopCartItems = []
        } else {
          shopCartItems = this.data.shopCartItemDiscounts[0].shopCartItems
        }
        
        let count = 0
        for (let i = 0; i < shopCartItems.length; i++) {
          if (shopCartItems[i].basketId == res.data.basketId) {
            count += 1
            shopCartItems[i].prodCount += prodCount
            break
          }
        }
        var basketChooseArr = this.data.basketChooseArr
        var resCategoryId = res.data.categoryId
        var resProdId = prodId
        // 新商品加入购物车
        if (count == 0) {
          // 构建购物车数据
          shopCartItemDiscounts[0] = {}
          let categoryProdList = this.data.categoryProdList
          let pushParam = {}
          let skuListIndex = 0
          // 寻找skuid对应的数据
          for(let i = 0; i < categoryProdList[index].skuList.length; i++) {
            if (categoryProdList[index].skuList[i].skuId == reqSkuId) {
              skuListIndex = i
              break
            }
          }
          // 构建新加购数据
          Object.assign(pushParam, res.data, categoryProdList[index].skuList[skuListIndex], categoryProdList[index])
          pushParam.prodCount = 1
          shopCartItems.push(pushParam)
          shopCartItemDiscounts[0].shopCartItems = shopCartItems
          // 构建用户操作数据
          if (!basketChooseArr[resCategoryId]) {
            basketChooseArr[resCategoryId] = {
              count: 0,
              prod: {},
              categoryId: resCategoryId
            }
          }
          if (!basketChooseArr[resCategoryId].prod[resProdId]) {
            basketChooseArr[resCategoryId].prod[resProdId]={
              sku: {},
              prodSkuCount: 0
            }
          }
          if (!basketChooseArr[resCategoryId].prod[resProdId].sku[reqSkuId]) {
            basketChooseArr[resCategoryId].prod[resProdId].sku[reqSkuId] = pushParam
          }
        }
        // 构建用户在店铺的商品选择结构
        basketChooseArr[resCategoryId].count += prodCount
        basketChooseArr[resCategoryId].prod[resProdId].prodSkuCount += prodCount
        
        this.setData({
          basketChooseArr: basketChooseArr,
          shopCartItemDiscounts: shopCartItemDiscounts
        })
        this.calTotalPrice()//计算总价
        http.getCartCount()
      }
    }
    http.request(params)
  },

  // 购物车减按钮
  basketCountMinus: function (e) {
    wx.vibrateShort({
      type: "heavy"
    })
    let cindex = e.currentTarget.dataset.cindex
    let index = e.currentTarget.dataset.index
    let shopCartItemDiscounts = this.data.shopCartItemDiscounts
    let prodId = e.currentTarget.dataset.prodid
    let reqSkuId = e.currentTarget.dataset.skuid
    let prodCount = -1
    let shopId = e.currentTarget.dataset.shopid
    let basketId = e.currentTarget.dataset.basketid
    let categoryId = e.currentTarget.dataset.categoryid
    if (shopCartItemDiscounts[index].shopCartItems[cindex].prodCount <= 1) {
      this.deleteOneItem(basketId, reqSkuId, prodId, categoryId)
      return
    }
    this.homeUpdateCount(prodCount, reqSkuId, shopId, prodId)
  },

  // 购物车加按钮
  basketCountPlus: function (e) {
    let btnBasket = this.data.btnBasket
    let clickAddBtn = e.detail
    let config = {
      origin: clickAddBtn,
      target: btnBasket,
      wxPage: this
    }
    let basketAnimatBody = new basketAnimat.Parabola(config)
    basketAnimatBody.animated()
    let prodId = e.currentTarget.dataset.prodid
    let reqSkuId = e.currentTarget.dataset.skuid
    let shopId = e.currentTarget.dataset.shopid
    let prodCount = 1
    this.homeUpdateCount(prodCount, reqSkuId, shopId, prodId)
    wx.vibrateShort({
      type: "heavy"
    })
  },

  // 清空购物车
  clearBasketHandle: function () {
    wx.vibrateShort({
      type: "heavy"
    })
    var shopCartItemDiscounts = this.data.shopCartItemDiscounts
    var basketIds = []
    for (var i = 0; i < shopCartItemDiscounts.length; i++) {
      var cItems = shopCartItemDiscounts[i].shopCartItems
      for (var j = 0; j < cItems.length; j++) {
        basketIds.push(cItems[j].basketId)
      }
    }
    if (basketIds.length == 0) {
      wx.showToast({
        title: "购物车已空",
        icon: "none"
      })
    } else {
      wx.showModal({
        title: "",
        content: "确认要清空吗？",
        confirmColor: "#26B6B7",
        success: (res) => {
          if (res.confirm) {
            wx.showLoading({
              mask: true
            })
            var params = {
              url: `/qcl-shop/shopCart/deleteItem?shopid=${config.shopId()}`,
              method: "POST",
              contentType: 'application/json',
              data: basketIds,
              callBack: (result) => {
                if (result.code != 200) {
                  wx.showToast({
                    title: res.msg,
                    icon: "none"
                  })
                  return
                }
                this.setData({
                  basketChooseArr: {},
                  shopCartItemDiscounts: []
                })
                wx.hideLoading()
                this.calTotalPrice()
                http.getCartCount()
                this.closeBasketDlg()
              }
            }
            http.request(params)
          }
        }
      })
    }
  },

  // 减按钮
  onCountMinus: function (e) {
    wx.vibrateShort({
      type: "heavy"
    })
    let categoryProdList = this.data.categoryProdList
    let scindex = e.currentTarget.dataset.index
    let basketChooseArr = this.data.basketChooseArr
    let choosedCategoryId = this.data.choosedCategoryId
    let prodId = categoryProdList[scindex].prodId
    let reqSkuId = categoryProdList[scindex].skuList[0].skuId
    let prodCount = -1
    let shopId = categoryProdList[scindex].shopId
    let basketId = basketChooseArr[choosedCategoryId].prod[categoryProdList[scindex].prodId].sku[reqSkuId].basketId
    if (basketChooseArr[choosedCategoryId].prod[prodId].sku[reqSkuId].prodCount <= 1) {
      this.deleteOneItem(basketId, reqSkuId, prodId, choosedCategoryId)
      return
    }
    this.homeUpdateCount(prodCount, reqSkuId, shopId, prodId)
  },

  /**
   * 
   * 删除某一项商品
   */
  deleteOneItem: function(basketId, reqSkuId, prodId, categoryId) {
    let basketChooseArr = this.data.basketChooseArr
    let choosedCategoryId = categoryId
    let basketIds = []
    if (!basketId) { return }
    basketIds.push(basketId)
    wx.showLoading({
      mask: true
    })
    var params = {
      url: `/qcl-shop/shopCart/deleteItem?shopid=${config.shopId()}`,
      method: "POST",
      contentType: 'application/json',
      data: basketIds,
      callBack: (res) => {
        if (res.code == 500) {
          wx.hideToast()
          wx.showToast({
            title: res.msg,
            icon: "none"
          })
          return
        }
        // 删除购物车数据
        let shopCartItems = []
        let shopCartItemDiscounts = this.data.shopCartItemDiscounts
        if (!shopCartItemDiscounts || shopCartItemDiscounts.length <= 0 ||
          !shopCartItemDiscounts[0].shopCartItems) {
          shopCartItems = []
        } else {
          shopCartItems = this.data.shopCartItemDiscounts[0].shopCartItems
        }
        basketChooseArr[choosedCategoryId].count += -1
        basketChooseArr[choosedCategoryId].prod[prodId].prodSkuCount += -1
        if (basketChooseArr[choosedCategoryId].prod[prodId].sku[reqSkuId].prodCount == 1) {
          delete basketChooseArr[choosedCategoryId].prod[prodId].sku[reqSkuId]
        }
        for (let i = 0; i < shopCartItems.length; i++) {
          if (shopCartItems[i].basketId == basketId) {
            // 删除购物车对应数据
            shopCartItems.splice(i, 1)
            break
          }
        }
        shopCartItemDiscounts.shopCartItems = shopCartItems
        this.setData({
          shopCartItemDiscounts: shopCartItemDiscounts,
          basketChooseArr: basketChooseArr
        })
        this.calTotalPrice()//计算总价
        http.getCartCount()
        wx.hideLoading()
      }
    }
    http.request(params)
  },

  // 加按钮
  onCountPlus: function (e) {
    let btnBasket = this.data.btnBasket
    let clickAddBtn = e.detail
    let config = {
      origin: clickAddBtn,
      target: btnBasket,
      wxPage: this
    }
    let basketAnimatBody = new basketAnimat.Parabola(config)
    basketAnimatBody.animated()
    let categoryProdList = this.data.categoryProdList
    let scindex = e.currentTarget.dataset.index
    let prodId = categoryProdList[scindex].prodId
    let reqSkuId = categoryProdList[scindex].skuList[0].skuId
    let prodCount = 1
    let shopId = categoryProdList[scindex].shopId
    this.homeUpdateCount(prodCount, reqSkuId, shopId, prodId, scindex)
    wx.vibrateShort({
      type: "heavy"
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
    this.fetchShopData()
    this.fetchDiscountData()
    this.fetchBasketData()
    this.isLikedShop()
    http.getCartCount()
  },

  // 获取商家信息
  fetchShopData: function () {
    let params = {
      url: '/qcl-shop/shop/getShopByShopId',
      method: 'GET',
      data: {
        shopId: config.shopId()
      },
      callBack: (res) => {
        this.setData({
          shopInfo: res.data,
          minimumOrderAmount: res.data.minimumOrderAmount
        })
      }
    }
    http.request(params)
  },
  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  setBasketStorage: function () {
    let basketChooseArr = this.data.basketChooseArr
    let shopBasketData = {}
    shopBasketData[config.shopId()] = basketChooseArr
    wx.setStorageSync('shopBasketData', shopBasketData)
  },
  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
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

  // 页面滚动，设置头部一些动画效果
  containerScroll: function (e) {
    let scrollTop = e.detail.scrollTop
    if (scrollTop > 50 && !this.data.showSearchFlag) {
      this.setData({
        showSearchFlag: true
      })
    }
    if (scrollTop > 50 && this.data.showSearchFlag) {
      this.setData({
        searchWidth: e.detail.scrollTop
      })
    }
    if (scrollTop < 50 && this.data.showSearchFlag) {
      this.setData({
        searchWidth: 0,
        topBarOpacity: 0
      })
      setTimeout(() => {
        this.setData({
          showSearchFlag: false
        })
      }, 100)
    }
  },
  tabHandle: function (e) {
    this.setData({
      tabLineLeft: e.currentTarget.offsetLeft,
      choosedTab:  e.currentTarget.dataset.tap,
      swiperIndex: e.currentTarget.dataset.index
    })
  },

  // 滑动容器滑动改变
  swiperChange: function (e) {
    let choosedTab = this.data.tabArr[e.detail.current]
    // 获取tabbar的dom信息
    let query = wx.createSelectorQuery()
    query.select(`#${choosedTab.id}`).boundingClientRect().exec((res) => {
      this.setData({
        tabLineLeft: res[0].left,
        choosedTab:  choosedTab.tap
      })
    })
  },

  // 打开隐藏内容
  openHidden: function() {
    this.setData({
      showFlag: !this.data.showFlag
    })
  },

  //加载轮播图
  getIndexImgs: function() {
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

  // 点击左侧菜单
  clickLeftTabHandle: function (e) {
    let categoryid = e.currentTarget.dataset.categoryid
    let categoryName = e.currentTarget.dataset.categoryname
    let categoryIndex = e.currentTarget.dataset.categoryindex
    let menuScrollTop = 0
    if (e.currentTarget.offsetTop > 170) {
      menuScrollTop = e.currentTarget.offsetTop - 170
    }
    if (categoryid == this.data.choosedCategoryId) {return}
    this.data.categoryIndex = categoryIndex
    this.getProdList(categoryid)
    this.setData({
      leftTabSelTop: e.currentTarget.offsetTop,
      choosedCategoryId: categoryid
    })
    setTimeout(() => {
      this.setData({
        menuScrollTop: menuScrollTop
      })
    }, 50)
    setTimeout(() => {
      this.setData({
        leftTabIndex: e.currentTarget.dataset.index,
        categoryName: categoryName
      })
    }, 300)
  },

  // 点击展示购物车弹窗
  showBasketDlgHandle: function () {
    let basketDlgShow = this.data.basketDlgShow
    if (basketDlgShow == true) {
      this.closeBasketDlg()
      return
    }
    this.setData({
      basketDlgShow: true
    })
    setTimeout(() => {
      this.setData({
        basketDlgAnimat: true
      })
    }, 50)
  },

  // 关闭购物车弹窗
  closeBasketDlg: function () {
    this.setData({
      basketDlgAnimat: false
    })
    setTimeout(() => {
      this.setData({
        basketDlgShow: false,
        basketDlgAnimat: true
      })
    }, 300)
  },

  // 返回上一级页面
  navibackHandle: function() {
    wx.navigateBack({
      delta: 1
    })
  },
  
  // 跳转到搜索页面
  gotoSeach: function() {
    wx.navigateTo({
      url: "/pages/search-page/search-page",
    })
  },

  // 联系商家
  callShopHandle: function() {
    if (!this.data.shopInfo.tel) {
      wx.showToast({
        title: '商家电话建设中',
        icon: "none"
      })
      return
    }
    wx.makePhoneCall({
      phoneNumber: this.data.shopInfo.tel
    })
  },

  // 关注、取消店铺
  likeShopHandle: function() {
    wx.vibrateShort({
      type: "heavy"
    })
    var params = {
      url: "/qcl-shop/shop/addOrCancel",
      method: "POST",
      data: {
        shopId: config.shopId()
      },
      callBack: (res) => {
        let isLikedShop = this.data.isLikedShop
        if (!isLikedShop) {
          wx.showToast({
            title: "店铺关注成功"
          })
        } else {
          wx.showToast({
            title: "取消店铺关注",
            icon: "none"
          })
        }
        this.setData({
          isLikedShop: !isLikedShop
        })
      }
    }
    http.request(params)
  },

  // 查询店铺是否被关注
  isLikedShop: function() {
    var params = {
      url: "/qcl-shop/shop/isGauanZhu",
      method: "GET",
      data: {
        shopId: config.shopId()
      },
      callBack: (res) => {
        this.setData({
          isLikedShop: res.data.isGauanZhu
        })
      }
    }
    http.request(params)
  },
  // 防止滚动冒泡
  preventTouchMove: function () {
  },
  
  // 打开规格选择窗
  openSkuDlg: function (e) {
    let index = e.currentTarget.dataset.index
    let skuList = this.data.categoryProdList[index].skuList
    let choosePrice = this.data.categoryProdList[index].price
    let prodId = this.data.categoryProdList[index].prodId
    this.setData({
      skuShow: true,
      choosedSkuList: skuList,
      choosePrice: choosePrice,
      prodId: prodId,
      categoryIndex: index
    })
  },

  // 加购按钮
  specCountPlus: function(e) {
    let btnBasket = this.data.btnBasket
    let clickAddBtn = e.detail.clickDetail
    let config = {
      origin: clickAddBtn,
      target: btnBasket,
      wxPage: this
    }
    let basketAnimatBody = new basketAnimat.Parabola(config)
    basketAnimatBody.animated()
    let scindex = e.detail.index
    let prodId = e.detail.prodId
    let reqSkuId = e.detail.reqSkuId
    let prodCount = e.detail.prodCount
    let shopId = e.detail.shopId
    this.homeUpdateCount(prodCount, reqSkuId, shopId, prodId, scindex)
    wx.vibrateShort({
      type: "heavy"
    })
  },
  // 减按钮
  specCountMinus: function(e) {
    let specParams = e.detail
    wx.vibrateShort({
      type: "heavy"
    })
    let basketChooseArr = this.data.basketChooseArr
    let prodId = specParams.prodId
    let reqSkuId = specParams.reqSkuId
    let prodCount = specParams.prodCount
    let shopId = specParams.shopId
    let basketId = specParams.basketId
    let choosedCategoryId = specParams.choosedCategoryId
    if (basketChooseArr[choosedCategoryId].prod[prodId].sku[reqSkuId].prodCount <= 1) {
      this.deleteOneItem(basketId, reqSkuId, prodId, choosedCategoryId)
      return
    }
    this.homeUpdateCount(prodCount, reqSkuId, shopId, prodId)
  },
  /**
   * 去结算
   */
  toFirmOrder: function () {
    wx.vibrateShort({
      type: "heavy"
    })
    var shopCartItemDiscounts = this.data.shopCartItemDiscounts
    var basketIds = []
    shopCartItemDiscounts.forEach(shopCartItemDiscount => {
      shopCartItemDiscount.shopCartItems.forEach(shopCartItem => {
        basketIds.push(shopCartItem.basketId)
      })
    })
    if (!basketIds.length) {
      wx.showToast({
        title: "请选择商品",
        icon: "none"
      })
      return
    }
    wx.setStorageSync("basketIds", JSON.stringify(basketIds))
    wx.navigateTo({
      url: "/pages/submit-order/submit-order?orderEntry=0",
    })
  },
   
  // 跳转到商品详情页面
  gotoPordHandle: function(e) {
    var prodid = e.currentTarget.dataset.prodid
    if (prodid) {
      wx.navigateTo({
        url: "/pages/shop-prod/prod?prodid=" + prodid,
      })
    }
  }
})