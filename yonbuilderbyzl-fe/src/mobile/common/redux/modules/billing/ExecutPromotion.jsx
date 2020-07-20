import Immutable from 'immutable';
import { genAction, proxy } from '@mdf/cube/lib/helpers/util';
import { push, goBack } from 'react-router-redux';
import _ from 'lodash'

import { getRetailVoucherData, getPromotionMutexMap, getOptions, checkWight, formatMoney } from './mix';
import { setFocusedRow, beforeOpenRefer, getGlobalProducts, getProductConstant } from './product';
import { showModal } from './actions';
import { getBillingViewModel } from './config';
let productsChildrenField = null;
let promotionsChildrenField = null;
let promotionDataBackup = null;
let memberDataBackup = null;
let hasCancelAutoPromotion = false;
const $$initialState = Immutable.fromJS({
  promotionData: [],
  checkedList: {},
  checkedPromotion: [], /* mobile */
})

/**
 * 促销孙表（promotionwrite）
 * iPromotionType: 1=买赠活动，2=整单促销，3=商品促销，4=固定套餐，5=搭配限购，
 * 6=加价购，7=珠宝商品促销，8=珠宝满减满折，9=时段(秒杀)促销，10=第N件优惠
 * 赠品表（promotionfilter）
 * itemtype: 6=送克数，7=赠品
 * filterType（赠品的范围）: 6=赠品范围为全部，标签、商品分类、指定商品、指定sku
 *
 * 前端主要处理 1 5 6 8；除去金一8；常用1 5 6，1和6前端处理逻辑一样；实际分两种 1 和 5
*/

// reducer
export default ($$state = $$initialState, action) => {
  switch (action.type) {
    case 'PLATFORM_UI_PRODUCT_SET_CHILDREN_FIELD':
      productsChildrenField = action.payload;
      return $$state;
    case 'PLATFORM_UI_PROMOTION_SET_CHILDREN_FIELD':
      promotionsChildrenField = action.payload;
      return $$state;
    case 'PLATFORM_UI_BILLING_EXECUTPROMOTION_SET_COMMONDATA':
      return $$state.merge(action.payload);
    case 'PLATFORM_UI_BILLING_RESTORE_PREFERENTIAL_PROMOTION_BACKUP':
      promotionDataBackup = action.payload;
      return $$state;
    case 'PLATFORM_UI_BILLING_CLEAR':
      hasCancelAutoPromotion = false;
      return $$state.merge({
        promotionData: [],
        checkedList: {},
        checkedPromotion: [],
      });
    case 'BILLING_PROMOTION_CLEAR':
      return $$state.merge({
        promotionData: [],
        checkedList: {},
        checkedPromotion: [],
      });
    default:
      return $$state;
  }
}
export function setData (val) {
  return function (dispatch) {
    dispatch(genAction('PLATFORM_UI_BILLING_EXECUTPROMOTION_SET_COMMONDATA', val));
  }
}
// 更新结算方式
export function getPromotionData (swallowTip, failCallback, filter) {
  return async function (dispatch, getState) {
    const config = {
      url: 'mall/bill/preferential/querypreferential.do',
      method: 'POST',
      params: {
        data: JSON.stringify(getRetailVoucherData(getState()))
      }
    };
    if (filter && typeof filter === 'object') {
      Object.assign(config.params, { hasCancelAutoPromotion }, filter)
    }
    if (!beforeGetpromotionData(config.params)) return 'notPop'
    const json = await proxy(config);
    if (json.code !== 200) return;
    const data = json.data;
    const checkedList = {};
    data.map(item => {
      item.key = `${item.type}_${item.ID}`;
      checkedList[item.key] = false;
    });
    if (data.length == 0) {
      !swallowTip && cb.utils.alert('没有适用的促销活动！', 'error')
      failCallback && failCallback()
      return 'notPop'
    }
    dispatch(genAction('PLATFORM_UI_BILLING_EXECUTPROMOTION_SET_COMMONDATA', { promotionData: data, checkedList: checkedList }));
  }
}
const transferData = (data) => {
  const promotionMutexMap = getPromotionMutexMap();
  if (promotionMutexMap.iMemberDiscountEnable) {
    memberDataBackup = cb.utils.extend(true, {}, data);
    const details = data.retailVouchDetails;
    details.forEach(detail => {
      // fQuotePrice零售价  fPrice实销价  fMoney实销金额 fDiscount折扣额 fQuantity数量
      detail.fPrice = detail.fQuotePrice;
      detail.fMoney = formatMoney(detail.fPrice * detail.fQuantity);
      detail.fDiscount = 0;
      detail.fVIPDiscount = 0;
      detail.per_fVIPDiscount = 0;
      detail.fVIPRate = 100;
      detail.fVIPPrice = detail.fQuotePrice;
    })
    data.retailVouchDetails = details;
  }
  return data;
}
const checkBackInfo = (dispatch, globalState) => {
  const returnseasonentry = getOptions().returnseasonentry ? getOptions().returnseasonentry.value : false;
  const billingStatus = globalState.uretailHeader.toJS().billingStatus;
  const { products } = globalState.product.toJS();
  const backInfoProducts = []; let bSuccess = true;
  /* modfiy by jinzh1 由于退货原因和改行合并   校验退货原因等字段时 需要同时setFocusedRow */
  if ((returnseasonentry === true || returnseasonentry === 'true') && (billingStatus == 'FormerBackBill' || billingStatus == 'NoFormerBackBill')) { // 退货原因必输
    for (let i = 0, len = products.length; i < len; i++) {
      if (!products[i].iBackid && products[i].fQuantity < 0) {
        backInfoProducts.push(products[i]);
        if (bSuccess) dispatch(setFocusedRow(products[i], i + 1));
        bSuccess = false;
      }
    }
  }
  if (backInfoProducts.length > 0) {
    cb.utils.alert('请填写退货原因!', 'error')
    dispatch(showModal('UpdateBackInfo', backInfoProducts))
    return false
  } else {
    return true
  }
}

