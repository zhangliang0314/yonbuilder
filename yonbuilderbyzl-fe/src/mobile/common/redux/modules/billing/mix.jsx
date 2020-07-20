import Immutable from 'immutable';
import moment from 'moment';
import Cookies from 'cookies-js';
import { genAction, proxy, getRoundValue, getMultiplication } from '@mdf/cube/lib/helpers/util';
import { setReceiptHang } from './menu';
import Status from './billingStatus';
import _ from 'lodash';
import uuid from 'uuid';
import { getBillingHeader, modifyPreferentialHeader, ModifyBillStatus } from './uretailHeader';
import { showHeaderInfo, getDefaultBusinessType, checkIsOwned, allEmloyeeIsSame, checkVoucherHead } from './reserve';
import { timeRange } from '@mdf/cube/lib/helpers/formatDate';
import {
  handleBackBill,
  handlePresellBack,
  handleServerData,
  handleAfterSaleServerData,
  handleOnlineBill,
  transferProducts,
  transferProducts2Flatten,
  loadColumns,
  loadDetailColumns,
  setFocusedRow,
  getGlobalProducts,
  handleFurnitureBill,
  modifyQuotePrice,
  calcMoney,
  getExchangeBillMapping,
} from './product';
import { loadEditColumns, checkVoucherDetail, showEdit } from './editRow';
import { queryMemberById, setMemberBoxFocus, queryMember } from './member';
import { print } from './receiptPrinter';
import { setSearchBoxFocus } from './goodsRefer';
import { deletePendingOrder } from './cancelPending';
import { showModal } from './actions';
import { getAuthData, getBillingViewModel } from './config';
import { showOperator } from './operator';
import { getFixedNumber, reviewHandleSave, getDelZeroResult } from './paymode';
import { getFromMapOrObject } from './electronicBalance';
import { cancelDiscount } from './discount';
import { checkDiscountOperator } from './checkMsg';
import { cancelExecute, checkButtonAuth, handleCancel } from './actions';
import { initBadge } from './eCommerce';
import { canOpen as canPromotionOpen, getPromotionData } from './ExecutPromotion'
import { localProxy } from './offLine'
import { IDB_deleteOneData, IDB_saveData } from '@mdf/metaui-mobile/lib/redux/indexedDB'
import * as funcCollect from './funcCollect'
import { ExeAfterCancelPending } from './ExecutPromotion'
import { showEmployeeVtCallBack } from './salesClerk'
import { promiseExecute1, execute1, warpPromiseExecute } from '../../../helpers/extend'

export const RetailVouchBillNo = 'rm_retailvouch';
export const GatheringVouchBillNo = 'rm_gatheringvouch';
export const MallOrderBillNo = 'rm_mallorderref';
export const mallOrderBackBillNo = 'rm_mallsalereturnref';

let options = null;
let functionOptioins = null;
let metaCache = null;
const initialState = {
  billNo: 'rm_retailreceipt',
  statusField: '_status',
  meta: null,
  data: null
};

const DataStates = {
  Insert: 'Insert',
  Update: 'Update',
  Delete: 'Delete',
  Unchanged: 'Unchanged'
};

const PreferentialExecuteMap = {
  Real: { order: 0 },
  Member: { order: 0, text: '会员优惠', forbiddenTip: '不能执行会员优惠' },
  Quote: { order: 0, text: '改零售价', forbiddenTip: '不能改零售价' },
  Promotion: { order: 1, text: '促销优惠', forbiddenTip: '不能执行促销活动' },
  Scene: { order: 2, text: '现场折扣', forbiddenTip: '不能执行现场折扣' },
  Point: { order: 3, text: '积分抵扣', forbiddenTip: '不能执行积分抵扣' },
  Coupon: { order: 4, text: '优惠券', forbiddenTip: '不允许使用优惠券' },
  Zero: { order: 5, text: '抹零', forbiddenTip: '不能抹零' },
  EditRow: { order: 6, text: '改行', forbiddenTip: '不能改行' },
  Quantity: { order: 7, text: '改数量', forbiddenTip: '不能改数量' }
};
let iWarehouseid = null; let iWarehouseid_name = null; let iWarehouse_erpCode = null; let warehouse_isGoodsPosition = null;
let centerWareHouse = null; let centerWareHouse_name = null; let centerWareHouse_erpCode = null;
/* 门店默认仓库 */
const promotionMutexMap = {
  iMemberDiscountEnable: false, /* 与会员折扣互斥 */
  iIntegral: false, /* 与积分抵扣互斥 */
  iCoupon: false, /* 与优惠券互斥 */
  isAllCoupon: false, /* 与全部优惠券互斥 */
  linecouponitem: [], /* 互斥的优惠券列表 */
  iSpotDiscountEnable: false, /* 与现场折扣互斥 */
  iOrderDiscountEnable: false, /* 与整单折扣互斥 */
};
let sotreBill2ReferMap = {};
const retailVouchDetailsFormat = {};
const PreferentialExecuteBackup = [];
let backBillInfo = null;
let presellBillInfo = null;
let mallorderInfo = null;
let mallorder = false;
let checkStockBackData = null;

let firstOpenPromotion = true; // 第一次打开促销面板
let cacheUploading = false // 缓存数据正在上传中

const $$initialState = Immutable.fromJS({})

// reducer
export default ($$state = $$initialState, action) => {
  switch (action.type) {
    case 'PLATFORM_UI_BILLING_INIT':
      initialState.meta = action.payload.meta;
      initialState.data = action.payload.data;
      console.log('action.payload.data >>>>>>>', action.payload.data);
      return $$state;
    case 'PLATFORM_UI_BILLING_EXECUTE_PREFERENTIAL_UPDATE_PRODUCTS': {
      const { key, backup } = action.payload;
      const preferential = PreferentialExecuteBackup.find(item => {
        return item.key === key;
      });
      if (!preferential) {
        PreferentialExecuteBackup.push({ key, value: backup });
      } else {
        preferential.value = backup;
      }
      return $$state;
    }
    case 'PLATFORM_UI_BILLING_CANCEL_PREFERENTIAL_UPDATE_PRODUCTS':
      PreferentialExecuteBackup.splice(PreferentialExecuteBackup.length - 1, 1);
      return $$state;
    case 'PLATFORM_UI_BILLING_CLEAR':
      PreferentialExecuteBackup.length = 0;
      backBillInfo = null;
      presellBillInfo = null;
      mallorderInfo = null;
      mallorder = false;
      firstOpenPromotion = true;
      centerWareHouse = null;
      centerWareHouse_name = null;
      centerWareHouse_erpCode = null;
      checkStockBackData = null;
      return $$state;
    default:
      return $$state;
  }
}

const getRetailVouchData = (params, isSave) => {
  const { header, money, products, coupons } = params;
  const retailVouchMeta = initialState[`${RetailVouchBillNo}Meta`];
  const retailVouchEmpty = initialState[`${RetailVouchBillNo}Empty`];
  delete header.cGUID
  header.creator = retailVouchEmpty.creator // 离线单据展现
  const storeInfo = {}
  transferAction(sotreBill2ReferMap, cb.rest.AppContext.storeOption, storeInfo)
  coverKey(retailVouchEmpty, header)
  const retailVouchData = Object.assign({}, header, storeInfo);
  for (const attr in money) {
    const { field, value } = money[attr];
    if (field == null) continue;
    const decimal = attr === 'TotalQuantity' ? options.numPoint_Quantity : options.amountofdecimal;
    if (isSave)
      retailVouchData[field] = (parseFloat(value).toFixed(decimal.value));
    else
      retailVouchData[field] = parseFloat(parseFloat(value).toFixed(decimal.value));
  }
  const productsChildrenField = retailVouchMeta.childrenField0;
  const billProducts = [];
  retailVouchData[productsChildrenField] = billProducts;
  retailVouchData[initialState.statusField] = DataStates.Insert;
  const productsMeta = retailVouchMeta[productsChildrenField];
  products.forEach((item, index) => {
    const formatObj = {};
    // for (let attr in money) {
    //   const { childField } = money[attr];
    //   if (childField == null || !item[childField]) continue;
    //   const decimal = attr === 'TotalQuantity' ? options.numPoint_Quantity : options.amountofdecimal;
    //   formatObj[childField] = parseFloat(item[childField].toFixed(decimal.value));
    // }
    for (const attr in productsMeta) {
      if (!item[attr]) continue;
      const productMetaItem = productsMeta[attr];
      const lowerCtrlType = productMetaItem.cControlType && productMetaItem.cControlType.trim().toLocaleLowerCase();
      let decimal;
      if (lowerCtrlType === 'money') {
        decimal = options.amountofdecimal;
      } else if (lowerCtrlType === 'price') {
        decimal = options.monovalentdecimal;
      } else if (attr === 'fQuantity') {
        decimal = options.numPoint_Quantity;
      }
      if (!decimal) continue;
      try {
        if (isSave)
          formatObj[attr] = (parseFloat(item[attr]).toFixed(decimal.value));
        else
          formatObj[attr] = parseFloat(parseFloat(item[attr]).toFixed(decimal.value));
      } catch (e) {

      }
    }
    const product = isSave ? Object.assign({}, item, formatObj, { iOrder: index }) : Object.assign({}, item, { iOrder: index });
    if (!product.iWarehouseid) {
      product.iWarehouseid = iWarehouseid;
      product.iWarehouseid_name = iWarehouseid_name;
    }
    product[initialState.statusField] = DataStates.Insert;
    billProducts.push(product);
  });
  if (coupons)
    retailVouchData[retailVouchMeta.childrenField1] = coupons;
  afterGetRetailVouchData(retailVouchData)
  return retailVouchData;
};

const afterGetRetailVouchData = (retailVouchData) => {
  const billingViewModel = getBillingViewModel()
  if (billingViewModel) {
    billingViewModel.execute('afterGetRetailVouchData', { retailVouchData, })
  }
}

const coverKey = (baseInfo, billInfo) => {
  for (const attr in baseInfo) {
    if (!billInfo[attr] && billInfo[attr] !== 0)
      billInfo[attr] = baseInfo[attr]
  }
}

