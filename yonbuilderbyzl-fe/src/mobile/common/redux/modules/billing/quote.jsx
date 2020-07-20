import Immutable from 'immutable';
import { genAction, getMultiplication } from '@mdf/cube/lib/helpers/util';
import { modifyQuotePrice, modifyQuantity, getExchangeBillMapping } from './product';
import { getBillingStatus } from './uretailHeader';
import { getOptions, canExecute, formatNum } from './mix';
import { getRoundValue } from '@mdf/cube/lib/helpers/util';
import { getOnlineCondition } from './actions';
import { getBillingViewModel} from './config';
let valueBackup = 0;
let quantityBackup = 0;
let options = {};

/* 移动端参数 */
let canModifyQuote = true;
let canModifyQuantity = true;

const $$initialState = Immutable.fromJS({
  value: valueBackup,
  quantity: quantityBackup,
  maxQuantity: {}
});

export default ($$state = $$initialState, action) => {
  switch (action.type) {
    case 'PLATFORM_UI_BILLING_QUOTE_CHANGE_VALUE':
      return $$state.set('value', action.payload);
    case 'PLATFORM_UI_BILLING_QUOTE_CHANGE_QUANTITY':
      return $$state.set('quantity', action.payload);
    case 'PLATFORM_UI_BILLING_QUOTE_CHANGE_MAXQUANTITY':
      return $$state.set('maxQuantity', action.payload);
    case 'PLATFORM_UI_BILLING_SET_FOCUSED_ROW': {
      const maxQ = $$state.get('maxQuantity').toJS();
      const row = action.payload;
      valueBackup = row.fQuotePrice;
      quantityBackup = row.fQuantity;
      if (!maxQ[row.key]) maxQ[row.key] = row.fQuantity;
      return $$state.merge({ value: valueBackup, quantity: quantityBackup, rowData: row, maxQuantity: maxQ });
    // return $$state.set('value', valueBackup);
    }
    case 'PLATFORM_UI_BILLING_Action_HandleCancel':
      return $$state.merge({ value: valueBackup, quantity: quantityBackup });
    case 'PLATFORM_UI_BILLING_CLEAR':
      valueBackup = 0
      quantityBackup = 0;
      canModifyQuote = true;
      canModifyQuantity = true;
      return $$state.merge({ value: 0, quantity: 0, rowData: {}, maxQuantity: {} });
    case 'PLATFORM_UI_BILLING_QUOTE_INIT':
      return $$state.merge(action.payload);
    default:
      return $$state;
  }
}
export function InitQuote () {
  return function (dispatch, getState) {
    let row = getState().product.get('focusedRow');
    if (Immutable.Map.isMap(row)) row = row.toJS();

    const maxQ = getState().quote.toJS().maxQuantity;
    valueBackup = row.fQuotePrice;
    quantityBackup = row.fQuantity;
    if (!maxQ[row.key]) maxQ[row.key] = row.fQuantity;
    dispatch(genAction('PLATFORM_UI_BILLING_QUOTE_INIT', {
      value: valueBackup, quantity: quantityBackup, rowData: row, maxQuantity: maxQ
    }))
  }
}
/* 改零售价 */
export function changeValue (val) {
  return function (dispatch, getState) {
    if (cb.rest.terminalType == 3 && !canModifyQuote) return;
    const monovalentdecimal = options.monovalentdecimal ? options.monovalentdecimal.value : 2;
    if (val != '-') {
      const v = val.toString().split('.');
      if (v[1] != undefined && v[1].length > monovalentdecimal) {
        val = getRoundValue(val, monovalentdecimal);
      }
    }
    dispatch(genAction('PLATFORM_UI_BILLING_QUOTE_CHANGE_VALUE', val));
  }
}
/* 改数量 */
export function changeQuantity (val) {
  return function (dispatch, getState) {
    if (cb.rest.terminalType == 3 && !canModifyQuantity) return;
    const numPoint_Quantity = options.numPoint_Quantity ? options.numPoint_Quantity.value : 2;
    if (val != '-') {
      const v = val.toString().split('.');
      if (v[1] != undefined && v[1].length > numPoint_Quantity) {
        val = getRoundValue(val, numPoint_Quantity);
      }
    }
    dispatch(genAction('PLATFORM_UI_BILLING_QUOTE_CHANGE_QUANTITY', val));
  }
}
/* 获取系统参数  精度等 */
export function getSysOptions () {
  return function (dispatch) {
    const sysOptions = getOptions();
    options = sysOptions;
  }
}

