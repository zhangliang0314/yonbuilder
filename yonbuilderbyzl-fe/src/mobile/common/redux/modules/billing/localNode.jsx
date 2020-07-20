// import Immutable from 'immutable';
import { proxy } from '@mdf/cube/lib/helpers/util';
// import _ from 'lodash'

export function OpenCashDrawer (params, callback) {
  return function (dispatch) {
    if (cb.electron.getSharedObject()) {
      cb.electron.sendOrder('openCashDraw', function (json) {
        callback(json);
      });
    } else {
      const config = {
        crossDomain: true,
        url: 'http://127.0.0.1:3000/openCashDraw',
        method: 'POST',
        params: params
      };
      proxy(config)
        .then(function (json) {
          callback(json);
        });
    }
  }
};

/*
export function usingPOS() {
  return function (dispatch) {
    const config = {
      crossDomain: true,
      url: 'http://127.0.0.1:3000/usingPOS',
      method: 'POST',
      params: {
        balatype: '4',
        balamoney: 0.01,
        // 返回
        //orderid:'LSDD201710310001'

      }
    };
    proxy(config)
      .then(function (json) {
        if (json.code !== 200) return;
      });
  }
};
*/

// 畅捷支付（支付宝，微信，银联卡）
/*
export function refundOrCancel() {

  return function (dispatch) {
    const config = {
      crossDomain: true,
      url: 'http://127.0.0.1:3000/refundOrCancel',
      method: 'POST',
      params: {
        balamoney: 0.01,
        orderid: 'LSDD201710310001',
        refund_orderid: 'LSTD201710310001'
      }
    };
    proxy(config)
      .then(function (json) {
        if (json.code !== 200) return;
      });
  }
}
*/

// todo 直接使用银联卡

// 畅捷支付（支付宝，微信，银联卡）
export function usepos (params, type) {
  // if (cb.electron.getSharedObject() && (type === 'sandPay' || type === 'unionPay' || type === 'laochangPay' || type === 'nohardwarePay' || type === 'lolPay')) {
  if (cb.electron.getSharedObject() && type) {
    return new Promise(resolve => {
      cb.electron.getSharedObject('sandPay')((msg) => {
        console.log(msg);
        const realReturn = JSON.parse(msg);
        resolve(realReturn)
      }, params);
    })
    // let data = JSON.stringify({"SandTransType": "30","SandPayType": "01","CreditCode": "","VoucherCode": "001005","ReferenceCode": "080024351317","TradeDate": "0802","TrandeMoney": 0.01,"TrandeCode": "456306","Message": "交易成功","storeCode": "0001","operatorCode": "111111","COM": 3})
  } else if (window.plus && window.plus.JavaToJs && type) {
    const temPromise = new Promise(resolve => {
      cb.events.on('androidNotification', (msg) => {
        console.log(msg);
        const realReturn = JSON.parse(msg);
        // params.callback(realReturn);
        resolve(realReturn)
      })
    })
    plus.JavaToJs.HardwareInterface('sandpos', params);
    return temPromise;
  } else {
    const config = {
      crossDomain: true,
      url: 'http://127.0.0.1:3000/usingPOS',
      method: 'POST',
      params
    }
    return proxy(config)
  }
}

export function refundorcancel (params, type) {
  if (cb.electron.getSharedObject() && type) {
    return new Promise(resolve => {
      cb.electron.getSharedObject('sandPay')((msg) => {
        console.log(msg);
        const realReturn = JSON.parse(msg);
        resolve(realReturn)
      }, params);
    })
    // const config = {
    //   crossDomain: true,
    //   url: 'http://127.0.0.1:3000/usingSDPOS',
    //   method: 'POST',
    //   params
    // }
    // return proxy(config)
  } else if (window.plus && window.plus.JavaToJs && type) {
    const temPromise = new Promise(resolve => {
      cb.events.on('androidNotification', (msg) => {
        console.log(msg);
        const realReturn = JSON.parse(msg);
        resolve(realReturn)
      })
    })
    plus.JavaToJs.HardwareInterface('sandpos', params);
    return temPromise;
  } else {
    const config = {
      crossDomain: true,
      url: 'http://127.0.0.1:3000/refundOrCancel',
      method: 'POST',
      params
    };
    return proxy(config)
  }
}

// 结算成功后开钱箱
export function opencashdrawnocheck () {
  if (window.plus) {
    plus.JavaToJs.HardwareInterface('opencashbox');
  } else if (cb.electron.getSharedObject()) {
    cb.electron.sendOrder('openCashDrawNoCheck');
  } else {
    const config = {
      crossDomain: true,
      url: 'http://127.0.0.1:3000/openCashDrawNoCheck',
      method: 'POST',
      params: ''
    };
    return proxy(config)
  }
}

// 小票打印接口
export async function print_for_temp (data) {
  const config = {
    crossDomain: true,
    url: 'http://127.0.0.1:3000/print_for_temp',
    method: 'POST',
    params: {
      data: data
    }
  };
  const result = await proxy(config);
  if (result.code !== 200) {
    const message = result.message ? (result.message == 'offline' ? '打印小票失败！' : result.message) : '打印小票失败！'
    cb.utils.alert(message, 'error');
  }
}

// 网络打印机小票打印接口
export async function networkprint_for_temp (url, data) {
  const config = {
    crossDomain: true,
    // url: 'http://10.11.116.10:3000/print_for_temp',
    url: url + '/print_for_temp',
    method: 'POST',
    params: {
      data: data
    }
  };
  const result = await proxy(config);
  if (result.code !== 200) {
    const message = result.message ? (result.message == 'offline' ? '打印小票失败！' : result.message) : '打印小票失败！'
    cb.utils.alert(message, 'error');
  }
}
