import Immutable from 'immutable';
import { genAction, proxy } from '@mdf/cube/lib/helpers/util';
import { Format } from '@mdf/cube/lib/helpers/formatDate';
import { IDB_saveData } from '@mdf/metaui-web/lib/redux/indexedDB'
import { getOriginRetailHeader } from 'src/common/redux/modules/billing/mix'

let retailMainFields = null;

const $$initialState = Immutable.fromJS({
  lineConnection: true, /* 是否连网  true:联网， false：断网， 0: 连接中（也属于断网） */
});

export default ($$state = $$initialState, action) => {
  switch (action.type) {
    case 'PLATFORM_UI_RETAIL_SET_MAIN_FIELDS':
      retailMainFields = action.payload;
      return $$state;
    case 'PLATFORM_UI_OFF_LINE_CHANGE_LINE_CONNECT':
      return $$state.merge(action.payload)
    default:
      return $$state
  }
}

/* 校验是否连网 */
export function checkOnline () {
  return function (dispatch, getState) {
    const lineConnection = getState().offLine.get('lineConnection')
    const config = cb.rest.nodeEnv == 'development' ? {
      url: '/pub/fileupload/getFileServerUrl',
      method: 'GET',
      options: {
        token: true, timeout: 3000
      }
    } : {
      url: 'test/fetch',
      method: 'GET',
      options: { uniform: false, token: false, timeout: 3000 }
    };
    proxy(config).then(json => {
      if (json.code !== 500) {
        if(!lineConnection && isBillingProcess(getState)) {
          console.log('正在连网中')
          dispatch(genAction('PLATFORM_UI_OFF_LINE_CHANGE_LINE_CONNECT', { lineConnection: 0 }))
          return
        }
        console.log('连网')
        dispatch(genAction('PLATFORM_UI_OFF_LINE_CHANGE_LINE_CONNECT', { lineConnection: true }))
        cb.events.execute('connectLine')
      } else {
        console.log('断网--->code为500:断网或者超时')
        dispatch(genAction('PLATFORM_UI_OFF_LINE_CHANGE_LINE_CONNECT', { lineConnection: false }))
      }
    }).catch(e => {
      console.error(e.message)
    })
  }
}

/* 检验是否在开单过程中 */
const isBillingProcess = (getState) => {
  // let lastBill = JSON.parse(localStorage.getItem('billing_lastBill'));
  const { billingStatus, bRepair, bHang } = getState().uretailHeader.toJS();
  const userInfoStatus = getState().member.get('userInfoStatus');
  const originProducts = getState().product.get('products');
  const products = Immutable.Iterable.isIterable(originProducts) ? originProducts.toJS() : originProducts;
  switch (billingStatus) {
    case 'PresellBill':/* 预订 */
    case 'Shipment':/* 交货 */
    case 'PresellBack':/* 退订 */
    case 'FormerBackBill':/* 原单退货 */
    case 'NoFormerBackBill':/* 非原单退货 */
      return true
  }
  if(bRepair || bHang || userInfoStatus || !_.isEmpty(products))
    return true
  return false
}

/* proxy的断网分支 */
export function localProxy (config) {
  const { options, url, params } = config;
  if(cb.rest.interMode !== 'touch')
    return proxy(config)
  if ((options && !options.networkConnect)) {
    if (url === 'bill/save') {
      return offLine_save(params);
    }
    if (url === 'bill/add') {
      return offLine_add(params)
    }
  } else {
    return proxy(config)
  }
}

/* 保存服务的处理 */
const offLine_save = (data) => {
  return new Promise(resolve => {
    try {
      const offLineDate = Format(new Date(), 'yyyy-MM-dd hh:mm:ss');
      const paramsData = JSON.parse(data.data);
      paramsData.rm_retailvouch.vouchdate = offLineDate; /* 单据日期 */
      paramsData.rm_retailvouch.ioffline = 1;
      data.data = JSON.stringify(paramsData);
      IDB_saveData(data).then(sucess => {
        // let paramsData = JSON.parse(data.data);
        const offlinereturndata = {};
        const { retailVouchDetails, retailVouchGatherings } = paramsData.rm_retailvouch;
        const mainObj = {};
        retailMainFields.forEach(item => {
          mainObj[item] = paramsData.rm_retailvouch[item];
        })
        offlinereturndata.rm_retailvouch = [mainObj];
        offlinereturndata.retailVouchDetails = retailVouchDetails;
        offlinereturndata.retailVouchGatherings = retailVouchGatherings;
        resolve({ code: 200, data: JSON.stringify(offlinereturndata) })
      }).catch(e => {
        console.error(e.message)
        resolve({ code: 505, message: e.message })
      })
    } catch (e) {
      console.error(e.message)
    }
  })
}

/* 取初始化表头数据 */
const offLine_add = (params) => {
  return new Promise(resolve => {
    try{
      const data = getOriginRetailHeader()[`${params.billnum}Empty`];
      const currentDate = new Date();
      data.createDate = Format(currentDate, 'yyyy-MM-dd');
      data.createTime = Format(currentDate, 'yyyy-MM-dd hh:mm:ss');
      resolve({ code: 200, data})
    }catch(e) {
      console.error(e.message)
      resolve({ code: 505, message: e.message })
    }
  })
}
