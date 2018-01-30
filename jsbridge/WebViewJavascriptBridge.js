let actionQueue = []
let JSBridge = {
  H5CallNative: function (param) {
    // 环境还未准备好,bridge 还未注入,H5跟 Native还不能交互,放进队列中
    actionQueue.push(param)
  }
}

let isAndroid = function () {
  let ua = navigator.userAgent
  return (/Android/i).test(ua)
}
// let isIos = function () {
//   let ua = navigator.userAgent
//   return (/Mac OS X/i).test(ua)
// }

// IOS
function setupWebViewJavascriptBridge (callback) {
  // console.log('-> setupWebViewJavascriptBridge run...')
  if (window.QFPAY) {
    // console.log('-> setupWebViewJavascriptBridge is 注入...')
    return callback(window.QFPAY)
  }
  if (window.WVJBCallbacks) {
    // console.log('-> WVJBCallbacks push callback...')
    return window.WVJBCallbacks.push(callback)
  }
  window.WVJBCallbacks = [callback]
  let WVJBIframe = document.createElement('iframe')
  WVJBIframe.style.display = 'none'
  WVJBIframe.src = 'wvjbscheme://__BRIDGE_LOADED__'
  document.documentElement.appendChild(WVJBIframe)
  setTimeout(function () {
    document.documentElement.removeChild(WVJBIframe)
  }, 0)
}

// Android
function connectWebViewJavascriptBridge (callback) {
  if (window.QFPAY) {
    callback(window.QFPAY)
  } else {
    document.addEventListener('WebViewJavascriptBridgeReady', function () {
      callback(window.QFPAY)
    }, false)
  }
}

if (isAndroid()) {
  connectWebViewJavascriptBridge(callback)
} else {
  setupWebViewJavascriptBridge(callback)
}

function callback (bridge) {
  // console.log('-> setupWebViewJavascriptBridge callback run...')

  if (isAndroid()) {
    bridge.init(function (message, responseCallback) {
      // console.log('JS got a message', message)
      let data = {'Javascript Responds': 'Wee!'}
      // console.log('JS responding with', data)
      responseCallback(data)
    })
  }

  /**
   * H5 调 Native事件 H5CallNative
   * @param  {[object]} param [description]
   * param.data：传给 Native参数
   * param.callback：Native回调(异步？)
   * @return {[type]}       [description]
   */
  JSBridge.H5CallNative = function (param) {
    // console.log('--> JS Call H5CallNative param:', param)

    // bridge.callHandler('testObjcCallback', param.data, function (response) {

    // let data = {
    //   schema: 'near-merchant-native',
    //   path: 'https://o2.qfpay.com/merchant/v2/settleinfo',
    //   action: 'get',
    //   params: param.data
    // }
    bridge.call(param.name, param.data, function (response) {
      // console.log('JS call OC OK!!!', response)
      param.callback && param.callback(response)
    })
  }

  // Native 调 H5事件 QFNativeCallH5
  // bridge.registerHandler('QFNativeCallH5', function (data, responseCallback) {
  //   // console.log('ObjC called testJavascriptHandler with（原生调用JS testJavascriptHandler()）', data)
  //   let responseData = {
  //     'Javascript Says': 'Right back atcha!'
  //   }
  //   // console.log('JS responding with（JS响应）', responseData)
  //   // 回调
  //   responseCallback(responseData)
  // })

  // 执行环境未准备好之前的事件队列
  runActionQueue()
}

// 执行环境未准备好之前的事件队列
function runActionQueue () {
  for (let index in actionQueue) {
    JSBridge.H5CallNative(actionQueue[index])
  }
}

module.exports = JSBridge