export function exec (price, editRowCallback) {
  return function (dispatch, getState) {
    let newPrice = parseFloat(getState().quote.toJS().value);
    if (!cb.utils.isEmpty(price)) newPrice = parseFloat(price);
    valueBackup = newPrice;
    dispatch(genAction('PLATFORM_UI_BILLING_Action_HandleCancel'));
    let productFocusedRow = getState().product.get('focusedRow');
    if (Immutable.Map.isMap(productFocusedRow)) productFocusedRow = productFocusedRow.toJS();
    if (productFocusedRow) {
      Object.assign(productFocusedRow, {
        fQuotePrice: formatNum('price', newPrice),
        fQuoteMoney: formatNum('money', getMultiplication(newPrice, productFocusedRow.fQuantity, 'Multiplication')),
        fPrice: formatNum('price', newPrice),
        fMoney: formatNum('money', getMultiplication(newPrice, productFocusedRow.fQuantity, 'Multiplication')),
        fDiscount: 0
      });
      /* 添加改价不重会员价/零售价 */
      productFocusedRow.bQuote = true;
      dispatch(modifyQuotePrice(productFocusedRow, null, null, editRowCallback));
    }
  }
}

export function execQuantity (num, row) {
  return function (dispatch, getState) {
    const quantity = (num !== undefined) ? parseFloat(num) : parseFloat(getState().quote.toJS().quantity);
    let focusedRow = getState().product.get('focusedRow');
    if (Immutable.Map.isMap(focusedRow)) focusedRow = focusedRow.toJS();
    if (cb.rest.terminalType == 3) focusedRow = row;
    // let products = getGlobalProducts();

    // if (cb.rest.terminalType == 3) focusedRow = row;

    // if (focusedRow.iPromotionProduct == 1 || focusedRow.iPromotionProduct == 2 || focusedRow.iPromotionProduct == 3) {
    //   let canQantity = getQuantityByMaterKey(focusedRow.key, products);/*获取最大赠品数量*/
    //   canQantity += focusedRow.fQuantity;
    //   if (canQantity < 0 || canQantity < quantity) {
    //     cb.utils.alert('已达到当前促销活动最大赠品数量！', 'error');
    //     return
    //   }
    //   dispatch(setPromotionMasterMap(focusedRow, quantity, canQantity));/*更新已选赠品数量*/
    // }
    if(!updatePromotionMap_changeNum(quantity, focusedRow)) return

    dispatch(genAction('PLATFORM_UI_BILLING_Action_HandleCancel'));
    dispatch(modifyQuantity(focusedRow, quantity));
  }
}

// 赠品的判断
const updatePromotionMap_changeNum = (quantity, focusedRow) => {
  const billingViewModel = getBillingViewModel();
  if (!billingViewModel) {
    cb.utils.alert('正在初始化，请稍后重试', 'error');
    return false
  }
  return billingViewModel.execute('updatePromotionMap_changeNum', {quantity, focusedRow})
}

