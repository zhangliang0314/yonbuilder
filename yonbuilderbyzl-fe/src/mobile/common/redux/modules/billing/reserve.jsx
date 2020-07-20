import Immutable from 'immutable';
import { genAction, proxy } from '@mdf/cube/lib/helpers/util';
// import _ from 'lodash'
import * as format from '@mdf/cube/lib/helpers/formatDate';
import { ModifyReserve, ModifyBillStatus, setDefaultBusinessType, ModifyReserveParams, setBusinessType, mockTransferMap } from './uretailHeader';
import { setSearchBoxFocus } from './goodsRefer';
import { getGlobalProducts } from './product';
import { getOptions, modifyCenterWareHouseInfo, getDefaultWareHouse } from './mix'
import status from './billingStatus';
import { getBillingViewModel } from './config'

const keyMap = {};
const $$initialState = Immutable.fromJS({
  visible: false,
  Businesstype_DataSource: [], /* 业务类型数据源 */
  WareHouse_DataSource: [], /* 仓库数据源 */
  Region_DataSource: [], /* 地区数据源 */
  takeWay_DataSource: [], /* 提货方式数据源 */
  logistics_DataSource: [], /* 物流数据源 */
  storeMember_DataSource: [], /* 店员数据源 */
  customer_DataSource: [], /* 客户数据源 */

  businessType: { id: '', name: '' }, /* 业务类型 */
  wareHouse: { id: '', name: '', erpCode: '' }, /* 交货仓库 */
  addressCascader: { id: '', name: '' }, /* 省市区 */
  takeWay: { id: '', name: '' }, /* 提货方式 */
  ReserveDeliveryDate: '', /* 预交货日期 */
  Contacts: '', /* 联系人 */
  Phone: '', /* 联系电话 */
  Address: '', /* 详细地址 */
  Memo: '', /* 备注 */

  cLogisticid: null, /* 物流公司ID */
  Logisticname: '', /* 物流公司名称 */
  cLogisticid_corp_code: '', /* 物流公司编码 */
  cLogisticsNo: '', /* 快递单号 */
  cCourierid: null, /* 配送人ID */
  cCourierid_name: '', /* 配送人姓名 */
  cCourierPhone: '', /* 配送人手机 */
  credit_assoc_customer: '', /* 赊销关联客户ID */
  iCustomerid: null, /* 赊销客户ID */
  iCustomerName: '', /* 赊销客户名称 */
  bCusCreCtl: '', /* 客户是否控制信用 */
  creditBalance: '', /* 客户信用余额 */

  isDefault: false, /* 是否默认 */

  bReserve: false, /* 预定/表头修改 */
  check: false, /* 校验 */
  MinPercentGiveMoneyPre: 100, /* 预订-预付款比例 */
  controlType: '1', /* 预定-预付款比例控制方式 1严格 2提醒 */
  isEdited: false, /** *是否编辑过预定信息 */
  cacheData_region: null, /* 登录缓存省市区数据 */
})

