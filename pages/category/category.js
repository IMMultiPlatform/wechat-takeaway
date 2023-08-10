// pages/category/category.js

var http = require("../../utils/http.js")
var config = require("../../utils/config.js")

Page({

  /**
   * 页面的初始数据
   */
  data: {
    selIndex: 0,
    categoryList: [],
    productList: [],
    categoryImg: "",
    prodid: "",
    showEmpty: false,
    choosedIndex: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var ths = this
    //加载分类列表
    var params = {
      url: "/qcl-shop/category/categoryListInfo",
      method: "GET",
      data: {
        shopId: config.shopId()
      },
      callBack: function (res) {
        // console.log(res);
        ths.setData({
          categoryImg: res.data[0].pic,
          categoryList: res.data,
        })
        ths.getProdList(res.data[0].categoryId)
      }
    }
    http.request(params)
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


  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

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

  /**
   * 分类点击事件
   */
  onMenuTab: function (e) {
    var id = e.currentTarget.dataset.id
    var index = e.currentTarget.dataset.index
    // this.getProdList(id);
    this.getProdList(this.data.categoryList[index].categoryId)
    this.setData({
      categoryImg: this.data.categoryList[index].pic,
      selIndex: index
    })
  },

  // 跳转搜索页
  toSearchPage: function () {
    wx.navigateTo({
      url: "/pages/search-page/search-page",
    })
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
        // console.log(res);
        let showEmpty = (!res.data.length)
        this.setData({
          productList: res.data,
          showEmpty: showEmpty
        })
        wx.hideLoading()
      }
    }
    http.request(params)
  },

//跳转商品详情页
  toProdPage: function (e) {
    var prodid = e.currentTarget.dataset.prodid
    wx.navigateTo({
      url: "/pages/prod/prod?prodid=" + prodid,
    })
  },
  // 防止冒泡
  addBasketPrevent: function() {
    
  }
})