export function exec () {
  return function (dispatch, getState) {
    const modalOpening = getState().actions.get('modalOpening');
    if(!modalOpening) return
    dispatch(genAction('PLATFORM_UI_BILLING_ACTION_MERGE', { modalOpening: false }))/* lz 托利多点击多次确定按钮 */
    const { checkedList, promotionData } = getState().promotion.toJS();
    const promotionMutexMap = getPromotionMutexMap();
    const promotions = [];
    promotionData.forEach(item => {
      if (!checkedList[item.key]) return;
      promotions.push(item);
    });
    const data = getRetailVoucherData(getState());
    const newdata = transferData(data);
    const config = {
      url: 'mall/bill/preferential/executepreferential',
      method: 'POST',
      params: {
        promotions: JSON.stringify(promotions),
        data: JSON.stringify(newdata)
      }
    };
    proxy(config)
      .then(json => {
        if (json.code !== 200) {
          cb.utils.alert(json.message, 'error');
          dispatch(genAction('PLATFORM_UI_BILLING_ACTION_MERGE', { modalOpening: true }))
          return;
        }
        promotionDataBackup = data;
        // let stash = [];
        updatePromotionMap(json.data[productsChildrenField])
        json.data[productsChildrenField].forEach(product => {
          // if (!product[promotionsChildrenField]) return; 蔡何威非要把促销挂到第一行(可能是退货行)
          /* lz 更新赠品行的totalQuantity */
          // if (product.promotionfilter)
          //     stash = product.promotionfilter;
          // if (product.iPromotionProduct === 1) { //先录赠品且不为自动促销
          // // if (product.iPromotionProduct === 1 && !product.autoPromotion) 既是自动，又是赠品
          //     let uniqPromoIdArr = onlyGiftPromotionFilter(product.promotionwrite);
          //     let currentId = uniqPromoIdArr[0].iPromotionid
          //     for(let i=0,len=stash.length;i<len;i++){
          //         let ele = stash[i]
          //         if (ele.iPromotionid == currentId) {
          //             if (!ele.isLimitPurchase) {
          //                 product.totalQuantity = ele.flotQuantity;
          //                 product.promotion_id = ele.iPromotionid;
          //                 product.isLimitPurchase = ele.isLimitPurchase;
          //             }
          //             if (ele.isLimitPurchase) {
          //                 let confirmPromotion = addNewGift(null, stash, product, true, true);
          //                 product.totalQuantity = confirmPromotion.flotQuantity;
          //                 product.promotion_id = confirmPromotion.iPromotionid;
          //                 product.isLimitPurchase = confirmPromotion.isLimitPurchase;
          //             }
          //             break
          //         }
          //     }
          // }

          if (product[promotionsChildrenField]) {
            const text = [];
            product[promotionsChildrenField].forEach(item => {
              const promotion = promotions.find(item1 => {
                return item1.type === item.iPromotionType && item1.ID === item.iPromotionid;
              });
              if (!promotion) return;
              text.push(promotion.name);
            });
            /* 后端促销，前端促销，一锅乱炖 */
            product.promotionTips = product.promotionTips ? (product.promotionTips + ',' + text.join(',')) : text.join(',');
          }
        });
        if (promotionMutexMap.iMemberDiscountEnable)
          dispatch(genAction('PLATFORM_UI_BILLING_EXECUTE_MEMBER_UPDATE_PRODUCTS', json.data.retailVouchDetails));
        dispatch(genAction('PLATFORM_UI_BILLING_EXECUTE_PREFERENTIAL_UPDATE_PRODUCTS', { key: 'Promotion', value: json.data, backup: data }));
        dispatch(genAction('PLATFORM_UI_BILLING_Action_HandleCancel'));
        // let havePromotionRow = null;
        // json.data.retailVouchDetails.forEach(product => {
        //   if (product.promotionfilter && havePromotionRow === null)
        //     havePromotionRow = product;
        // })
        dispatch(beforeOpenRefer(json.data.retailVouchDetails))
        if(cb.rest.terminalType == 3) dispatch(goBack());
      });
  }
}

