/*
*
* localStorage兼容检测
* 初始化公共方法Toast
*
* */
import { Toast, Modal } from 'antd-mobile'
import React from 'react'
import _ from 'lodash'
import { proxy } from '@mdf/cube/lib/helpers/util'
// 兼容处理 safari无痕浏览模式禁用localStorage
try {
  localStorage.setItem('_storage_test', 'test');
  localStorage.removeItem('_storage_test');
} catch (exc) {
  var tmp_storage = {};
  var p = '__unique__'; // Prefix all keys to avoid matching built-ins
  Storage.prototype.setItem = function (k, v) {
    tmp_storage[p + k] = v;
  };
  Storage.prototype.getItem = function (k) {
    return tmp_storage[p + k] === undefined ? null : tmp_storage[p + k];
  };
  Storage.prototype.removeItem = function (k) {
    delete tmp_storage[p + k];
  };
  Storage.prototype.clear = function () {
    tmp_storage = {};
  };
}

cb.utils.scan = function (path, success, error) {
  if (!window.plus)
    return;
  var filters = [plus.barcode.QR, plus.barcode.EAN13, plus.barcode.EAN8, plus.barcode.ITF];
  plus.barcode.scan(path, success, error, filters);
};

cb.utils.confirm = function (msg, okFunc, cacelFunc) {
  Modal.alert(<div className='icon_wenhao' />, msg, [
    { text: '取消', onPress: () => { if (cacelFunc) cacelFunc() } },
    { text: '确定', onPress: () => okFunc() },
  ])
}

// 初始化公共方法
cb.utils.Toast = cb.utils.alert = function (...args) {
  // 兼容旧的写法，参数推荐使用语义对象(option)
  let option = {
    title: '',
    // type: info | success | error | warning | fail
    type: 'info',
    content: null,
    duration: 2,
    onClose: function () {
      if (args[3]) {
        args[3]();
      }
    },
    mask: true
  }
  if (_.isPlainObject(args[0]) && !React.isValidElement(args[0])) {
    option = _.extend(option, args[0])
  } else {
    option = _.extendWith(option, { title: args[0], type: args[1], content: args[2] }, (objValue, srcValue) => {
      return _.isUndefined(srcValue) ? objValue : srcValue
    })
  }

  let { title, type, duration, onClose, mask } = option

  // error -> fail
  if (type === 'error' || type === 'fail') {
    type = 'fail'
    title = <div className='retail-toast'><i className='icon icon-cuowutishi' /><p>{title}</p></div>;
  }
  if (type === 'success') {
    type = 'success'
    title = <div className='retail-toast'><i className='icon icon-chenggongtishi' /><p>{title}</p></div>;
  }
  // warning -> info
  if (type === 'warning' || type === 'info') {
    type = 'info'
    title = <div className='retail-toast'><i className='icon icon-tishi' /><p>{title}</p></div>;
  }

  return Toast[type](title, duration, onClose, mask)
}

cb.utils.checkUpdate = async function (device, version, callback, environment, alias) {
  const config = {
    url: 'package/checkUpdate',
    method: 'GET',
    options: { uniform: false, token: false },
    params: { terminal: 'mobile', device, version, environment, alias }
  };
  const json = await proxy(config);
  if (json.code !== 200) {
    cb.utils.alert(json.message, 'error');
    return;
  }
  callback && callback(json.data);
}

// 设置状态栏背景颜色
cb.utils.setStatusBarBackground = function (color) {
  if (!window.plus || !window.plus.navigator) {
    return;
  }
  window.plus.navigator.setStatusBarBackground(color);
}

// 获取出厂商
cb.utils.getVerdor = function () {
  if (!window.plus || !window.plus.device) {
    return;
  }
  return window.plus.device.vendor;
}

// light 白色 dark 黑色
cb.utils.setStatusBarStyle = function (color) {
  if (!window.plus || !window.plus.navigator) {
    return;
  }
  window.plus.navigator.setStatusBarStyle(color);
}