// reducer
export default ($$state = $$initialState, action) => {
  switch (action.type) {
    /* modal显示/隐藏 */
    case 'PLATFORM_UI_BILLING_RESERVE_SET_VISIBLE':
      return $$state.set('visible', action.payload);
    /* 门店类型 */
    case 'PLATFORM_UI_BILLING_RESERVE_SET_STORETYPE':
      return $$state.set('storeType', action.payload);
    /* 业务类型数据源 */
    case 'PLATFORM_UI_BILLING_RESERVE_GET_BUSINESS_DATASOURCE':
      return $$state.set('Businesstype_DataSource', action.payload);
    /* 仓库数据源 */
    case 'PLATFORM_UI_BILLING_RESERVE_GET_WAREHOUSE_DATASOURCE':
      return $$state.set('WareHouse_DataSource', action.payload);
    /* 地区数据源 */
    case 'PLATFORM_UI_BILLING_RESERVE_GET_REGION_DATASOURCE':
      return $$state.set('Region_DataSource', action.payload);
    case 'PLATFORM_UI_BILLING_RESERVE_SET_COMMON_DATA':
      return $$state.merge(action.payload);
    case 'PLATFORM_UI_BILLING_CLEAR':
      return billingClear(action.payload, $$state);
    /* 交货/退订/退货/解挂等参照返回 */
    case 'PLATFORM_UI_BILLING_REFER_BILL_OK':
      return transformHeader(action.payload.data, $$state);
    /* mobile */
    case 'PLATFORM_UI_BILLING_IS_EDITING':
      return $$state.merge(action.payload);
    case 'PLATFORM_UI_BILLING_RESERVE_CACHE_REGION':
      return $$state.merge({ cacheData_region: action.payload })
    /* 客户参照返回 */
    case 'BILLING_REFER_RESERVE_CUSTOMER_RETURN':
      return $$state.merge({ iCustomerid: action.payload.id, iCustomerName: action.payload.name })
    /* 交货仓库返回 */
    case 'BILLING_REFER_RESERVE_WAREHOUSE_RETURN':
      return $$state.merge({ wareHouse: action.payload });
    case 'PLATFORM_UI_BILLING_VIEWMODEL_INIT':
      return $$state.set('viewModel', action.payload)
        .set('viewMeta', action.payload.getViewMeta('rm_retailvouch_header_info'))
        .set('defineMeta', action.payload.getViewMeta('rm_retailvouch_header_userdefine'));
    default:
      return $$state;
  }
}
/* 新开单 */
const billingClear = (payload, $$state) => {
  const reserve = {
    businessType: { id: '', name: '' }, wareHouse: { id: '', name: '', erpCode: '' },
    addressCascader: { id: '', name: '' }, takeWay: { id: '', name: '' },
    ReserveDeliveryDate: format.Format(new Date()) + ' 23:59:59', Contacts: '', Phone: '',
    Address: '', Memo: '', isDefault: false, isDistribCenter: false, bReserve: false, check: false,
    Businesstype_DataSource: [], WareHouse_DataSource: [], hadOpen: false, cLogisticid: null, /* 物流公司ID */
    Logisticname: '', /* 物流公司名称 */
    cLogisticid_corp_code: '', /* 物流公司编码 */
    cLogisticsNo: '', /* 快递单号 */
    cCourierid: null, /* 配送人ID */
    cCourierid_name: '', /* 配送人姓名 */
    cCourierPhone: '',
    cCourier_idPhoneName: '',
    logistics_idCode: '',
    credit_assoc_customer: '',
    iCustomerid: null,
    iCustomerName: '',
    bCusCreCtl: '',
    creditBalance: '',
  }
  return $$state.merge(reserve);
}
/* 点击左侧菜单-预定 */
export function showReserve () {
  return function (dispatch, getState) {
    /* 校验是否可以预定 */
    const check = checkReatilHeader(getState(), status.PresellBill);
    if (!check) return;
    const { billingStatus } = getState().uretailHeader.toJS();/* 开单状态 */
    const memberInfo = getState().member.toJS().memberInfo;
    const reserve = getState().reserve.toJS();
    const { bReserve, Contacts, Phone, storeType, customer_DataSource } = reserve;
    const data = { visible: true };
    if (reserve.ReserveDeliveryDate == '') data.ReserveDeliveryDate = format.Format(new Date()) + ' 23:59:59';
    if (memberInfo.data && Contacts == '' && Phone == '') {
      data.Contacts = memberInfo.data.realname;
      data.Phone = memberInfo.data.phone;
    }
    if (!bReserve && (billingStatus != status.PresellBill)) {
      data.bReserve = true;
      data.businessType = { id: '', name: '' };
      dispatch(getBusinessType(data.bReserve, status.PresellBill, true));
    }
    if (storeType == 1 && cb.rest.AppContext.tenant.isOpenUdh) { // 直营店
      if (!customer_DataSource[0])
        dispatch(getCustomer())
    }
    if (cb.rest.terminalType == 3) {
      data.bReserve = true;
    }
    dispatch(genAction('PLATFORM_UI_BILLING_RESERVE_SET_COMMON_DATA', data));
  }
}
/* 校验是否可以修改表头信息 */
function checkReatilHeader (globalState, type) {
  const { billingStatus, infoData } = globalState.uretailHeader.toJS();
  const lineConnection = globalState.offLine.get('lineConnection');
  if (cb.rest.interMode === 'touch' && !lineConnection) {
    cb.utils.alert('当前网络不可用，不能使用此功能!', 'error')
    return
  }
  const isPop = false
  if (!beforeOpenRetailHeader({ isPop })) {
    if (isPop === true)
      return true
    return false
  }
  let err_info = null; let end_info = '下不能修改表头信息';
  if (type == status.PresellBill) end_info = '下不能进行预订';
  if (billingStatus == status.Shipment) {
    if (infoData.takeWay.id != 3 && infoData.takeWay.id != 1)/* 非本店配送+本店自提 */
      err_info = '预订交货状态';
  }
  if (billingStatus == status.PresellBack) err_info = '预订退订状态';
  if (billingStatus == status.OnlineBackBill) err_info = '电商退货状态';
  // if (billingStatus == status.OnlineBill && infoData.cDeliverType !== 'STOREDELIVERY') err_info = '非本店配送的电商订单';
  if (err_info) {
    cb.utils.alert(err_info + end_info, 'error');
    return false;
  } else {
    return true;
  }
}

const beforeOpenRetailHeader = (obj) => {
  const billingViewModel = getBillingViewModel();
  if (!billingViewModel) {
    cb.utils.alert('正在初始化，请稍后重试', 'error');
    return false
  }
  return billingViewModel.execute('beforeOpenRetailHeader', { obj })
}
const beforeGetBusinessType = (params) => {
  const billingViewModel = getBillingViewModel();
  if (!billingViewModel) {
    // cb.utils.alert('正在初始化，请稍后重试', 'error');
    return false
  }
  return billingViewModel.execute('beforeGetBusinessType', params)
}

