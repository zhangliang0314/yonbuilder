import Immutable from 'immutable';
import { genAction } from '@mdf/cube/lib/helpers/util';
// import _ from 'lodash'
import { getAllregion } from './reserve';
import status from './billingStatus';
import { getBillingViewModel } from './config'
import Cookies from 'cookies-js';

const infoMap = {
  businessType: {}, /* 业务类型iBusinesstypeid */
  warehouse: {}, /* 交货仓库 iDeliveryWarehouseid */
  reserveDate: '', /* 预交货日期dPlanShipmentDate */
  contacts: '', /* 联系人cCusperson */
  phone: '', /* 电话 cMobileNo */
  address: '', /* 地址*cDeliveradd */
  addressCascader: { id: '', name: '' },
  memo: '', /* 备注*memo */
  takeWay: {}, /* 提货方式iTakeway */
  regionCode: '', /* 省市区 */
}

const contrastMap = {
  businessType: { iBusinesstypeid: 'id', iBusinesstypeid_name: 'name' },
  warehouse: { iDeliveryWarehouseid: 'id', iDeliveryWarehouseName: 'name' },
  reserveDate: 'dPlanShipmentDate',
  contacts: 'cCusperson',
  phone: 'cMobileNo',
  address: 'cDeliveradd',
  memo: 'memo',
  takeWay: 'iTakeway',
  addressCascader: 'addressCascader',
  regionCode: 'regionCode',
}

// iPresellState: "预订单状态", 0非预定，1预定，2退订，3交货
// iDeliveryState: "交货状态", 0未交，1已交，2退货
// iPayState: "收款状态", 0未收款，1全款结清，2收部分
// iTakeway: "提货方式", 0即提，1本店自提，2中心配送
const BillingStatus2FieldMap = {
  CashSale: { iPresellState: 0, iDeliveryState: 1, iPayState: 1, iTakeway: 0 },
  PresellBill: { iPresellState: 1, iDeliveryState: 0 },
  Shipment: { iPresellState: 3, iDeliveryState: 1, iPayState: 1 },
  PresellBack: { iPresellState: 2, iDeliveryState: 0 },
  FormerBackBill: { iPresellState: 0, iDeliveryState: 1, iPayState: 1, iTakeway: 0 },
  NoFormerBackBill: { iPresellState: 0, iDeliveryState: 1, iPayState: 1, iTakeway: 0 },
  AfterSaleService: { iPresellState: 6, iDeliveryState: 1, iPayState: 1, iTakeway: 0 },
  OnlineBill: { iPresellState: 7 },
  OnlineBackBill: { iPresellState: 8 }
};

let retailMainFields = null;
let preferentialHeader = null;
let billingStatus = status.CashSale;
let cacheDeliveryModify = true;/* add by jinzh1 副屏需要参数增加 */
let __backBillDate = '';
/* add by jinzh1 会员meta   cRefRetId */
let memberRefer2HeaderMap = null;
let viewModel = null;
const $$initialState = Immutable.fromJS({
  billingStatus: billingStatus, /* 开单界面状态 */
  infoData: infoMap, /* 开单界面 右上 信息 */
  defineData: [], /* 表头自定义项 */
  bRepair: false, /* 是否补单 */
  bHang: false, /* 是否解挂 */
  vouchdate: '', /* 单据日期(仅补单) */
  MinPercentGiveMoneyPre: 100, /* 预付款比例 */
  controlType: 1, /* 预付款比例控制方式 1严格 2提醒 */
  gatheringMemo: '', /* 收款单备注 */
  cacheDefaultBusinessType: null, /* 登录缓存默认业务类型数据 */
})