const getGatheringVouchData = (params) => {
  // 实收
  let receive = 0
  const { header, money, paymodes } = params;
  // if (_.isEmpty(paymodes)) return {}
  const gatheringVouchMeta = initialState[`${GatheringVouchBillNo}Meta`];
  const gatheringVouchEmpty = initialState[`${GatheringVouchBillNo}Empty`];
  coverKey(gatheringVouchEmpty, header)
  const gatheringVouchData = Object.assign({}, header);
  const { field, value } = money.Gathering;
  gatheringVouchData[field] = value;
  for (const attr in money) {
    const field1 = money[attr].field; const value1 = money[attr].value;
    if (field1 == null) continue;
    const decimal = attr === 'TotalQuantity' ? options.numPoint_Quantity : options.amountofdecimal;
    gatheringVouchData[field1] = (parseFloat(value1).toFixed(decimal.value));
  }
  const finalPaymodes = []

  gatheringVouchData[initialState.statusField] = DataStates.Insert;
  calculateChange(value, paymodes)
  if (_.isEmpty(paymodes)) return gatheringVouchData

  //

  // 电商退单时组装数据: 支付方式为现金
  if (header.billingStatus === 'OnlineBackBill') {
    gatheringVouchData[gatheringVouchMeta.childrenField0] = [{
      [initialState.statusField]: DataStates.Insert,
      iPaymentid: '123', // 为了后台校验通过，写死id  ^-.-^
      iPaytype: 1,
      fMoney: value,
    }]
  } else if (cb.rest.terminalType === 3 && header.billingStatus === 'PresellBack') { // 处理退订，退货相关业务
    gatheringVouchData[gatheringVouchMeta.childrenField0] = paymodes
    gatheringVouchData.fChangeMoney = 0;
  } else {
    let change = 0;
    // 如果整单金额为0， 重写数据为只使用最后一条支付方式
    // 或者预订状态可最低支付为0并且实际支付总额为0，  重写数据为只使用最后一条支付方式

    if (Number(value) === 0 ||
      (header.billingStatus === 'PresellBill' && header.MinPercentGiveMoneyPre == 0 && _.reduce(paymodes, (a, b) => {
        return Number(a) + Number(b.value || 0)
      }, 0) == 0)
    ) {
      let lastPay = _.last(_.sortBy(_.filter(paymodes, 'show'), p => {
        // 原单支付方式放在前面
        // 其他按照页面支付顺序排列
        return typeof p.order !== 'undefined' ? p.order : -1
      }))
      if (cb.rest.terminalType == 3) {
        if (paymodes.length > 1) {
          cb.utils.alert('暂不支持多种支付方式退订~', 'error');
          return
        }
        if (header.billingStatus == 'PresellBack') {
          lastPay = paymodes[0];
        }
      }
      finalPaymodes.push({
        [initialState.statusField]: DataStates.Insert,
        iPaymentid: lastPay.paymethodId,
        iPaytype: lastPay.paymentType,
        fMoney: 0,
        iPaymentid_name: lastPay.name,
        Paymentname: lastPay.name
      })
    } else {
      _.forEach(paymodes, (item) => {
        // 如果整单金额不为0， 过滤掉为0的支付方式
        if (!item.show || Number(item.value) === 0) return;

        const paymodeBaseInfo = _.extend({
          [initialState.statusField]: DataStates.Insert,
          iPaymentid: item.paymethodId,
          iPaytype: item.paymentType,
          fMoney: item.value,
          iPaymentid_name: item.name,
          Paymentname: item.name
        }, _.pick(item,
          ['authCode', // 支付宝, 微信, 储值卡
            //  'pwd', // 储值卡
            'backUrl', // 储值卡回调参数
            'gatheringvouchPaydetail', // 畅捷支付
            'order'
          ]
        ))

        if (item.originalSamePaymodes) {
          /* 过滤出真实可执行退款的支付方式 */
          const copayOriginalPaymodes = _.filter(item.originalSamePaymodes, pay => {
            const { gatheringvouchPaydetail } = pay;
            return pay.fMoney > 0 && pay.fMoney - (gatheringvouchPaydetail && gatheringvouchPaydetail[0] && gatheringvouchPaydetail[0].fCoMoney || 0) > 0
          })
          let isMultip = false;
          _.forEach(_.groupBy(copayOriginalPaymodes, e => e.iPaymentid), (value, key) => {
            if (value.length > 1) isMultip = true
          })
          if (isMultip) { // 分摊退
            let _backValue = Math.abs(item.value);
            for (let i = 0, len = copayOriginalPaymodes.length; i < len; i++) {
              const op = copayOriginalPaymodes[i];
              const { fMoney, gatheringvouchPaydetail, ...others } = op;
              const counteractMoney = Math.abs(op.fMoney - (gatheringvouchPaydetail && gatheringvouchPaydetail[0] && gatheringvouchPaydetail[0].fCoMoney || 0))
              if ( counteractMoney >= _backValue) {
                finalPaymodes.push({
                  [initialState.statusField]: DataStates.Insert,
                  fMoney: 0 - Math.abs(_backValue), // 赵哲 支付方式实退可以不等于原单
                  ...others,
                  Paymentname: others.iPaymentid_name,
                  gatheringvouchPaydetail: (op.gatheringvouchPaydetail && op.gatheringvouchPaydetail.length == 1 && (op.gatheringvouchPaydetail[0].fAmount = Math.abs(_backValue)) && op.gatheringvouchPaydetail) || []
                })
                receive += Number(Math.abs(_backValue))
                break
              } else {
                _backValue = getFixedNumber(Math.abs(item.value) - counteractMoney)
                finalPaymodes.push({
                  [initialState.statusField]: DataStates.Insert,
                  fMoney: 0 - Math.abs(fMoney), // 赵哲 支付方式实退可以不等于原单
                  ...others,
                  Paymentname: others.iPaymentid_name,
                  gatheringvouchPaydetail: (op.gatheringvouchPaydetail && op.gatheringvouchPaydetail.length == 1 && op.gatheringvouchPaydetail) || []
                })
                receive += Number(Math.abs(fMoney))
              }
            }
          } else {
            // 存在原单支付信息时，拆出除了现金的所有原始支付方式
            _.forEach(copayOriginalPaymodes, op => {
              const { fMoney, ...others } = op
              finalPaymodes.push({
                [initialState.statusField]: DataStates.Insert,
                fMoney: 0 - Math.abs(item.value), // 赵哲 支付方式实退可以不等于原单
                ...others,
                Paymentname: others.iPaymentid_name,
                gatheringvouchPaydetail: (op.gatheringvouchPaydetail && op.gatheringvouchPaydetail.length == 1 && (op.gatheringvouchPaydetail[0].fAmount = Math.abs(item.value)) && op.gatheringvouchPaydetail) || []
              })

              receive += Number(Math.abs(item.value))
            })
          }
        } else {
          finalPaymodes.push(paymodeBaseInfo)
          receive += paymodeBaseInfo.fMoney
        }

        // 如果有现金支付 增加一条找零数据
        if (item.change && parseFloat(item.change) > 0) {
          change += item.change;
          finalPaymodes.push(_.extend({}, paymodeBaseInfo, {
            fMoney: 0 - item.change,
            bIsChange: true,
            Paymentname: '找零'
          }));
        }
      })
    }

    // 处理排序
    const sortedPaymodes = _.map(_.sortBy(finalPaymodes, p => {
      // 找零放在最后
      if (p.bIsChange) return Infinity
      // 原单支付方式放在前面
      // 其他按照页面支付顺序排列
      return typeof p.order !== 'undefined' ? p.order : -1
    }), (item, i) => {
      item.iOrder = i
      return item
    })

    gatheringVouchData[gatheringVouchMeta.childrenField0] = sortedPaymodes
    gatheringVouchData.fChangeMoney = change;

    // 赊销标识

    gatheringVouchData.iOwesState = 0

    // 预订单, 退订单不存在赊销标识
    if (_.get(header, 'infoData.iOwesState') == 1 && header.billingStatus !== 'PresellBill' || header.billingStatus !== 'PresellBack') {
      gatheringVouchData.iOwesState = Math.abs(receive) < Math.abs(value) ? 1 : 0
    }
  }
  afterGetGatheringVouchData(gatheringVouchData)

  return gatheringVouchData;
};

const calculateChange = (realTotal, paymodes) => {
  // 应收金额为负的时候不记录找零
  if (realTotal < 0)
    return

  // 获取可找零金额
  let maxzerolim = _.get(options, 'maxzerolim.value')
  maxzerolim = getFixedNumber(maxzerolim)

  // 计算当前找零金额
  let currentChange = 0;
  _.forEach(paymodes, paymode => {
    currentChange = currentChange + Number(paymode.value || 0)
  })
  currentChange = getFixedNumber(currentChange - realTotal);

  // 抹零限额开启时， 限制抹零金额
  if (maxzerolim != 0 && currentChange > maxzerolim) {
    cb.utils.alert({ title: '最大找零金额为：' + maxzerolim })
    // maps.updateIn([action.payload.index, 'value'], v => (v - getFixedNumber(currentChange - maxzerolim)))
    // currentChange = maxzerolim
  }

  // 有现金(paymentType为1)支付时记录找零
  const cashPayKey = _.findKey(paymodes, paymode => paymode.paymentType == 1 && paymode.show && paymode.value > 0)
  if (cashPayKey) {
    const cashPay = paymodes[cashPayKey]
    if (cashPay.show)
      cashPay.change = currentChange
    else
      cashPay.change = 0
  }
}

let isSaving = false;

export function save (callback, errorCallback) {
  return async function (dispatch, getState) {
    if (isSaving) return;
    isSaving = true;
    const params = buildParams(getState());
    const data = {};
    data[RetailVouchBillNo] = getRetailVouchData(params, true);
    data[GatheringVouchBillNo] = getGatheringVouchData(params);
    const voucherCode = buildVouchCode(params.header.cStoreCode);
    const billingStatus = data[RetailVouchBillNo].billingStatus;
    if (beforeBillCodeLogic(data)) {
      if (cb.rest.interMode === 'touch' && voucherCode.posCode && billingStatus !== 'OnlineBill' && billingStatus !== 'OnlineBackBill') {
        data[RetailVouchBillNo].code = 'LS' + voucherCode.code;
        data[GatheringVouchBillNo].code = 'SK' + voucherCode.code;
      } else {
        // 浏览器模式下后端add服务返回来的code先去掉，后端保存的时候重新生成
        delete data[RetailVouchBillNo].code;
        delete data[GatheringVouchBillNo].code;
      }
    }
    const retailVouchMeta = initialState[`${RetailVouchBillNo}Meta`];
    const gatheringVouchMeta = initialState[`${GatheringVouchBillNo}Meta`];

    // todo 赊销
    data[RetailVouchBillNo].fChangeMoney = data[GatheringVouchBillNo].fChangeMoney;
    data[GatheringVouchBillNo].memo = params.gatheringMemo

    data[RetailVouchBillNo][retailVouchMeta.childrenField2] = data[GatheringVouchBillNo][gatheringVouchMeta.childrenField0];
    if (backBillInfo)
      data.backinfo = backBillInfo;
    if (presellBillInfo)
      data.presellinfo = presellBillInfo;
    if (mallorderInfo)
      data.mallorderInfo = mallorderInfo
    if (mallorder === true)
      data.mallorder = true;
    // let paymodes = getState().paymode.get('paymodes');
    // Immutable.Iterable.isIterable(paymodes) ? (paymodes = paymodes.toJS()) : '';
    // if (_.isEmpty(paymodes)) data[GatheringVouchBillNo] = {}
    const isTouch = cb.rest.interMode === 'touch';
    const networkConnect = getState().offLine.get('lineConnection');
    const config = {
      url: 'bill/save',
      method: 'POST',
      params: { billnum: initialState.billNo, data: JSON.stringify(data) },
      options: { async: isTouch, networkConnect, timeout: 60000, mask: false },
    }
    const proxy = cb.rest.DynamicProxy.create({
      saveBill: {
        url: 'bill/save',
        method: 'POST',
        options: { async: isTouch }
      }
    });
    const inputParams = { billnum: initialState.billNo, data: JSON.stringify(data) }
    const extendData = { getState, dispatch, getOptions, isSaving }
    if (isTouch) {
      let resultObj = {}
      if (paymodeDecideSave(getState(), billingStatus))
        config.options.networkConnect = false
      else
        config.options.networkConnect = true
      extendData.config = config;
      if (!(await beforeSaveService(extendData))) {
        // isSaving = extendData.isSaving
        isSaving = false
        errorCallback(extendData.errorMsg)
        return
      }
      localProxy(config).then(json => {
        if (json.code !== 200)
          resultObj = { error: { message: json.message } }
        else
          resultObj = { result: json.data }
        dispatch(_save(resultObj, callback, errorCallback, params.header.bHang, isTouch, voucherCode));
      })
    } else {
      extendData.config = { params: inputParams };
      if (!(await beforeSaveService(extendData))) {
        // isSaving = extendData.isSaving
        isSaving = false
        errorCallback(extendData.errorMsg)
        return
      }
      dispatch(_save(proxy.saveBill(inputParams), callback, errorCallback, params.header.bHang, isTouch));
    }
  }
}

/* 根据支付方式来决定是否走离线 */
const paymodeDecideSave = (allState, billingStatus) => {
  if (billingStatus === 'OnlineBill' || billingStatus === 'OnlineBackBill') return false
  let paymodes = allState.paymode.get('paymodes');
  if (Immutable.Map.isMap(paymodes)) paymodes = paymodes.toJS();
  const billingViewModel = getBillingViewModel()
  let haveScan = false
  for (const i in paymodes) {
    const value = paymodes[i]
    if (value.paymentType == 3 || value.paymentType == 4 || value.paymentType == 5 || value.paymentType == 10 || value.paymentType == 6 || value.paymentType == 7 || value.paymentType == 8) {
      if (value.show && value.value) {
        haveScan = true;
        break
      }
    }
  }
  if (!haveScan) { // 现金等方式有序列号商品走在线服务，校验序列号重复
    const products = getGlobalProducts()
    for (const product of products) {
      if (product.product_productOfflineRetail_isSerialNoManage) {
        haveScan = true
        break
      }
    }
  }
  if (!haveScan && billingViewModel) {
    const params = { haveScan, paymodes }
    billingViewModel.execute('afterPaymodeDecideSave', { params })
    haveScan = params.haveScan
  }
  if (!cb.rest.cache.isOpenDBCache) return false
  const offLine = !haveScan
  return offLine
}