/* 点击修改表头信息 */
export function showHeaderInfo (callback) {
  return function (dispatch, getState) {
    /* 校验是否可以修改表头信息 */
    const check = checkReatilHeader(getState(), status.CashSale);
    if (!check) return;
    if (cb.rest.terminalType == 3 && callback) callback(check);
    const { billingStatus, infoData } = getState().uretailHeader.toJS();/* 开单状态 */
    // let products = getState().product.toJS().products;/*开单商品行*/
    const memberInfo = getState().member.toJS().memberInfo;
    let { storeType, bReserve, Businesstype_DataSource, customer_DataSource, Contacts, Phone } = getState().reserve.toJS();
    const data = { visible: true };
    if (billingStatus != status.PresellBill) {
      bReserve = false;
    } else {
      bReserve = true;
    }
    if (memberInfo.data && bReserve && Contacts == '' && Phone == '') {
      data.Contacts = memberInfo.data.realname;
      data.Phone = memberInfo.data.phone;
    }
    data.bReserve = bReserve;
    data.hadOpen = true /* lz, 表头信息已经打开过 */
    dispatch(genAction('PLATFORM_UI_BILLING_RESERVE_SET_COMMON_DATA', data));
    /* 赊销 */
    if (billingStatus !== status.OnlineBackBill && billingStatus !== status.OnlineBill && storeType == 1 && cb.rest.AppContext.tenant.isOpenUdh) {
      if (!customer_DataSource[0]) {
        dispatch(getCustomer())
      }
    }
    if (billingStatus == status.PresellBill) {
      if (!Businesstype_DataSource.length || (Businesstype_DataSource[0] && Businesstype_DataSource[0].saleType != '2')) {
        dispatch(getBusinessType(bReserve, billingStatus, true));
      }
    } else if (billingStatus == status.OnlineBill) {
      if (!Businesstype_DataSource[0] || !Businesstype_DataSource[0].code.includes('A16')) {
        dispatch(getBusinessType(bReserve, billingStatus, true, true));
        dispatch(getLogistics())
        dispatch(getStoreMember())
      }
      if (typeof infoData.addressCascader.id === 'object')
        infoData.addressCascader.id.reverse();
      mockTransferMap(infoData, data);
    } else if (billingStatus == status.Shipment && (infoData.takeWay.id == '3' || infoData.takeWay.id == '1')) {
      dispatch(getBusinessType(true, billingStatus, false, false));
      dispatch(getLogistics());
      dispatch(getStoreMember());
      if (typeof infoData.addressCascader.id === 'object')
        infoData.addressCascader.id.reverse();
    } else if (billingStatus == status.AfterSaleService) {
      dispatch(getBusinessType(bReserve, billingStatus));
    } else {
      if (Businesstype_DataSource[0] && Businesstype_DataSource[0].saleType != '1') {
        dispatch(getBusinessType(bReserve, billingStatus));
      } else {
        if (Businesstype_DataSource.length == 0)
          dispatch(getBusinessType(bReserve, billingStatus));
      }
    }
    data.businessType = infoData.businessType;
    data.takeWay = infoData.takeWay;
    data.Address = infoData.address;
    data.addressCascader = infoData.addressCascader;
    data.ReserveDeliveryDate = infoData.reserveDate ? infoData.reserveDate : '';
    data.Contacts = infoData.contacts;
    data.Phone = infoData.phone;
    data.Memo = infoData.memo;
    dispatch(genAction('PLATFORM_UI_BILLING_RESERVE_SET_COMMON_DATA', data));
  }
}

/* 取物流公司数据源 */
export function getLogistics () {
  return function (dispatch, getState) {
    const config = {
      url: 'mall/bill/ref/getRefData',
      method: 'POST',
      params: {
        refCode: 'aa_deliverycorp',
        dataType: 'grid',
        page: { pageSize: 200, pageIndex: 1 },
        condition: {
          isExtend: true, simpleVOs: [
            { field: 'disabled', op: 'eq', value1: 0 },
          ]
        },
      }
    }
    proxy(config).then(json => {
      if (json.code !== 200) {
        cb.uitls.alert(json.message, 'error');
        return
      }
      const dataSource = json.data.recordList;
      dispatch(genAction('PLATFORM_UI_BILLING_RESERVE_SET_COMMON_DATA', { logistics_DataSource: dataSource }))
    })
  }
}

/* 取店员参照 */
export function getStoreMember () {
  return function (dispatch, getState) {
    const store = getState().user.toJS().storeId;
    const config = {
      url: 'membercenter/bill/ref/getRefData',
      method: 'POST',
      params: {
        refCode: 'aa_operator',
        dataType: 'grid',
        page: { pageSize: 200, pageIndex: 1 },
        condition: {
          isExtend: true, simpleVOs: [
            { field: 'operatorStore.iStoreId', op: 'eq', value1: store },
            { field: 'iStatus', op: 'eq', value1: 1 },
          ]
        },
      }
    }
    proxy(config).then(json => {
      if (json.code !== 200) {
        cb.uitls.alert(json.message, 'error');
        return
      }
      const dataSource = json.data.recordList;
      dispatch(genAction('PLATFORM_UI_BILLING_RESERVE_SET_COMMON_DATA', { storeMember_DataSource: dataSource }))
    })
  }
}