// 设置是否全屏
cb.utils.setFullscreen = function (bl) {
  if (!window.plus || !window.plus.navigator) {
    return;
  }
  window.plus.navigator.setFullscreen(bl);
}

// 判断网络
cb.utils.network = function () {
  if (plus.networkinfo.getCurrentType() === plus.networkinfo.CONNECTION_NONE) {
    return false;
  } else {
    return true;
  }
}

// 获取Wifi中的MAC地址
cb.utils.getWifiMac = function () {
  var mac = null;
  if (plus && plus.os && plus.os.name == 'Android') {
    // WifiManager
    // var Context = plus.android.importClass("android.content.Context");
    // var WifiManager = plus.android.importClass("android.net.wifi.WifiManager");
    // var wifiManager = plus.android.runtimeMainActivity().getSystemService(Context.WIFI_SERVICE);
    // var WifiInfo = plus.android.importClass("android.net.wifi.WifiInfo");
    // var wifiInfo = wifiManager.getConnectionInfo();
    // mac = wifiInfo.getMacAddress().replace(/\:+/g, '-');
  }
  return mac;
}

// 设备的国际移动设备身份码
cb.utils.getImei = function () {
  return plus.device.imei;
}

// 设备的国际移动用户识别码
cb.utils.getImsi = function () {
  return plus.device.imsi;
}

// 设备唯一标示
cb.utils.getUUid = function () {
  return plus.device.uuid;
}

// 退出应用
cb.utils.quit = function () {
  if (window.plus && window.plus.runtime)
    plus.runtime.quit();
}

// 设置提示音
cb.utils.cusAudio = function () {
  if (!window.plus || !window.plus.audio || window.isstop === false) {
    return;
  }
  if (window.isstop === undefined) {
    window.isstop = true;
  }
  if (window.isstop === true) {
    const plusCusAudio = plus.audio.createPlayer('http://uretailmobile.yonyouup.com/assets/5a5ef020133fb.mp3');
    plusCusAudio.play(function () {
      console.log('audio success');
      window.isstop = true;
    }, function (e) {
      plusCusAudio.stop();
      window.isstop = false;
      var audioTime = setTimeout(function () {
        clearTimeout(audioTime);
        window.isstop = true;
      }, 2000);
      console.log('audio fail');
    });
  }
}
/* add by jinzh1  判断IOS 还是android */
cb.utils.isIos = function () {
  var ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) {
    return true;
  } else if (/android/.test(ua)) {
    return false;
  }
}
/** *打电话 */
cb.utils.callPhone = function (phone) {
  if (!window.plus || !window.plus.device || !window.plus.nativeUI) {
    return;
  }
  window.plus.nativeUI.confirm('确定拨打' + phone + '?', function (e) {
    if (e.index === 0) {
      plus.device.dial(phone, false);
    }
  });
}

// 获取App版本号
cb.utils.getVersionCode = () => {
  let code = '1.0.0';
  if (window.plus && window.plus.runtime) {
    code = window.plus.runtime.version;
  }
  return code;
}

// 判断是否支持工业扫码
cb.utils.IsIMScanBar = () => {
  if (window.plus && window.plus.JavaToJs && window.plus.JavaToJs.HardwareInterfaceSync) {
    return window.plus.JavaToJs.HardwareInterfaceSync(null, 'scanbarinit', 'cb.events.execute.onScanbar');
  }
  return false;
}

// 获取设备信息
cb.utils.getDevicesInfo = () => {
  var mac = null; var uuid = null; var imsi = null; var imei = null; var model = null; var vendor = null;
  if (window.plus) {
    if (plus.device) {
      uuid = plus.device.uuid;
      imsi = plus.device.imsi;
      imei = plus.device.imei;
      model = plus.device.model;
      vendor = plus.device.vendor;
    }
    // WifiManager
    if (plus.JavaToJs && plus.JavaToJs.HardwareInterfaceSync && plus.os && plus.os.name == 'Android') {
      mac = plus.JavaToJs.HardwareInterfaceSync(null, 'macaddress');
    }
  } else {
    return null;
  }
  return { macaddress: mac, uuid, imsi, imei, model, vendor };
}

