/**
 * js抛物线动画
 * @param  {[object]} origin [起点元素]
 * @param  {[object]} target [目标点元素]
 * @param  {[object]} element [要运动的元素]
 * @param  {[number]} radian [抛物线弧度]
 * @param  {[number]} time [动画执行时间]
 * @param  {[function]} callback [抛物线执行完成后回调]
 */
const systemInfo = wx.getSystemInfoSync()
class Parabola {
  constructor(config) {
    this.b = 0;
    this.INTERVAL = 33;
    this.timer = null;
    this.config = config || {};
    if(systemInfo.system && (systemInfo.system.toLowerCase().indexOf('ios') == 0 || systemInfo.system.benchmarkLevel > 40 )) {
      this.INTERVAL = 16
    }
    // 屏幕比例
    this.pixelRatio = wx.getSystemInfoSync().pixelRatio
    // 起点
    this.origin = this.config.origin || null;
    // 终点
    this.target = this.config.target || null;
    // 运动的元素
    this.element = this.config.element || {};
    // 曲线弧度
    this.radian = this.config.radian || 0.01;
    // 运动时间(ms)
    this.time = this.config.time || 500;
    // wx页面实例
    this.wxPage = this.config.wxPage

    this.originX = this.origin.x;
    this.originY = this.origin.y;
    this.targetX = this.target.left;
    this.targetY = this.target.top;

    this.diffx = this.targetX - this.originX;
    this.diffy = this.targetY - this.originY;
    this.speedx = this.diffx / this.time;

    // 已知a, 根据抛物线函数 y = a*x*x + b*x + c 将抛物线起点平移到坐标原点[0, 0]，终点随之平移，那么抛物线经过原点[0, 0] 得出c = 0;
    // 终点平移后得出：y2-y1 = a*(x2 - x1)*(x2 - x1) + b*(x2 - x1)
    // 即 diffy = a*diffx*diffx + b*diffx;
    // 可求出常数b的值
    this.b =
      (this.diffy - this.radian * this.diffx * this.diffx) / this.diffx;
    this.wxPage.setData({
      canvasShow: true
    })
    this.element.left = `${this.originX}`;
    this.element.top = `${this.originY}`;
  }

  // 确定动画方式
  moveStyle() {
    let moveStyle = 'position'
    return moveStyle;
  }

  // 画圆球
  drawBall(ctx, canvas, x, y) {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.beginPath()
    ctx.arc(x, y, 8, 0, Math.PI * 2)
    ctx.fillStyle = '#ff0000'
    ctx.strokeStyle = '#ff0000'
    ctx.fill()
    ctx.stroke()
  }

  animated() {
    const query = wx.createSelectorQuery()
    query.select('#animate').fields({
      node: true,
      size: true,
    }).exec((res) => {
      // 兼容老机型
      if (!res[0].node || !res[0].node.getContext('2d')) {
        this.move()
        return
      }
      const canvas = res[0].node
      const width = res[0].width
      const height = res[0].height
      const ctx = canvas.getContext('2d')
      // 设置显示比例
      canvas.width = width * this.pixelRatio
      canvas.height = height * this.pixelRatio
      ctx.scale(this.pixelRatio, this.pixelRatio)
      this.drawBall(ctx, canvas, this.originX, this.originY)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      this.newMove(ctx, canvas)
    })
  }

  // canvas动画，流畅
  newMove(ctx, canvas) {
    let start = new Date().getTime(),
      moveStyle = this.moveStyle(),
      _this = this;
      if (this.timer) return;
      let step = function() {
      if (new Date().getTime() - start > _this.time) {
        _this.drawBall(ctx, canvas, _this.targetX, _this.targetY)
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        _this.wxPage.setData({
          canvasShow: false
        })
        typeof _this.config.callback === 'function' &&
          _this.config.callback();
          try{
            canvas.cancelAnimationFrame(_this.timer);
          } catch(e) {
            console.log(e)
          }
        _this.timer = null;
        return;
      }
      let x = _this.speedx * (new Date().getTime() - start);
      let y = _this.radian * x * x + _this.b * x;
      if (moveStyle === 'position') {
        _this.drawBall(ctx, canvas, `${x + _this.originX}`, `${y + _this.originY}`)
      }
      canvas.requestAnimationFrame(step)
    }
    this.timer = canvas.requestAnimationFrame(step)
    return this;
  }

  // 不兼容canvas的走的动画，会卡顿
  move() {
    let start = new Date().getTime(),
      moveStyle = this.moveStyle(),
      _this = this;
    if (this.timer) return;
    this.element.left = `${this.originX}`;
    this.element.top = `${this.originY}`;
    this.element[moveStyle] = 'translate(0px,0px)';
    this.timer = setInterval(function () {
      if (new Date().getTime() - start > _this.time) {
        _this.element.left = `${_this.targetX}`;
        _this.element.top = `${_this.targetY}`;
        _this.wxPage.setData({
          animateElmLeft: `${_this.targetX}`,
          animateElmTop: `${_this.targetY}`
        })
        typeof _this.config.callback === 'function' &&
          _this.config.callback();
        clearInterval(_this.timer);
        _this.timer = null;
        return;
      }
      let x = _this.speedx * (new Date().getTime() - start);
      let y = _this.radian * x * x + _this.b * x;
      if (moveStyle === 'position') {
        _this.element.left = `${x + _this.originX}`;
        _this.element.top = `${y + _this.originY}`;
        _this.wxPage.setData({
          animateElmLeft: `${x + _this.originX}`,
          animateElmTop: `${y + _this.originY}`
        })
      } else {
        if (window.requestAnimationFrame) {
          window.requestAnimationFrame(() => {
            _this.element[moveStyle] =
              'translate(' + x + 'px,' + y + 'px)';
          });
        } else {
          _this.element[moveStyle] =
            'translate(' + x + 'px,' + y + 'px)';
        }
      }
    }, this.INTERVAL);
    return this;
  }
}

module.exports = {
  Parabola: Parabola
}