/* 客户参照 */
export function getCustomer () {
  return function (dispatch) {
    const config = {
      url: 'uorder/bill/ref/getRefData',
      method: 'POST',
      params: {
        page: { pageSize: -1, pageIndex: 1 }, refCode: 'aa_cust', dataType: 'grid', externalData: '{"excludeStop":"1","bURetailFinal":"1","useOrgFilter":"1"}'
      }
    }
    proxy(config).then(json => {
      if (json.code !== 200) {
        cb.utils.alert(json.message, 'error');
        return
      }
      const data = json.data.recordList
      dispatch(genAction('PLATFORM_UI_BILLING_RESERVE_SET_COMMON_DATA', { customer_DataSource: data }));
    })
  }
}

/* 获取客户信用额度 */
export function getCustomerInfo (id) {
  return function (dispatch, getState) {
    const orgId = getState().user.toJS().orgId
    const config = {
      url: 'uorder/bill/getCustInfo',
      method: 'POST',
      params: {
        id,
        iYxyOrgId: orgId
      }
    }
    proxy(config).then(json => {
      if (json.code !== 200) {
        cb.utils.alert(json.message, 'error')
        return
      }
      const { bCusCreCtl, creditBalance } = json.data;
      dispatch(genAction('PLATFORM_UI_BILLING_RESERVE_SET_COMMON_DATA', { bCusCreCtl, creditBalance }));
    })
  }
}

/* 设置modal显示隐藏 */
export function setVisible (visible) {
  return function (dispatch) {
    dispatch(genAction('PLATFORM_UI_BILLING_RESERVE_SET_VISIBLE', visible));
    if (visible == false) dispatch(setSearchBoxFocus(true));
  }
}