// reducer
export default ($$state = $$initialState, action) => {
  switch (action.type) {
    case 'PLATFORM_UI_BILLING_URETAILHEADER_EXTEND_SET_OPTIONS':
    case 'PLATFORM_UI_BILLING_HEADER_SET_COMMONDATA':
      return $$state.merge(action.payload);
    case 'PLATFORM_UI_RETAIL_SET_MAIN_FIELDS':
      retailMainFields = action.payload;
      return $$state;
    case 'PLATFORM_UI_BILLING_EXECUTE_PREFERENTIAL_UPDATE_PRODUCTS':
    case 'PLATFORM_UI_BILLING_CANCEL_PREFERENTIAL_UPDATE_PRODUCTS':
      cachePreferentialHeader(action.payload.value);
      return $$state;
    case 'PLATFORM_UI_BILLING_CLEAR': {
      preferentialHeader = null;
      __backBillDate = '';
      billingStatus = status.CashSale;
      const infoData = $$state.get('DefaultInfoData') ? $$state.get('DefaultInfoData').toJS() : infoMap;
      return $$state.merge({ billingStatus, infoData, bRepair: false, bHang: false, vouchdate: '', billMoney: 0, gatheringMemo: '' });
    }
    case 'PLATFORM_UI_BILLING_REFER_BILL_OK':
      cb.events.execute('communication', action)
      billingStatus = action.payload.status;
      cachePreferentialHeader(action.payload.data);
      return transformHeader(action.payload.data, billingStatus, $$state, !!action.payload.bHang);
    case 'PLATFORM_UI_BILLING_QUERY_MEMBER':
      preferentialHeader = preferentialHeader || {};
      preferentialHeader.fPointBalance = action.payload.data.points;
      if (action.payload.data.scoppoints)/* 商家积分 */
        preferentialHeader.fSellerPointBalance = action.payload.data.scoppoints;
      return $$state;
    case 'PLATFORM_UI_BILLING_CACHE_DEFAULT_BUSINESSTYPE':
      return $$state.merge({ cacheDefaultBusinessType: action.payload })
    /* add by jinzh1 */
    case 'PLATFORM_UI_MEMBER_META_TO_HEADER':
      try {
        var obj = JSON.parse(action.payload);
        for (var attr in obj) {
          var referKey = obj[attr];
          if (!memberRefer2HeaderMap) memberRefer2HeaderMap = {};
          memberRefer2HeaderMap[referKey] = attr;
        }
      } catch (e) {
        console.error('参照携带定义' + action.payload + '有错误');
      }
      return $$state;
    case 'PLATFORM_UI_BILLING_VIEWMODEL_INIT': {
      viewModel = action.payload;
      const defineMeta = action.payload.getViewMeta('rm_retailvouch_header_userdefine');
      let defineData = [];
      if (defineMeta.containers && defineMeta.containers[0] && defineMeta.containers[0].controls)
        defineData = defineMeta.containers[0].controls;
      return $$state.merge({ defineData: defineData });
    }
    default:
      return $$state;
  }
}

/* 更改开单状态 */
export function ModifyBillStatus (value) {
  return function (dispatch, getState) {
    billingStatus = value;
    dispatch(genAction('PLATFORM_UI_BILLING_HEADER_SET_COMMONDATA', { billingStatus: billingStatus }));
  }
}

/* 预定 */
export function ModifyReserve (data) {
  return function (dispatch, getState) {
    const { infoData, billingStatus } = getState().uretailHeader.toJS();
    data.bRepair = infoData.bRepair;
    data.vouchdate = infoData.vouchdate;
    data.cDeliverType = infoData.cDeliverType;
    data.iOwesState = infoData.iOwesState;
    data.isControlCredit = infoData.isControlCredit;
    data.canCreditAmount = infoData.canCreditAmount;
    data.bCusCreCtl = (infoData.bCusCreCtl === undefined) ? data.bCusCreCtl : infoData.bCusCreCtl;
    data.creditBalance = (infoData.creditBalance === undefined) ? data.creditBalance : infoData.creditBalance;
    infoData.billNo && (data.billNo = infoData.billNo)
    /* 赵哲 电商订单可用量从单据里取 */
    if (billingStatus === 'OnlineBill') data.bPreselllockStock = infoData.bPreselllockStock;
    dispatch(genAction('PLATFORM_UI_BILLING_HEADER_SET_COMMONDATA', { infoData: data }));
  }
}