export function canOpen (dispatch, globalState, callback) {
  const billingStatus = getBillingStatus();
  let focusedRow = globalState.product.get('focusedRow');
  if (Immutable.Map.isMap(focusedRow)) focusedRow = focusedRow.toJS();

  const fSceneDiscount = focusedRow.fSceneDiscount ? focusedRow.fSceneDiscount : 0;
  if (fSceneDiscount !== 0) {
    cb.utils.alert('已经执行了现场折扣,不允许改零售价！', 'error');
    canModifyQuote = false;
    return
  }
  if ((billingStatus == 'NoFormerBackBill' || billingStatus == 'FormerBackBill') && focusedRow.fQuoteMoney < 0) {
    cb.utils.alert('退货行不允许改零售价', 'error');
    canModifyQuote = false;
    return
  }
  if (focusedRow.noModify) {
    cb.utils.alert('原单退货中，换货行不允许修改零售价！', 'error');
    canModifyQuote = false;
    return
  }
  if (focusedRow.bFixedCombo) {
    cb.utils.alert('固定套餐不允许改零售价', 'error');
    canModifyQuote = false;
    return
  }
  const exchangeBillMapping = getExchangeBillMapping();
  if (exchangeBillMapping[focusedRow.key] && focusedRow.retailPriceDimension == 1) {
    cb.utils.alert('没有可以改零售价的商品行', 'error');
    canModifyQuote = false;
    return
  }
  const promotionwrite = focusedRow.promotionwrite;
  if (promotionwrite && promotionwrite.length > 0) {
    cb.utils.alert('已经执行促销活动，不能改零售价！', 'error');
    canModifyQuote = false;
    return
  }
  /* 预订状态 --开单允许改价为否  且 没有选择sku的商品    可以改价   变态~~~~~~~ */
  if (billingStatus == 'PresellBill') {
    const specs = focusedRow.specs; const specsBtn = focusedRow.specsBtn;
    if (!focusedRow.product_productOfflineRetail_isPriceChangeAllowed) {
      if ((!specs || specs == '') && specsBtn == true) {
        canModifyQuote = true;
        callback();
      } else {
        canModifyQuote = false;
        cb.utils.alert('当前商品不允许开单改价', 'error');
        return
      }
    }
    callback();
  } else {
    if (!focusedRow.product_productOfflineRetail_isPriceChangeAllowed) {
      const infoData = globalState.uretailHeader.get('infoData')
      const onlineDeliverModify = Immutable.Map.isMap(infoData) ? infoData.get('bDeliveryModify') : infoData.bDeliveryModify
      if (billingStatus == 'OnlineBill' && onlineDeliverModify) {

      } else {
        canModifyQuote = false;
        cb.utils.alert('当前商品不允许开单改价', 'error');
        return
      }
    }
    canModifyQuote = true;
    callback();
  }
}
export function canQuantityOpen (dispatch, globalState, callback, whereEnter, row, bReWeight) {
  let focusedRow = globalState.product.get('focusedRow');
  if (Immutable.Map.isMap(focusedRow)) focusedRow = focusedRow.toJS();
  const money = globalState.product.get('money').toJS();
  const industry = globalState.user.toJS().tenant.industry;/* 所属行业 */
  const modalData = globalState.actions.toJS().modalData;

  if (cb.rest.terminalType == 3) focusedRow = row;

  if (!goPubilicCanQuantityOpen()) {
    callback()
    return
  }
  if (focusedRow.product_productOfflineRetail_isSerialNoManage) {
    cb.utils.alert('序列号管理商品不允许修改数量！', 'error');
    canModifyQuantity = false;
    return
  }
  if (focusedRow.bFixedCombo && focusedRow.children) {
    const hasSn = focusedRow.children.some(child => {
      return (child.product_productOfflineRetail_isSerialNoManage && child.cSerialNo)
    })
    if (hasSn) {
      cb.utils.alert('序列号管理商品不允许修改数量！', 'error');
      canModifyQuantity = false;
      return
    }
  }

  const fSceneDiscount = focusedRow.fSceneDiscount ? focusedRow.fSceneDiscount : 0;
  if (fSceneDiscount !== 0) {
    cb.utils.alert('已经执行了现场折扣,不允许改数量！', 'error');
    canModifyQuantity = false;
    return
  }
  if (money.Promotion.done && focusedRow.iPromotionProduct != 1 && focusedRow.iPromotionProduct != 2 && focusedRow.iPromotionProduct != 3) {
    // if (money.Promotion.done) {
    cb.utils.alert('已经执行了促销活动,不允许修改商品数量！', 'error');
    canModifyQuantity = false;
    return
  }
  if (focusedRow.noModify) {
    cb.utils.alert('原单退货中，换货行不允许修改数量！', 'error');
    canModifyQuantity = false;
    return
  }
  if (industry == 17 && focusedRow['product_productProps!define2'] === '是') {
    cb.utils.alert('回收品不允许修改数量！', 'error');
    canModifyQuantity = false;
    return
  }
  if (focusedRow.bFixedCombo) {
    // let quantity = 0;
    if (focusedRow.promotionwrite) {
      // quantity = focusedRow.fQuantity / focusedRow.promotionwrite[0].fQuantity;
      // dispatch(genAction('PLATFORM_UI_BILLING_QUOTE_CHANGE_QUANTITY', quantity));
      cb.utils.alert('当前行不允许修改数量！', 'error');
      canModifyQuantity = false;
      return
    }
    modalData.ModifyQuantity.title = '套餐数量';
    if(whereEnter != 'inputNum') dispatch(genAction('PLATFORM_UI_BILLING_QUOTE_CHANGE_QUANTITY', focusedRow.fQuantity));
    dispatch(genAction('PLATFORM_UI_BILLING_ACTION_MODIFY_MODALDATA_QUANTITY', modalData));
  } else {
    if (!bReWeight) {
      if(whereEnter != 'inputNum') dispatch(genAction('PLATFORM_UI_BILLING_QUOTE_CHANGE_QUANTITY', focusedRow.fQuantity));
      modalData.ModifyQuantity.title = '商品数量';
      dispatch(genAction('PLATFORM_UI_BILLING_ACTION_MODIFY_MODALDATA_QUANTITY', modalData));
    }
  }
  canModifyQuantity = true;
  if (!afterCanQuantityOpen(globalState, { canModifyQuantity })) return
  callback();
}

