// components/pay/pay.js
const http = require('../../utils/http.js')
const config = require('../../utils/config.js')
const util = require('../../utils/util.js')
const md5 = require('../../utils/md5.js')
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    showPay: {
      type: Boolean
    },
    orderNumber: {
      type: String
    },
    actualTotal: {
      type: Number
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    payMethodList: [{
        name: "微信支付",
        icon: "../../images/icon/pay_wx.png",
        isChoosed: false,
        id: 1
      },
      {
        name: "零钱支付",
        icon: "../../images/icon/pay_wallet.png",
        isChoosed: true,
        id: 3
      }
    ],
    animatMenu: false,
    showMenu: false,
    animatPay: true,
    // 展示零钱信息标志位
    showWalletFlag: false,
    payType: 0,
    // 订单类型，0普通，1充值
    orderType: 0,
    // 付款方式展示
    payTypeText: "微信支付",
    // 余额
    walletNum: '',
    // 密码
    passwordData: '',
    // 键盘聚焦
    pwdFocus: false,
    // 是否需要密码支付框
    needPasswd: false
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 点击付款方式
    chooseMethodHandle: function (e) {
      let id = e.currentTarget.dataset.id
      let payType = this.data.payType
      let showWalletFlag = this.data.showWalletFlag
      let payMethodList = this.data.payMethodList
      let payTypeText = this.data.payTypeText
      payMethodList.forEach((item, i) => {
        // 判断选择付款方式
        if (item.id == id) {
          item.isChoosed = true
          payType = item.id
          payTypeText = item.name
        } else {
          item.isChoosed = false
        }
      })
      // 判断是否展示零钱信息
      if (id == 3) {
        showWalletFlag = true
      } else {
        showWalletFlag = false
      }
      this.setData({
        payMethodList: payMethodList,
        payType: payType,
        showWalletFlag: showWalletFlag,
        payTypeText: payTypeText,
        animatMenu: false
      })
      setTimeout(() => {
        this.setData({
          showMenu: false
        })
      }, 400);
    },
    // 选择付款方式
    chooseMorePay: function (e) {
      this.setData({
        showMenu: true,
        animatMenu: true
      })
    },
    // 关闭选择付款窗口
    closeMenu: function () {
      this.setData({
        animatMenu: false
      })
      setTimeout(() => {
        this.setData({
          showMenu: false
        })
      }, 400);
    },
    // 关闭支付窗口
    closePayDlg: function () {
      // 订单已经生成，关闭窗口就是取消支付
      wx.showModal({
        title: "",
        content: "确认要放弃当前支付吗？",
        confirmColor: "#26B6B7",
        success: (res) => {
          if (res.confirm) {
            this.setData({
              animatPay: false
            })
            setTimeout(() => {
              this.triggerEvent('payCancel')
              this.setData({
                animatPay: true,
                showPay: false
              })
            }, 400);
          }
        }
      })
    },
    // 查询所有的支付方式
    getPayMethodList: function () {
      var params = {
        url: "/qcl-shop/pay/paymentlist",
        method: "GET",
        callBack: res => {
          let payMethodList = res.data
          let payMethodListTmp = []
          if (payMethodList && payMethodList.length > 0) {
            payMethodList.forEach((item, i) => {
              switch (item.code) {
                case "wechatpay":
                  item.icon = "../../images/icon/pay_wx.png"
                  item.isChoosed = true
                  payMethodListTmp.push(item)
                  break;
                case "alipay":
                  item.icon = "../../images/icon/pay_zfb.png"
                  item.isChoosed = false
                  break;
                case "balancepay":
                  item.icon = "../../images/icon/pay_wallet.png"
                  item.isChoosed = false
                  payMethodListTmp.push(item)
                  break;
                default:
                  break;
              }
            })
          }
          this.setData({
            payMethodList: payMethodListTmp,
            payType: 1
          })
        }
      }
      http.request(params)
    },
    // 获取零钱信息
    getWalletInfo: function () {
      let params = {
        url: '/qcl-user/my/blanceRefresh',
        method: 'GET',
        data: {},
        callBack: (res) => {
          let walletNum = res.data.blance
          this.setData({
            walletNum: walletNum
          })
        }
      }
      http.request(params)
    },
    // 支付入口
    payHandle: function () {
      wx.vibrateShort({
        type: "heavy"
      })
      let payType = this.data.payType
      switch (payType) {
        case 1:
          // 微信支付
          this.wxPay()
          break;
        case 2:
          // 支付宝
          console.log("支付宝")
          break;
        case 3:
          // 余额支付
          this.walletPay()
          break;
        default:
          break;
      }
    },
    // 微信支付
    wxPay: function () {
      wx.showLoading({
        mask: true
      })
      var params = {
        url: "/qcl-shop/pay/miniPay",
        method: "POST",
        data: {
          orderNumbers: this.data.orderNumber,
          orderType: this.data.orderType,
          payType: this.data.payType
        },
        callBack: res => {
          let payData = res.data
          wx.requestPayment({
            appId: payData.appId,
            nonceStr: payData.nonceStr,
            package: payData.package,
            paySign: payData.paySign,
            timeStamp: payData.timeStamp,
            signType: payData.signType,
            success: (result) => {
              // 支付成功
              this.setData({
                animatPay: false
              })
              setTimeout(() => {
                this.triggerEvent("paySuccess")
                this.setData({
                  animatPay: true,
                  showPay: false
                })
              }, 400);
            },
            fail: (result) => {
              // 支付失败
              if (result.errMsg == "requestPayment:fail cancel") {
                // 弹出询问用户弹窗
                this.closePayDlg()
              } else {
                // 其他错误提示
                wx.showModal({
                  title: "",
                  content: result.errMsg,
                  confirmColor: "#26B6B7",
                  showCancel: false
                })
              }
            }
          })
          wx.hideLoading()
        }
      }
      http.request(params)
    },
    // 钱包支付
    walletPay: function () {
      // 支付校验密码校验
      // if ( this.data.needPasswd ) {
      //   if (this.data.passwordData.length === 0 && this.data.pwdFocus) {
      //     wx.showToast({
      //       title: '请输入支付密码',
      //       icon: 'none',
      //       duration: 1500
      //     })
      //     this.setData({
      //       pwdFocus: true
      //     })
      //     return
      //   } else if (this.data.passwordData.length < 6) {
      //     wx.showToast({
      //       title: '密码需要输入6位',
      //       icon: 'none',
      //       duration: 1500
      //     })
      //     return
      //   }
      // }
      wx.showLoading({
        mask: true
      })
      var params = {
        url: "/qcl-shop/pay/balanceOrderPay",
        method: "POST",
        data: {
          orderNumbers: this.data.orderNumber,
          orderType: this.data.orderType,
          payType: this.data.payType
        },
        callBack: res => {
          if (res.code == 200) {
            this.setData({
              animatPay: false
            })
            setTimeout(() => {
              this.triggerEvent("paySuccess")
              this.setData({
                animatPay: true,
                showPay: false
              })
            }, 400);
          } else {
            wx.showModal({
              title: "",
              content: res.data,
              confirmColor: "#26B6B7",
              showCancel: false
            })
            // this.triggerEvent('paySuccess', res)
          }
          wx.hideLoading()
        }
      }
      http.request(params)
    },
    preventBindtouchmove: function () {

    },
    // 输入密码
    inputPasswd: function(e) {
      let str = e.detail.value
      this.setData({
        passwordData: str
      })
    },
    // 密码聚焦方法
    pwdFocusHandle: function() {
      this.setData({
        pwdFocus: true
      })
    }
  },
  lifetimes: {
    created: function () {
      this.getPayMethodList()
      this.getWalletInfo()
    }
  },
  observers: {
    // 监听支付方式的变化，用于展示密码框
    'payType': function(payType){
        if(payType === 3) {
          this.setData({
            needPasswd: true
          })
        } else {
          this.setData({
            needPasswd: false
          })
        }
    },
    "showPay": function(showPay) {
      if (showPay) {
        wx.vibrateShort({
          type: "heavy"
        })
      }
    }
  }
})