export function setCommonData (data) {
  return function (dispatch) {
    dispatch(genAction('PLATFORM_UI_BILLING_RESERVE_SET_COMMON_DATA', data));
  }
}
/* 获取当前门店信息 */
export function getStoreInfo () {
  return function (dispatch, getState) {
    const { storeId, userStores } = getState().user.toJS();
    userStores.forEach(store => {
      if (store.store == storeId) {
        dispatch(genAction('PLATFORM_UI_BILLING_RESERVE_SET_STORETYPE', store.storeType));
      }
    });
  }
}
/* 获取业务类型数据源 */
export function getBusinessType (bReserve, billingStatus, isInit, isOnline) {
  return function (dispatch, getState) {
    const storeType = getState().reserve.toJS().storeType;
    const params = {
      page:
        { pageSize: 100, pageIndex: 1 },
      refCode: 'aa_businesstype',
      condition: {
        isExtend: true, simpleVOs: [
          { field: 'saleType', op: 'eq', value1: 1 },
          { field: 'stopstatus', op: 'eq', value1: false },
          { field: 'storeType', op: 'like', value1: storeType },
          // { "field": "madeType", "op": "neq || is_null", "value1": 1 },
        ]
      },
      dataType: 'grid'
    }
    beforeGetBusinessType(params);
    if (bReserve) {
      params.condition.simpleVOs[0].value1 = 2;
    } else {
      if (billingStatus == 'AfterSaleService')
        params.condition.simpleVOs[0].value1 = 8;
    }
    if (isOnline) {
      params.condition.simpleVOs = [
        { field: 'stopstatus', op: 'eq', value1: false },
        { field: 'receipttype.code', op: 'eq', value1: 'A16' },
      ]
    }
    const config = {
      url: 'bill/ref/getRefData',
      method: 'POST',
      params: params,
    };
    proxy(config)
      .then(function (json) {
        if (json.code !== 200) {
          cb.utils.alert(json.message, 'error');
        }
        const infoData = getState().uretailHeader.toJS().infoData;
        const businessData = json.data.recordList;
        let businessType = { id: '', name: '' }; let takeWay = {}; const takeWay_DataSource = []; let bDeliveryModify = false; let bPreselllockStock = false; let MinPercentGiveMoneyPre = 100; let controlType = 1;
        if (isInit) {
          businessData.forEach(function (ele) {
            if (ele.isDefault) {
              businessType = { id: ele.id, name: ele.name };
              if (billingStatus == 'CashSale' || billingStatus == 'AfterSaleService') {
                takeWay = { id: 0, name: '即提' };
                bPreselllockStock = ele.isPreCalcBalance;
                bDeliveryModify = ele.isUpdItemBySend;
              } else {
                let isDistribCenter = ele.isDistribCenter;
                if (!isDistribCenter) isDistribCenter = '';
                const takeWayData = isDistribCenter.split(',');
                takeWayData.map((data, index) => {
                  if (data == '') return;
                  if (data == '1') takeWay_DataSource.push({ id: data, name: '本店自提' });
                  if (data == '3') takeWay_DataSource.push({ id: data, name: '本店配送' });
                  // if (data == '2' && storeType != '2' && storeType != '3') takeWay_DataSource.push({ id: data, name: '中心配送' });
                  if (data == '2' && storeType != '3') takeWay_DataSource.push({ id: data, name: '中心配送' });
                  if (index == 0) {
                    takeWay = takeWay_DataSource[0] || {};
                    bPreselllockStock = ele.isPreCalcBalance;
                    bDeliveryModify = ele.isUpdItemBySend;
                    if (data == '3') dispatch(getWareHouse());
                  }
                });
              }
              MinPercentGiveMoneyPre = ele.MinPercentGiveMoneyPre;
              controlType = ele.controlType;
            }
            // if (billingStatus == 'PresellBill') dispatch(getRegion());
          }, this);
          if (billingStatus == 'OnlineBill' && infoData.businessType && infoData.businessType.id) businessType = infoData.businessType // canclePending
          dispatch(genAction('PLATFORM_UI_BILLING_RESERVE_SET_COMMON_DATA', { bPreselllockStock, bDeliveryModify, businessType: businessType, takeWay, takeWay_DataSource, MinPercentGiveMoneyPre, controlType }));
          if (cb.rest.terminalType == 3 && bReserve) dispatch(modify());
        } else {
          businessType = getState().reserve.toJS().businessType;
          businessData.forEach(function (ele) {
            if (businessType.id == ele.id) {
              const takeWayData = ele.isDistribCenter.split(',');
              takeWayData.map((data, index) => {
                if (data == '') return;
                if (data == '1') takeWay_DataSource.push({ id: data, name: '本店自提' });
                if (data == '3') takeWay_DataSource.push({ id: data, name: '本店配送' });
                // if (data == '2' && storeType != '2' && storeType != '3') takeWay_DataSource.push({ id: data, name: '中心配送' });
                if (data == '2' && storeType != '3') takeWay_DataSource.push({ id: data, name: '中心配送' });
                if (index == 0) {
                  takeWay = takeWay_DataSource[0] || {};
                  bPreselllockStock = ele.isPreCalcBalance;
                  bDeliveryModify = ele.isUpdItemBySend;
                  if (data == '3') dispatch(getWareHouse());
                }
              });
            }
          }, this);
          dispatch(genAction('PLATFORM_UI_BILLING_RESERVE_SET_COMMON_DATA', { takeWay_DataSource }));
        }
        dispatch(genAction('PLATFORM_UI_BILLING_RESERVE_GET_BUSINESS_DATASOURCE', json.data.recordList));
      });
  }
}
/* 获取默认业务类型 */
export function getDefaultBusinessType (saleType, cacheData) {
  return async function (dispatch, getState) {
    const storeType = getState().reserve.toJS().storeType;
    const { billingStatus } = getState().uretailHeader.toJS();
    const params = {
      page:
        { pageSize: 100, pageIndex: 1 },
      refCode: 'aa_businesstype',
      condition: {
        isExtend: true, simpleVOs: [
          { field: 'saleType', op: 'eq', value1: saleType },
          { field: 'stopstatus', op: 'eq', value1: false },
          { field: 'storeType', op: 'like', value1: storeType },
          // { "field": "madeType", "op": "neq || is_null", "value1": 1 },
        ]
      },
      dataType: 'grid'
    }
    beforeGetBusinessType(params);
    if (storeType != 1 && billingStatus == 'PresellBill') {
      params.condition.simpleVOs.push(
        { field: 'isDistribCenter', op: 'in', value1: ['1', '3'] }
      );
    }
    if (saleType === '16') {
      params.condition.simpleVOs = [
        { field: 'stopstatus', op: 'eq', value1: false },
        { field: 'receipttype.code', op: 'eq', value1: 'A16' },
      ]
    }
    const config = {
      url: 'bill/ref/getRefData',
      method: 'POST',
      params: params,
    };
    const json = cacheData || await proxy(config)
    if (json.code !== 200) {
      cb.utils.alert(json.message, 'error');
    }
    const businessData = json.data.recordList;
    let businessType = { id: '', name: '' };
    const takeWay = { id: 0, name: '即提' };
    if (cb.rest.terminalType === 3) {
      dispatch(genAction('PLATFORM_UI_BILLING_RESERVE_GET_BUSINESS_DATASOURCE', businessData));
    }
    if (billingStatus == 'AfterSaleService' && businessData.length == 0) {
      dispatch(setBusinessType({ id: '', name: '' }));
    }
    businessData.forEach(function (ele) {
      if (ele.isDefault) {
        businessType = { id: ele.id, name: ele.name };
        const bPreselllockStock = ele.isPreCalcBalance;
        const bDeliveryModify = ele.isUpdItemBySend;
        const MinPercentGiveMoneyPre = ele.MinPercentGiveMoneyPre;
        const controlType = ele.controlType;
        if (billingStatus != 'AfterSaleService')
          dispatch(setDefaultBusinessType(businessType, takeWay, bPreselllockStock, bDeliveryModify, MinPercentGiveMoneyPre, controlType));
        else
          dispatch(setBusinessType(businessType));
        // dispatch(genAction('PLATFORM_UI_BILLING_RESERVE_SET_COMMON_DATA', { bPreselllockStock, bDeliveryModify, businessType, takeWay, MinPercentGiveMoneyPre }));
      }
    }, this);
  }
}