/* 更新预订状态下  预付款比例/预定影响可用量/交货时可修改商品 */
export function ModifyReserveParams (data) {
  return function (dispatch, getState) {
    dispatch(genAction('PLATFORM_UI_BILLING_HEADER_SET_COMMONDATA', data));
  }
}
/* 设置是否补单/单据日期 */
export function SetRepair (repair) {
  return function (dispatch, getState) {
    const data = getState().uretailHeader.toJS().infoData;
    data.bRepair = repair.bRepair;
    data.vouchdate = repair.vouchdate;
    dispatch(genAction('PLATFORM_UI_BILLING_HEADER_SET_COMMONDATA', { infoData: data }));
  }
}
/* 获取单据状态 */
export function getBillingStatus () {
  return billingStatus;
}
/* 获取交货是否可改参数 */
export function getBDeliveryModify () {
  return cacheDeliveryModify;
}
export function setDefaultBusinessType (businessType, takeWay, bPreselllockStock, bDeliveryModify, MinPercentGiveMoneyPre, controlType) {
  return function (dispatch, getState) {
    const { infoData, billingStatus } = getState().uretailHeader.toJS();
    infoData.businessType = businessType;
    infoData.takeWay = takeWay;
    /* 赵哲 电商订单可用量从单据里取 */
    if (billingStatus !== status.OnlineBill) infoData.bPreselllockStock = bPreselllockStock;
    infoData.bDeliveryModify = bDeliveryModify;
    cacheDeliveryModify = bDeliveryModify;
    const commonData = { infoData: infoData, MinPercentGiveMoneyPre, controlType };
    if (billingStatus != status.OnlineBill && billingStatus != status.OnlineBackBill) {
      commonData.DefaultInfoData = infoData;
    }// billingStatus != status.AfterSaleService &&
    dispatch(genAction('PLATFORM_UI_BILLING_HEADER_SET_COMMONDATA', commonData));
  }
}
/* 交货/退订/带回表头信息 */
const transformHeader = (data, billingStatus, $$state, bHang) => {
  // if (billingStatus == status.Shipment || billingStatus == status.PresellBack) {
  const infoData = $$state.get('infoData').toJS();
  infoData.billNo = data.code;// 单据编号--退订、交货时显示
  infoData.reserveDate = data.dPlanShipmentDate;// 希望交货日期
  infoData.contacts = data.cCusperson;
  infoData.phone = data.cMobileNo;
  infoData.address = data.cDeliveradd;
  infoData.memo = data.memo;
  infoData.bDeliveryModify = data.bDeliveryModify;
  cacheDeliveryModify = data.bDeliveryModify;
  infoData.bPreselllockStock = data.bPreselllockStock;
  infoData.businessType = { id: data.iBusinesstypeid, name: data.iBusinesstypeid_name };
  infoData.warehouse = { id: data.iDeliveryWarehouseid, name: data.iDeliveryWarehouseName };
  infoData.regionCode = data.regionCode;
  infoData.Contacts = data.Contacts;
  infoData.Phone = data.Phone;
  infoData.Address = data.Address;
  mockTransferMap(data, infoData);
  infoData.takeWay = { id: data.iTakeway, name: '' };
  if (data.iTakeway == 0) infoData.takeWay.name = '即提';
  if (data.iTakeway == 1) infoData.takeWay.name = '本店自提';
  if (data.iTakeway == 3) infoData.takeWay.name = '本店配送';
  if (data.iTakeway == 2) infoData.takeWay.name = '中心配送';
  infoData.cDeliverType = data.cDeliverType || '' // lz 电商提货方式
  infoData.iCustomerid = data.iCustomerid
  infoData.iOwesState = data.iOwesState // 原单退货赊销标记
  infoData.addressCascader = getAllregion(data.regionCode);
  let billMoney = 0;
  if (billingStatus === 'OnlineBill') {
    billMoney = data.fMoneySum - data.fPresellPayMoney
  }
  if (data.__backBillDate) __backBillDate = data.__backBillDate
  return $$state.merge({ infoData: infoData, billingStatus: billingStatus, bHang, billMoney });
  // } else {
  //   return $$state.merge({ "billingStatus": billingStatus });
  // }
}

export const mockTransferMap = (originTarget, receptor) => {
  /* 电商交货解挂字段 */
  const transferMap = { cCourier_idPhoneName: 'cCourier_idPhoneName', cCourierid: 'cCourierid', cCourierid_name: 'cCourierid_name', cCourierPhone: 'cCourierPhone', cLogisticsNo: 'cLogisticsNo', logistics_idCode: 'logistics_idCode', cLogisticid: 'cLogisticid', cLogisticid_corp_code: 'cLogisticid_corp_code' }
  for (const attr in transferMap) {
    if (transferMap.hasOwnProperty(attr) && originTarget[attr]) receptor[attr] = originTarget[attr]
  }
}

const cachePreferentialHeader = (value) => {
  if (preferentialHeader) {
    const { fPointBalance, fSellerPointBalance } = preferentialHeader;
    preferentialHeader = {};
    if (fPointBalance) preferentialHeader.fPointBalance = fPointBalance;
    if (fSellerPointBalance) preferentialHeader.fSellerPointBalance = fSellerPointBalance;
  } else {
    preferentialHeader = {};
  }
  retailMainFields.forEach(field => {
    preferentialHeader[field] = value[field];
  });
}