/* 1.改数量校验 2.支持传入数量（电子秤） */
export function checkBeforeOpenQuantity (modalKey_Current, num, bCheck) {
  return function (dispatch, getState) {
    const globalState = getState();
    const billingStatus = getBillingStatus();
    const middle = (modalKey_Current == 'Quantity' ? 'ModifyQuantity' : modalKey_Current)
    const onLineBillCondition = getOnlineCondition(middle, billingStatus, globalState);
    let focusedRow = globalState.product.get('focusedRow');
    if (Immutable.Map.isMap(focusedRow)) focusedRow = focusedRow.toJS();
    if (onLineBillCondition) {
      cb.utils.alert('电商订单不支持该种操作！', 'error');
      return false;
    }
    /* add by jinzh1  称重点取数的时候才进行校验 */
    if (bCheck)
      canExecute(globalState, modalKey_Current, () => {
        canQuantityOpen(dispatch, globalState, () => {
          dispatch(modifyQuantity(focusedRow, num))
        }, null, null, true)
      }, dispatch);
    else
      dispatch(modifyQuantity(focusedRow, num))
  }
}
export function checkQuantity (num, product) {
  return function (dispatch, getState) {
    canExecute(getState(), 'Quantity', () => {
      canQuantityOpen(dispatch, getState(), () => {
        dispatch(execQuantity(num, product))
      }, null, product)
    }, dispatch);
  }
}

const afterCanQuantityOpen = (globalState, extend) => {
  const billingViewModel = getBillingViewModel();
  if (!billingViewModel) {
    cb.utils.alert('正在初始化，请稍后重试', 'error');
    return false
  }
  return billingViewModel.execute('afterCanQuantityOpen', extend)
}

const goPubilicCanQuantityOpen = () => {
  const billingViewModel = getBillingViewModel();
  if (!billingViewModel) {
    cb.utils.alert('正在初始化，请稍后重试', 'error');
    return false
  }
  return billingViewModel.execute('goPubilicCanQuantityOpen', {})
}