export const touch_getDefaultBusinessTypeConfig = (user, dispatch) => {
  const { storeId, userStores } = user;
  const currentStore = userStores.find(store => {
    return store.store == storeId
  })
  currentStore && dispatch(genAction('PLATFORM_UI_BILLING_RESERVE_SET_STORETYPE', currentStore.storeType));
  const params = {
    page:
      { pageSize: 100, pageIndex: 1 },
    refCode: 'aa_businesstype',
    condition: {
      isExtend: true, simpleVOs: [
        { field: 'saleType', op: 'eq', value1: 1 },
        { field: 'stopstatus', op: 'eq', value1: false },
        { field: 'storeType', op: 'like', value1: currentStore.storeType }
      ]
    },
    dataType: 'grid'
  }
  const config = {
    url: 'bill/ref/getRefData',
    method: 'POST',
    params: params,
  };
  return config
}

export const touch_getDefaultBusinessTypeDispatch = (json, dispatch) => {
  if (json.code !== 200) {
    cb.utils.alert(json.message, 'error');
  }
  const businessData = json.data.recordList;
  let businessType = { id: '', name: '' };
  const takeWay = { id: 0, name: '即提' };
  // if (cb.rest.terminalType === 3) {
  //   dispatch(genAction('PLATFORM_UI_BILLING_RESERVE_GET_BUSINESS_DATASOURCE', businessData));
  // }
  // if (billingStatus == 'AfterSaleService' && businessData.length == 0) {
  //   dispatch(setBusinessType({ id: "", name: "" }));
  // }
  businessData.forEach(function (ele) {
    if (ele.isDefault) {
      businessType = { id: ele.id, name: ele.name };
      const bPreselllockStock = ele.isPreCalcBalance;
      const bDeliveryModify = ele.isUpdItemBySend;
      const MinPercentGiveMoneyPre = ele.MinPercentGiveMoneyPre;
      const controlType = ele.controlType;
      // if (billingStatus != 'AfterSaleService')
      dispatch(setDefaultBusinessType(businessType, takeWay, bPreselllockStock, bDeliveryModify, MinPercentGiveMoneyPre, controlType));
      // else
      //   dispatch(setBusinessType(businessType));
    }
  }, this);
}

/* 获取仓库数据源 */
export function getWareHouse () {
  return function (dispatch, getState) {
    const store = getState().user.toJS().storeId;
    const config = {
      url: 'AdjacentWarehouse/query',
      method: 'GET',
      params: {
        storeid: store
      }
    };
    proxy(config)
      .then(function (json) {
        if (json.code !== 200) {
          cb.utils.alert(json.message, 'error');
        }
        const data = json.data;
        dispatch(genAction('PLATFORM_UI_BILLING_RESERVE_GET_WAREHOUSE_DATASOURCE', data));
      });
  }
}

/* 获取地区数据源 */
export function getRegion (cacheData) {
  return async function (dispatch) {
    // if(cb.rest.interMode === 'touch') return
    const config = {
      url: 'region/getAllregion',
      method: 'POST',
      params: {}
    };
    const json = cacheData || await proxy(config)
    if (json.code !== 200) {
      cb.utils.alert(json.message, 'error');
    }
    getKeyMap(json.data[0]);
    dispatch(genAction('PLATFORM_UI_BILLING_RESERVE_GET_REGION_DATASOURCE', json.data));
    dispatch(genAction('PLATFORM_UI_BILLING_MEMBER_SET_REGION_DATASOURCE', json.data));
  }
}

export const mapAndSaveRegionData = (json) => {
  return function (dispatch) {
    if (json.code !== 200) {
      cb.utils.alert(json.message, 'error');
    }
    getKeyMap(json.data[0]);
    dispatch(genAction('PLATFORM_UI_BILLING_RESERVE_GET_REGION_DATASOURCE', json.data));
    dispatch(genAction('PLATFORM_UI_BILLING_MEMBER_SET_REGION_DATASOURCE', json.data));
  }
}