/* mobile端save服务 */
export function save_mobile (callback, errorCallback) {
  return function (dispatch, getState) {
    if (isSaving) return;
    isSaving = true;
    const params = buildParams(getState());
    const data = {};
    data[RetailVouchBillNo] = getRetailVouchData(params, true);
    data[GatheringVouchBillNo] = getGatheringVouchData(params);
    const voucherCode = buildVouchCode(params.header.cStoreCode);
    if (voucherCode.posCode && cb.rest.interMode === 'self') {
      data[RetailVouchBillNo].code = 'LS' + voucherCode.code;
      data[GatheringVouchBillNo].code = 'SK' + voucherCode.code;
    } else {
      // 浏览器模式下后端add服务返回来的code先去掉，后端保存的时候重新生成
      delete data[RetailVouchBillNo].code;
      delete data[GatheringVouchBillNo].code;
    }
    const retailVouchMeta = initialState[`${RetailVouchBillNo}Meta`];
    const gatheringVouchMeta = initialState[`${GatheringVouchBillNo}Meta`];
    data[RetailVouchBillNo].fChangeMoney = data[GatheringVouchBillNo].fChangeMoney;
    data[RetailVouchBillNo][retailVouchMeta.childrenField2] = data[GatheringVouchBillNo][gatheringVouchMeta.childrenField0];
    if (backBillInfo)
      data.backinfo = backBillInfo;
    if (presellBillInfo)
      data.presellinfo = presellBillInfo;
    if (mallorderInfo)
      data.mallorderInfo = mallorderInfo;
    cb.utils.loading(true)
    const proxy = cb.rest.DynamicProxy.create({ saveBill: { url: 'bill/save', method: 'POST', options: { async: false } } });
    const saveResult = proxy.saveBill({ billnum: initialState.billNo, data: JSON.stringify(data) });
    cb.utils.loading(false)
    isSaving = false;
    if (saveResult.error) {
      // isSaving = false;
      errorCallback(saveResult.error.message);
      return;
    }
    try {
      if (saveResult.result && saveResult.result.constructor === Object)
        localStorage.setItem('billing_lastBillId', saveResult.result.id);
      else
        localStorage.setItem('billing_lastBillId', JSON.parse(saveResult.result)[RetailVouchBillNo][0].id);
      if (voucherCode && voucherCode.posCode && cb.rest.interMode === 'self') {
        const serialNoObj = {};
        serialNoObj[voucherCode.dateCode] = voucherCode.serialNo;
        localStorage.setItem('billing_serialNo', JSON.stringify(serialNoObj));
      }
    } catch (e) {
      console.error('_save exception: ' + e.message);
    }

    // 打印
    const canPrint = getState().config.toJS().canPrint;
    if (canPrint)
      dispatch(print(saveResult.result));
    if (params.header.bHang)
      dispatch(deletePendingOrder());
    dispatch(clear(false));
    /**/

    callback(saveResult.result);
  }
}

const _save = function (saveResult, callback, errorCallback, bHang, isTouch, voucherCode) {
  return function (dispatch, getState) {
    try {
      const billingStatus = getState().uretailHeader.toJS().billingStatus;
      if (saveResult.error) {
        errorCallback(saveResult.error.message);
        isSaving = false;
        return;
      }
      try {
        localStorage.setItem('billing_lastStatus', mallorder ? billingStatus : 'CashSale');
        const result = typeof saveResult.result === 'string' ? JSON.parse(saveResult.result)[RetailVouchBillNo][0] : saveResult.result;
        localStorage.setItem('billing_lastBillId', mallorder ? result.billNo : result.id);
        if (voucherCode && voucherCode.posCode) {
          const serialNoObj = {};
          serialNoObj[voucherCode.dateCode] = voucherCode.serialNo;
          localStorage.setItem('billing_serialNo', JSON.stringify(serialNoObj));
        }
      } catch (e) {
        console.error('_save exception: ' + e.message);
      }
      const canPrint = getState().config.toJS().canPrint;
      if (canPrint && cb.rest.terminalType != 3)
        dispatch(print(saveResult.result));
      if (bHang)
        dispatch(deletePendingOrder());
      /* 电商徽标 */
      billingStatus === 'OnlineBill' && dispatch(initBadge())
      dispatch(clear(false));
      if (cb.rest.terminalType == 3) {
        callback(saveResult.result);
      } else {
        callback();
      }
      isSaving = false;
    } catch (e) {
      console.error('mix _save error: ' + e.message);
      isSaving = false;
    }
  }
}

export async function rebootSave (dbData, callback, errorCallback) {
  if (!dbData.length) {
    // reject({ message: 'db暂无数据' })
    return
  }
  if (cacheUploading) {
    throw ({ message: '上次上传任务未进行完' })
  }
  cacheUploading = true;
  for (let i = 0; i < dbData.length; i++) {
    const currentData = dbData[i];
    const config = {
      url: 'bill/save',
      method: 'POST',
      params: { billnum: currentData.billnum, data: currentData.data },
      options: { timeout: 60000, mask: false }
    }
    let isContinue = ''
    try {
      isContinue = await rebootSave_per(currentData, config);
      // console.log('第一步：***********保存服务刚刚有返回***********')
    } catch (e) {
      console.error('rebootSave_per保存服务错误！')
    }
    if (isContinue === 'break') {
      cacheUploading = false
      console.error(`第${i + 1}条数据bootSave保存时报错！`)
      throw (`第${i + 1}条数据bootSave保存时报错！`)
      // break
    }
    // console.log('第二步：************此次循环完成*****************')
    if (i === dbData.length - 1)
      cacheUploading = false
  }
  // console.log('第三步：***************整个for循环完成***************')
  return true
}

const rebootSave_per = (currentData, config) => {
  return new Promise(resolve => {
    proxy(config).then(json => {
      if (json.code === 200) {
        try {
          const result = typeof json.data === 'string' ? JSON.parse(json.data)[RetailVouchBillNo][0] : json.data;
          // localStorage.setItem('billing_lastBillId', result.id);
          localStorage.setItem('billing_lastBillId', mallorder ? result.billNo : result.id); // yangleih 19.03.05 兼容电商
        } catch (e) {
          console.error('rebootSave_per exception: ' + e.message);
        }
        IDB_saveData(currentData, 'upLoaded').then(success => {
          IDB_deleteOneData({ id: currentData.indexedDB_id }).then(result => {
            result == '删除成功' && resolve('continue')
            result == '删除失败' && resolve('break')
          }).catch(e => console.error('IDB_deleteOneData删除数据出错！'))
        }).catch(e => {
          console.error('upLoaded表存入数据错误！')
          resolve('break')
        })
      } else {
        const reason = `break_${json.code}错：${json.message}`
        currentData.reason = reason
        if (json.code === 500) {
          rebootSave_per_updateErr(currentData, () => {
            resolve('break')
          })
        } else {
          rebootSave_per_updateErr(currentData, () => {
            resolve('continue')
            console.error('后端报错：' + json.message)
          })
        }
      }
    })
  })
}

const rebootSave_per_updateErr = (data, callback) => {
  IDB_saveData(data, 'save_data').then(json => {
    callback && callback()
  }).catch(e => {
    console.error(`数据更新错误原因失败：${e}`)
  })
}

const getEmpty = (billNo, cGUID, networkConnect) => {
  const options = { networkConnect };
  if (cb.rest.interMode === 'touch')
    options.timeout = 3000;
  // if (window.__loginIng)
  //   options.token = false;
  const config = {
    url: 'bill/add',
    method: 'POST',
    params: {
      billnum: billNo
    },
    options
  };
  initialState[`${billNo}Empty`] = { cGUID, ioffline: 0 };
  localProxy(config)
    .then(function (json) {
      if (json.code !== 200) {
        // initialState[`${billNo}Empty`] = { cGUID };
        return
      }
      delete json.data.vouchdate;
      // json.data.cGUID = cGUID;
      // json.data.ioffline = 0; //0:在线 1:离线
      // initialState[`${billNo}Empty`] = json.data;
      Object.assign(initialState[`${billNo}Empty`], json.data)
    });
};

export function getOriginRetailHeader () {
  return { rm_retailvouchEmpty: initialState.rm_retailvouchEmpty, rm_gatheringvouchEmpty: initialState.rm_gatheringvouchEmpty }
}

export function empty () {
  return function (dispatch, getState) {
    const lineConnection = getState().offLine.get('lineConnection')
    const guid = uuid();
    getEmpty(RetailVouchBillNo, guid, lineConnection);
    getEmpty(GatheringVouchBillNo, guid, lineConnection);
    const defaultFocus = options.newbilldefcursor && options.newbilldefcursor.value;
    if (defaultFocus == 1)
      return dispatch(setMemberBoxFocus(true));
    if (defaultFocus == 2)
      return dispatch(setSearchBoxFocus(true));
  }
}

export function clear (confirm) {
  return function (dispatch, getState) {
    if (cb.rest.terminalType == 3) {
      _clear(dispatch);
      return
    }
    if (confirm === false) {
      _clear(dispatch);
    } else {
      cb.utils.confirm('确定整单清除吗?', function () {
        const lineConnection = getState().offLine.get('lineConnection');
        if (cb.rest.interMode === 'touch' && lineConnection === 0) {
          console.log('新开单 连网中=>连网')
          dispatch(genAction('PLATFORM_UI_OFF_LINE_CHANGE_LINE_CONNECT', { lineConnection: true }))
        }
        _clear(dispatch);
      });
    }
  }
}

const _clear = function (dispatch) {
  if (cb.rest.terminalType == 3) isSaving = false;
  dispatch(setReceiptHang(true));
  dispatch(genAction('PLATFORM_UI_BILLING_CLEAR'));
  dispatch(empty());
  const billingViewModel = getBillingViewModel()
  if (billingViewModel) {
    billingViewModel.clear();
    billingViewModel.execute('afterClear')
  }
}

const buildEntityTree = (nonMainEntities, parentCode, meta) => {
  const nonMainMap = {};
  const subEntities = [];
  nonMainEntities.forEach(function (entity) {
    nonMainMap[entity.cCode] = entity;
  });
  nonMainEntities.forEach(function (entity) {
    if (entity.cParentCode === parentCode) {
      subEntities.push(entity);
    } else {
      const parentEntity = nonMainMap[entity.cParentCode];
      if (!parentEntity) return;
      if (!parentEntity.children)
        parentEntity.children = [];
      parentEntity.children.push(entity);
    }
  });
  recursive(subEntities, meta);
}

const recursive = (entities, meta) => {
  entities.forEach((entity, index) => {
    meta[`childrenField${index}`] = entity.childrenField;
    const childMeta = {};
    meta[entity.childrenField] = childMeta;
    entity.fields.forEach(field => {
      childMeta[field.cItemName] = field;
    });
    if (!entity.children) return;
    recursive(entity.children, childMeta);
  });
}

const getMeta = async (billNo, callback, { cacheData = null, cacheDBData = null } = {}) => {
  const config = {
    url: 'billmeta/getbill',
    method: 'GET',
    params: {
      billno: billNo,
      bIncludeView: false,
      bIncludeViewModel: true
    }
  };
  const json = cacheData ? cacheData[`BillMetaData_${billNo}`] : await proxy(config);
  if (cacheDBData) cacheDBData[`BillMetaData_${billNo}`] = json
  if (json.code !== 200) {
    cb.utils.alert(`获取${billNo}元数据失败：${json.message}`, 'error');
    return;
  }
  const meta = {};
  const entities = json.data.viewmodel.entities;
  const nonMainEntities = [];
  let parentCode = null;
  entities.forEach(entity => {
    if (entity.cType !== 'Bill') return;
    if (entity.bMain) {
      parentCode = entity.cCode;
      const mainFields = [];
      const mainDefineMap = {};
      entity.fields.forEach(field => {
        const { cItemName, cSelfDefineType } = field;
        meta[cItemName] = field;
        mainFields.push(cItemName);
        if (!cSelfDefineType) return;
        mainDefineMap[cSelfDefineType] = cItemName;
      });
      meta.mainFields = mainFields;
      meta.mainDefineMap = mainDefineMap;
    } else {
      nonMainEntities.push(entity);
    }
  });
  buildEntityTree(nonMainEntities, parentCode, meta);
  initialState[`${billNo}Meta`] = meta;
  if (callback)
    callback(meta);
};