const updatePromotionMap = (details) => {
  const billingViewModel = getBillingViewModel();
  if (!billingViewModel) {
    cb.utils.alert('正在初始化，请稍后重试', 'error');
    return
  }
  const promotionMap = getProductConstant('promotionMap');
  return billingViewModel.execute('afterExecutePreferential', {promotionMap, details})
}

export function ExeAfterCancelPending (data) {
  return (dispatch) => {
    const filterRow = data.retailVouchDetails.find(ele => {
      return ele.promotionfilter && ele.promotionfilter.length > 0
    })
    if (!filterRow) return
    updatePromotionMap(data[productsChildrenField])
    dispatch(beforeOpenRefer(data.retailVouchDetails))
  }
}

export async function canOpen (dispatch, globalState, callback, swallowTip, failCallback) {
  if (globalState.product.toJS().money.Promotion.done) {
    let hasMember = false; let backValue = promotionDataBackup;
    cb.utils.confirm('将清除全部促销活动，是否继续？', function () {
      const promotionMutexMap = getPromotionMutexMap();
      if (globalState.member.toJS().memberInfo.code == 200) hasMember = true;
      if (promotionMutexMap.iMemberDiscountEnable && hasMember) {
        backValue = memberDataBackup;
      }
      dispatch(genAction('PLATFORM_UI_BILLING_CANCEL_PREFERENTIAL_UPDATE_PRODUCTS', { key: 'Promotion', value: backValue }));
      dispatch(genAction('PLATFORM_UI_BILLING_PRODUCT_CLEAR_PROMOTION', { promotionFilter: null }))
      promotionDataBackup = null;
      memberDataBackup = null;
      if(cb.rest.terminalType == 3) {
        dispatch(genAction('BILLING_PROMOTION_CLEAR', ''));
        callback();
      }
    }, function () {
      failCallback && failCallback()
    });
    return;
  }
  if(cb.rest.terminalType == 3) dispatch(push('/promotion'));
  const continuePromotionList = await goContinuePromotionList(globalState, dispatch)
  // if (!continuePromotionList.resolveResult) return //取消自动促销后仍走弹促销活动逻辑(结算处问题)
  if (!checkBackInfo(dispatch, globalState)) return;
  if (!checkWight(globalState, dispatch)) return;
  const isPop = await dispatch(getPromotionData(swallowTip, failCallback, continuePromotionList.filter))
  if (isPop !== 'notPop') {
    callback()
    dispatch(genAction('PLATFORM_UI_BILLING_ACTION_MERGE', { modalOpening: true }))
  }
}
/* mobile */
export function clearPromotion () {
  return function (dispatch) {
    dispatch(genAction('PLATFORM_UI_BILLING_EXECUTPROMOTION_SET_COMMONDATA', {
      checkedList: {},
      checkedPromotion: []
    }));
  }
}
export function rollBackPromotion () {
  return function (dispatch) {
    if(_.isNull(promotionDataBackup)) return
    dispatch(genAction('PLATFORM_UI_BILLING_CANCEL_PREFERENTIAL_UPDATE_PRODUCTS', { key: 'Promotion', value: promotionDataBackup }));
    dispatch(genAction('PLATFORM_UI_BILLING_PRODUCT_CLEAR_PROMOTION', { promotionFilter: null }))
    promotionDataBackup = null;
    dispatch(genAction('BILLING_PROMOTION_CLEAR', ''));
  }
}