const getKeyMap = (node) => {
  if (node.id == null) return;
  keyMap[node.id] = node;
  if (!node.children || !node.children.length) return;
  node.children.forEach(function (item) {
    getKeyMap(item);
  }, this);
};
const getRegionIdByParent = (keys, parent) => {
  const id = keyMap[parent].id;
  keys.push(id);
  if (keyMap[parent].parent) {
    getRegionIdByParent(keys, keyMap[parent].parent)
  }
  return keys;
}
export function getAllregion (regionCode) {
  if (regionCode == '' || !regionCode) {
    return { id: '', name: '' };
  }
  let ids = [];
  ids.push(keyMap[regionCode].id);
  ids = getRegionIdByParent(ids, keyMap[regionCode].parent);
  return { id: ids, name: keyMap[regionCode].mergername };
}
/* add by jinzh1 更改表头/存盘时 校验表头信息（自定义项） */
export function checkVoucherHead (getState, dispatch) {
  const defineMeta = getState().reserve.get('defineMeta');
  const viewModel = getState().reserve.get('viewModel');
  if (defineMeta && defineMeta.containers && defineMeta.containers[0] && viewModel) {
    const controls = defineMeta.containers[0].controls;
    let validate = true; let errMsg = '';
    controls && controls.map(control => {
      const model = viewModel.get(control.cItemName);
      if (!model.validate()) {
        validate = false;
        errMsg += control.cShowCaption + '必输！';
      }
    });
    if (!validate)
      cb.utils.alert(errMsg, 'error');
    return validate;
  }
  return true;
}
export function modify () {
  return function (dispatch, getState) {
    const data = getState().reserve.toJS();
    let { billingStatus, infoData } = getState().uretailHeader.toJS();
    const productInfo = {};
    productInfo.businessType = data.businessType;
    productInfo.warehouse = data.wareHouse;
    productInfo.reserveDate = data.ReserveDeliveryDate;
    productInfo.contacts = data.Contacts;
    productInfo.phone = data.Phone;
    productInfo.addressCascader = data.addressCascader;
    productInfo.address = data.Address;
    productInfo.iCustomerid = data.iCustomerid;
    productInfo.iCustomerName = data.iCustomerName;
    productInfo.bCusCreCtl = data.bCusCreCtl;
    productInfo.creditBalance = data.creditBalance;

    // let regionCode = ''
    const regionId = data.addressCascader.id;
    if (regionId.length > 0) {
      productInfo.regionCode = regionId[regionId.length - 1];
    }
    // productInfo.address = data.AddressCascaderName + ' ' + data.Address;

    productInfo.memo = data.Memo;
    productInfo.takeWay = data.takeWay;
    if (data.bReserve) {
      billingStatus = status.PresellBill;
      const params = {};
      productInfo.bPreselllockStock = data.bPreselllockStock;
      productInfo.MinPercentGiveMoneyPre = data.MinPercentGiveMoneyPre;
      productInfo.controlType = data.controlType;
      productInfo.bDeliveryModify = data.bDeliveryModify;
      params.bPreselllockStock = data.bPreselllockStock;
      params.MinPercentGiveMoneyPre = data.MinPercentGiveMoneyPre;
      params.controlType = data.controlType;
      params.bDeliveryModify = data.bDeliveryModify;
      dispatch(ModifyReserveParams(params));
    }
    if (billingStatus == 'OnlineBill' || billingStatus == 'Shipment') {
      productInfo.cLogisticid = data.cLogisticid;
      productInfo.cLogisticid_corp_code = data.cLogisticid_corp_code;
      productInfo.cLogisticsNo = data.cLogisticsNo;
      productInfo.cCourierid_name = data.cCourierid_name;
      productInfo.cCourierPhone = data.cCourierPhone;
      productInfo.logistics_idCode = data.logistics_idCode
      productInfo.cCourier_idPhoneName = data.cCourier_idPhoneName
      productInfo.cCourierid = data.cCourierid; /* 主要给交货用 */
      productInfo.Contacts = infoData.Contacts;
      productInfo.Phone = infoData.Phone;
      productInfo.Address = infoData.Address;
      productInfo.Memo = infoData.Memo;
      if (billingStatus == 'OnlineBill')
        productInfo.bDeliveryModify = data.bDeliveryModify
    }

    /* add by jinzh1  中心配送时  更新表头交货仓库到表体 */
    if (data.takeWay.id == 2 && data.wareHouse.id) {
      const products = getGlobalProducts();
      if (products && products.length > 0 && productInfo.warehouse.id) {
        cb.utils.confirm('更改交货仓库将同步更新已添加商品，是否确认更新？', () => {
          products.forEach(product => {
            product.iWarehouseid = productInfo.warehouse.id;
            product.iWarehouseid_name = productInfo.warehouse.name;
            product.iWarehouseid_erpCode = productInfo.warehouse.erpCode;
          });
          dispatch(genAction('PLATFORM_UI_BILLING_DISCOUNT_UPDATE_PRODUCTS', products));
        }, () => { });
      }
      modifyCenterWareHouseInfo(productInfo.warehouse);
    } else {
      productInfo.warehouse = {};
      if (infoData.takeWay.id == 2) {
        const products = getGlobalProducts();
        const wareHouseData = getDefaultWareHouse();
        products.forEach(product => {
          product.iWarehouseid = wareHouseData.id;
          product.iWarehouseid_name = wareHouseData.name;
          product.iWarehouseid_erpCode = wareHouseData.erpCode;
        });
        if (products.length > 0)
          dispatch(genAction('PLATFORM_UI_BILLING_DISCOUNT_UPDATE_PRODUCTS', products));
      }
      modifyCenterWareHouseInfo();
    }

    dispatch(ModifyReserve(productInfo));
    dispatch(ModifyBillStatus(billingStatus));
  }
}
/* 交货/退订/带回表头信息 */
const transformHeader = (data, $$state) => {
  const warehouse = {
    id: data.iDeliveryWarehouseid ? data.iDeliveryWarehouseid : '',
    name: data.iDeliveryWarehouseName ? data.iDeliveryWarehouseName : ''
  };
  const addressCascader = getAllregion(data.regionCode);

  return $$state.merge({ warehouse, addressCascader });
}