export function init (billHead, showLines, paramsObj) {
  return function (dispatch, getState) {
    getMeta(RetailVouchBillNo, function (meta) {
      metaCache = meta;
      billHead && billHead.forEach(item => {
        item.dataIndex = meta.mainDefineMap[item.defineId];
        item.metaData = meta[item.dataIndex];
      });
      sotreBill2ReferMap = transferRule(meta.store.cRefRetId);
      const productsChildrenField = meta.childrenField0;
      const productsMeta = meta[productsChildrenField];
      getbillDetailsFormater(productsMeta)
      const backBillMeta = {
        iCoRetailid: JSON.parse(meta.iCoRetailid.cRefRetId),
        iCoRetailDetailId: JSON.parse(productsMeta.iCoRetailDetailId.cRefRetId)
      }
      const defineMap = {};
      _.forEach(productsMeta, (item, key) => {
        const { cSelfDefineType } = item;
        if (!cSelfDefineType) return;
        defineMap[cSelfDefineType] = key;
      });
      const columns = []; const detailColumns = []; const editColumns = { common: [], define: [] };
      showLines.forEach(item => {
        const { variable } = item;
        item.dataIndex = defineMap[variable] || variable;
        item.metaData = productsMeta[item.dataIndex];
        if (item.isLineShow)
          columns.push(item);
        if (item.isDetailAreaShow)
          detailColumns.push(item);
        if (item.isEditShow)
          defineMap[variable] ? editColumns.define.push(item) : editColumns.common.push(item);
        if (item.variable == 'fAvailableAuantity')
          item.isLineShow === false && item.isDetailAreaShow === false && item.isEditShow === false ? dispatch(genAction('PLATFORM_UI_PRODUCT_CAN_QUANTITY', false)) : dispatch(genAction('PLATFORM_UI_PRODUCT_CAN_QUANTITY', true))
      });
      dispatch(loadColumns(columns));
      dispatch(loadDetailColumns(detailColumns));
      dispatch(loadEditColumns(editColumns, productsMeta.iBathid, productsMeta.cSerialNo));
      const productFieldMeta = productsMeta.product;

      /* add by jinzh1 增加会员iMemberid根据预制参数返回数据 */
      const memberFieldMeta = meta.iMemberid;
      if (memberFieldMeta && memberFieldMeta.cRefRetId)
        dispatch(genAction('PLATFORM_UI_MEMBER_META_TO_HEADER', memberFieldMeta.cRefRetId));

      dispatch(genAction('PLATFORM_UI_PRODUCT_SET_CHILDREN_FIELD', productsChildrenField));
      dispatch(genAction('PLATFORM_UI_COUPON_SET_CHILDREN_FIELD', meta.childrenField1));
      dispatch(genAction('PLATFORM_UI_GATHERING_SET_CHILDREN_FIELD', meta.childrenField2));
      dispatch(genAction('PLATFORM_UI_PROMOTION_SET_CHILDREN_FIELD', productsMeta.childrenField0));
      dispatch(genAction('PLATFORM_UI_PRODUCT_REFER_TO_BILL_MAP', productFieldMeta && productFieldMeta.cRefRetId));
      dispatch(genAction('PLATFORM_UI_RETAIL_SET_MAIN_FIELDS', meta.mainFields));
      dispatch(genAction('PLATFORM_UI_BILLING_EMPLOYEE_REFER_META', productsMeta.iEmployeeid_name));
      dispatch(genAction('PLATFORM_UI_BILLING_BACK_BILL_RETURN_META', backBillMeta))
    }, paramsObj);
    getMeta(GatheringVouchBillNo, false, paramsObj);
    getStoreDefaultWareHouse(getState(), paramsObj, dispatch);
    getPromotionMutex(paramsObj);

    dispatch(empty());
    cb.loader.runCommandLine('bill', {
      billtype: 'voucher',
      billno: RetailVouchBillNo,
      params: {
        extendName: 'RM_rm_retailvouch_VM_billing',
        options: { billKey: 'billing' }
      }
    }, null, (vm, viewmeta) => {
      vm.getBillingContext = collectBillingOptions(dispatch, getState);
      vm.billingFunc = getBillingFunc(dispatch);
      vm.promiseExecute1 = promiseExecute1;
      vm.execute1 = execute1;
      vm.warpPromiseExecute = warpPromiseExecute;
      cb.loader.runCommandLine('bill', {billtype: 'freeview', billno: 'rm_retailbilling_extend', params: {}}, null, function (settleVm, settleMeta) {
        vm.settleViewModel = settleVm;
        vm.settleViewMeta = settleMeta;
        vm.payListModel = settleVm.get('rm_billingpay_window');
      })
      dispatch(genAction('PLATFORM_UI_BILLING_VIEWMODEL_INIT', vm));
      connectViewModel(vm, dispatch, getState);
      vm.execute('afterClear')
    });
  }
}

const getbillDetailsFormater = (productsMeta) => {
  if (!productsMeta) return
  for (const attr in productsMeta) {
    if (productsMeta[attr].cFormatData) {
      try {
        retailVouchDetailsFormat[productsMeta[attr].cItemName] = JSON.parse(productsMeta[attr].cFormatData)
      } catch (e) {
        retailVouchDetailsFormat[productsMeta[attr].cItemName] = undefined
      }
    }
  }
}

const connectViewModel = function (billingViewModel, dispatch, getState) {
  const VirtualListener = function () { }
  VirtualListener.prototype.setColumnStates = function (arr) {
    if (!arr || !Array.isArray(arr) || !arr.length) return
    let columns = getState().product.get('columns');
    if(Immutable.Iterable.isIterable(columns)) columns = columns.toJS()
    // [{
    //   'dataIndex':'fQuantity',
    //   'states': [{'name': name, value: '汇总数量'}]
    // }]
    arr.forEach(changeC => {
      columns.forEach(oldC => {
        if (changeC.dataIndex == oldC.dataIndex) {
          changeC.states.forEach(ele => {
            oldC[ele.name] = ele.value
          })
        }
      })
    })
    dispatch(genAction('PLATFORM_UI_BILLING_SET_COLUMNS', columns))
  }
  const virtualListener = new VirtualListener();
  billingViewModel.get('retailVouchDetails').addListener(virtualListener);
}

/* add by jinzh1 获取门店默认仓库 */
const getStoreDefaultWareHouse = async (globalState, { cacheData = null, cacheDBData = null } = {}, dispatch) => {
  const storeId = globalState.user.toJS().storeId;
  if (!storeId) return
  const config = {
    url: 'billTemplateSet/getCurrentStoreWarehouse',
    method: 'GET',
    params: { storeId: storeId, cabinetGroup: Cookies.get('pos_cabinetgroup') || null }
  };
  const json = cacheData ? cacheData.WarehouseData : await proxy(config)
  if(cacheDBData) cacheDBData.WarehouseData = json
  if (json.code !== 200) {
    cb.utils.alert(json.message, 'error');
    return
  }
  const { defaultWarehouse, otherWarehouse } = json.data;
  if (defaultWarehouse.warehouse) {
    iWarehouseid = defaultWarehouse.warehouse;
    for (var i = 0; i < otherWarehouse.length; i++) {
      if (otherWarehouse[i].warehouse == iWarehouseid) {
        iWarehouseid_name = otherWarehouse[i].warehouse_name;
        iWarehouse_erpCode = otherWarehouse[i].warehouse_erpCode;
        warehouse_isGoodsPosition = otherWarehouse[i].warehouse_isGoodsPosition;
        break;
      }
    }
  }
  dispatch(genAction('PLATFORM_UI_BILLING_EDITROW_GET_WAREHOUSE_DATASOURCE', otherWarehouse))
}
/* add by jinzh1  促销活动互斥策略 */
const getPromotionMutex = async ({ cacheData = null, cacheDBData = null } = {}) => {
  const config = {
    url: 'mall/bill/preferential/querylinemutexstrategy',
    method: 'GET'
  };
  const json = cacheData ? cacheData.PromotionMutexData : await proxy(config)
  if(cacheDBData) cacheDBData.PromotionMutexData = json
  if (json.code !== 200) {
    cb.utils.alert(json.message, 'error');
    return;
  }
  if (json.data[0]) {
    promotionMutexMap.iMemberDiscountEnable = (json.data[0].iMemberDiscountEnable == 1);
    promotionMutexMap.iIntegral = (json.data[0].iIntegral == 1);
    promotionMutexMap.iSpotDiscountEnable = (json.data[0].iSpotDiscountEnable == 1);

    promotionMutexMap.iOrderDiscountEnable = json.data[0].iOrderDiscountEnable;
    promotionMutexMap.iCoupon = (json.data[0].iCoupon == 1);
    promotionMutexMap.isAllCoupon = (json.data[0].isAllCoupon == 1);
    promotionMutexMap.linecouponitem = json.data[0].linecouponitem;
  }
}
export const getRetailVoucherData = (globalState, bHang) => {
  const data = getRetailVouchData(buildParams(globalState));
  if (bHang)
    data.preferentialExecuteBackup = PreferentialExecuteBackup;
  return data;
}

const buildParams = (globalState) => {
  const header = getBillingHeader(globalState);
  const { products, coupons, money } = globalState.product.toJS();
  const paymode = globalState.paymode.toJS();
  return {
    header,
    products: transferProducts2Flatten(products),
    coupons,
    money,
    paymodes: paymode.paymodes,
    // 原单支付信息
    originPaymodes: paymode.billPaymodes,
    // hidePaymodes: paymode.hidePaymodes,
    gatheringMemo: globalState.uretailHeader.get('gatheringMemo'),
  };
}

const buildVouchCode = function (storeCode) {
  const posCode = localStorage.getItem('billing_posCode') || '';
  const dateCode = moment().format('YYMMDD');
  const serialNoStr = localStorage.getItem('billing_serialNo');
  let serialNo;
  if (serialNoStr) {
    try {
      serialNo = JSON.parse(serialNoStr)[dateCode] || 0;
    } catch (e) {
      serialNo = 0;
    }
  } else {
    serialNo = 0;
  }
  serialNo++;
  return { code: storeCode + posCode + dateCode + formatInt(serialNo, 4), posCode, dateCode, serialNo };
}

const formatInt = function (number, len) {
  let mask = '';
  let returnVal = '';
  for (let i = 0; i < len; i++)
    mask += '0';
  returnVal = mask + number;
  returnVal = returnVal.substr(returnVal.length - len, len);
  return returnVal;
}

export function canExecute (globalState, key, callback, dispatch) {
  const currentText = PreferentialExecuteMap[key].forbiddenTip;
  // const currentPreferential = PreferentialExecuteMap[key].text;
  if (PreferentialExecuteBackup.length) {
    const lastKey = PreferentialExecuteBackup[PreferentialExecuteBackup.length - 1].key;
    if (key === lastKey) {
      callback();
      return;
    }
    let showAlert = false;
    if (PreferentialExecuteMap[key].order < PreferentialExecuteMap[lastKey].order)
      showAlert = true;
    if (key == 'Scene' && promotionMutexMap.iSpotDiscountEnable && lastKey == 'Promotion')
      showAlert = true;
    if (key == 'Point' && promotionMutexMap.iIntegral && lastKey == 'Promotion')
      showAlert = true;
    if (key == 'Member' && promotionMutexMap.iMemberDiscountEnable && lastKey == 'Promotion')
      showAlert = true;
    if (key == 'Coupon' && promotionMutexMap.iCoupon && promotionMutexMap.isAllCoupon && lastKey == 'Promotion')
      showAlert = true;
    if (key === 'Promotion') {
      if (promotionMutexMap.iSpotDiscountEnable && lastKey == 'scene')
        showAlert = true;
      if (promotionMutexMap.iIntegral && lastKey == 'Point')
        showAlert = true;
      if (promotionMutexMap.iMemberDiscountEnable && lastKey == 'Member')
        showAlert = true;
    }
    if (key == 'Quantity') {
      // if (lastKey == 'Scene' || lastKey == 'Point' || lastKey == 'Coupon') {
      if (lastKey == 'Point' || lastKey == 'Coupon') {
        showAlert = true;
      }
    }
    /* add by jinzh1 现场折扣后允许修改零售价   判断挪到改零售价里 */
    if (key == 'Quote' && lastKey == 'Scene') showAlert = false;
    if (showAlert) {
      if (key === 'Promotion') {
        const passCheck = checkOpen(globalState, key, null, currentText);
        /* 校验，不走callback */
        if (passCheck === false) return false
        clearAfterPromotion(dispatch, callback)
        /* 清除，执行callback */
        return false
      }
      cb.utils.alert(`已经执行了${PreferentialExecuteMap[lastKey].text}, ${currentText}`, 'error');
      return;
    }
  }
  /* add by jinzh1 checkOpen  前事件 */
  if (!beforeCheckOpen(key)) {
    callback();
    return;
  }
  checkOpen(globalState, key, callback, currentText);
}