export function onlyGiftPromotionFilter (promotionInfoArr) {
  if (!promotionInfoArr) return []
  const uniqPromoIdArr = promotionInfoArr.filter(ele => {
    return (ele.iPromotionType == 1 || ele.iPromotionType == 5 || ele.iPromotionType == 6 || ele.iPromotionType == 8)
  })
  return uniqPromoIdArr || []
}

export async function goContinuePromotionList (globalState, dispatch) {
  return new Promise(resolve => {
    const products = getGlobalProducts();
    const billingViewModel = getBillingViewModel();
    if (!billingViewModel) {
      cb.utils.alert('正在初始化，请稍后重试', 'error');
      resolve(true)
      return
    }
    const extendResult = {resolveResult: true, hasCancelAutoPromotion, filter: {}}
    const updateProducts = (newProducts) => {
      dispatch(genAction('PLATFORM_UI_BILLING_EXECUTE_MEMBER_UPDATE_PRODUCTS', newProducts))
    }
    billingViewModel.promiseExecute('beforePopPromotionModal', { products, extendResult, updateProducts }, function () {
      hasCancelAutoPromotion = extendResult.hasCancelAutoPromotion
      resolve(extendResult)
    })
    // for (let product of products){
    //     if (product.autoPromotion){
    //         return cb.utils.confirm('是否取消自动促销？', function(){
    //             // 确认
    //             let newProducts = productsBackToOriginPrice(products)
    //             dispatch(genAction('PLATFORM_UI_BILLING_EXECUTE_MEMBER_UPDATE_PRODUCTS', newProducts))
    //             resolve(false)
    //         }, function(){
    //             // 取消
    //             resolve(true)
    //         })
    //     }
    // }
    // resolve(true)
  })
}

// const productsBackToOriginPrice = (products) => {
//     for (let product of products){
//        if (product.autoPromotion){
//             product.fPrice = product.fVIPPrice || product.fQuotePrice;
//             let { fPrice, fQuantity, fQuotePrice} = product
//             delete product.promotionwrite
//             delete product.autoPromotion
//             delete product.fPromotionDiscount
//             delete product.fPromotionPrice
//             delete product.promotionTips
//             product.fMoney = formatMoney(fPrice * fQuantity);
//             product.fDiscount = formatMoney((fQuotePrice - fPrice) * fQuantity)
//             product.fDiscountRate = 100
//        }
//     }
//     cb.utils.alert('取消自动促销成功', 'success')
//     return products
// }

export const getPromotionConstant = (type) => {
  const obj = {
    hasCancelAutoPromotion
  }
  return obj[type]
}

const beforeGetpromotionData = (params, callback) => {
  const billingViewModel = getBillingViewModel();
  if (!billingViewModel) {
    cb.utils.alert('正在初始化，请稍后重试', 'error');
    return
  }
  return billingViewModel.execute('beforeGetpromotionData', params)
}