/* 校验是否能赊销 */
export async function checkIsOwned (globalState, dispatch) {
  const infoData = globalState.uretailHeader.toJS().infoData;
  const billingStatus = globalState.uretailHeader.get('billingStatus')
  const { iOwesState, iCustomerid } = infoData;
  const OwesCustomerenter = getOptions().OwesCustomerenter ? getOptions().OwesCustomerenter.value : false;
  if (iOwesState && OwesCustomerenter && !iCustomerid && billingStatus !== 'FormerBackBill') {
    const asyncFunc = () => {
      return new Promise((resolve) => {
        cb.utils.confirm('未录入客户，只能全额收款，是否继续', function () {
          infoData.iOwesState = 0;
          dispatch(genAction('PLATFORM_UI_BILLING_HEADER_SET_COMMONDATA', { infoData }))
          resolve(true)
        }, function () {
          dispatch(showHeaderInfo())
          resolve(false)
        })
      })
    }
    const final = await asyncFunc();
    return final
  }
  if (iOwesState && OwesCustomerenter && !iCustomerid && billingStatus === 'FormerBackBill') {
    infoData.iOwesState = 0;
    dispatch(genAction('PLATFORM_UI_BILLING_HEADER_SET_COMMONDATA', { infoData }))
    return true
  }
  return true
}
export const allEmloyeeIsSame = async (globalState, dispatch) => {
  const products = globalState.product.toJS().products;
  const infoData = globalState.uretailHeader.toJS().infoData
  const { iOwesState } = infoData;
  if (iOwesState !== 1) return true
  const firstiEmployeeid = products[0].iEmployeeid;
  const index = products.findIndex(ele => {
    return ele.iEmployeeid !== firstiEmployeeid
  })
  if (index !== -1) {
    const func = () => {
      return new Promise((resolve) => {
        cb.utils.confirm('存在多个营业员，只能全额收款，是否继续', function () {
          infoData.iOwesState = 0;
          dispatch(genAction('PLATFORM_UI_BILLING_HEADER_SET_COMMONDATA', { infoData }))
          resolve(true)
        }, function () {
          resolve(false)
        })
      })
    }
    const final = await func();
    return final
  }
  else
    return true
}

/** *设置预定信息是否修改过--mobile */
export function setReserveIsEdit (isEdited) {
  return function (dispatch) {
    dispatch(genAction('PLATFORM_UI_BILLING_IS_EDITING', isEdited));
  }
}
/* 仓库 */
export function beforeWareHouseRefer () {
  return function (dispatch, getState) {
    const { WareHouse_DataSource, wareHouse } = getState().reserve.toJS();
    const referData = {
      dataSource: WareHouse_DataSource,
      title: '选择仓库',
      reduxName: 'RESERVE_WAREHOUSE',
      returnType: null,
      defineName: null,
      showType: 'id',
      checkedRow: {
        compareItem: 'id',
        row: [wareHouse.id],
      },
      showItem: {
        cItemName: 'name',
        childrenItem: []
      }
    };
    dispatch(genAction('BILLING_REFER_INIT_DATA', referData));
  }
}
/* 客户 */
export function beforeCustomerRefer () {
  return function (dispatch, getState) {
    const { customer_DataSource, iCustomerid } = getState().reserve.toJS();
    const referData = {
      dataSource: customer_DataSource,
      title: '选择客户',
      reduxName: 'RESERVE_CUSTOMER',
      returnType: null,
      defineName: null,
      showType: 'id',
      showSearch: true,
      searchSource: 'name',
      placeholder: '客户名称',
      checkedRow: {
        compareItem: 'id',
        row: [iCustomerid],
      },
      showItem: {
        cItemName: 'name',
        childrenItem: []
      }
    };
    dispatch(genAction('BILLING_REFER_INIT_DATA', referData));
  }
}
/* 预定详情 */
export function reserveDetail (params, callback) {
  return async (dispatch, getState) => {
    const config = {
      url: '/bill/detail?terminalType=1&billnum=rm_retailvouch&id=' + params.id,
      method: 'POST',
      showLoading: false,
      options: {
        token: true
      }
    }
    const json = await proxy(config);
    if (json.code === 200) {
      callback(true, json.data);
    } else {
      callback(false);
    }
  }
}