const checkOpen = (globalState, key, callback, currentText, params) => {
  params = params || {};
  const swallowTip = params.swallowTip;
  const failCallback = params.failCallback;
  const currentPreferential = PreferentialExecuteMap[key].text;
  // const industry = globalState.user.toJS().tenant.industry;
  /* 所属行业 */
  if (key !== 'Member') {
    const { products } = globalState.product.toJS();
    const { billingStatus, infoData } = globalState.uretailHeader.toJS();
    if (!products.length) {
      !swallowTip && cb.utils.alert(`未录入商品，${currentText}`, 'error');
      failCallback && failCallback()
      return false;
    }
    const items = [];
    products.forEach(item => {
      if (item.bFixedCombo) return false;
      if (item.specsBtn)
        items.push(item.product_cName);
    });

    // if (industry != 17) {/*珠宝行业不校验*/
    /* modify by jinzh1 改零售价需要根据单据状态等控制，故不在此控制了！ */
    if (items.length && key != 'Quote') {
      !swallowTip && cb.utils.alert(`未录入商品“${items.join('，')}”的规格，${currentText}`, 'error');
      failCallback && failCallback()
      return false;
    }
    // }
    let checkShipmentDM, checkPresellBack;
    // let checkPresellBillDM

    if (key === 'Promotion' || key === 'Scene' || key === 'Point' || key === 'Coupon') {
      checkShipmentDM = true;
      // checkPresellBillDM = true;
      checkPresellBack = true;
      /* “若列表中不存在“参与折扣计算”为是且实销金额大于零的商品行，则提示“没有可以执行积分抵扣的商品行” */
      const notToBe = products.every(product => {
        if (!product.children) {
          const pass = product.bCanDiscount === true && product.fMoney > 0;
          return !pass
        } else {
          const notToBe_children = product.children.every(item => {
            const pass_children = item.bCanDiscount === true && product.fMoney > 0;
            return !pass_children;
          })
          return notToBe_children
        }
      })
      if (notToBe === true) {
        !swallowTip && cb.utils.alert(`没有可以执行${currentPreferential}的商品行`, 'error');
        failCallback && failCallback()
        return false
      }
    }
    /* 改零售价 【删行】 */
    if (key == 'Quote' || key == 'Quantity') {
      checkShipmentDM = true;
      checkPresellBack = true;
    }
    if (key == 'EditRow') {
      checkPresellBack = true;
    }
    /* 预交货状态 + ‘交货时可修改商品’=false */
    if (billingStatus === Status.Shipment && infoData.bDeliveryModify === false && checkShipmentDM == true) {
      !swallowTip && cb.utils.alert(`交货不能修改商品时，${currentText}！`, 'error');
      failCallback && failCallback()
      return false
    }
    /* 预定状态 + ‘交货时可修改商品’=true 新增预定放开 */
    // if (billingStatus === Status.PresellBill && false && infoData.bDeliveryModify === true && checkPresellBillDM == true) {
    //   !swallowTip && cb.utils.alert(`预订状态且交货时可修改商品的情况下，${currentText}！`, 'error');
    //   failCallback && failCallback()
    //   return false
    // }
    /* 预退状态 */
    if (billingStatus === Status.PresellBack && checkPresellBack == true) {
      !swallowTip && cb.utils.alert(`预订退订状态下，${currentText}！`, 'error');
      failCallback && failCallback()
      return false
    }
  }
  callback && callback();
}

export function canExecute_copy (globalState, key, callback, dispatch, resolve, failCallback) {
  // let failCallback = resolve ? () => {
  //   resolve(true)
  // } : null
  const currentText = PreferentialExecuteMap[key].forbiddenTip;
  // const currentPreferential = PreferentialExecuteMap[key].text;
  if (PreferentialExecuteBackup.length) {
    const lastKey = PreferentialExecuteBackup[PreferentialExecuteBackup.length - 1].key;
    if (key === lastKey) {
      callback();
      return;
    }
    let showAlert = false;
    if (PreferentialExecuteMap[key].order < PreferentialExecuteMap[lastKey].order)
      showAlert = true;
    if (key === 'Promotion') {
      if (promotionMutexMap.iSpotDiscountEnable && lastKey == 'scene')
        showAlert = true;
      if (promotionMutexMap.iIntegral && lastKey == 'Point')
        showAlert = true;
      if (promotionMutexMap.iMemberDiscountEnable && lastKey == 'Member')
        showAlert = true;
    }
    if (showAlert && key === 'Promotion') {
      /* 校验，不走callback */
      const passCheck = checkOpen(globalState, key, null, currentText, { swallowTip: true });
      if (passCheck === false) {
        failCallback && failCallback();
        return false
      }
      clearAfterPromotion(dispatch, callback, resolve, true, failCallback)
    }
  } else {
    checkOpen(globalState, key, callback, currentText, { swallowTip: true, failCallback: failCallback });
  }
}

/* 已经执行了现场折扣／优惠券／积分抵扣，点击促销活动的处理 */
const clearAfterPromotion = async (dispatch, callBack, resolve, swallowTip, failCallback) => {
  // failCallback = failCallback ? failCallback : () => {
  //   resolve(true)
  // };
  let isPop = ''
  if (resolve) { // 执行了现场折扣等 && 点击结算 => 先确定有无促销活动再弹框
    isPop = await dispatch(getPromotionData(swallowTip, failCallback))
    if (isPop === 'notPop') return
  }
  let tips = ''
  // let cancelTips = '';
  const length = PreferentialExecuteBackup.length;
  PreferentialExecuteBackup.forEach((ele, index) => {
    if (!cb.utils.isEmpty(PreferentialExecuteMap[ele.key].text))
      tips += `${PreferentialExecuteMap[ele.key].text}${(length != index + 1) ? '、' : ''}`
  })
  tips = `已经执行了：${tips}不能执行促销活动！您确定要取消${tips}？`
  cb.utils.confirm(tips, function () {
    for (let len = PreferentialExecuteBackup.length, i = len - 1; i >= 0; i--) {
      const key = PreferentialExecuteBackup[i].key; const backupData = PreferentialExecuteBackup[i].value; let rowData = null;
      if (key === 'Scene') {
        rowData = backupData.backData;
        dispatch(cancelDiscount());
      }
      if (key === 'Point' || key === 'Coupon') {
        rowData = backupData.voucherData.voucherDataBefore;
        dispatch(cancelExecute(rowData, key));
      }
      // (i == 0) && dispatch(genAction('PLATFORM_UI_BILLING_CANCEL_PREFERENTIAL_UPDATE_PRODUCTS', {key, value: rowData}));
      // dispatch(genAction(`PLATFORM_UI_BILLING_RESTORE_PREFERENTIAL_${key.toLocaleUpperCase()}_BACKUP`, backupData));
    }
    callBack && callBack()
  }, failCallback && failCallback)
  resolve && resolve(false)
}

export function canCancel (key, callback) {
  if (PreferentialExecuteBackup.length) {
    const lastKey = PreferentialExecuteBackup[PreferentialExecuteBackup.length - 1].key;
    if (lastKey !== 'Real' && key !== lastKey) {
      cb.utils.alert(`请先取消${PreferentialExecuteMap[lastKey].text}`, 'error');
      return;
    }
  }
  callback();
}

export function handleBackBillData (data, originalData) {
  return function (dispatch, getState) {
    backBillInfo = originalData;
    const retailVouchData = data[RetailVouchBillNo];
    delete retailVouchData.vouchdate;
    const { iMemberid } = retailVouchData;
    /* 王久龄说  不管有没有会员 先清 */
    dispatch(genAction('PLATFORM_UI_MEMBER_CLEAR', ''));
    if (iMemberid) {
      dispatch(queryMemberById(iMemberid));
    }
    const retailVouchMeta = initialState[`${RetailVouchBillNo}Meta`];
    generateKey(retailVouchData, retailVouchMeta)
    const products = transferProducts(retailVouchData[retailVouchMeta.childrenField0]);
    /* 当天退货走撤销 */
    retailVouchData.__backBillDate = originalData[RetailVouchBillNo].vouchdate

    /* add by jinzh1 */
    const billingViewModel = getBillingViewModel()
    billingViewModel.loadData(retailVouchData);
    dispatch(genAction('PLATFORM_UI_BILLING_REFER_BILL_OK', { status: Status.FormerBackBill, data: retailVouchData }));
    dispatch(handleBackBill(products));

    // 原单退货处理原单支付相关信息
    handleOriginBillPaymodes(dispatch, data.rm_gatheringvouch.gatheringVouchDetail)
    /*    dispatch(genAction('PLATFORM_UI_BILLING_BACKUP_BILL_PAYMODES', _.map(data['rm_gatheringvouch']['gatheringVouchDetail'], item => {
          const {fMoney, iPaytype, iPaymentid_name, iPaymentid, ...others} = item
          return {
            value: 0 - fMoney,
            originValue: 0 - fMoney,
            paymentType: iPaytype,
            name: iPaymentid_name,
            paymethodId: iPaymentid,
            show: true,
            ...others
          }
        }))) */
  }
}

export function handleAfterSaleData (data, originalData, status) {
  return function (dispatch, getState) {
    presellBillInfo = originalData;// 携带原单信息
    const retailVouchData = data[RetailVouchBillNo];
    delete retailVouchData.vouchdate;
    // getState().uretailHeader.toJS().infoData.vouchdate
    // retailVouchData.vouchdate = Format(new Date(), 'yyyy-MM-dd hh:mm:ss')
    dispatch(genAction('PLATFORM_UI_MEMBER_CLEAR', ''));

    const retailVouchMeta = initialState[`${RetailVouchBillNo}Meta`];
    const products = retailVouchData[retailVouchMeta.childrenField0];// transferProducts(retailVouchData[retailVouchMeta.childrenField0]);
    // dispatch(genAction('PLATFORM_UI_BILLING_REFER_BILL_OK', { status, data: retailVouchData }));
    // let infoData = getState().uretailHeader.toJS().infoData;
    const member_id = originalData[RetailVouchBillNo].iMemberid;
    dispatch(handleAfterSaleServerData(member_id, 'AfterSaleService', products, originalData[RetailVouchBillNo][retailVouchMeta.childrenField0]));

    const { phone } = retailVouchData;
    // if (iMemberid) {
    //   dispatch(queryMemberById(iMemberid));
    // }
    if (phone) {
      dispatch(queryMember(phone, null, null, null, true));
    }
    // 退订处理原单支付相关信息
    // handleOriginBillPaymodes(dispatch, data['rm_gatheringvouch']['gatheringVouchDetail'])
  }
}

export function handlePresellBillData (data, originalData, status) {
  return function (dispatch, getState) {
    presellBillInfo = originalData;
    const retailVouchData = data[RetailVouchBillNo];
    delete retailVouchData.vouchdate;
    const { iMemberid } = retailVouchData;
    const billingStatus = getState().uretailHeader.toJS().billingStatus;
    /* 王久龄说  不管有没有会员 先清 */
    dispatch(genAction('PLATFORM_UI_MEMBER_CLEAR', ''));
    if (iMemberid) {
      if (cb.rest.terminalType == 3) {
        if (billingStatus !== 'PresellBack') {
          dispatch(queryMemberById(iMemberid));
        }
      } else {
        dispatch(queryMemberById(iMemberid));
      }
    }

    if (cb.rest.terminalType == 3 && iMemberid) {
      dispatch(genAction('BILLING_MEMBER_SET_MEMBERINFO', { mid: iMemberid }));
    }
    let hasEmployye = false;
    if (retailVouchData.retailVouchDetails && retailVouchData.retailVouchDetails[0].iEmployeeid)
      hasEmployye = true;
    const callback = (checkedEmployee) => {
      const retailVouchMeta = initialState[`${RetailVouchBillNo}Meta`];
      generateKey(retailVouchData, retailVouchMeta)
      mergeEmployee(retailVouchData, retailVouchMeta, checkedEmployee);
      const products = transferProducts(retailVouchData[retailVouchMeta.childrenField0]);
      /* add by jinzh1 */
      const billingViewModel = getBillingViewModel()
      billingViewModel.loadData(retailVouchData);
      if (!beforePresellBill2Retail(data, billingViewModel)) return
      dispatch(genAction('PLATFORM_UI_BILLING_REFER_BILL_OK', { status, data: retailVouchData }));
      if (status === Status.PresellBack) {
        dispatch(handlePresellBack(products));
      } else if (status === Status.Shipment) {
        const infoData = getState().uretailHeader.toJS().infoData
        const actionType = infoData.bDeliveryModify ? 'shipmentModify' : 'shipmentUnmodify'
        const member_id = originalData[RetailVouchBillNo].iMemberid;
        dispatch(handleServerData(member_id, actionType, products, originalData[RetailVouchBillNo][retailVouchMeta.childrenField0]));
      }

      // 退订处理原单支付相关信息
      handleOriginBillPaymodes(dispatch, data.rm_gatheringvouch.gatheringVouchDetail)
    }
    if (!hasEmployye) {
      dispatch(showEmployeeVtCallBack(callback));
      return
    }
    callback()
  }
}