export const getPreferentialHeader = () => {
  return preferentialHeader
}
export const modifyPreferentialHeader = (headersData) => {
  preferentialHeader = headersData;
}

const getHeadersData = (globalState) => {
  const uretailHeader = globalState.uretailHeader.toJS();
  const { infoData, bHang, doneActiveKey, billingStatus } = uretailHeader;
  const data = cb.utils.extend(true, {}, infoData);
  for (var key in infoData) {
    if (contrastMap[key]) {
      delete data[key];
      if (typeof (infoData[key]) == 'object') {
        if (typeof (contrastMap[key]) == 'object') {
          for (var item in contrastMap[key])
            data[item] = infoData[key][contrastMap[key][item]] == '' ? null : infoData[key][contrastMap[key][item]];
        } else {
          if (infoData[key].id == '') {
            data[contrastMap[key]] = null;
          } else {
            data[contrastMap[key]] = infoData[key].id;
          }
        }
      } else {
        if (infoData[key] == '') {
          data[contrastMap[key]] = null;
        } else {
          data[contrastMap[key]] = infoData[key];
        }
      }
    } else {
      if (infoData[key] && (typeof (infoData[key]) == 'object')) {
        data[key] = infoData[key].name;
      } else {
        data[key] = infoData[key];
      }
    }
  }
  data.bPreselllockStock = infoData.bPreselllockStock;
  data.bDeliveryModify = infoData.bDeliveryModify;
  cacheDeliveryModify = infoData.bDeliveryModify;
  data.bHang = bHang;
  data.bRestore = infoData.bRepair;
  data.doneActiveKey = doneActiveKey;
  data.billingStatus = billingStatus;
  if (billingStatus == 'AfterSaleService' && data.vouchdate == '')
    delete data.vouchdate;
  return data;
}
export function getBillingHeader (globalState) {
  const headersData = getHeadersData(globalState);
  let { storeId, gradeId, userStores } = globalState.user.toJS();
  const defineControls = globalState.uretailHeader.get('defineData').toJS();
  let storeCode = null; let storeName = null;
  const viewModelData = getBillingViewModel().getAllData();
  const mainData = {};
  retailMainFields.forEach(field => {
    mainData[field] = viewModelData[field];
  });
  const defineData = {};
  defineControls.map(item => {
    defineData[item.cItemName] = viewModelData[item.cItemName];
  });
  if (userStores && userStores.length) {
    const store = storeId ? userStores.find(item => {
      return item.store === storeId;
    }) : userStores[0];
    if (!storeId)
      storeId = store.store;
    if (store) {
      storeCode = store.store_code;
      storeName = store.store_name;
    }
  }
  const memberData = globalState.member.toJS().memberInfo.data;
  const { device, serviceUrl } = cb.rest.AppContext;
  const memberMAp = {};
  if (memberRefer2HeaderMap && memberData) {
    for (var key in memberRefer2HeaderMap) {
      memberMAp[memberRefer2HeaderMap[key]] = memberData[key];
    }
  }
  const iCabinetgroup = Number(Cookies.get('pos_cabinetgroup'))
  return Object.assign({ billingStatus }, preferentialHeader, mainData, defineData, BillingStatus2FieldMap[billingStatus], headersData, {
    store: storeId,
    cStoreCode: storeCode,
    store_name: storeName,
    iGradeid: gradeId,
    // iMemberid: memberData && memberData.mid,
    // levelId: memberData && memberData.level_id,
    cMachineid: device && device.macaddress,
    cRetailURL: serviceUrl + '/uniform',
    cPOSNum: localStorage.getItem('billing_posCode') || '',
    iCabinetgroup: isNaN(iCabinetgroup) ? null : (iCabinetgroup || null),
  }, memberMAp);
}

export function setBusinessType (businessType) {
  return function (dispatch, getState) {
    const infoData = getState().uretailHeader.toJS();
    infoData.businessType = businessType;
    dispatch(genAction('PLATFORM_UI_BILLING_HEADER_SET_COMMONDATA', { infoData: infoData }));
  }
}

export function getCommonParams (type) {
  const obj = {
    __backBillDate: __backBillDate,
    preferentialHeader: preferentialHeader
  }
  return obj[type]
}

export function getViewModel () {
  return viewModel;
}