cb.utils.nativeStorage = (type, name, val) => {
  if (window.plus && window.plus.JavaToJs && window.plus.JavaToJs.HardwareInterfaceSync) {
    return window.plus.JavaToJs.HardwareInterfaceSync(null, type, name, val);
  }
  return null;
}

cb.utils.IsURL = (str_url) => {
  var strRegex = '(https?|ftp|file)://[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]';
  var re = new RegExp(strRegex);
  if (re.test(str_url))
    return true;
  else
    return false;
}

cb.utils.localPrint = (data) => {
  if (window.plus) {
    const currentVersionNo = cb.utils.getVersionCode().replace(/\.+/g, '');
    if (parseInt(currentVersionNo) >= 205) {
      // eslint-disable-next-line no-undef
      printData(data, (base64Image, isEndPrint) => {
        plus.JavaToJs.HardwareInterface('print', base64Image, isEndPrint);
      });
    } else if (parseInt(currentVersionNo) >= 10 && parseInt(currentVersionNo) < 205) {
      // eslint-disable-next-line no-undef
      const printData = getPrintData(data);
      if (printData.code === 200)
        plus.JavaToJs.HardwareInterface('print', printData.data);
    } else {
      plus.JavaToJs.HardwareInterface('print', JSON.stringify(data));
    }

    /** if (cb.utils.compareVersion(cb.utils.getVersionCode(), '1.0')) {
      const printData = getPrintData(data);
      if (printData.code === 200)
        plus.JavaToJs.HardwareInterface('print', printData.data);
    } else {
      plus.JavaToJs.HardwareInterface('print', JSON.stringify(data));
    }***/
  }
}

window.webViewEventHand = {
  addEvent: function (name, func) {
    if (!this.handle)
      this.handle = [];
    this.handle[name] = func;
    this.funcname = name;
  },
  emitEvent: function () {
    return this.handle[this.funcname];
  },
  cancelEvent: function (name) {
    this.funcname = name;
  }
}