/* 电商订单处理 */
export function handleOnlineBillData (data, originalData, isBack) {
  return function (dispatch, getState) {
    mallorderInfo = JSON.parse(JSON.stringify(originalData))
    mallorder = true;
    const retailVouchData = data[RetailVouchBillNo];
    delete retailVouchData.vouchdate;
    const { iMemberid } = retailVouchData;
    /* 王久龄说  不管有没有会员 先清 */
    dispatch(genAction('PLATFORM_UI_MEMBER_CLEAR', ''));
    /* 写入会员放到选择默认营业员之后,回车弹参照 */
    // if (iMemberid) {
    //   dispatch(queryMemberById(iMemberid));
    // }
    const retailVouchMeta = initialState[`${RetailVouchBillNo}Meta`];
    generateKey(retailVouchData, retailVouchMeta)
    const products = transferProducts(retailVouchData[retailVouchMeta.childrenField0]);
    /* add by jinzh1 */
    const billingViewModel = getBillingViewModel()
    billingViewModel.loadData(retailVouchData);
    dispatch(genAction('PLATFORM_UI_BILLING_REFER_BILL_OK', {
      status: (isBack ? Status.OnlineBackBill : Status.OnlineBill),
      data: retailVouchData
    }));
    dispatch(getDefaultBusinessType('16'))
    !isBack ? dispatch(handleOnlineBill(iMemberid, products)) : dispatch(handleOnlineBill(iMemberid, products, 'back'));

    // 原单退货处理原单支付相关信息
    // handleOriginBillPaymodes(dispatch, data['rm_gatheringvouch']['gatheringVouchDetail'])
    /*    dispatch(genAction('PLATFORM_UI_BILLING_BACKUP_BILL_PAYMODES', _.map(data['rm_gatheringvouch']['gatheringVouchDetail'], item => {
          const {fMoney, iPaytype, iPaymentid_name, iPaymentid, ...others} = item
          return {
            value: 0 - fMoney,
            originValue: 0 - fMoney,
            paymentType: iPaytype,
            name: iPaymentid_name,
            paymethodId: iPaymentid,
            show: true,
            ...others
          }
        }))) */
  }
}

function handleOriginBillPaymodes (dispatch, originBillPaymodes) {
  // 原单退货和退订处理原单支付相关信息
  // 组织结算页面所需数据
  // 合并同id的支付方式
  dispatch(genAction('PLATFORM_UI_BILLING_BACKUP_BILL_PAYMODES', _.map(_.groupBy(originBillPaymodes, item => {
    return item.iPaymentid
  }), p => {
    const { iPaytype, iPaymentid_name, iPaymentid, cVoucherCode, gatheringvouchPaydetail } = p[0]
    const money = _.reduce(p, function (a, b) {
      return getFixedNumber(Number(a) + Number(b.fMoney))
    }, 0)
    return {
      value: getFixedNumber(0 - money),
      originValue: getFixedNumber(0 - money),
      paymentType: iPaytype,
      name: iPaymentid_name,
      paymethodId: iPaymentid,
      show: true,
      cVoucherCode,
      // 除了'现金', '储值卡', '其他'支付方式, 其他的保存原单数据
      // originalSamePaymodes: iPaytype != 1 && iPaytype != 5 && iPaytype != 9 && iPaytype != 18 && p
      originalSamePaymodes: gatheringvouchPaydetail && iPaytype != 5 && iPaytype != 18 && p
      // ...others
    }
  })
  ))
}

export function handlePendingData (selectedData) {
  return function (dispatch, getState) {
    const { data } = selectedData
    const { iMemberid, billingStatus } = data;
    if (billingStatus === 'OnlineBill') {
      mallorder = true;
      mallorderInfo = selectedData.mallorderInfo
    }
    /* 王久龄说  不管有没有会员 先清 */
    dispatch(genAction('PLATFORM_UI_MEMBER_CLEAR', ''));
    if (iMemberid) {
      dispatch(queryMemberById(iMemberid));
    }
    const { preferentialExecuteBackup } = data;
    delete data.preferentialExecuteBackup;
    const retailVouchMeta = initialState[`${RetailVouchBillNo}Meta`];
    generateKey(data, retailVouchMeta)
    const products = transferProducts(data[retailVouchMeta.childrenField0]);
    delete data.vouchdate // 八百尊 解挂单据日期后段生成
    /* add by jinzh1 */
    const billingViewModel = getBillingViewModel()
    billingViewModel.loadData(data);
    dispatch(ExeAfterCancelPending(data))
    if (!beforeCancelPending(data, billingViewModel)) return
    dispatch(genAction('PLATFORM_UI_BILLING_REFER_BILL_OK', { status: data.billingStatus, data, bHang: true }));
    const asyncCallback = () => {
      if (!preferentialExecuteBackup || !preferentialExecuteBackup.length) return;
      preferentialExecuteBackup.forEach(item => {
        const { key, value } = item;
        dispatch(genAction('PLATFORM_UI_BILLING_EXECUTE_PREFERENTIAL_UPDATE_PRODUCTS', {
          key,
          value: data,
          backup: value
        }));
        dispatch(genAction(`PLATFORM_UI_BILLING_RESTORE_PREFERENTIAL_${key.toLocaleUpperCase()}_BACKUP`, value));
      });
    }
    dispatch(handleServerData(null, 'cancelPending', products, null, asyncCallback));
  }
}

// const mockOptions = {
//   "monovalentdecimal": {
//     "value": 3,
//     "caption": "单价小数位"
//   },
//   "amountofdecimal": {
//     "value": 3,
//     "caption": "金额小数位"
//   },
//   "ERPsyscheckoutdate": {
//     "caption": "ERP系统结账日期"
//   },
//   "maxzerolim": {
//     "value": "2",
//     "caption": "最大找零金额"
//   }, // 0-不控制
//   "newbilldefcursor": {
//     "value": "2",
//     "caption": "新开单据光标默认于"
//   }, // 1-会员录入；2-商品录入
//   "returnseasonentry": {
//     "value": "false",
//     "caption": "退货原因必输"
//   },
//   "displaymembercoupon": {
//     "value": true,
//     "caption": "显示会员优惠券"
//   },
//   "ticketprint": {
//     "value": true,
//     "caption": "收款时打印小票"
//   },
//   "billprinttype": {
//     "value": "1",
//     "caption": "开单打印类型"
//   }, // 1-POS打印；2-单据打印
//   "billdefaulttype": {
//     "value": "003",
//     "caption": "开单默认打印模板"
//   },
//   "goldprice": {
//     "value": "2",
//     "caption": "预订业务金价取值"
//   } // 1-预订日期金价；2-交货日期金价
// }

export function loadOptions (data) {
  return function (dispatch, getState) {
    // options = data;
    options = Object.assign({
      numPoint_Quantity: { value: 2, caption: '数量小数位' },
      numPoint_Rate: { value: 2, caption: '比率小数位' },
      numPoint_Weight: { value: 2, caption: '重量小数位' }
    }, data);
    options.numPoint_Quantity.value = cb.rest.AppContext.option.quantitydecimal;
    options.numPoint_Weight.value = cb.rest.AppContext.option.scaledecimal;
  }
}

export function getOptions () {
  return options;
}

export function loadFunctionOptions (data, type) {
  return function (dispatch) {
    functionOptioins = {}
    functionOptioins[type] = !!data
  }
}

export function getFunctionOptions () {
  return functionOptioins
}

// 异步示例
// function checkProductsku0(getState, dispatch) {
//   return new Promise((resolve, reject) => {
//     let canOpen = true
//     const currentState = getState()
//     const { infoData: { bPreselllockStock, bDeliveryModify }, billingStatus } = currentState.uretailHeader.toJS()
//     const { products } = currentState.product.toJS()

//     // 每个商品是否都选了规格
//     const filledSku = _.every(products, p => {
//       // 套餐商品bFixedCombo不需要判断规格productsku
//       return p.bFixedCombo || !!p.productsku
//     })
//     // '现销'、'退货'、'交货'、'预订状态下交货不可修改'，如果存在没有选择规格的商品，弹窗提示
//     switch (billingStatus) {
//       case 'CashSale':/*现销*/
//       case 'Shipment':/*交货*/
//       case 'FormerBackBill':/*原单退货*/
//       case 'NoFormerBackBill':/*非原单退货*/
//         canOpen = filledSku
//         break
//       case 'PresellBill':/*预订 */
//         //预订且占用可用量
//         //预订且交货时不可修改商品
//         if (!bDeliveryModify || bPreselllockStock) {
//           canOpen = filledSku
//         }
//         break
//     }

//     if (!canOpen) {
//       cb.utils.alert({
//         title: '请先选择规格',
//         type: 'error'
//       })
//       resolve(false)
//     } else {
//       resolve(true)
//     }
//   })
// }

// 同步示例
function checkProductsku (getState, dispatch) {
  const currentState = getState()
  let canOpen = true
  const { infoData: { bPreselllockStock, bDeliveryModify }, billingStatus } = currentState.uretailHeader.toJS()
  const { products } = currentState.product.toJS()

  // 每个商品是否都选了规格
  const filledSku = _.every(products, p => {
    // 套餐商品bFixedCombo不需要判断规格productsku
    return p.bFixedCombo || !!p.productsku
  })
  // '现销'、'退货'、'交货'、'预订且占用可用量'、'预订且交货时不可修改商品'，如果存在没有选择规格的商品，弹窗提示
  switch (billingStatus) {
    case 'CashSale':
      /* 现销 */
    case 'Shipment':
      /* 交货 */
    case 'FormerBackBill':
      /* 原单退货 */
    case 'NoFormerBackBill':
    case 'OnlineBill':
      /* 非原单退货 */
      canOpen = filledSku
      break
    case 'PresellBill':
      /* 预订 */
      // 预订且占用可用量
      // 预订且交货时不可修改商品
      if (!bDeliveryModify || bPreselllockStock) {
        canOpen = filledSku
      }
      break
  }

  if (!canOpen) {
    cb.utils.alert({
      title: '请先选择规格',
      type: 'error'
    })
    return false
  }
  return canOpen
}

function checkBackReason (getState, dispatch) {
  const currentState = getState()
  const { products } = currentState.product.toJS()
  const { billingStatus } = currentState.uretailHeader.toJS()
  const arr = []; let bSuccess = true;

  // 退货原因不是必填时，直接返回
  if (!(_.get(getOptions(), 'returnseasonentry.value') === true)) return true
  if (billingStatus == 'OnlineBackBill' || billingStatus == 'OnlineBill') return true

  // 非退订状态下检查退货原因是否填写
  if (billingStatus !== 'PresellBack') {
    // arr = _.filter(products, (p,i) => {
    //   return p.fQuantity < 0 && typeof p.iBackid === 'undefined'
    // })
    /* modfiy by jinzh1 由于退货原因和改行合并   校验退货原因等字段时 需要同时setFocusedRow */
    for (var i = 0; i < products.length; i++) {
      if (products[i].fQuantity < 0 && typeof products[i].iBackid === 'undefined') {
        arr.push(products[i]);
        if (bSuccess) dispatch(setFocusedRow(products[i], i + 1));
        bSuccess = false;
      }
    }
  }

  if (arr.length > 0) {
    cb.utils.alert('请填写退货原因!', 'error')
    dispatch(showModal('UpdateBackInfo', arr))
    return false
  }
  return true
}

export function checkWight (globalState, dispatch) {
  const industry = cb.rest.AppContext.tenant ? cb.rest.AppContext.tenant.industry : cb.rest.AppContext.user.industry;
  if (industry !== 17) return true // 自定义项控制只限珠宝行业
  const { billingStatus } = globalState.uretailHeader.toJS();
  const { products } = globalState.product.toJS();
  if (billingStatus === 'NoFormerBackBill') {
    const arr = products.filter(ele => {
      return (ele.fQuantity < 0 && ele['product_productProps!define2'] == '是' && !ele['retailVouchDetailCustom!define1'])
    })
    if (arr.length > 0) {
      cb.utils.alert('重量不能为空或者0！', 'error')
      dispatch(showModal('UpdateBackInfo', arr))
      return false
    }
  }
  return true
}

export function checkOnline (globalState, dispatch) {
  const { billingStatus, infoData } = globalState.uretailHeader.toJS();
  const hadOpen = globalState.reserve.toJS().hadOpen;
  if (billingStatus === 'OnlineBill' && !hadOpen && infoData.cDeliverType === 'STOREDELIVERY') {
    dispatch(showHeaderInfo())
    return false
  }
  return true
}

export async function checkOutoPromotion (globalState, dispatch) {
  const billingStatus = globalState.uretailHeader.toJS().billingStatus;
  if (billingStatus == 'OnlineBackBill' || billingStatus == 'OnlineBill' || !firstOpenPromotion) return true
  // let flag = false;
  // flag = await dispatch(showModal('SetPromotionFocus'));
  // flag === false ? false : true;
  // return flag
  const flag = await promotionCanOpen('SetPromotionFocus', dispatch, globalState);
  return flag;
}

