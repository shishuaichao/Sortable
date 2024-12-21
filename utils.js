

// 设置标签css方法
function css(el, prop, val) {
  var style = el && el.style;
  if (style) {
    if (val === void 0) {
      if (document.defaultView && document.defaultView.getComputedStyle) {
        val = document.defaultView.getComputedStyle(el, '');
      } else if (el.currentStyle) {
        val = el.currentStyle;
      }
      return prop === void 0 ? val : val[prop];
    } else {
      if (!(prop in style) && prop.indexOf('webkit') === -1) {
        prop = '-webkit-' + prop;
      }
      style[prop] = val + (typeof val === 'string' ? '' : 'px');
    }
  }
}

function clone(el) {
  let cloneEl = el.cloneNode(true);
  let rect = getRect(el, '克隆标签')
  css(cloneEl, 'left', rect.left)
  css(cloneEl, 'top', rect.top)
  css(cloneEl, 'margin', '0')
  css(cloneEl, 'position', 'absolute')
  css(cloneEl, 'zIndex', 10000)
  return cloneEl
}

// 隐藏/丢弃克隆节点
function hideClone(cloneEl, isDrop) {
  if (isDrop) {
    cloneEl && cloneEl.parentNode && cloneEl.parentNode.removeChild(cloneEl);
    cloneEl.status = 'remove'
    return 
  }
  css(cloneEl, 'display', 'none')
  cloneEl.status = 'hide'
}
// 克隆节点
function showClone(dragNode) {
  if (!dragNodeClone || dragNodeClone.status == 'remove') {
    dragNodeClone = clone(dragNode)
    dragNodeClone.status = 'show'
    dragNode && dragNode.parentNode.appendChild(dragNodeClone);
    return 
  }
  // 更新clone标签位置
  let rect = getRect(dragNode)
  css(dragNodeClone, 'left', rect.left)
  css(dragNodeClone, 'top', rect.top)
  css(dragNodeClone, 'display', '')
}

// 获取标签索引
const findCurrentIndex = (node) => {
  let parentNode = node.parentNode
  let arr = Array.from(parentNode.childNodes)
  return arr.indexOf(node)
}

// 获取相对于容器的位置（可以讲容器标签传入，简单来说就是父标签）
const getRect = (element, str) => {
  const rect = element.getBoundingClientRect(); 
  const parentRect = element.parentNode.getBoundingClientRect();
  let rectObj = {
    left: rect.left - parentRect.left,
    top: rect.top - parentRect.top,
  }
  // str && console.log(element.textContent, str, rectObj);
  // str == '打印' && console.log(element, '真实位置', rectObj)
  return rectObj
}

// 获取位置
const getPosition = (element, str) => {
  const rect = element.getBoundingClientRect(); 
  // str && console.log(str, rectObj);
  return rect
}

// 关键动画（把元素target 从 currRect位置，过渡到 toRect位置）
// 目前场景下，先插入元素再执行动画的前提下
// 其实currRect是插入后的位置，toRect是元素插入前的位置
const animate = (target, currRect, toRect, duration) => {
  if (rootDuration) {
    duration = rootDuration
  }
  css(target, "transition", "");
  css(target, "transform", "");
  let translateX = currRect.left - toRect.left;
  let translateY = currRect.top - toRect.top;
  target.animatingX = !!translateX;
  target.animatingY = !!translateY;
  // console.log("移动了", translateX, translateY);
  css(
    target,
    "transform",
    "translate3d(" + translateX + "px," + translateY + "px, 0)"
  );

  // 1. 先插入 2. 执行动画 3. 动画执行到translate3d，把动画元素回复到初始状态，
  // 4. 然后重绘  this.forRepaintDummy = target.offsetTop; // 立即重绘 repaint
  // 5. 然后执行transition过渡到本身位置（也就是插入后的位置）
  
  this.forRepaintDummy = target.offsetTop; // 立即重绘 repaint

  css(target, "transition", "transform " + duration + "ms" + " linear");
  css(target, "transform", "translate3d(0,0,0)");
  
  if (typeof target.isAnimate === "number") {
    clearTimeout(target.isAnimate);
    // console.log('停掉' + target.textContent + '的动画')
  }
  target.isAnimate = setTimeout(function () {
    css(target, "transition", "");
    css(target, "transform", "");
    target.isAnimate = false;
    target.animatingX = false;
    target.animatingY = false;
  }, duration);
};

// 节点互换
const exChangeNode = (dragNode, target, isInsertBefore, dragNodeIndex, targetIndex) => {
  // 创建克隆节点，插入根节点
  showClone(dragNode)
  let rectList = []
  if (dragNodeIndex > targetIndex) {
    for (let i=targetIndex; i<=dragNodeIndex; i++) {
      rectList.push({
        el: liArr[i],
        currRect: getRect(liArr[i], '插入前')
      })
    }
  } else if (dragNodeIndex < targetIndex) {
    for (let i=dragNodeIndex; i<=targetIndex; i++) {
      rectList.push({
        el: liArr[i],
        currRect: getRect(liArr[i], '打印')
      })
    }
  }
  // 插入节点、执行动画
  rootEl.insertBefore(dragNode, isInsertBefore ? target : target.nextElementSibling)
  // 更新节点数据
  updateLiArr()
  // 更新dragNode的位置


  rectList.map(e => {
    e.toRect = getRect(e.el, '插入后')
    animate(e.el, e.currRect, e.toRect);
  })
  // animate(dragNode, getRect(dragNodeClone), getRect(dragNode));
  // 隐藏克隆标签
  hideClone(dragNodeClone)
}