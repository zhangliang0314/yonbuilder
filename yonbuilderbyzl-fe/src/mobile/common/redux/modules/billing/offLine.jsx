import Immutable from 'immutable';
import { genAction, proxy } from '@mdf/cube/lib/helpers/util';
import { Format } from '@mdf/cube/lib/helpers/formatDate';
import { IDB_saveData, IDB_searchData, IDB_deleteSomeData } from '@mdf/metaui-mobile/lib/redux/indexedDB'
import { getOriginRetailHeader, formateProduct } from './mix'
import { getBillingViewModel } from './config';
import uuid from 'uuid';
import _ from 'lodash';

let retailMainFields = null;

const $$initialState = Immutable.fromJS({
  lineConnection: true, /* 是否连网  true:联网， false：断网， 0: 连接中（也属于断网） */
  viewLoadedData: [], /* 上传成功的缓存数据 */
});

export default ($$state = $$initialState, action) => {
  switch (action.type) {
    case 'PLATFORM_UI_RETAIL_SET_MAIN_FIELDS':
      retailMainFields = action.payload;
      return $$state;
    case 'PLATFORM_UI_OFF_LINE_CACHEVIEW_DATA':
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
        token: true, timeout: 3000, mask: false
      }
    } : {
      url: 'test/fetch',
      method: 'GET',
      options: { uniform: false, token: false, timeout: 3000, mask: false }
    };
    proxy(config).then(json => {
      if (json.code !== 500) {
        if (cb.rest.cache.isMenualOffline) {
          dispatch(genAction('PLATFORM_UI_OFF_LINE_CHANGE_LINE_CONNECT', { lineConnection: false }))
          cb.events.execute('connectLine')
          return
        }
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
      if (!paramsData.rm_retailvouch.bRestore) /* 王九龄 */
        paramsData.rm_retailvouch.vouchdate = offLineDate; /* 单据日期 */
      paramsData.rm_retailvouch.ioffline = 1;
      paramsData.rm_retailvouch.retailVouchDetails.forEach(ele => {
        ele.fbeforeEffacePrice === undefined && (ele.fbeforeEffacePrice = ele.fPrice);
        ele.fbeforeEffaceMoney === undefined && (ele.fbeforeEffaceMoney = ele.fMoney);
      })
      if (!paramsData.rm_retailvouch.cGUID) { /* 最后一道防线 */
        const reCGUID = uuid();
        paramsData.rm_retailvouch.cGUID = reCGUID;
        paramsData.rm_gatheringvouch.cGUID = reCGUID;
      }
      data.data = JSON.stringify(paramsData);
      IDB_saveData(data).then(sucess => {
        // let paramsData = JSON.parse(data.data);
        const offlinereturndata = {};
        const { retailVouchDetails, retailVouchGatherings } = paramsData.rm_retailvouch;
        retailVouchDetails.forEach(ele => formateProduct(ele))
        const mainObj = {};
        retailMainFields.forEach(item => {
          mainObj[item] = paramsData.rm_retailvouch[item];
        })
        offlinereturndata.rm_retailvouch = [mainObj];
        offlinereturndata.retailVouchDetails = retailVouchDetails;
        offlinereturndata.retailVouchGatherings = retailVouchGatherings;
        afterOfflineSave(offlinereturndata)
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
      data.creator = cb.rest.AppContext.user.name
      resolve({ code: 200, data})
    }catch(e) {
      console.error(e.message)
      resolve({ code: 505, message: e.message })
    }
  })
}

/* cacheView取数据 */
export const getCacheViewData = (status) => {
  return function (dispatch, getState) {
    status || (status = 'upLoaded')
    const viewLoadedData = []
    IDB_searchData({dbTableName: status}).then(dbData => {
      for(const per of dbData) {
        const load = {}
        load.indexedDB_id = load.key = per.indexedDB_id;
        load.reason = per.reason;
        const data = JSON.parse(per.data)
        const { vouchdate, cGUID, creator, retailVouchDetails, code, fMoneySum } = data.rm_retailvouch
        load.vouchdate = vouchdate; // 单据日期
        load.cGUID = cGUID;
        load.creator = creator; // 制单人
        load.code = code; // 单据编号
        load.fMoneySum = fMoneySum // 金额
        load.retailVouchDetails = retailVouchDetails;

        viewLoadedData.push(load)
      }
      dispatch(genAction('PLATFORM_UI_OFF_LINE_CACHEVIEW_DATA', {viewLoadedData}))
    }).catch(e => {
      console.error(e)
      cb.utils.alert('查询缓存数据出错！', 'error')
    })
  }
}

/* cacheView删除数据库 */
export function deleteCacheViewItems (ids, dbTableName, callback) {
  return function (dispatch, getState) {
    IDB_deleteSomeData({id: ids, dbTableName}).then(json => {
      if (json === '删除失败') return
      let viewLoadedData = getState().offLine.get('viewLoadedData')
      Immutable.List.isList(viewLoadedData) && (viewLoadedData = viewLoadedData.toJS())
      const deleteIndexArr = []
      for(const [index, value] of viewLoadedData.entries()) {
        if (ids.indexOf(value.key) > -1) deleteIndexArr.push(index)
      }
      for(const [i, v] of deleteIndexArr.entries()) { // eslint-disable-line no-unused-vars
        viewLoadedData.splice(v, 1)
      }
      // for (let i=0,length=viewLoadedData.length;i<length;i++){
      //     if (ids.indexOf(viewLoadedData[i].key)>-1) viewLoadedData.splice(i, 1)
      // }
      dispatch(genAction('PLATFORM_UI_OFF_LINE_CACHEVIEW_DATA', {viewLoadedData}))
      callback && callback()
    }).catch(e => {
      console.error(`删除缓存数据过程失败：${e}`)
    })
  }
}

export function autoDeleteDB () {
  return new Promise(resolve => {
    const currentTime = (new Date()).getTime();
    const sevenDayTime = 7 * 24 * 60 * 60 * 1000;
    try{
      IDB_searchData({dbTableName: 'upLoaded'}).then(dbData => {
        const ids = [];
        if(!dbData || dbData.length < 1) {
          resolve(false)
          return
        }
        dbData.forEach(data => {
          const retailvouch = JSON.parse(data.data);
          const date = retailvouch.rm_retailvouch.vouchdate;
          const billTime = (new Date(date)).getTime();
          if (billTime + sevenDayTime < currentTime)
            ids.push(data.indexedDB_id)
        })
        if(ids.length < 1) {
          resolve(false)
          return
        }
        IDB_deleteSomeData({id: ids, dbTableName: 'upLoaded'}).then(str => {
          if (str === '删除成功')
            resolve(true)
          else {
            console.error('IDB_deleteSomeData 删除事务失败')
            resolve(false)
          }
        })
      })
    }catch(e) {
      console.error('删除多条数据过程失败！')
      resolve(false)
    }
  })
}

/**
 * [
    {
        belongname: '零售单',
        data: [{attrKey: '', data: , message: ''}, {'attrKey': '', data: , message: ''}],
        keys: ['rm_retailvouch', 'rm_gathering'],
        bytes: '1.23MB'
    },
]
 */
export const getDBMeta = (treeData) => {
  return new Promise(resolve => {
    const json = { code: 200, data: [] };
    const { transBillno2Name, allBillName } = cacheDataClassify(treeData)
    IDB_searchData({dbTableName: 'metaData'}).then(result => {
      // if (!result.length) {
      //     json.code = 500;
      //     resolve(json)
      //     return
      // }
      result.forEach(ele => {
        const keyArr = ele.attrKey.split('|') // url|billno|billKey
        // if(keyArr[1])
        const belongName = transBillno2Name[keyArr[1]]
        if (belongName) {
          let flag = false
          json.data.forEach(element => {
            if (element.belongName === belongName) {
              flag = true;
              element.data.push(ele)
            }
          })
          if (!flag) json.data.push({belongName: belongName, data: [ele]})
        }
      })
      const copyBillName = allBillName.slice();
      json.data.forEach(bill => {
        const index = copyBillName.indexOf(bill.belongName);
        if (index != -1) {
          copyBillName.splice(index, 1)
          bill.bytes = calculateBytes(bill.data)
        }
      })
      copyBillName.forEach(name => {
        json.data.push({belongName: name, data: [], bytes: '0B'})
      })
      resolve(json)
    })
  })
}

const cacheDataClassify = (treeData) => {
  let transBillno2Name = {}; let allBillName = []; let retailName = '';
  treeData && treeData.map(ele => {
    if (ele.viewType === 'meta' && ele.metaKey.includes('rm_retailvouch'))
      retailName = ele.name
  })
  treeData && treeData.forEach(menu => {
    if (menu.viewType === 'meta') {
      allBillName.push(menu.name)
      transBillno2Name[menu.metaKey] = menu.name
      !menu.metaKey.endsWith('list') && (transBillno2Name[`${menu.metaKey}list`] = menu.name)
      if (menu.metaKey.includes('rm_gatheringvouch'))
        transBillno2Name[menu.metaKey] = retailName || '零售单'
    }
  })
  if (_.isEmpty(transBillno2Name)) {
    transBillno2Name = _transBillno2Name;
    allBillName = _allBillName;
  }
  return { transBillno2Name, allBillName }
}

const _transBillno2Name = {
  rm_retailvouch: '零售单',
  rm_retailvouchlist: '零售单',
  rm_gatheringvouch: '零售单',
  st_demandapplylist: '要货申请',
  st_demandapply: '要货申请',
  st_storenoticelist: '入库通知',
  st_storenotice: '入库通知',
  st_storeinlist: '店存入库',
  st_storein: '店存入库',
  st_storeoutlist: '店存出库',
  st_storeout: '店存出库',
  st_othinrecordlist: '其他入库',
  st_othinrecord: '其他入库',
  st_othoutrecordlist: '其他出库',
  st_othoutrecord: '其他出库',
  rm_contributionlist: '缴款',
  rm_contribution: '缴款',
  rm_shiftreceipt: '交班',
  rm_shiftreceiptlist: '交班',
  rm_dayEndReceipt: '日结',
  rm_dayEndReceiptlist: '日结',
  rm_offlinevouchlist: '离线单据',
  rm_offlinevouch: '离线单据',
  aa_electronicbalancescheme: '硬件设备适配',
}

const _allBillName = ['零售单', '要货申请', '入库通知', '店存入库', '店存出库', '其他入库', '其他出库', '缴款', '交班', '日结', '离线单据', '硬件设备适配'];

/* 暂以utf-8编码格式计算 */
const calculateBytes = (target) => {
  if (!target) return '0B'
  if (typeof target === 'object')
    target = JSON.stringify(target)
  else if (typeof target !== 'string')
    target = target.toString()
  const blob = new Blob([target])
  const bytes = blob.size;
  if (bytes < 1024)
    return bytes + 'B'
  if (bytes >= 1024 && bytes < 1048576)
    return (bytes / 1024).toFixed(2) + 'Kb'
  if (bytes >= 1048576 && bytes < 1073741824)
    return (bytes / 1048576).toFixed(2) + 'MB'
  if (bytes > 1073741824)
    return (bytes / 1073741824).toFixed(2) + 'G'
}

export function perfectOption () {
  if (cb.rest.interMode !== 'touch') return
  cb.rest.AppContext.option._internetPrint = JSON.parse(localStorage.getItem('_internetPrint')) || false;
  cb.rest.AppContext.option._acceptCaterBill = JSON.parse(localStorage.getItem('_acceptCaterBill')) || false;
  if (localStorage.getItem('isOpenDBCache') === null)
    cb.rest.cache.isOpenDBCache = {key: 'DEFAULT', value: !!cb.rest.AppContext.option.billCacheToApp}
  else
    cb.rest.cache.isOpenDBCache = JSON.parse(localStorage.getItem('isOpenDBCache'))
}

export function timeTask (type) {
  return function (dispatch) {
    if (type === 'close') {
      if (window.__onLineTimer) {
        clearInterval(window.__onLineTimer)
        window.__onLineTimer = null
      }
      return
    }
    if(cb.rest.interMode === 'touch') {
      if (cb.rest.cache.isOpenDBCache) {
        if (window.__onLineTimer) return
        window.__onLineTimer = setInterval(() => {
          dispatch(checkOnline())
        }, 10000)
      } else
        dispatch({type: 'PLATFORM_UI_OFF_LINE_CHANGE_LINE_CONNECT', payload: { lineConnection: true }})
    }
  }
}

const afterOfflineSave = (offlinereturndata) => {
  const billingViewModel = getBillingViewModel();
  if (!billingViewModel) {
    cb.utils.alert('正在初始化，请稍后重试', 'error');
    return false
  }
  return billingViewModel.execute('afterOfflineSave', {offlinereturndata})
}