/* 结算时关联校验促销活动，不能执行促销时弹结算 */
export async function promotionCanOpen (key, dispatch, globalState) {
  // if (key == 'SetPromotionFocus' && judgeFirstOpenPromotion('get')) {
  //   judgeFirstOpenPromotion('set', false)
  // }
  if (key == 'SetPromotionFocus') {
    const hasAuth = checkButtonAuth('SetPromotionFocus', globalState, true);
    if (!hasAuth) return false;
  }
  return new Promise((resolve, reject) => {
    canExecute_copy(globalState, 'Promotion', () => {
      canPromotionOpen(dispatch, globalState, function () {
        dispatch(genAction('PLATFORM_UI_BILLING_Action_ShowModal', { modalKey_Current: key }));
        if (key == 'SetPromotionFocus' && judgeFirstOpenPromotion('get')) {
          judgeFirstOpenPromotion('set', false)
        }
        resolve(false)
      }, true, () => {
        judgeFirstOpenPromotion('set', false)
        resolve(true)
      });
    }, dispatch, resolve, () => {
      judgeFirstOpenPromotion('set', false)
      resolve(true)
    })
  });
}

// 交货时， 应收金额必须大于等于零
function checkShipmentValuePC (getState, dispatch) {
  const currentState = getState()
  const gathering = currentState.product.toJS().money.Gathering.value
  const { billingStatus } = currentState.uretailHeader.toJS()
  // if (billingStatus === 'Shipment' && Number(gathering) < 0) { LS-2325
  //   cb.utils.alert({
  //     title: '应收金额必须大于等于零',
  //     type: 'error'
  //   })
  //   return false
  // }
  if (billingStatus === 'OnlineBill') {
    const billMoney = currentState.uretailHeader.get('billMoney')
    if (Number(gathering) < billMoney) {
      cb.utils.alert('整单金额小于原单金额，不能结算!', 'error')
      return false
    }
  }
  return true
}

/* o2o不可以离线结算 */
const check_o2o_settle = (allState, dispatch) => {
  const billingStatus = allState.uretailHeader.get('billingStatus');
  if (billingStatus === 'OnlineBill' || billingStatus === 'OnlineBackBill') {
    cb.utils.alert('此种网络状况下，不允许电商结算！', 'error')
    return false
  }
  return true
}

// 判断结算弹窗是否可打开
export async function canOpenSettleModal (getState, dispatch, payType) {
  let result
  const lineConnection = getState().offLine.get('lineConnection');
  const middle = { rowHasWarehousePosition: false };

  /* add by  jinzh1  结算校验前事件 */
  result = beforeCheckVouch(getState, dispatch)

  // 检查是否有数量/重量 为0的商品
  if (result) result = checkQuantityZero(getState, middle)

  if (result) {
    // 检查是否已经在结算状态
    result = checkInSettle(getState)
  }

  if (result) {
    // 交货时， 应收金额必须大于等于零
    result = checkShipmentValuePC(getState, dispatch)
  }

  // if (result) {
  //   /*校验退款权限*/
  //   result = await checkRefundAuth(getState, dispatch);
  // }

  // 同步示例, 直接返回true或者false
  if (result) {
    result = checkProductsku(getState, dispatch)
  }

  // 同步示例， 直接返回true或者false
  if (result) {
    result = checkVoucherDetail(getState, dispatch)
  }

  if (result) {
    result = checkVoucherHead(getState, dispatch)
  }

  if (result) {
    result = checkBackReason(getState, dispatch)
  }

  if (result) {
    result = checkWight(getState(), dispatch)
  }

  if (result) {
    result = checkOnline(getState(), dispatch)
  }

  if (result && !lineConnection) {
    result = check_o2o_settle(getState(), dispatch)
  }

  if (result) {
    /* 校验业务类型 */
    const businessType = getState().uretailHeader.toJS().infoData.businessType;
    if (!businessType.id || businessType.id == '') {
      cb.utils.alert('未录入业务类型，请检查！', 'error');
      result = false;
    }
  }

  if (result && options.autopromotion && options.autopromotion.value && firstOpenPromotion && lineConnection && cb.rest.terminalType != 3) {
    result = await checkOutoPromotion(getState(), dispatch)
  }

  // 异步示例, 使用'await'并返回promise
  if (result && (!options.allownegstock.value || options.autoDesignOutStockBatch.value || (options.goodsPositionManage.value && middle.rowHasWarehousePosition && options.autoDesignRetailPosition.value)) && lineConnection) {
    result = await checkStock(getState, dispatch)
  }

  /* 校验赊销营业员 */
  if (result) {
    result = await allEmloyeeIsSame(getState(), dispatch)
  }

  /* 校验赊销客户 */
  if (result) {
    result = await checkIsOwned(getState(), dispatch)
  }

  if (result) {
    /* 校验退款权限 */
    result = await checkRefundAuth(getState, dispatch);
  }

  /* add by jinzh1 校验是否需要短信验证+校验最低售价 */
  if (result) {
    result = await checkDiscountOperator(getState, dispatch, payType);
  }

  /* 保证此项校验在最后 */
  if (result) {
    result = await beforeSettleViewOpen(getState, dispatch)
  }
  return result
}

/* 校验退款权限 */
export function checkRefundAuth (getState, dispatch) {
  return new Promise(function (resolve) {
    /* 应收为负 */
    const totalValue = getState().product.toJS().money.Total.value;
    if (totalValue < 0) {
      const authData = getAuthData();
      if (authData.BackPay == false) {
        dispatch(showOperator(true, false, 'returnmoney', 'RM20', () => {
          resolve(true);
        }, null, null, null, () => { resolve(false) }));
      } else {
        resolve(true);
      }
    } else {
      resolve(true);
    }
  });
}

// 异步示例
export function checkStock (getState, dispatch) {
  const data = getRetailVoucherData(getState());
  checkStockBackData = data;
  /* 记录 校验库存前 数据 方便 取消结算时回滚 */
  if (presellBillInfo)
    data.presellinfo = presellBillInfo;
  return new Promise(function (resolve) {
    const config = {
      url: 'bill/stockchecking',
      method: 'POST',
      params: data,
    };
    proxy(config)
      .then(json => {
        if (json.code !== 200) {
          cb.utils.alert(json.message, 'error');
          resolve(false);
          return;
        }
        dispatch(genAction('PLATFORM_UI_BILLING_EXECUTE_PREFERENTIAL_UPDATE_PRODUCTS', {
          key: 'Real',
          value: json.data
        }));
        resolve(true);
      });
  })
}

export function afterPayModalClose () {
  return function (dispatch, getState) {
    if (checkStockBackData) {
      dispatch(genAction('PLATFORM_UI_BILLING_CANCEL_PREFERENTIAL_UPDATE_PRODUCTS',
        { key: 'Real', value: checkStockBackData }));
      checkStockBackData = null;
    }
  }
}

export function getPromotionMutexMap () {
  return promotionMutexMap;
}

export function getProductWarehouse (product) {
  if (!product.iWarehouseid_name)
    product.iWarehouseid_name = centerWareHouse_name || iWarehouseid_name
  if (!product.iWarehouseid) {
    if (centerWareHouse) {
      product.iWarehouseid = centerWareHouse;
      product.iWarehouseid_name = centerWareHouse_name;
      product.iWarehouseid_erpCode = centerWareHouse_erpCode;
    } else {
      product.iWarehouseid = iWarehouseid
      product.iWarehouseid_name = iWarehouseid_name;
      product.iWarehouseid_erpCode = iWarehouse_erpCode;
      product.warehouse_isGoodsPosition = warehouse_isGoodsPosition;
    }
  }
}

export function judgeFirstOpenPromotion (type, value) {
  if (type === 'get')
    return firstOpenPromotion
  if (type == 'set')
    firstOpenPromotion = value
}

// 检查是否正在结算
export function checkInSettle (getState) {
  // return true
  // return !getState()['paymode'].get('onSettle')
  const currentState = getState()
  const products = currentState.product.get('products').toJS()
  const onSettle = currentState.paymode.get('onSettle')

  return !(_.isEmpty(products) || onSettle)
}

// 检查是否有数量/重量 为0的商品
export function checkQuantityZero (getState, middle) {
  const products = getState().product.get('products')
  let hasZero = false
  products.forEach(product => {
    if (getFromMapOrObject(product, 'fQuantity') == 0)
      hasZero = true
    if (getFromMapOrObject(product, 'warehouse_isGoodsPosition'))
      middle.rowHasWarehousePosition = true
  })

  hasZero && cb.utils.alert('商品行有数量为0的数据，不可进行结算', 'error')

  return !hasZero
}

/* 执行过的优惠 */
export function executedPreferential () {
  let pass = true
  PreferentialExecuteBackup.forEach(ele => {
    if (ele.key === 'Promotion' || ele.key === 'Point' || ele.key === 'Coupon' || ele.key === 'Scene') {
      pass = false
    }
  })
  if (!pass)
    cb.utils.alert('执行过促销活动或现场折扣或积分抵扣或优惠券，断网络状态下不允许结算！', 'error')
  return pass
}

export function getMallorderInfo () {
  return mallorderInfo
}
/* 获取门店默认仓库 */
export function getDefaultWareHouse () {
  return { id: iWarehouseid, name: iWarehouseid_name, erpCode: iWarehouse_erpCode };
}

/* 中心配送时，存储表头中心配送给仓库用于替换新增商品时   表体仓库 */
export function modifyCenterWareHouseInfo (data) {
  if (!data) {
    centerWareHouse = null;
    centerWareHouse_name = null;
    centerWareHouse_erpCode = null;
  } else {
    centerWareHouse = data.id;
    centerWareHouse_name = data.name;
    centerWareHouse_erpCode = data.erpCode;
  }
}

/* 参照原单生成key,给张林用 */
export function generateKey (retailVouchData, retailVouchMeta) {
  const data = retailVouchData[retailVouchMeta.childrenField0]
  if (!data) return
  const _id = 'product'; const _skuId = 'productsku';
  data.forEach(ele => {
    if (!ele.key)
      ele.key = `${ele[_id]}|${ele[_skuId]}`
  })
}

/* 合并营业员 */
export function mergeEmployee (retailVouchData, retailVouchMeta, checkedEmployee) {
  const data = retailVouchData[retailVouchMeta.childrenField0]
  if (!data) return
  data.forEach(item => {
    item = Object.assign(item, checkedEmployee);
  });
}

/* ---------------------mobile----------------------------------------------------------- */
// 交货时， 应收金额必须大于等于零
export function checkShipmentValue (getState, dispatch) {
  const currentState = getState()
  const gathering = currentState.product.toJS().money.Gathering.value
  const { billingStatus } = currentState.uretailHeader.toJS()
  if ((billingStatus === 'Shipment' || billingStatus === 'PresellBill') && Number(gathering) < 0) {
    cb.utils.alert({
      title: '应收金额必须大于等于零',
      type: 'error'
    })
    return false
  }
  return true
}

/* 数字按照精度格式化 */
export const formatNum = (type, value) => {
  const options = getOptions();
  if (!options) return null;
  const { amountofdecimal, monovalentdecimal, numPoint_Rate } = options;
  switch (type) {
    case 'money':
      return isNaN(Number(value)) ? 0 : Number(Number(getRoundValue(value, amountofdecimal.value)))
    case 'price':
      return isNaN(Number(value)) ? 0 : Number(Number(getRoundValue(value, monovalentdecimal.value)))
    case 'rate':
      return isNaN(Number(value)) ? 0 : Number(Number(getRoundValue(value, numPoint_Rate.value)))
    default:
      return value
  }
}

export const formatMoney = (value) => {
  return formatNum('money', value)
}

const beforeSettleViewOpen = async (getState, dispatch) => {
  const billingViewModel = getBillingViewModel()
  if (!billingViewModel) {
    cb.utils.alert('正在初始化，请稍后重试', 'error');
    return false
  }
  const extendData = { getState, dispatch, getOptions, reviewHandleSave, getGlobalProducts, getDelZeroResult }
  return billingViewModel.warpPromiseExecute('beforeSettleViewOpen', extendData)
}

const beforeSaveService = async (extendData = {}) => {
  const billingViewModel = getBillingViewModel()
  if (!billingViewModel) {
    cb.utils.alert('正在初始化，请稍后重试', 'error');
    return false
  }
  return billingViewModel.warpPromiseExecute('beforeSaveService', extendData)
}

export const writeOriginBillMember = (dispatch, iMemberid) => {
  /* 王久龄说  不管有没有会员 先清 */
  dispatch(genAction('PLATFORM_UI_MEMBER_CLEAR', ''));
  if (iMemberid) {
    dispatch(queryMemberById(iMemberid));
  }
}