// 处理手机的返回键
document.addEventListener('plusready', function () {
  if (!window.plus || !plus.key || !plus.storage) {
    return;
  }
  if (window.plus.device && window.plus.device.vendor.toLowerCase() === 'supoin') {
    var bodycls = document.body.className;
    document.body.className = bodycls + ' supoin';
  }
  console.error = (function (oriLogFunc) {
    return function (str) {
      if (plus && plus.storage) {
        const _timeLog = arguments[0] + '  ' + JSON.stringify(arguments[2]) || '';
        if (_timeLog) {
          // plus.storage.setItem(key,'\r\n---------------'+new Date().toLocaleString()+'------------------\r\n');
          // plus.storage.setItem(key,(_storageLog || "")+"\r\n"+_timeLog);
        }
      }
      oriLogFunc.call(console, '监听中日志...');
      oriLogFunc.call(console, arguments);
    }
  })(console.error);
  var first = null;
  var webview = plus.webview.currentWebview();
  // 监听返回键
  plus.key.addEventListener('backbutton', function () {
    webview.canBack(function (e) {
      const store = require('./index').store;
      const pathname = store ? (store.getState().router.location && store.getState().router.location.pathname) : '';
      if (e.canBack && pathname !== '/login' && pathname !== '/') {
        // 设置状态栏字体白色
        cb.utils.setStatusBarStyle('light');
        if (window.webViewEventHand.funcname) {
          window.webViewEventHand.emitEvent()(() => {
            webview.back();
          });
        } else {
          webview.back();
        }
      } else {
        // 首次按键，提示‘再按一次退出应用’
        if (!first) {
          first = new Date().getTime();
          Toast.show('再按一次退出应用', 1);
          const firstyu = setTimeout(function () {
            clearTimeout(firstyu);
            first = null;
          }, 2000);
        } else {
          if (new Date().getTime() - first < 2000) {
            cb.utils.quit();
          }
        }
      }
    })
  });

  // 监听网络链接
  document.addEventListener('netchange', function () {
    if (plus.networkinfo.getCurrentType() === plus.networkinfo.CONNECTION_NONE) {
      // console.log("无网络");
    } else {
      // console.log("有网络");
    }
  }, false);

  window.onresize = function () {
    document.activeElement.scrollIntoView(false);
  }

  // 监听错误
  document.addEventListener('error', function (e) {
    console.log(e);
  }, false)

  if (!window.plus) {
    window.plus = {};
  }
  var _BARCODE = 'JavaToJs';
  var B = window.plus.bridge;
  var JavaToJs =
  {
    HardwareInterface: function (Argus1, Argus2, Argus3, Argus4, successCallback, errorCallback) {
      var success = typeof successCallback !== 'function' ? null : function (args) {
        successCallback(args);
      };
      var fail = typeof errorCallback !== 'function' ? null : function (code) {
        errorCallback(code);
      };
      const callbackID = B.callbackId(success, fail);

      return B.exec(_BARCODE, 'HardwareInterface', [callbackID, Argus1, Argus2, Argus3, Argus4]);
    },
    HardwareInterfaceArrayArgu: function (Argus, successCallback, errorCallback) {
      var success = typeof successCallback !== 'function' ? null : function (args) {
        successCallback(args);
      };
      var fail = typeof errorCallback !== 'function' ? null : function (code) {
        errorCallback(code);
      };
      const callbackID = B.callbackId(success, fail);
      return B.exec(_BARCODE, 'HardwareInterface', [callbackID, Argus]);
    },
    HardwareInterfaceSync: function (Argus1, Argus2, Argus3, Argus4) {
      return B.execSync(_BARCODE, 'HardwareInterface', [Argus1, Argus2, Argus3, Argus4]);
    },
    HardwareInterfaceSyncArrayArgu: function (Argus) {
      return B.execSync(_BARCODE, 'HardwareInterface', [Argus]);
    }
  };
  if (!cb.utils.isIos()) window.plus.JavaToJs = JavaToJs; // 在非POS机设备禁用
});
// 兼容处理fetch问题
cb.rest.mode = 'xhr';
/* 微信环境 */
var ua = navigator.userAgent.toLowerCase();
cb.rest.weChatReady = false;
if (ua.match(/MicroMessenger/i) == 'micromessenger') {
  cb.rest.isWeChat = true;
} else {
  cb.rest.isWeChat = false;
}
if (cb.rest.isWeChat) {
  cb.utils.initWeChat = function () {
    const config = {
      url: 'bill/client/pay/getWeChatConfig',
      method: 'POST',
      params: { url: cb.rest.AppContext.serviceUrl + '/' }
    }
    proxy(config)
      .then(function (json) {
        if (json.code !== 200) {
          cb.utils.alert(json.message, 'error');
          return
        }
        const obj = json.data;
        cb.rest.WeChatConfig = obj;
        wx.config({
          debug: false, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
          appId: obj.appId, // 必填，公众号的唯一标识
          timestamp: obj.timestamp, // 必填，生成签名的时间戳
          nonceStr: obj.nonceStr, // 必填，生成签名的随机串
          signature: obj.signature, // 必填，签名
          jsApiList: ['scanQRCode', 'chooseImage', 'getLocation', 'getLocalImgData'] // 必填，需要使用的JS接口列表
        });
        wx.ready(function () {
          console.log('wx初始化----ready');
          cb.rest.weChatReady = true;
        });
        wx.error(function (res) {
          console.log('wx初始化----error' + JSON.stringify(res));
          cb.rest.weChatReady = false;
        });
      });
  }
}
const freshToken = () => {
  const config = {
    url: '/pub/fileupload/getFileServerUrl',
    method: 'GET',
    options: {
      token: true, timeout: 3000
    }
  }
  proxy(config).then(json => {
    console.error('刷新token 成功！')
  })
}
if (window.__freshTokenTimer)
  clearInterval(window.__freshTokenTimer)
else
  window.__freshTokenTimer = setInterval(freshToken, 3600000)
