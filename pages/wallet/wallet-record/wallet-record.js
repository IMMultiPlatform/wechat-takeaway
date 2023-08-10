// pages/wallet/wallet-record/wallet-record.js
const http = require('../../../utils/http')
Page({

  /**
   * 页面的初始数据
   */
  data: {
    recordList: [],
    pageSize: 20,
    pageIndex: 1,
    // 判断是否是最后一页
    listOver: false,
    // 分页加载开关
    isLoading: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.getRecordList()
  },

  // 获取消费记录
  getRecordList: function () {
    wx.showLoading()
    // 分页加载开关，防止重复请求的发送
    this.setData({
      isLoading: true
    })
    let params = {
      url: '/qcl-user/UserBlanceLogController/list',
      method: 'GET',
      data: {
        pageNum: this.data.pageIndex,
        pageSize: this.data.pageSize
      },
      callBack: (res) => {
        let listTmp = res.data.records
        let recordList = this.data.recordList
        let pageIndex = this.data.pageIndex
        let pageSize = this.data.pageSize
        let listOver = false
        if (listTmp.length < pageSize) {
          listOver = true
        }
        pageIndex += 1
        recordList = recordList.concat(listTmp)
        this.setData({
          recordList: recordList,
          pageIndex: pageIndex,
          listOver: listOver,
          isLoading: false
        })
        wx.hideLoading()
      },
      failCallBack: () => {
        this.setData({
          isLoading: false
        })
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
    if (this.data.listOver || this.data.isLoading) {
      return
    }
    this.getRecordList()
  }
})