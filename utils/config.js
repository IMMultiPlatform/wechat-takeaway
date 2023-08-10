var domain = "" 

// map插件信息
const mapKey = "" // 腾讯位置服务
const referer = "同城" //调用插件的app的名称
const category = ""
const shopId = function () {
  let shopId = wx.getStorageSync("shopId")
  if (shopId) {
    return shopId
  }
  return 0
}

module.exports = {
  domain: domain,
  mapKey: mapKey,
  referer: referer,
  category: category,
  shopId: shopId
}