/* 单据带入开单 */
export function warpTransfer (dispatch) {
  return function (bills, billingStatus, noInitMember, mode) {
    const billingViewModel = getBillingViewModel()
    if (!billingViewModel) {
      cb.utils.alert('正在初始化，请稍后重试', 'error');
      return false
    }
    if (!bills || !Array.isArray(bills)) return
    let products = []
    bills.forEach(bill => {
      const { rm_retailvouch } = bill
      const { retailVouchDetails, iMemberid } = rm_retailvouch
      products = products.concat(retailVouchDetails);
      if (!noInitMember) writeOriginBillMember(dispatch, iMemberid)
      billingViewModel.loadData(rm_retailvouch);
      dispatch(genAction('PLATFORM_UI_BILLING_REFER_BILL_OK', { status: billingStatus || 'CashSale', data: rm_retailvouch }));
    })
    if (mode === 'update')
      dispatch(genAction('PLATFORM_UI_BILLING_EXECUTE_MEMBER_UPDATE_PRODUCTS', products))
    else
      dispatch(handleFurnitureBill(products))
  }
}

const setReduxState = (obj, reduxName) => {
  return (dispatch) => {
    dispatch(genAction(`PLATFORM_UI_BILLING_${reduxName.toLocaleUpperCase()}_EXTEND_SET_OPTIONS`, obj))
  }
}

const getOriginBill = (type) => {
  if (type === 'presellBillInfo')
    return presellBillInfo
  if (type === 'backBillInfo')
    return backBillInfo
}

/* 暴露开单参数 */
const collectBillingOptions = (dispatch, getState) => {
  return (optionName, reduxName) => {
    if (reduxName) {
      return () => {
        let data = null;
        if (getState()[reduxName])
          data = getState()[reduxName].get(optionName);
        if (!_.isEmpty(data) && Immutable.Iterable.isIterable(data))
          data = data.toJS()
        return data;
      }
    } else {
      switch (optionName) {
        case 'defaultWarehouse':
          return () => {
            return { iWarehouseid, iWarehouseid_name, iWarehouse_erpCode }
          }
        case 'billingStatus':
          return () => {
            return getState().uretailHeader.get('billingStatus')
          }
        case 'Businesstype_DataSource':
          return () => {
            let dataSource = getState().reserve.get('Businesstype_DataSource')
            if (Immutable.List.isList(dataSource)) dataSource = dataSource.toJS()
            return dataSource
          }
        case 'originBillHeader':
          return () => {
            const { getCommonParams } = funcCollect;
            return getCommonParams('preferentialHeader')
          }
        case 'businessType':
          return () => {
            let infoData = getState().uretailHeader.get('infoData');
            if (Immutable.Map.isMap(infoData)) infoData = infoData.toJS()
            return infoData.businessType
          }
        case 'products':
          return () => {
            const dataSource = getGlobalProducts();
            return dataSource
          }
        case 'focusedRow':
          return () => {
            let dataSource = getState().product.get('focusedRow')
            if (Immutable.Map.isMap(dataSource)) dataSource = dataSource.toJS()
            return dataSource
          }
        case 'promotionFilter':
          return () => {
            let dataSource = getState().product.get('promotionFilter')
            if (Immutable.List.isList(dataSource)) dataSource = dataSource.toJS()
            return dataSource
          }
        case 'billingOptions':
          return () => {
            return getOptions()
          }
        case 'paymodes':
          return () => {
            let dataSource = getState().paymode.get('paymodes')
            if (Immutable.Map.isMap(dataSource)) dataSource = dataSource.toJS()
            return dataSource
          }
        case 'getMoneyMap':
          return () => {
            let dataSource = getState().product.get('money');
            if (Immutable.Map.isMap(dataSource)) dataSource = dataSource.toJS()
            return dataSource
          }
        case 'memberInfo':
          return () => {
            let dataSource = getState().member.get('memberInfo');
            if (Immutable.Map.isMap(dataSource)) dataSource = dataSource.toJS()
            return dataSource.data
          }
        case 'touchHasGetGiftService':
          return () => {
            const dataSource = getState().touchRight.get('touchHasGetGiftService');
            return dataSource
          }
        case 'exchangeBillMapping':
          return () => {
            return getExchangeBillMapping()
          }
        case 'retailVouchData':
          return () => {
            return getRetailVoucherData(getState());
          }
        case 'currentBillHeader':
          return () => {
            return getBillingHeader(getState())
          }
        case 'authData':
          return () => {
            return getAuthData();
          }
      }
    }
  }
}

/* 暴露开单方法 */
const getBillingFunc = (dispatch) => {
  const { showHeaderInfo, setPaymodes, getProductConstant, closePaymodal, getPromotionData, warpGetMemberPrice, commonAfterGetMemberPrice, _transferRefer2Bill, setProductConstant, deleteProducts, modifyQuantity, scanEnter } = funcCollect;
  /* 异步action方法写入 */
  const target = {
    handlePresellBillData,
    setReduxState,
    deleteProducts,
    deleteProductAction: (key) => { return dispatch(genAction('PLATFORM_UI_BILLING_DELETE_PRODUCT', key)) },
    modifyQuantity,
    scanEnter,
    setSearchBoxFocus,
  }
  return {
    showHeaderInfo: (callback) => { return dispatch(showHeaderInfo(callback)) },
    updateFocusedRow: (product) => { return dispatch(genAction('PLATFORM_UI_BILLING_UPDATE_PRODUCT', product)) },
    updateProducts: (products) => { return dispatch(genAction('PLATFORM_UI_BILLING_EXECUTE_MEMBER_UPDATE_PRODUCTS', products)) },
    updateCheckDiscountAuth: (bCheckDiscountAuth) => { return dispatch(genAction('PLATFORM_UI_BILLING_DISCOUNT_SET_CHECKDISCOUNTAUTH', bCheckDiscountAuth)) },
    modifyPreferentialHeader: (headerData) => { return dispatch(modifyPreferentialHeader(headerData)) },
    mutable: (value) => { return (Immutable.Iterable.isIterable(value) ? value.toJS() : value) },
    setPaymodes: (obj) => { return dispatch(setPaymodes(obj)) },
    _mergeWith: (obj, source, customizer) => { return _.mergeWith(obj, source, customizer) },
    getDefaultBusinessType: (saleType) => { return dispatch(getDefaultBusinessType(saleType)) },
    setMoneyMap: (obj) => { return dispatch(genAction('PLATFORM_UI_BILLING_UPDATE_MONEYMAP', { money: obj })) },
    cancelModal: () => { return dispatch(handleCancel()) },
    setPromotionFilter: (value) => { return dispatch(genAction('PLATFORM_UI_BILLING_SET_OPTIONS', { promotionFilter: value })) },
    wrapFunc: (bills, billingStatus, noInitMember, mode) => { return warpTransfer(dispatch)(bills, billingStatus, noInitMember, mode) },
    closePaymodal: (isComplete) => { return dispatch(closePaymodal(isComplete)) },
    getPromotionData: (promotionFilter) => { return dispatch(getPromotionData(promotionFilter)) },
    modifyQuotePrice: (product, bGetPrice, type, editRowCallback) => { return dispatch(modifyQuotePrice(product, bGetPrice, type, editRowCallback)) },
    warpGetMemberPrice: (billProducts, actionName, successCallback, errorCallback) => { return dispatch(warpGetMemberPrice(billProducts, actionName, successCallback, errorCallback)) },
    commonAfterGetMemberPrice: (...params) => { return dispatch(commonAfterGetMemberPrice(...params)) },
    clearBillDetail: (...params) => { return dispatch(genAction('PLATFORM_UI_BILLING_CLEAR_BILL_DETAIL')) },
    ModifyBillStatus: (value) => { return dispatch(ModifyBillStatus(value)) },
    onlyUpdateProducts: (products) => { return dispatch(onlyUpdateProducts(products)) },
    afterPayModalClose: () => { return dispatch(afterPayModalClose()) },
    showEdit: (bCheckDetail, checkedRows) => { return dispatch(showEdit(bCheckDetail, checkedRows)) },
    ...bindFunctionCreators(target, dispatch),
    _transferRefer2Bill,
    getProductConstant,
    setProductConstant,
    formatMoney,
    formatNum,
    getMultiplication,
    timeRange,
    getOriginBill,
    getPromotionMutexMap,
    calcMoney,
  }
}

const bindFunctionCreators = (target, dispatch) => {
  const iteratorMap = {}
  if (typeof target === 'object' && target instanceof Object) {
    for (const attr in target) {
      if (typeof target[attr] === 'function') {
        iteratorMap[attr] = bindAction(target[attr], dispatch)
      }
    }
  }
  if (typeof target === 'function') {
    iteratorMap[target] = bindAction(target, dispatch)
  }
  return iteratorMap
}

const bindAction = (func, dispatch) => {
  return (...params) => { return dispatch(func(...params)) }
}

/* add by jinzh1  checkOpen 前事件 */
const beforeCheckOpen = (params) => {
  const billingViewModel = getBillingViewModel();
  if (!billingViewModel) {
    cb.utils.alert('正在初始化，请稍后重试', 'error');
    return false
  }
  return billingViewModel.execute('beforeCheckOpen', params)
}

/* add by jinzh1  beforCheckVouch */
const beforeCheckVouch = (params) => {
  const billingViewModel = getBillingViewModel();
  if (!billingViewModel) {
    cb.utils.alert('正在初始化，请稍后重试', 'error');
    return false
  }
  return billingViewModel.execute('beforeCheckVouch', params)
}

/* 映射关系 */
const transferRule = (target) => {
  const productRefer2BillKeyFieldMap = {}
  try {
    var obj = JSON.parse(target);
    for (var attr in obj) {
      var billKey = attr;
      var referKey = obj[billKey];
      const index = billKey.indexOf('@');
      if (index > -1) {
        const iterators = billKey.substr(index + 1).split('@@');
        const startIndex = parseInt(iterators[0]); const endIndex = parseInt(iterators[1]);
        billKey = billKey.substr(0, index);
        referKey = referKey.substr(0, referKey.indexOf('@'));
        for (var i = startIndex, len = endIndex - startIndex + 1; i <= len; i++) {
          if (!productRefer2BillKeyFieldMap[referKey + i])
            productRefer2BillKeyFieldMap[referKey + i] = [];
          productRefer2BillKeyFieldMap[referKey + i].push(billKey + i);
        }
      } else {
        if (!productRefer2BillKeyFieldMap[referKey])
          productRefer2BillKeyFieldMap[referKey] = [];
        productRefer2BillKeyFieldMap[referKey].push(billKey);
      }
    }
    // console.log('商品参照携带字段映射：' + JSON.stringify(productRefer2BillKeyFieldMap, null, '\t'));
  } catch (e) {
    console.error('参照携带定义' + target + '有错误');
    return productRefer2BillKeyFieldMap
  }
  return productRefer2BillKeyFieldMap
}

/* 转换动作 */
const transferAction = (transfer, referData, billData) => {
  for (const attr in transfer) {
    const billKeys = transfer[attr];
    billKeys.forEach(billKey => {
      billData[billKey] = referData[attr];
    });
  }
}

const beforeCancelPending = (data, billingViewModel) => {
  if (!billingViewModel) {
    cb.utils.alert('正在初始化，请稍后重试', 'error');
    return
  }
  return billingViewModel.execute('beforeCancelPending', { data })
}

const beforePresellBill2Retail = (data, billingViewModel) => {
  if (!billingViewModel) {
    cb.utils.alert('正在初始化，请稍后重试', 'error');
    return
  }
  return billingViewModel.execute('beforePresellBill2Retail', { data })
}

const beforeBillCodeLogic = (data) => {
  const billingViewModel = getBillingViewModel();
  if (!billingViewModel) {
    cb.utils.alert('正在初始化，请稍后重试', 'error');
    return false
  }
  return billingViewModel.execute('beforeBillCodeLogic', { data })
}

const afterGetGatheringVouchData = (gatheringVouchData) => {
  const billingViewModel = getBillingViewModel();
  if (!billingViewModel) {
    cb.utils.alert('正在初始化，请稍后重试', 'error');
    return false
  }
  return billingViewModel.execute('afterGetGatheringVouchData', { gatheringVouchData })
}

const trans = (formatStyle, value) => {
  if (formatStyle.before)
    value = '' + formatStyle.before + value
  if (formatStyle.after)
    value = '' + value + formatStyle.after
  return value
}

export function formateProduct (product) {
  for (const attr in retailVouchDetailsFormat) {
    if (product[attr] && retailVouchDetailsFormat[attr]) {
      product[attr] = trans(retailVouchDetailsFormat[attr], product[attr])
    }
  }
}

/* add by jinzh1  获取缓存的元数据 */
export function getMetaCache () {
  return metaCache;
}
/* add by jinzh1  仅更新products */
export function onlyUpdateProducts (products) {
  return function (dispatch, getState) {
    dispatch(genAction('PLATFORM_UI_BILLING_DISCOUNT_UPDATE_PRODUCTS', products))
  }
}
