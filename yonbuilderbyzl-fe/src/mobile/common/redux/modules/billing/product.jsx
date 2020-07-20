import Immutable from 'immutable';
// import React from 'react';
import { findIndex } from 'lodash';
import { genAction, proxy, getRoundValue, getMultiplication } from '@mdf/cube/lib/helpers/util';
import { setReceiptHang } from './menu';
import { cacheProduct, getCheckedEmployee, onLineSelectEmployee, furnitrueSelectEmployee } from './salesClerk';
import { getOptions, getProductWarehouse, formatMoney as _formatMoney, formatNum } from './mix'
import { showModal } from './actions';
import { showOperator } from './operator'
import status from './billingStatus';
import { Format } from '@mdf/cube/lib/helpers/formatDate';
import { getBillingHeader } from './uretailHeader';
import { setSearchBoxFocus } from './goodsRefer'
import { getPromotionData } from './touchRight'
import env from 'src/server/env';
import { addEnableWeightProduct, getFromMapOrObject } from './electronicBalance'
import { queryMemberById } from './member';
import { getBillingTouchOptions, getBillingViewModel } from './config';
import { onlyGiftPromotionFilter, getPromotionConstant } from './ExecutPromotion';
import { getBillingStatus, getBDeliveryModify } from './uretailHeader';
import { hasPreferential } from './editRow';
import { checkQuantity } from './quote'
import { setPrevCompareProducts } from './recognition'

export const formatMoney = _formatMoney

let touchServerTips = ''; /* 触屏取价服务错误的提示信息 */
// let formBackUnreceivable = 0;
let currentStatus = status.CashSale;
const columnRender = {};
let productsChildrenField = null;
let couponsChildrenField = null;
let promotionsChildrenField = null;
let presellProducts = null;
const productRefer2BillKeyFieldMap = {};
let expandedRowKeys = [];
let editRowModal = null;
const moneyMap = {
  Total: { field: 'fQuoteMoneySum', value: 0, childField: 'fQuoteMoney' },
  TotalQuantity: { field: 'fQuantitySum', value: 0, childField: 'fQuantity' },
  Member: { field: 'fVIPDiscountSum', text: '会员优惠', value: 0, preferential: true, childField: 'fVIPDiscount' },
  Promotion: {
    field: 'fPromotionSum',
    text: '促销优惠',
    value: 0,
    done: false,
    preferential: true,
    childField: 'fPromotionDiscount'
  },
  Scene: {
    field: 'fSceneDiscountSum',
    text: '现场折扣',
    value: 0,
    done: false,
    preferential: true,
    childField: 'fSceneDiscount'
  },
  Coupon: { field: 'fGiftApportion', text: '优惠券', value: 0, done: false, preferential: true },
  Point: {
    field: 'fPointPayMoney',
    text: '积分抵扣',
    value: 0,
    done: false,
    preferential: true,
    childField: 'fPointPayDiscount'
  },
  Zero: { field: 'fEffaceMoney', value: 0, childField: 'fEffaceMoney' },
  Preferential: { field: 'fDiscountSum', value: 0, childField: 'fDiscount' },
  Real: { field: 'fMoneySum', value: 0, childField: 'fMoney' },
  Deposit: { field: 'fPresellPayMoney', value: 0 },
  Gathering: { field: 'fGatheringMoney', value: 0 },
  BackDiscount: { field: 'fCoDiscountSum', value: 0, childField: 'fCoDiscount' },
  FoldDiscount: { field: 'foldDiscountSum', value: 0, childField: 'foldDiscount' },
  Freight: { field: 'iPostage', value: 0, text: '运费', preferential: true }
};
const preferentials = ['Member', 'Promotion', 'Scene', 'Coupon', 'Point', 'Zero', 'BackDiscount', 'FoldDiscount'];
const productInfoMap = {
  businessType: '', /* 业务类型 */
  warehouse: '', /* 交货仓库 */
  reserveData: '', /* 预交货日期 */
  contacts: '', /* 联系人 */
  phone: '', /* 电话 */
  address: '', /* 地址 */
  memo: '', /* 备注 */
}
/* add by 金子涵  存储products  解决toJS效率问题 */
let globalProducts = [];

const $$initialState = Immutable.fromJS({
  columns: [],
  detailColumns: [],
  products: [],
  spec: {},
  specVisible: false,
  backBill_checked: true, // 非原单退货下的checkbox
  expandedRowKeys: expandedRowKeys,
  money: moneyMap,
  focusedRow: null,
  canModify: true,
  productInfo: productInfoMap,
  priceDecimal: 2,
  moneyDecimal: 2,
  scrollRow: 0, // add by jinzh1
  /* add by jinzh1 电子秤 分页参数 */
  pageIndex: 1
});
let backBillMapping = {
  productId: {
    rowKey: {
      quantity: 5,
      rowData: {},
      hQuantity: 5,
    }
  }
}
let exchangeBillMapping = {
  换货行的rowkey: '相应退货productId下的rowkey'
}
let extendConstant = { /* 扩展脚本所需全局变量 */
  hasCancelPreferential: false,
}
let promotionMap = {} /* 促销赠品的map */
// let currentPromotionKey = null; //当前促销主商品key
let promotionMasterMap = {};
// let promotionGiftMap = {};
// let switchPromotion = null;
let isGetServiceTable = false
/* 是否发取价格服务 */
// reducer
export default ($$state = $$initialState, action) => {
  switch (action.type) {
    case 'PLATFORM_UI_PRODUCT_CAN_QUANTITY':
      return $$state.merge({ canQuantity: action.payload })
    case 'PLATFORM_UI_PRODUCT_SET_CHILDREN_FIELD':
      productsChildrenField = action.payload;
      return $$state;
    case 'PLATFORM_UI_COUPON_SET_CHILDREN_FIELD':
      couponsChildrenField = action.payload;
      return $$state;
    case 'PLATFORM_UI_PROMOTION_SET_CHILDREN_FIELD':
      promotionsChildrenField = action.payload;
      return $$state;
    case 'PLATFORM_UI_PRODUCT_REFER_TO_BILL_MAP':
      try {
        var obj = JSON.parse(action.payload);
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
        console.error('参照携带定义' + action.payload + '有错误');
      }
      return $$state;
    case 'PLATFORM_UI_BILLING_SET_COLUMNS':
      return $$state.update('columns', columns => {
        const configColumns = action.payload;
        // const _columns = columns.toJS();
        // configColumns.forEach(item => {
        //   _columns.push(item);
        // });
        return Immutable.fromJS(configColumns);
      });
    case 'PLATFORM_UI_BILLING_ADD_PRODUCT': {
      const originProducts = $$state.get('products').toJS();
      // return $$state.set('referReturnProducts', null).update('products', products => {
      return $$state.update('products', products => {
        const billProducts = action.payload;
        const _products = products.toJS();
        billProducts.forEach(item => {
          getProductWarehouse(item)
          _products.push(item);
        });
        if (isChangeGoods(billProducts))
          exchangeGoods(billProducts, originProducts);
        calcMoney(_products, true);
        setRowNumber(_products)
        globalProducts = _products;
        beforeUpdateMoneyMap({moneyMap, type: 'productAdd'})
        cb.events.execute('communication', {
          products: getSecondScreedProducts(_products), moneyMap, option: cb.rest.AppContext.option, expandedRowKeys,
          billingStatus: getBillingStatus(), bDeliveryModify: getBDeliveryModify(),
        });
        return Immutable.fromJS(_products);
      }).merge({
        expandedRowKeys,
        money: moneyMap
      });
    }
    case 'PLATFORM_UI_BILLING_UPDATE_PRODUCT': {
      let focusedRow = $$state.get('focusedRow');
      return $$state.update('products', products => {
        const product = action.payload;
        if (getFromMapOrObject(focusedRow, 'key') === product.key)
          focusedRow = product;
        const _products = products.toJS();
        const index = findIndex(_products, ['key', product.key]);
        const canPass = exchangeGoods_sum(_products, product, index);
        if (!canPass) return Immutable.fromJS(_products);
        if (index !== -1)
          _products[index] = product;
        if (index === -1)
          updateProductChildren(product, _products)
        calcMoney(_products);
        globalProducts = _products;
        beforeUpdateMoneyMap({moneyMap, type: 'productUpdate'})
        cb.events.execute('communication', { products: getSecondScreedProducts(_products), moneyMap, focusedRow });
        return Immutable.fromJS(_products);
      }).merge({ money: moneyMap }).set('focusedRow', focusedRow);
    }
    case 'PLATFORM_UI_BILLING_DELETE_PRODUCT': {
      let focusedRow = $$state.get('focusedRow');
      if (Immutable.Map.isMap(focusedRow))
        focusedRow = focusedRow.toJS()
      /* add by jinzh1  触屏开单配置 */
      const options = getBillingTouchOptions();
      let bFlipPage = false;
      let pageIndex = $$state.get('pageIndex'); const pageSize = $$state.get('pageSize'); let totalPage;
      if (options && options.basicSettingData.flipPage == 2 && options.basicSettingData.selectType === '1')
        bFlipPage = true;
      return $$state.update('products', products => {
        const _products = products.toJS();
        const index = findIndex(_products, ['key', action.payload]);
        const canPass = exchangeGoods_delete(_products, action.payload, index);
        if (!canPass) return Immutable.fromJS(_products);
        if (index !== -1)
          _products.splice(index, 1);
        calcMoney(_products);
        /* add by 金子涵 处理删行后focusedRow */
        if (focusedRow.key == action.payload) {
          const productsLength = _products.length;
          if (productsLength > 0) {
            focusedRow = resetFocusedRow(_products);
          } else {
            focusedRow = null;
          }
        } else {
          focusedRow = resetFocusedRow(_products);
        }
        // filter = updateGiftParams(focusedRow);
        setRowNumber(_products)
        globalProducts = _products;
        if (bFlipPage) {
          totalPage = Math.ceil(_products.length / pageSize);
          if (totalPage < pageIndex && totalPage != 0) pageIndex = totalPage;
        }
        beforeUpdateMoneyMap({moneyMap, type: 'productDelete'})
        cb.events.execute('communication', {
          products: getSecondScreedProducts(_products), moneyMap, expandedRowKeys, focusedRow
        });
        return Immutable.fromJS(_products);
      }).merge({
        expandedRowKeys, pageIndex,
        money: moneyMap,
        // promotionFilter: filter,
      }).set('focusedRow', focusedRow);
    }
    case 'PLATFORM_UI_BILLING_CLEAR_TOUCH':
    case 'PLATFORM_UI_BILLING_CLEAR':
      cb.events.execute('communication', {
        products: [], moneyMap: {}, expandedRowKeys: [], focusedRow: null
      });
      currentStatus = status.CashSale;
      presellProducts = null;
      backBillMapping = {};
      exchangeBillMapping = {};
      // currentPromotionKey = null;
      promotionMasterMap = {};
      // promotionGiftMap = {}
      // switchPromotion = null;
      window.__getMemberPriceMask = null;
      promotionMap = {};
      extendConstant = {hasCancelPreferential: false}
      return $$state.update('products', () => {
        const _products = [];
        calcMoney(_products);
        clearMoneyMap();
        globalProducts = _products;
        return Immutable.fromJS(_products);
      }).merge({
        coupons: null,
        backBill_checked: true,
        money: moneyMap,
        focusedRow: null,
        canModify: true,
        backBillMapping: {},
        exchangeBillMapping: {},
        promotionFilter: null,
        pageIndex: 1
      });
    case 'PLATFORM_UI_BILLING_SET_FOCUSED_ROW':
      cb.events.execute('communication', { focusedRow: action.payload });
      return $$state.set('focusedRow', action.payload);
    case 'PLATFORM_UI_BILLING_SET_FOCUSED_ROW_SECOND':
      return $$state.set('focusedRow', action.payload);
    case 'PLATFORM_UI_BILLING_EXECUTE_MEMBER_UPDATE_PRODUCTS': {
      let focusedRow = $$state.get('focusedRow');
      if (Immutable.Map.isMap(focusedRow))
        focusedRow = focusedRow.toJS()
      return $$state.update('products', () => {
        const _products = action.payload;
        const focusedKey = focusedRow.key;
        focusedRow = _products.find(item => {
          return item.key === focusedKey;
        });
        calcMoney(_products);
        globalProducts = _products;
        beforeUpdateMoneyMap({moneyMap, type: 'productsUpdate'})
        cb.events.execute('communication', { products: getSecondScreedProducts(_products), moneyMap, focusedRow });
        return Immutable.fromJS(_products);
      }).merge({
        money: moneyMap
      }).set('focusedRow', focusedRow);
    }
    case 'PLATFORM_UI_BILLING_EXECUTE_PREFERENTIAL_UPDATE_PRODUCTS':
      return executePreferential($$state, action.payload);
    case 'PLATFORM_UI_BILLING_EXECUTE_PREFERENTIAL_UPDATE_PRODUCTS_TOUCH':
      return executePreferential($$state, action.payload)
    case 'PLATFORM_UI_BILLING_CANCEL_PREFERENTIAL_UPDATE_PRODUCTS':
      return cancelPreferential($$state, action.payload);
    case 'PLATFORM_UI_BILLING_CANCEL_PREFERENTIAL_UPDATE_PRODUCTS_TOUCH':
      return cancelPreferential($$state, action.payload);
    case 'PLATFORM_UI_BILLING_UPDATE_PRODUCT_INFO':
      if (action.payload.focusedRow)
        cb.events.execute('communication', { focusedRow: action.payload.focusedRow });
      return $$state.merge(action.payload);
    case 'PLATFORM_UI_BILLING_UPDATE_MONEYMAP':
    case 'PLATFORM_UI_BILLING_SET_OPTIONS':
      return $$state.merge(action.payload);
    case 'PLATFORM_UI_BILLING_REFER_BILL_OK':
    {
      currentStatus = action.payload.status;
      const billData = action.payload.data;
      const depositValue = billData[moneyMap.Deposit.field] || 0;
      const sceneValue = billData[moneyMap.Scene.field] || 0;
      const pointValue = billData[moneyMap.Point.field] || 0;
      const couponValue = billData[moneyMap.Coupon.field] || 0;
      const freightValue = billData[moneyMap.Freight.field] || 0;
      switch (currentStatus) {
        case status.Shipment:
        case status.OnlineBill:
          moneyMap.Deposit.value = depositValue;
          moneyMap.Scene.value = sceneValue;
          moneyMap.Point.value = pointValue;
          moneyMap.Coupon.value = couponValue;
          moneyMap.Freight.value = freightValue
          break;
        case status.PresellBack:
          moneyMap.Deposit.value = 0 - depositValue;
          moneyMap.Scene.value = 0 - sceneValue;
          moneyMap.Point.value = 0 - pointValue;
          moneyMap.Coupon.value = 0 - couponValue;
          break;
        case status.FormerBackBill:
          // formBackUnreceivable = 0 - billData.formBackUnreceivable
          break;
      }
      beforeUpdateMoneyMap({moneyMap, type: 'billAdd'})
      cb.events.execute('communication', { moneyMap })
      return $$state.merge({ money: moneyMap });
    }
    case 'PLATFORM_UI_BILLING_PRESELL_PAY_MONEY':
      if (typeof action.payload !== 'undefined') {
        moneyMap.Gathering.value = action.payload;
        beforeUpdateMoneyMap({moneyMap, type: 'settle'})
        return $$state.merge({ money: moneyMap });
      }
      return $$state;
    case 'PLATFORM_UI_BILLING_PRODUCT_CLEAR_PROMOTION':
      promotionMasterMap = {};
      // promotionGiftMap = {};
      return $$state.merge(action.payload)
    case 'PLATFORM_UI_BILLING_TOUCH_LOGOUT':
      cb.events.execute('communication', {
        DualScreenSettingData: {}, products: [], moneyMap: {}, expandedRowKeys: [], focusedRow: null,
        option: { quantitydecimal: 2, amountofdecimal: 2, monovalentdecimal: 2 },
      });
      return $$state.merge({ columns: [] })
    // case 'PLATFORM_UI_BILLING_MERGE_DEEP_IN':
    //   if (action.payload) {
    //     moneyMap.FoldDiscount.value = action.payload;
    //     return $$state.merge({ money: moneyMap });
    //   }
    //   return $$state;
    case 'PLATFORM_UI_BILLING_CONFIG_GET_IS_GET_PRICE_TABLE':
      isGetServiceTable = action.payload;
      return $$state

    /* mobile */
    case 'PLATFORM_UI_BILLING_PRESELL_AND_SCENE_PAY_MONEY':
      if (action.payload) {
        moneyMap.Gathering.value = action.payload.receipts;
        moneyMap.Scene.value = action.payload.scene;
        beforeUpdateMoneyMap({moneyMap, type: 'settle'})
        return $$state.merge({ money: moneyMap });
      }
      return $$state;
    case 'PLATFORM_UI_BILLING_DEPOSIT_PAY_MONEY':
      if (action.payload) {
        moneyMap.Deposit.value = action.payload;
        beforeUpdateMoneyMap({moneyMap, type: 'settle'})
        return $$state.merge({ money: moneyMap });
      }
      return $$state;

    case 'PLATFORM_UI_BILLING_DISCOUNT_UPDATE_PRODUCTS': {
      let _focusedRow = $$state.get('focusedRow');
      if (Immutable.Map.isMap(_focusedRow))
        _focusedRow = _focusedRow.toJS()
      const _products = action.payload;
      const focusedKey = _focusedRow.key;
      _focusedRow = _products.find(item => {
        return item.key === focusedKey;
      });
      globalProducts = _products;
      return $$state.merge({ products: _products, focusedRow: _focusedRow });
    }
    case 'PLATFORM_UI_BILLING_VIEWMODEL_INIT':
      editRowModal = action.payload.get(productsChildrenField || 'retailVouchDetails').getEditRowModel();
      return $$state
    case 'PLATFORM_UI_BILLING_CLEAR_BILL_DETAIL':
      return $$state.update('products', () => {
        const _products = [];
        calcMoney(_products);
        clearMoneyMap();
        globalProducts = _products;
        return Immutable.fromJS(_products);
      }).merge({
        coupons: null,
        backBill_checked: true,
        money: moneyMap,
        focusedRow: null,
        canModify: true,
        backBillMapping: {},
        exchangeBillMapping: {},
        promotionFilter: null,
        pageIndex: 1
      });
    default:
      return $$state;
  }
}

// 赠品删除后的重设focusedRow到主商品行
const resetFocusedRow = (_products) => {
  let isOver = true;
  let focusedRow;
  for (const attr in promotionMasterMap) {
    if (promotionMasterMap[attr].cQuantity > 0) {
      focusedRow = _products.find(ele => {
        return ele.key == attr
      });
      isOver = false;
      break;
    }
  }
  if(isOver) focusedRow = _products[_products.length - 1]
  return focusedRow
}

// 删除赠品后更新currentPromotionKey和promotionFilter
// const updateGiftParams = (focusedRow) => {
//   let return_promotionFilter = null;
//   if (focusedRow && focusedRow.promotionfilter && focusedRow.promotionfilter.length > 0) {
//     currentPromotionKey = focusedRow.key;
//     let promotionFilterArr = [];
//     focusedRow.promotionfilter.forEach(ele => { //只取第一个促销活动
//       if (ele.iPromotionid == focusedRow.promotionfilter[0].iPromotionid)
//         promotionFilterArr.push(ele)
//     })
//     return_promotionFilter = promotionFilterArr;
//   } else {
//     currentPromotionKey = null;
//     return_promotionFilter = null;
//   }
//   return return_promotionFilter
// }

const updateProductChildren = (product, products) => {
  const product_child = products.find(item => {
    return item.bFixedCombo && item.children
  })
  const children_index = product_child ? findIndex(product_child.children, ['key', product.key]) : -1;
  if (children_index !== -1)
    product_child.children[children_index] = product;
}

export function setColumnRender (data) {
  return function (dispatch) {
    for (var attr in data)
      columnRender[attr] = data[attr];
  }
}

export function loadColumns (data) {
  return function (dispatch) {
    const columns = [];
    columns.push(
      { name: '', dataIndex: 'rowNumber', alignStyle: 'left', fixed: true, board: 40, width: 40 }
    );
    data.forEach(item => {
      columns.push(item);
    });
    columns.push({ name: '', dataIndex: 'actions', alignStyle: 'right', fixed: true, width: 44 });
    dispatch(genAction('PLATFORM_UI_BILLING_SET_COLUMNS', columns));
    // console.log('开单显示列：' + JSON.stringify(columns, null, '\t'));
  }
}

// export function loadColumns(data) {
//   return function (dispatch) {
//     const columns = [];
//     columns.push(
//       { title: '', dataIndex: 'rowNumber', fixed: 'left', width: 10 },
//       { title: '名称', dataIndex: 'key', fixed: 'left', width: 200, render: columnRender.key }
//     );
//     data.forEach(item => {
//       const { name, dataIndex, board, alignStyle, metaData } = item;
//       let columnStyle = dataIndex === "fQuantity" ? 'columns-center' : `columns-${alignStyle.toLowerCase()}`;
//       if (dataIndex === 'product_cName') {
//         columns[1].title = name;
//         columns[1].width = board;
//         return;
//       }
//       let column = { title: name, dataIndex, className: columnStyle, width: board || 100, metaData }
//       if (item.metaData && (item.metaData.cControlType == 'price' || item.metaData.cControlType == 'money')) {
//         let { amountofdecimal, monovalentdecimal } = getOptions();
//         let precisionType = item.metaData.cControlType == 'price' ? monovalentdecimal.value : amountofdecimal.value;
//         if (columnRender[dataIndex]) {
//           column.render = (text, record) => columnRender[dataIndex](text, record, precisionType);
//         } else {
//           column.render = (text, record) => {
//             // columnRender.common_precision_control(text, record, precisionType);
//             return isNaN(parseFloat(text)) ? '' : parseFloat(text).toFixed(precisionType)
//           }
//         }
//       } else if (columnRender[dataIndex]) {
//         column.render = columnRender[dataIndex];
//       }
//       if (item.metaData && item.metaData.cControlType === 'InputNumber' && item.dataIndex !== "fQuantity") {
//         let configPrecision = item.metaData.iNumPoint;
//         column.render = (text, record) => {
//           return isNaN(parseFloat(text)) ? '' : parseFloat(text).toFixed(configPrecision)
//         }
//       }
//       columns.push(column);
//     });
//     columns.push({ title: '', dataIndex: 'actions', fixed: 'right', width: 44, render: columnRender.actions });
//     dispatch(genAction('PLATFORM_UI_BILLING_SET_COLUMNS', columns));
//     // console.log('开单显示列：' + JSON.stringify(columns, null, '\t'));
//   }
// }

export function loadDetailColumns (detailData) {
  const detailColumns = [];
  detailData.forEach(item => {
    const { name, dataIndex } = item;
    const column = { title: name, dataIndex };
    if (dataIndex === 'invaliddate') {
      column.render = (text, record) => {
        return Format(new Date(text), 'yyyy-MM-dd')
      }
    }
    if (item.metaData && (item.metaData.cControlType == 'price' || item.metaData.cControlType == 'money')) {
      const { amountofdecimal, monovalentdecimal } = getOptions();
      const precisionType = item.metaData.cControlType == 'price' ? monovalentdecimal.value : amountofdecimal.value;
      column.render = (text, record) => {
        return isNaN(parseFloat(text)) ? '' : getRoundValue(text, precisionType)
      }
    }
    if (item.metaData && item.metaData.cControlType === 'InputNumber' && item.dataIndex !== 'fQuantity') {
      const configPrecision = item.metaData.iNumPoint;
      column.render = (text, record) => {
        return isNaN(parseFloat(text)) ? '' : getRoundValue(text, configPrecision)
      }
    }
    if (item.dataIndex === 'fQuantity') {
      const numDecimal = getOptions().numPoint_Quantity ? getOptions().numPoint_Quantity.value : 2;
      column.render = (text, record) => {
        return isNaN(parseFloat(text)) ? '' : getRoundValue(text, numDecimal)
      }
    }
    detailColumns.push(column);
  });
  return genAction('PLATFORM_UI_BILLING_SET_OPTIONS', { detailColumns });
}

export function modifyQuantity (product, num) {
  return function (dispatch, getState) {
    // product.fPromotionDiscount_origin = product.fPromotionDiscount ? (product.fPromotionDiscount / product.fQuantity) : 0;
    if (!beforeModifyQuantityLogic(product, num)) return
    const origin_fQuantity = product.fQuantity;
    // let origin_fcoDiscount = product.fCoDiscount || 0, origin_foldDiscount = product.foldDiscount || 0;
    /* lz 老昌决定电商不再重算金额 */
    // if (onlineDeliveryModifyNum(product, num, getState, dispatch)) return
    product.fQuantity = num;
    product.fQuoteMoney = formatNum('money', getMultiplication(product.fQuotePrice, num, 'Multiplication'));
    product.fMoney = formatNum('money', getMultiplication(product.fPrice, num, 'Multiplication'));
    product.fDiscount = formatNum('money', getMultiplication(product.fQuoteMoney, product.fMoney, 'subduction'));
    rely_quantity(product, origin_fQuantity, num)
    // if (product.fPromotionDiscount_origin) // 赠品的促销金额
    //   product.fPromotionDiscount = product.fPromotionDiscount_origin * num;
    calcPromotionDiscount(product, num);
    if (product.autoPromotion || product.iPromotionProduct === 1) // 秒杀类自动促销，更新孙表，孙表只可能一个元素
      product.promotionwrite[0].fAmount = product.fPromotionDiscount
    if (product.children) {
      product.fQuoteMoney = 0;
      product.fMoney = 0;
      product.fDiscount = 0;
      product.fPromotionDiscount = 0;
      product.children.forEach(item => {
        const scale = item.fQuantity / item.productNum
        const originPromotion = item.fPromotionDiscount / scale
        if (item.productNum)
          item.fQuantity = (item.productNum) * num;
        // if (item.promotionwrite && item.promotionwrite[0].fQuantity)
        //   item.fQuantity = (item.promotionwrite[0].fQuantity) * num;
        item.fQuoteMoney = formatMoney(item.fQuotePrice * item.fQuantity);
        item.fMoney = formatMoney(item.fPrice * item.fQuantity);
        product.fQuoteMoney += item.fQuoteMoney;
        product.fMoney += item.fMoney;
        item.fMoney = formatMoney(item.fPrice * item.fQuantity);
        item.fDiscount = item.fQuoteMoney - item.fMoney;
        item.fPromotionDiscount = formatMoney(originPromotion * (item.fQuantity / item.productNum));
        product.fDiscount += item.fDiscount;
        product.fPromotionDiscount += item.fPromotionDiscount;
      })
    }
    if (moneyMap.Promotion.done) {
      // let products = getState().product.toJS().products;
      const products = globalProducts;
      let promotionPrice = 0;
      products.forEach(ele => {
        if (ele.fbitGift == 1) {
          if (ele.key == product.key) {
            promotionPrice += product.fDiscount;
          } else {
            promotionPrice += ele.fDiscount;
          }
        }
      })
      moneyMap.Promotion.value = promotionPrice;
    }
    dispatch(genAction('PLATFORM_UI_BILLING_UPDATE_PRODUCT', product));
  }
}

/* 促销折扣额算法 */
export const calcPromotionDiscount = (product, num) => {
  /**
   * 折扣额 = 格式化【格式化（零售价*数量）- 格式化（实销价*数量）】
   * 会员折扣额 = 格式化【格式化（零售价*数量）- 格式化（会员价*数量）】
   * //促销折扣额 = 格式化【（折扣额-会员折扣额）】，来保证相加总和等于零售金额
   * 促销折扣额 = 格式化【格式化（会员价*数量） - 格式化（促销价*数量）】
   * 现场折扣额 = 格式化【（折扣额-会员折扣额-促销折扣额）】，来保证相加总和等于零售金额
   */
  if (product.fQuantity <= 0) return
  /* 负数行不算促销和会员 */
  const { fPrice, fQuotePrice, fVIPPrice, fPromotionPrice } = product;
  const _vipPrice = (fVIPPrice === undefined) ? fQuotePrice : fVIPPrice;
  const _promotionPrice = (fPromotionPrice === undefined) ? _vipPrice : fPromotionPrice;
  const fQuoteMoney = formatNum('money', getMultiplication(fQuotePrice, num, 'Multiplication'));
  const fMoney = formatNum('money', getMultiplication(fPrice, num, 'Multiplication'));
  const fVipMoney = formatNum('money', getMultiplication(_vipPrice, num, 'Multiplication'));
  const fPromotionMoney = formatNum('money', getMultiplication(_promotionPrice, num, 'Multiplication'));
  const totalDiscount = formatNum('money', getMultiplication(fQuoteMoney, fMoney, 'subduction'));
  const vipDiscount = formatNum('money', getMultiplication(fQuoteMoney, fVipMoney, 'subduction'));
  const promotionDiscount = formatNum('money', getMultiplication(fVipMoney, fPromotionMoney, 'subduction'));
  // let promotionDiscount = formatNum('money', getMultiplication(totalDiscount, vipDiscount, 'subduction'))
  const vipAndPromotionDiscount = vipDiscount + promotionDiscount;
  const sceneDiscount = formatNum('money', getMultiplication(totalDiscount, vipAndPromotionDiscount, 'subduction'))
  product.fPromotionDiscount = promotionDiscount;
  product.fVIPDiscount = vipDiscount;
  product.fSceneDiscount = sceneDiscount;
}

const rely_quantity = (product, originQuantity, newQuantity) => {
  let per = 0;
  if (product.foldDiscount) {
    per = product.foldDiscount / originQuantity;
    product.foldDiscount = formatMoney(per * newQuantity);
  }
  if (product.fCoDiscount) {
    per = product.fCoDiscount / originQuantity;
    product.fCoDiscount = formatMoney(per * newQuantity);
  }
}

// const onlineDeliveryModifyNum = (product, num, getState, dispatch) => {
//   if (!num) return false
//   let billingStatus = getState().uretailHeader.get('billingStatus');
//   if (billingStatus !== 'OnlineBill') return false
//   if (!product.iRelatingRetailDetailId) return false /* 是否为原电商订单行 */
//   product.fQuantity = num;
//   product.fQuotePrice = product.fQuoteMoney / num
//   product.fPrice = product.fMoney / num
//   dispatch(genAction('PLATFORM_UI_BILLING_UPDATE_PRODUCT', product));
//   return true
// }

export function deleteProduct (key, hasAuth) {
  return function (dispatch, getState) {
    if (!hasAuth) {
      const lineConnection = getState().offLine.get('lineConnection')
      if (!lineConnection) {
        cb.utils.alert('当前网络不可用并且当前操作员无删行权限，不能使用此功能！', 'error')
        return
      }
      cb.utils.confirm('当前操作员无删行权限！是否使用其他 操作员的删行权限？', () => {
        dispatch(showOperator(true, false, 'delretaildetail', 'RM17', () => {
          cacheDeletePRoduct(key, getState, dispatch)
        }));
      }, () => {
        console.log('删行权限 取消')
      })
    } else {
      cacheDeletePRoduct(key, getState, dispatch)
    }
  }
}

const cacheDeletePRoduct = (key, getState, dispatch) => {
  const { billingStatus, infoData } = getState().uretailHeader.toJS();
  // let { products, focusedRow, canModify, promotionFilter } = getState().product.toJS();
  const productRedux = getState().product;
  const focusedRow = productRedux.get('focusedRow');
  // let promotionFilter = productRedux.get('promotionFilter') ? productRedux.get('promotionFilter').toJS() : null;
  const canModify = productRedux.get('canModify');
  const products = globalProducts;

  if (key.key)
    key = focusedRow.key;
  if(!beforeDeleteProductCheck(key)) return
  if ((billingStatus == status.OnlineBill && infoData.bDeliveryModify === false) || billingStatus == status.OnlineBackBill) {
    cb.utils.alert(`${billingStatus == 'OnlineBill' ? '电商订单' : '电商退货'}状态下，不允许删除商品！`, 'error');
    return
  }
  if (billingStatus == status.Shipment && infoData.bDeliveryModify === false) {
    cb.utils.alert('交货不能修改商品时，不允许删除商品！', 'error')
    return;
  }
  if (billingStatus == status.PresellBack) {
    cb.utils.alert('预订退订状态下不允许删除商品！', 'error');
    return;
  }
  const deleteRow = getRowByKey(key, products);
  if (deleteRow.iPromotionProduct === 1) { // 赠品
    // getPromotionFilterFromProduct(promotionFilter, products, dispatch);
    updatePromotionMap_delete(deleteRow)
    dispatch(genAction('PLATFORM_UI_BILLING_DELETE_PRODUCT', key));
    return
  }
  if (!canModify) {
    cb.utils.alert('已经执行了优惠，不允许删行！', 'error');
    return;
  }
  if (!focusedRow) {
    cb.utils.alert('未选择商品，不允许删行！', 'error');
    return;
  }
  if (products.length == 1)
    dispatch(setReceiptHang(true));
  if(!beforeDeleteProductLogic(deleteRow)) return
  dispatch(genAction('PLATFORM_UI_BILLING_DELETE_PRODUCT', key));
}

export function setFocusedRow (product, scrollRow) {
  return function (dispatch) {
    if (!cb.utils.isEmpty(scrollRow)) {
      dispatch(genAction('PLATFORM_UI_BILLING_UPDATE_PRODUCT_INFO', { scrollRow: scrollRow, focusedRow: product }))
    } else {
      if(editRowModal) editRowModal.loadData(product);
      dispatch(genAction('PLATFORM_UI_BILLING_SET_FOCUSED_ROW', product));
    }
    // dispatch(beforeOpenRefer())
  }
}

const updatePromotionMap_delete = (deleteRow) => {
  const billingViewModel = getBillingViewModel()
  if (!billingViewModel) {
    cb.utils.alert('正在初始化，请稍后重试', 'error');
    return false
  }
  billingViewModel.execute('updatePromotionMap_delete', {deleteRow})
}

// const getPromotionFilterFromProduct = (promotionFilter, products, dispatch) => {
//   !promotionFilter && products.forEach(product => {
//     if (product.promotionfilter)
//       dispatch(genAction('PLATFORM_UI_BILLING_SET_OPTIONS', { promotionFilter: product.promotionfilter }))
//   })
// }

/* 补录商品规格 */
export function selectSpec (product, cacheData) {
  return async function (dispatch) {
    const config = {
      url: 'mall/bill/ref/getProudctSkus.do',
      method: 'GET',
      params: {
        productId: product
      }
    }
    const json = cacheData || await proxy(config)
    if (json.code === 200) {
      if (json.data) {
        const spec = getSpecData(json.data);
        dispatch(genAction('PLATFORM_UI_BILLING_SET_OPTIONS', { spec }));
      }
    }
    // if (json.code !== 200) return
  }
}

const getSpecData = (data) => {
  const columnsArr = []; const dataSource = [];

  const len = data.specs.length; let hasSpec = true; let width;
  if (len == 0) {
    hasSpec = false;
  } else {
    width = parseInt(400 / len);
    if (width < 100) width = 100;
  }

  // data.specs.forEach(element => {
  //   let ele = {};
  //   if(element.cFreeid > 10){
  //     ele.title = element.cName;
  //     ele.dataIndex = 'propertiesValue';
  //     ele.width = 500;
  //   }else{
  //     ele.title = element.cName;
  //     ele.dataIndex = 'free' + element.cFreeid;
  //     ele.width = width;
  //   }
  //   columnsArr.push(ele);
  // })
  columnsArr.push({ title: '规格', dataIndex: 'propertiesValue', width: 500 })
  const headArr = [
    { title: '', dataIndex: 'radio', fixed: 'left', width: 40 },
    { title: '编码', dataIndex: 'skuCode', width: hasSpec ? 150 : 550 }, ];
  const footerArr = [{ title: '零售价', dataIndex: 'skuSalePrice', alignStyle: 'right', width: 100 }]
  const concatArr = headArr.concat(columnsArr).concat(footerArr);
  data.skus.forEach(element => {
    const ele = {};
    concatArr.forEach((item, index) => {
      if (item.dataIndex == 'skuSalePrice') {
        ele[item.dataIndex] = getRoundValue(element[item.dataIndex], 2)
      } else {
        // if(item.dataIndex!=`${tabName}_kong`) concatArr[index].width=120;
        ele[item.dataIndex] = element[item.dataIndex];
      }
    })
    ele.key = element.skuId;
    ele.data = element;
    dataSource.push(ele);
  });
  return { concatArr, dataSource }
}

/**
 * @param currentSku {obj} 兼容移动端
*/
export function combineSpecToProduct (currentSku) {
  return function (dispatch, getState) {
    // const { focusedRow, skuData } = getState().product.toJS();
    const productRedux = getState().product;
    let focusedRow = productRedux.get('focusedRow');
    if (Immutable.Map.isMap(focusedRow)) focusedRow = focusedRow.toJS();
    const skuData = currentSku || (Immutable.Map.isMap(productRedux.get('skuData')) ? productRedux.get('skuData').toJS() : productRedux.get('skuData'));
    const skus = {};
    const specs = [];
    for (const i in skuData) {
      if (productRefer2BillKeyFieldMap[i] && productRefer2BillKeyFieldMap[i].length > 0) {
        if (focusedRow.retailPriceDimension == 1 && i == 'skuSalePrice') continue
        productRefer2BillKeyFieldMap[i].forEach(billkey => {
          skus[billkey] = skuData[i]
        });
      }
      if (i.startsWith('free'))
        specs.push(skuData[i]);
    }
    if(skuData.promotioninfo) skus.promotioninfo = skuData.promotioninfo
    if(skuData.MemberInfo) skus.MemberInfo = skuData.MemberInfo
    skus.specs = skuData.propertiesValue ? (skuData.propertiesValue || '') : specs.join(',');
    skus.specsBtn = false;
    if (cb.rest.interMode === 'touch' && focusedRow.fVIPPrice == undefined) {
      const allState = getState()
      const memberData = allState.member.toJS().memberInfo.data || {};
      Object.assign(focusedRow, skus); // todo 选择促销
      focusedRow.fPrice = focusedRow.fQuotePrice;
      focusedRow.fMoney = focusedRow.fQuoteMoney = formatNum('money', getMultiplication(focusedRow.fPrice, focusedRow.fQuantity, 'Multiplication'));
      // if (notSendServer(memberData, allState))
      touchRegetPrice({ sku: [focusedRow] }, [focusedRow], allState, memberData); /* 触屏重取价格 */
      dispatch(genAction('PLATFORM_UI_BILLING_UPDATE_PRODUCT', focusedRow));
      return
    }
    Object.assign(focusedRow, skus);
    if (focusedRow.retailPriceDimension == 2) { // 取价维度为sku
      focusedRow.fPrice = focusedRow.fQuotePrice;
      focusedRow.fMoney = formatMoney(focusedRow.fQuantity * focusedRow.fPrice);
      focusedRow.fQuoteMoney = formatMoney(focusedRow.fQuantity * focusedRow.fQuotePrice);
      focusedRow.fDiscount = focusedRow.fQuoteMoney - focusedRow.fMoney;
      if (focusedRow.fVIPPrice || focusedRow.fVIPDiscount) { // 张林改动
        delete focusedRow.fVIPPrice
        delete focusedRow.fVIPRate
        delete focusedRow.fVIPDiscount
      }
      dispatch(modifyQuotePrice(focusedRow, true, 'changeSpecs'))
      return
    }
    dispatch(genAction('PLATFORM_UI_BILLING_UPDATE_PRODUCT', focusedRow));
  }
}

export function setOptions (obj) {
  return function (dispatch) {
    dispatch(genAction('PLATFORM_UI_BILLING_SET_OPTIONS', obj))
  }
}

const getMemberPrice = (globalState, memberId, products, billingStatus, successCallback, failCallback, bGetPrice, actionName, dispatch) => {
  products.forEach(ele => {
    if (!ele.iWarehouseid)
      getProductWarehouse(ele)
  })
  const data = getBillingHeader(globalState);
  data[productsChildrenField] = transferProducts2Flatten(products);
  // let canQuantity = globalState.product.toJS().canQuantity;
  const canQuantity = globalState.product.get('canQuantity');
  let memberInfoData = globalState.member.get('memberInfo')
  if (Immutable.Map.isMap(memberInfoData)) memberInfoData = memberInfoData.toJS();
  const level_id = memberInfoData && memberInfoData.data && memberInfoData.data.level_id;
  const hasCancelAutoPromotion = getPromotionConstant('hasCancelAutoPromotion');
  const params = {
    mid: memberId,
    data: JSON.stringify(data),
    billingstatus: billingStatus,
    bGetPrice: bGetPrice/* 是否重新取价 */,
    fAvailableAuantity: canQuantity ? 1 : 0, // 是否取可用量
    hasCancelAutoPromotion, // 蔡何威 自动促销
    actionName: actionName // 触发事件点
  };
  if (level_id != undefined) params.level_id = level_id /* 张林改动 */
  if (presellProducts)
    params.predata = JSON.stringify(presellProducts);
  const config = {
    url: 'thirdparty/member/memberdiscountarray',
    method: 'POST',
    params
  };
  /*   if(window.__isElectronic)
      window.__getMemberPriceMask = openAwaitModal() */
  if (window.__getMemberPriceMask) window.__getMemberPriceMask.init()
  if (cb.rest.interMode === 'touch')
    config.options = { timeout: 3000 }
  proxy(config)
    .then(function (json) {
      if (window.__getMemberPriceMask) {
        window.__getMemberPriceMask.destroy()
        window.__getMemberPriceMask = null
      }
      if (json.code !== 200) {
        if (cb.rest.interMode === 'touch') {
          cb.utils.alert(touchServerTips, 'error')
          console.log('断网--->code为500:断网或者超时')
          dispatch && cb.rest.cache.isOpenDBCache && dispatch(genAction('PLATFORM_UI_OFF_LINE_CHANGE_LINE_CONNECT', { lineConnection: false }))
        } else {
          cb.utils.alert(json.message, 'error');
        }
        return failCallback && failCallback();
      }
      if (json.message) { // 后端特殊场景
        cb.utils.alert(json.message, 'error');
      }
      json.data.forEach((product, index) => {
        // if (product.fVIPDiscount != undefined && product.fQuantity)
        //   json.data[index].per_fVIPDiscount = product.fVIPDiscount / product.fQuantity
        if (product.autoPromotion) {
          const text = []
          product.promotionwrite.forEach(promotion => {
            text.push(promotion.cPromotionName)
          })
          product.promotionTips = text.join(',');
        }
      })
      successCallback(json.data);
    });
}

export function warpGetMemberPrice (billProducts, actionName, successCallback, errorCallback) {
  return function (dispatch, getState) {
    const billingStatus = getState().uretailHeader.get('billingStatus');
    const memberData = getState().member.toJS().memberInfo.data || {};
    if (!actionName) actionName = 'addProduct';
    getMemberPrice(getState(), memberData.mid || '', billProducts, billingStatus, successCallback, errorCallback, true, actionName, actionName == 'addProduct' && dispatch);
  }
}

export function commonAfterGetMemberPrice (data, mode) {
  return function (dispatch, getState) {
    if (mode === 'server')
      addProductDispatch(dispatch, getState, transferProducts(data));
    else
      addProductDispatch(dispatch, getState, data);
  }
}

export function modifyQuotePrice (product, bGetPrice, type, editRowCallback) {
  return function (dispatch, getState) {
    const passFalse = bGetPrice === true;
    const memberData = getState().member.toJS().memberInfo.data || {};
    const billingStatus = getState().uretailHeader.toJS().billingStatus;
    const currentName = type === 'changeSpecs' ? 'changeSpecs' : 'changeQuotePrice';
    if (!memberData) {
      if(!afterModifyQuotePrice(product, 'noMember', type)) return
      return dispatch(genAction('PLATFORM_UI_BILLING_UPDATE_PRODUCT', product));
    }
    getMemberPrice(getState(), memberData.mid, [product], billingStatus, data => {
      if(!afterModifyQuotePrice(data[0], 'memberSuccess', type)) return
      dispatch(genAction('PLATFORM_UI_BILLING_UPDATE_PRODUCT', data[0]));
      if (editRowCallback) editRowCallback(data[0]);
    }, () => {
      /* 改价失败后  清除bQuote */
      product.bQuote = false;
      if(!afterModifyQuotePrice(product, 'memberFail', type)) return
      dispatch(genAction('PLATFORM_UI_BILLING_UPDATE_PRODUCT', product));
    }, passFalse, currentName);
  }
}

export function execMemberPrice (memberId, memberInfo) {
  return function (dispatch, getState) {
    // let products = getState().product.toJS().products;
    const products = globalProducts;
    const touchRoutePC = getState().config.get('touchRoutePC');
    if (cb.rest.interMode == 'touch' && !touchRoutePC && memberInfo) {
      const memberData = memberInfo.data || {}
      products.forEach(row => {
        touchRegetPrice({ sku: [row] }, [row], getState(), memberData)
      })
      dispatch(genAction('PLATFORM_UI_BILLING_EXECUTE_MEMBER_UPDATE_PRODUCTS', products));
      return
    }
    const billingStatus = getState().uretailHeader.toJS().billingStatus;
    getMemberPrice(getState(), memberId, products, billingStatus, data => {
      dispatch(genAction('PLATFORM_UI_BILLING_EXECUTE_MEMBER_UPDATE_PRODUCTS', transferProducts(data)));
    }, () => {
    }, false, 'member');
  }
}

/* add by jinzh1 表体行序列号更改后需更新 */
export function modfiySnPrice (product) {
  return function (dispatch, getState) {
    // let products = globalProducts;
    const memberData = getState().member.toJS().memberInfo.data || {};
    const billingStatus = getState().uretailHeader.toJS().billingStatus;
    getMemberPrice(getState(), memberData.mid, [product], billingStatus, data => {
      dispatch(genAction('PLATFORM_UI_BILLING_UPDATE_PRODUCT', data[0]));
    }, () => {
    }, true, 'addProduct');
  }
}

const addProductDispatch = (dispatch, getState, products) => {
  // let before_products = getState().product.toJS().products;
  const before_products = globalProducts;
  const samegoodsmerged = getOptions().samegoodsmerged ? getOptions().samegoodsmerged.value == '2' : false;
  if (!before_products.length)
    dispatch(setReceiptHang(false));
  afterFinalAddProduct(products) /* 扩展脚本干预 */
  mergeSameProduct(before_products, products, samegoodsmerged, dispatch, getState)
  // dispatch(setFocusedRow(products[products.length - 1]));
  if (products && products.length > 0) {
    promotionSetFocusedRow(dispatch, products, before_products, samegoodsmerged)
    dispatch(openBackModal(before_products, products));
    mergeMulteProduct(dispatch, getState, products);
  }
}

// 兼容存在一次性商品数量超过一件  yangleih  2019.04.02
const mergeMulteProduct = (dispatch, getState, products) => {
  setPrevCompareProducts(products, (tempCompareProducts) => {
    products.map((item) => {
      tempCompareProducts.map((item0) => {
        if(item.key === item0.key && item.fQuantity > 1)
          dispatch(checkQuantity(item.fQuantity, item));
      })
    })
  });
}

// 删除多件商品  yangleih  2019.04.02
export function deleteMulteProducts (products) {
  return async (dispatch, getState) => {
    products.map((item, index) => {
      if(item.key) {
        dispatch(setFocusedRow(item));
        dispatch(genAction('PLATFORM_UI_BILLING_DELETE_PRODUCT', item.key));
        products.splice(index, index + 1);
      }
    })
  }
}

export function deleteProducts (products) {
  return (dispatch) => {
    products.forEach(ele => {
      if(ele.key) {
        dispatch(setFocusedRow(ele));
        dispatch(genAction('PLATFORM_UI_BILLING_DELETE_PRODUCT', ele.key));
      }
    })
  }
}

const afterFinalAddProduct = (products) => {
  const billingViewModel = getBillingViewModel()
  if (!billingViewModel) {
    cb.utils.alert('正在初始化，请稍后重试', 'error');
    return false
  }
  billingViewModel.execute('afterFinalAddProduct', {products})
}

/* 交货时验货 */
const deliveryInspect = (before_products, obj, dispatch, getState) => {
  const products = obj.sku && obj.sku.length ? obj.sku : obj.goods;
  const billingStatus = getState().uretailHeader.get('billingStatus')
  // if (billingStatus !== 'OnlineBill' && billingStatus !== 'OnlineBackBill' && billingStatus !== 'Shipment') return true
  if (before_products && before_products.length < 1) return true
  const infoData = getState().uretailHeader.get('infoData')
  const onlineDeliverModify = Immutable.Map.isMap(infoData) ? infoData.get('bDeliveryModify') : infoData.bDeliveryModify
  if (products.length < 1) { // 参照商品
    if ((billingStatus === status.OnlineBill && onlineDeliverModify === false) || billingStatus === status.OnlineBackBill) {
      cb.utils.alert('电商订单状态下不能新增商品！', 'error');
      return false
    }
    return true
  }
  const indexArr = []
  for (const [newIndex, newRow] of products.entries()) {
    if (!newRow.skuId) continue
    for (const [oldIndex, oldRow] of before_products.entries()) { // eslint-disable-line no-unused-vars
      let update = false
      let getPrice = false
      let needBreak = false // 匹配到套餐就不需要在匹配开单其他行

      if (oldRow.bFixedCombo && oldRow.children) {
        const children = oldRow.children
        const fatherKey = oldRow.key
        for (const oldChild of children) {
          const childResult = judgeDeliveryInspectConditions(oldChild, newRow, before_products, billingStatus, onlineDeliverModify, dispatch, getState, fatherKey)
          update = childResult && childResult.update;
          getPrice = childResult && childResult.getPrice;
          if (!childResult || (childResult && childResult.update)) {
            needBreak = true
            break
          }
        }
      } else {
        const result = judgeDeliveryInspectConditions(oldRow, newRow, before_products, billingStatus, onlineDeliverModify, dispatch, getState)
        update = result && result.update;
        getPrice = result && result.getPrice;
      }

      if (update) {
        if (getPrice) {
          if (hasPreferential(getState(), '已经执行过优惠，不允许修改序列号！')) return false
          dispatch(modfiySnPrice(oldRow))
        }
        else
          dispatch(genAction('PLATFORM_UI_BILLING_UPDATE_PRODUCT', oldRow))
        // products.splice(newIndex, 1)
        indexArr.push(newIndex)
        break
      }
      if (needBreak) {
        products.length && products.splice(newIndex, 1) // 前提扫码为一件商品
        break
      }
    }
  }
  for (let len = indexArr.length, j = len - 1; j >= 0; j--) {
    products.splice(indexArr[j], 1)
  }
  if (billingStatus === 'OnlineBackBill' && products.length > 0) {
    cb.utils.alert('电商退货状态下不能新增商品！', 'error')
    return false
  }
  if (billingStatus === 'OnlineBill' && products.length > 0 && !onlineDeliverModify) {
    cb.utils.alert('电商交货不可改状态下不能新增商品！', 'error')
    return false
  }
  if (products.length <= 0)
    return false
  return true
}

const judgeDeliveryInspectConditions = ( oldRow, newRow, before_products, billingStatus, onlineDeliverModify, dispatch, getState, fatherKey) => {
  let update = false; let getPrice = false;
  // 序列号
  if (oldRow.productsku === newRow.skuId && newRow.isSerialNoManage && oldRow.product_productOfflineRetail_isSerialNoManage && newRow.sn && !oldRow.cSerialNo) {
    if (oldRow.fQuantity > 1) {
      splitRows({oldRows: before_products, splitkey: oldRow.key, newRow, dispatch, getState, fatherKey})
      return
    } else {
      oldRow.cSerialNo = newRow.sn
      if (newRow.producedate) oldRow.producedate = newRow.producedate
      if (newRow.invaliddate) oldRow.invaliddate = newRow.invaliddate
      if (billingStatus === status.OnlineBill && onlineDeliverModify && !oldRow.iRelatingRetailDetailId)
        getPrice = true
      else if (billingStatus === status.Shipment && onlineDeliverModify)
        getPrice = true
    }
    update = true
  }
  // 批次号
  if (oldRow.productsku === newRow.skuId && newRow.isBatchManage && oldRow.product_productOfflineRetail_isBatchManage && newRow.batchno && !oldRow.cBatchno) {
    oldRow.cBatchno = newRow.batchno
    if (newRow.producedate) oldRow.producedate = newRow.producedate
    if (newRow.invaliddate) oldRow.invaliddate = newRow.invaliddate
    update = true
  }
  return { update, getPrice }
}

const splitRows = (options = {}) => {
  const { oldRows, splitkey, newRow, dispatch, getState, fatherKey } = options
  const bill = getBillingHeader(getState());
  // bill[productsChildrenField] = transferProducts2Flatten(oldRows);
  bill[productsChildrenField] = oldRows
  const config = {
    url: '/bill/splitretailbysn',
    method: 'POST',
    params: {
      data: JSON.stringify(bill),
      key: splitkey,
      sn: JSON.stringify(newRow)
    }
  }
  if (fatherKey) {
    config.params.detailkey = fatherKey
  }
  proxy(config).then(json => {
    if (json.code !== 200) {
      cb.utils.alert(json.message, 'error');
      return
    }
    // let products = transferProducts(json.data)
    const products = json.data
    dispatch(genAction('PLATFORM_UI_BILLING_EXECUTE_MEMBER_UPDATE_PRODUCTS', products));
  })
}

const mergeSameProduct = (before_products, products, samegoodsmerged, dispatch, getState) => {
  // 不存在商品行
  if (before_products && before_products.length > 0) {
    for (let j = products.length - 1; j >= 0; j--) {
      const newEle = products[j]; const newIndex = j;
      for (let i = 0; i < before_products.length; i++) {
        const oldEle = before_products[i]; const oldIndex = i;

        /* add by jinzh1  触屏开单配置 */
        const options = getBillingTouchOptions();
        if (options && options.basicSettingData.flipPage == 2 && options.basicSettingData.selectType === '1') {
          var produtState = getState().product;
          var pageSize = produtState.get('pageSize');
          var pageIndex = produtState.get('pageIndex');
          var len = before_products.length;
          var totalPage = Math.ceil(len / pageSize);
          var newOldIndex = oldIndex + 1;
        }
        if (!samegoodsmerged) {
          /* add by jinzh1 相同商品合并切分页显示时 需跳转到添加的商品页码 */
          totalPage = Math.ceil((len + 1) / pageSize);
          if (options && options.basicSettingData.flipPage == 2 && options.basicSettingData.selectType === '1' && pageIndex < totalPage) {
            dispatch(modifyProductInfo({ pageIndex: totalPage }))
          }
          // 匹配到完旧数据，人没有匹配到时候，新增当前index的商品行
          dispatch(genAction('PLATFORM_UI_BILLING_ADD_PRODUCT', [products[newIndex]]));
          break;
        }
        if (mergeCondition(newEle, oldEle, getState)) {
          const newEleQuantity = newEle.fQuantity;
          products.splice(newIndex, 1); // 删除新增的重复skuId的商品
          // 给before_products[oldIndex]的数量+1
          let num = oldEle.fQuantity;
          num = num + newEleQuantity;
          dispatch(modifyQuantity(before_products[oldIndex], num))
          dispatch(setFocusedRow(before_products[oldIndex], oldIndex));

          if (options && options.basicSettingData.flipPage == 2 && options.basicSettingData.selectType === '1') {
            /* add by jinzh1 相同商品合并切分页显示时 需跳转到添加的商品页码 */
            if (totalPage == 1) break;
            if (newOldIndex <= pageSize && pageIndex != 1) {
              dispatch(modifyProductInfo({ pageIndex: 1 }));
              break;
            }
            for (let k = 0; k < totalPage; k++) {
              if (newOldIndex > k * pageSize && newOldIndex <= (k + 1) * pageSize) {
                dispatch(modifyProductInfo({ pageIndex: k + 1 }))
                break;
              }
            }
          }
          break
        } else if (oldIndex == before_products.length - 1) {
          totalPage = Math.ceil((len + 1) / pageSize);
          /* add by jinzh1 相同商品合并切分页显示时 需跳转到添加的商品页码 */
          if (options && options.basicSettingData.flipPage == 2 && options.basicSettingData.selectType === '1' && pageIndex < totalPage) {
            // totalPage = Math.ceil((len + 1) / pageSize);
            dispatch(modifyProductInfo({ pageIndex: totalPage }))
          }
          // 匹配到完旧数据，人没有匹配到时候，新增当前index的商品行
          dispatch(genAction('PLATFORM_UI_BILLING_ADD_PRODUCT', [products[newIndex]]));
        }
      }
    }
  } else {
    // 开单界面不存在商品行，直接新增商品行
    dispatch(genAction('PLATFORM_UI_BILLING_ADD_PRODUCT', products));
  }
}

const mergeCondition = (newEle, oldEle, getState) => {
  const isSameCombo = newEle.bFixedCombo && oldEle.key.split('_')[0] == newEle.key.split('_')[0];
  const idSkuidKey = (row) => {
    return `${row.product}|${row.productsku}`
  }
  let result = true; const middle = {result}
  if (!beforeMergeSameProduct(newEle, oldEle, middle)) {
    return middle.result
  }
  if (isSameCombo)
    return true
  result = middle.result;
  /* id相同，且价格相同的商品 */
  if (result) {
    result = idSkuidKey(newEle) == idSkuidKey(oldEle) && oldEle.fPrice == newEle.fPrice
  }
  /* 批次 */
  if (result) {
    result = checkBatch(newEle, oldEle);
  }
  /* 效期 */
  if (result) {
    result = checkDates(newEle, oldEle);
  }
  /* 序列号 */
  if (result) {
    if (!newEle.product_productOfflineRetail_isSerialNoManage)
      result = true
    else
      result = false
  }
  /* 去掉换货情况,赠品与主商品相同情况 */
  if (result) {
    const promotionFilter = getState().product.get('promotionFilter') ? getState().product.get('promotionFilter').toJS() : null;
    result = (oldEle.fQuantity * newEle.fQuantity > 0) && (promotionFilter ? oldEle.iPromotionProduct == 1 : true)
  }
  /* 参与折扣计算(换货商品和现销商品的区别) */
  if (result) {
    result = (newEle.bCanDiscount === oldEle.bCanDiscount)
  }
  return result
}

const checkBatch = (newEle, oldEle) => {
  const batches = 'product_productOfflineRetail_isBatchManage';
  if (newEle[batches] || oldEle[batches]) { // 有批次
    if (newEle[batches] && oldEle[batches] && newEle.cBatchno === oldEle.cBatchno)
      return true
    else
      return false
  } else { // 无批次跳过批次校验
    return true
  }
}

const checkDates = (newEle, oldEle) => {
  const dates = 'product_productOfflineRetail_isExpiryDateManage';
  if (newEle[dates] || oldEle[dates]) { // 有批次
    if (newEle[dates] && oldEle[dates] && newEle.invaliddate === oldEle.invaliddate && newEle.producedate === oldEle.producedate)
      return true
    else
      return false
  } else { // 无批次跳过批次校验
    return true
  }
}

const promotionSetFocusedRow = (dispatch, products, before_products, samegoodsmerged) => {
  let noGift = true
  for (const attr in promotionMasterMap) {
    if (promotionMasterMap[attr] && promotionMasterMap[attr].cQuantity > 0) {
      dispatch(setFocusedRow(products[attr]));
      noGift = false;
      break
    }
  }
  let sRow = before_products.length;
  if(samegoodsmerged) { /* 相同商品合并时 才处理scrollRow */
    const focusedRow = products[0];
    before_products.map((bp, index) => {
      if (focusedRow.product == bp.product && focusedRow.productsku == bp.productsku)
        sRow = index;
    });
  }
  if(noGift === true) dispatch(setFocusedRow(products[0], sRow))
}

export function handleBackBill (products) {
  return function (dispatch, getState) {
    if (products.length)
      dispatch(setReceiptHang(false));
    // let before_products = getState().product.toJS().products;
    const before_products = globalProducts;
    // let foldDiscountSum = 0; // 以此字段来接受原单折扣额总额
    products.forEach(item => {
      if (item.children) {
        item.children.forEach(ele => {
          // ele.key = ele.iCoRetailDetailId; 后端不记得用，暂先去掉
          if (ele.fCanCoQuantity !== undefined)
            ele.fQuantity = 0 - parseFloat(ele.fCanCoQuantity);
          ele.fQuoteMoney = 0 - ele.fQuoteMoney;
          ele.fMoney = 0 - ele.fMoney;
          item.fQuantity = (ele.fQuantity / ele[promotionsChildrenField][0].fQuantity);
          item.fMoney = formatMoney(item.fQuantity * item.fPrice);
          item.fQuoteMoney = formatMoney(item.fQuantity * item.fQuotePrice);
          // item.fDiscountRate = 100;
          // item.fDiscount = item.fQuoteMoney - item.fMoney; 原单退货 折扣额都为0
        })
      } else {
        // item.key = item.iCoRetailDetailId; 后端不记得用，暂先去掉
        item.fQuantity = 0 - item.fQuantity;
        const origin_fQuantity = item.fQuantity;
        if (item.fCanCoQuantity !== undefined)
          item.fQuantity = 0 - parseFloat(item.fCanCoQuantity);
        item.fQuoteMoney = 0 - item.fQuoteMoney;
        item.fMoney = 0 - item.fMoney;
        item.fDiscount = 0 - item.fDiscount;
        item.foldDiscount = 0 - item.foldDiscount;
        if (item.fCouponPayApportion) item.fCouponPayApportion = 0 - item.fCouponPayApportion
        if (item.fCouponDisApportion) item.fCouponDisApportion = 0 - item.fCouponDisApportion
        if (Math.abs(item.fCanCoQuantity) != Math.abs(origin_fQuantity)) {
          item.fMoney = formatMoney(item.fCanCoQuantity * item.fPrice * -1); // 退货一半，重算实销价
          item.fQuoteMoney = formatMoney(item.fCanCoQuantity * item.fQuotePrice * -1);
          item.foldDiscount = formatMoney(item.fCanCoQuantity * (item.fQuotePrice - item.fPrice) * -1);
          item.fDiscount = item.foldDiscount;
          item.fDiscountRate = Math.abs((item.fPrice / item.fQuotePrice) * 100)
        }
        if (item.fQuantity > 0) item.noModify = true; // 换货行导出不能修改数量
        item.bCanDiscount = false; // 原单退货不参与折扣计算
        // item.fDiscount = item.fQuoteMoney - item.fMoney;
        // foldDiscountSum += item.foldDiscount
      }
    });
    // moneyMap.FoldDiscount.value = foldDiscountSum; // 原单折扣额更新到FoldDiscountSum字段中
    dispatch(genAction('PLATFORM_UI_BILLING_ADD_PRODUCT', products));
    dispatch(setFocusedRow(products[products.length - 1]));
    dispatch(openBackModal(before_products, products));
  }
}

export function handlePresellBack (products) {
  return function (dispatch, getState) {
    if (products.length)
      dispatch(setReceiptHang(false));
    products.forEach(item => {
      item.key = item.id;
      item.fQuantity = 0 - item.fQuantity;
      item.fQuoteMoney = 0 - item.fQuoteMoney;
      item.fMoney = 0 - item.fMoney;
      item.fDiscount = 0 - item.fDiscount;
      item.fSceneDiscount = 0 - item.fSceneDiscount;
      item.fPromotionDiscount = 0 - item.fPromotionDiscount;
      item.fVIPDiscount = 0 - item.fVIPDiscount;
      item.fEffaceMoney = 0 - item.fEffaceMoney;
    });
    dispatch(genAction('PLATFORM_UI_BILLING_ADD_PRODUCT', products));
    dispatch(setFocusedRow(products[products.length - 1]));
  }
}

export function handleServerData (originMemId, type, products, originalProducts, callback) {
  return function (dispatch, getState) {
    if (products.length)
      dispatch(setReceiptHang(false));
    presellProducts = originalProducts;
    products.forEach(item => {
      if (!item.key) item.key = item.id;
      // 交货 赋上是否套餐标记
      if (item.bFixedCombo === undefined && item.promotionwrite) {
        item.promotionwrite.forEach(ele => {
          if (ele.iPromotionType == 4)
            item.bFixedCombo = true
        })
      }
      if (item.bFixedCombo === undefined)
        item.bFixedCombo = false
    });
    // let presellGodPrice = getOptions().goldprice.value == 2 ? true : false;
    // let bDeliveryModify = getState().uretailHeader.toJS().infoData.bDeliveryModify;
    const memberData = getState().member.toJS().memberInfo.data || {};
    const billingStatus = getState().uretailHeader.toJS().billingStatus;
    const memberId = originMemId || memberData.mid
    getMemberPrice(getState(), memberId, products, billingStatus, data => {
      addProductDispatch(dispatch, getState, transferProducts(data));
      callback && callback()
    }, () => {
      addProductDispatch(dispatch, getState, products);
      callback && callback()
    }, true, type);
  }
}

export function handleOnlineBill (iMemberid, products, isBack) {
  return function (dispatch, getState) {
    if (products.length && !isBack)
      dispatch(setReceiptHang(false));
    if (!getState().salesClerk.toJS().salesChecked) {
      dispatch(onLineSelectEmployee(iMemberid, products, isBack));
      return dispatch(genAction('PLATFORM_UI_BILLING_ADD_PRODUCT', []));
    }
    if (iMemberid) {
      dispatch(queryMemberById(iMemberid));
    }
    // let checkedRow = getState().salesClerk.toJS().checkedRow;
    const infoData = getState().uretailHeader.get('infoData')
    const onlineDeliverModify = Immutable.Map.isMap(infoData) ? infoData.get('bDeliveryModify') : infoData.bDeliveryModify
    const checkedEmployee = getCheckedEmployee();
    products.forEach(item => {
      if (!item.key) item.key = item.id;
      if (onlineDeliverModify && isBack) item.is_online_lz = true; // 删行标记
      const specArr = [];
      for (const attr in item) {
        if (attr.startsWith('free') && item[attr])
          specArr.push(item[attr])
      }
      item.specs = specArr.join(',');
      /* 规格 */
      if (isBack) {
        item.fQuantity = item.fQuantity * -1;
        item.fMoney = item.fMoney ? (item.fMoney * -1) : item.fMoney;
        item.fQuoteMoney = item.fQuoteMoney ? (item.fQuoteMoney * -1) : item.fQuoteMoney
      }
      Object.assign(item, checkedEmployee)
    });
    dispatch(genAction('PLATFORM_UI_BILLING_ADD_PRODUCT', products));
    dispatch(setFocusedRow(products[products.length - 1]));
  }
}

export function handleFurnitureBill (products) {
  return function (dispatch, getState) {
    let checkedEmployee = {}
    if (!products[0].iEmployeeid) {
      if (!getState().salesClerk.toJS().salesChecked) {
        dispatch(furnitrueSelectEmployee(products));
        return dispatch(genAction('PLATFORM_UI_BILLING_ADD_PRODUCT', []));
      }
      checkedEmployee = getCheckedEmployee();
    }
    products.forEach(item => {
      Object.assign(item, checkedEmployee)
    });
    dispatch(genAction('PLATFORM_UI_BILLING_ADD_PRODUCT', products));
    dispatch(setFocusedRow(products[products.length - 1]));
  }
}

export function addCacheProduct (products) {
  return function (dispatch, getState) {
    const allState = getState();
    const productRedux = allState.product;
    const promotionFilter = productRedux.get('promotionFilter') ? productRedux.get('promotionFilter').toJS() : null;
    // let reduxProducts = getState().product.toJS().products;
    const reduxProducts = globalProducts;

    const exportData = transferReferProduct(products, allState);
    const billProducts = exportData.dataSource;
    const { _isGetPrice, _touchIsGetPrice, _actionName } = exportData;
    const memberData = allState.member.toJS().memberInfo.data || {};
    makePromotionGiftMap(promotionFilter, products, billProducts, dispatch, reduxProducts);
    if (notSendServer(memberData, allState, billProducts, {_isGetPrice, _touchIsGetPrice}))
      touchRegetPrice(products, billProducts, allState, memberData); /* 触屏重取价格 */
    if (isChangeGoods(billProducts))
      exchangeGoods(billProducts, reduxProducts);
    const billingStatus = allState.uretailHeader.toJS().billingStatus;
    /* start todo
可称重商品 电子秤取重量 */
    if (billProducts[0].__codeType === undefined)
      dispatch(addEnableWeightProduct(billProducts[0]))
    /* 可称重商品 电子秤取重量
    end */
    const callback = function () {
      if (notSendServer(memberData, allState, billProducts, {_isGetPrice}))
        return addProductDispatch(dispatch, getState, billProducts);
      getMemberPrice(allState, memberData.mid, billProducts, billingStatus, data => {
        addProductDispatch(dispatch, getState, transferProducts(data));
      }, () => {
        addProductDispatch(dispatch, getState, billProducts);
      }, true, _actionName || 'addProduct', dispatch);
    }
    outLogicSinceGetPrice(billProducts, callback)
  }
}

const outLogicSinceGetPrice = (billProducts, callback) => {
  const billingViewModel = getBillingViewModel();
  if (!billingViewModel) {
    cb.utils.alert('正在初始化，请稍后重试', 'error');
    return false
  }
  billingViewModel.promiseExecute('outLogicSinceGetPrice', {billProducts}, callback)
}

const touchRegetPrice = (referProducts, billProducts, allState) => {
  const billingViewModel = getBillingViewModel()
  if (!billingViewModel) {
    cb.utils.alert('正在初始化，请稍后重试', 'error');
    return false
  }
  const hasCancelAutoPromotion = getPromotionConstant('hasCancelAutoPromotion');
  billingViewModel.execute('extendTouchRegetPrice', {referProducts, billProducts, allState, hasCancelAutoPromotion})
}

function notSendServer (member, allState, newAddProducts, extendParams = {}) {
  // let { canQuantity, promotionFilter } = allState.product.toJS();
  const { _isGetPrice } = extendParams;
  if (_isGetPrice !== undefined && _isGetPrice !== null) return !_isGetPrice
  const productRedux = allState.product;
  const canQuantity = productRedux.get('canQuantity');
  const promotionFilter = productRedux.get('promotionFilter') ? productRedux.get('promotionFilter').toJS() : null;
  const touchRoutePC = allState.config.get('touchRoutePC')
  let { LowestPriceControl } = getOptions();
  LowestPriceControl = LowestPriceControl ? LowestPriceControl.value : false;

  const industry = cb.rest.AppContext.tenant ? cb.rest.AppContext.tenant.industry : cb.rest.AppContext.user.industry;
  if (canQuantity) {
    if (cb.rest.interMode === 'touch') touchServerTips = '当前网络状况不能查询可用量！'
    return false
  }
  if (industry == 17) {
    if (cb.rest.interMode === 'touch') touchServerTips = '当前网络状况不能取金价！'
    return false
  }
  if (promotionFilter && promotionFilter.length > 0) {
    if (cb.rest.interMode === 'touch') touchServerTips = '当前网络状况不能执行促销赠品！'
    return false
  }
  if (LowestPriceControl) {
    if (cb.rest.interMode === 'touch') touchServerTips = '当前网络状况不能执行最低价格！'
    return false
  }
  if (cb.rest.interMode === 'touch' && !touchRoutePC && newAddProducts) { /* 触屏扫描序列号 */
    touchServerTips = '当前网络状况不能重取序列号商品价格！'
    for(const product of newAddProducts) {
      if (product.cSerialNo) return false
    }
  }
  if (member.mid) {
    if (cb.rest.interMode === 'touch' && !touchRoutePC)
      return true
    else {
      if (cb.rest.interMode === 'touch') touchServerTips = '当前网络状况不允许录入会员，请重新开单！'
      return false
    }
  }
  if ((cb.rest.interMode !== 'touch' || (cb.rest.interMode == 'touch' && touchRoutePC)) && isGetServiceTable) /* 业务判断走完，再走此系统参数判断 */
    return false
  return true
}

export function addProduct (products) {
  return function (dispatch, getState) {
    if ((!getState().salesClerk.toJS().salesChecked && cb.rest.terminalType != 3) ||
      (cb.rest.AppContext.option.retailMustChooseEmployee && !getState().salesClerk.toJS().hasShow)) {
      dispatch(cacheProduct(products));
      return dispatch(genAction('PLATFORM_UI_BILLING_ADD_PRODUCT', []));
    }
    dispatch(addCacheProduct(products));
  }
}

export function _transferRefer2Bill (referItem, billItem) {
  for (const attr in productRefer2BillKeyFieldMap) {
    const billKeys = productRefer2BillKeyFieldMap[attr];
    billKeys.forEach(billKey => {
      billItem[billKey] = referItem[attr];
    });
  }
  billItem.enableWeight = referItem.enableWeigh
  /* add by jinzh1  移动+大屏 扫码标识 */
  if(!cb.utils.isEmpty(referItem.bScanSource)) billItem.bScanSource = referItem.bScanSource;
  referItem.__codeType !== undefined && (billItem.__codeType = referItem.__codeType)
  mallToRetailFieldMap(referItem, billItem);
}

const changeDefineValue = (type, product) => {
  const industry = cb.rest.AppContext.tenant ? cb.rest.AppContext.tenant.industry : cb.rest.AppContext.user.industry;
  if (industry !== 17) return // 自定义项控制只限珠宝行业
  // let saleCalcStyle //售价计算方式
  // 回收品
  // product['product_productSkuProps!define4'] != undefined ?
  // saleCalcStyle = product['product_productSkuProps!define4'] :
  // saleCalcStyle = product['product_productProps!define1']
  const reBack = product['product_productProps!define2'];
  const judger = type == 'skuTab' ? product.specs.length > 0 : product.skuId != undefined
  if (judger) {
    product['retailVouchDetailCustom!define1'] = product['product_productSkuProps!define1'] // 有sku，重量取自skuDefine1
    product['retailVouchDetailCustom!define3'] = product['product_productSkuProps!define3'] // 有sku，销售工费
  } else {
    if (reBack === '是') {
      if (product.product_productOfflineRetail_isBatchManage) // 商品 == 启用批次属性
        product['retailVouchDetailCustom!define1'] = product['retailVouchDetailBatch!define1']
      else
        product['retailVouchDetailCustom!define1'] = ''
      product['retailVouchDetailCustom!define3'] = product['product_productProps!define3'];
    }
  }
}

const transferReferProduct = (products, allState) => {
  // products.combo = { "369": { "comboData": { "combinationProducts": [{ "product": 28067, "code": "11007", "productClassId": 2135, "retailPriceDimension": 2, "combinationSales": 369, "unitName": "个", "salePrice": 289, "pname": "清洁用品", "productTotalNum": 1, "productClassCode": "10014", "ppath": "|2135|", "productNum": 1, "favorablePrice": 280, "combinationDetailId": 4876, "product_productskus": [{ "product": 28067, "free3": "银灰色", "skuSalePrice": 288, "free4": "智能", "skuId": 70399, "skuCode": "11007002", "skuKey": "28067|70399", "productNum": 1 }, { "product": 28067, "free3": "银灰色", "skuSalePrice": 288, "free4": "非智能", "skuId": 70400, "skuCode": "11007003", "skuKey": "28067|70400" }, { "product": 28067, "free3": "白色", "skuSalePrice": 288, "free4": "智能", "skuId": 70401, "skuCode": "11007004", "skuKey": "28067|70401" }, { "product": 28067, "free3": "白色", "skuSalePrice": 288, "free4": "非智能", "skuId": 70402, "skuCode": "11007005", "skuKey": "28067|70402" }, { "product": 28067, "free3": "黑色", "skuSalePrice": 288, "free4": "智能", "skuId": 70403, "skuCode": "11007006", "skuKey": "28067|70403" }, { "product": 28067, "free3": "黑色", "skuSalePrice": 288, "free4": "非智能", "skuId": 70404, "skuCode": "11007007", "skuKey": "28067|70404" }], "isBatchManage": true, "isExpiryDateManage": false, "name": "米家声波电动牙刷", "productPicUrl": "/photo/products/909/20170926/lm_fa727b63-b88d-433f-9af3-081ba97e3dea.jpg", "isSerialNoManage": false, "isPriceChangeAllowed": false, "skuId": 0, "goodsKey": "369|28067" }, { "product": 28069, "code": "11003", "productClassId": 2132, "retailPriceDimension": 2, "combinationSales": 369, "unitName": "个", "salePrice": 4589, "pname": "手机", "productTotalNum": 1, "productClassCode": "1001", "ppath": "|2132|", "productNum": 1, "favorablePrice": 4000, "combinationDetailId": 4877, "product_productskus": [{ "product": 28069, "free3": "银灰色", "skuSalePrice": 5866, "free4": "智能", "skuId": 70398, "skuCode": "11003002", "skuKey": "28069|70398", "productNum": 1 }, { "product": 28069, "free3": "银灰色", "skuSalePrice": 5866, "free4": "非智能", "skuId": 70415, "skuCode": "11003003", "skuKey": "28069|70415" }, { "product": 28069, "free3": "白色", "skuSalePrice": 5866, "free4": "智能", "skuId": 70416, "skuCode": "11003004", "skuKey": "28069|70416" }, { "product": 28069, "free3": "白色", "skuSalePrice": 5866, "free4": "非智能", "skuId": 70417, "skuCode": "11003005", "skuKey": "28069|70417" }], "isBatchManage": false, "isExpiryDateManage": false, "name": "米动手表青春版", "productPicUrl": "/photo/products/909/20170926/lm_8eb098c8-d1ec-4e0f-a594-eef4ed2512cc.jpg", "isSerialNoManage": false, "isPriceChangeAllowed": false, "skuId": 0, "goodsKey": "369|28069" }], "name": "小米手机套餐1", "id": 369, "packageDiscountDrice": 4280, "packageLimitNum": 1 }, "clap": [{ "product": 28067, "code": "11007", "productClassId": 2135, "retailPriceDimension": 2, "combinationSales": 369, "unitName": "个", "salePrice": 289, "pname": "清洁用品", "productTotalNum": 1, "productClassCode": "10014", "ppath": "|2135|", "productNum": 1, "favorablePrice": 280, "combinationDetailId": 4876, "product_productskus": [{ "product": 28067, "free3": "银灰色", "skuSalePrice": 288, "free4": "智能", "skuId": 70399, "skuCode": "11007002", "skuKey": "28067|70399", "productNum": 1 }, { "product": 28067, "free3": "银灰色", "skuSalePrice": 288, "free4": "非智能", "skuId": 70400, "skuCode": "11007003", "skuKey": "28067|70400" }, { "product": 28067, "free3": "白色", "skuSalePrice": 288, "free4": "智能", "skuId": 70401, "skuCode": "11007004", "skuKey": "28067|70401" }, { "product": 28067, "free3": "白色", "skuSalePrice": 288, "free4": "非智能", "skuId": 70402, "skuCode": "11007005", "skuKey": "28067|70402" }, { "product": 28067, "free3": "黑色", "skuSalePrice": 288, "free4": "智能", "skuId": 70403, "skuCode": "11007006", "skuKey": "28067|70403" }, { "product": 28067, "free3": "黑色", "skuSalePrice": 288, "free4": "非智能", "skuId": 70404, "skuCode": "11007007", "skuKey": "28067|70404" }], "isBatchManage": true, "isExpiryDateManage": false, "name": "米家声波电动牙刷", "productPicUrl": "/photo/products/909/20170926/lm_fa727b63-b88d-433f-9af3-081ba97e3dea.jpg", "isSerialNoManage": false, "isPriceChangeAllowed": false, "skuId": 70399, "goodsKey": "369|28067", "free3": "银灰色", "skuSalePrice": 288, "free4": "智能", "skuCode": "11007002", "skuKey": "28067|70399" }, { "product": 28069, "code": "11003", "productClassId": 2132, "retailPriceDimension": 2, "combinationSales": 369, "unitName": "个", "salePrice": 4589, "pname": "手机", "productTotalNum": 1, "productClassCode": "1001", "ppath": "|2132|", "productNum": 1, "favorablePrice": 4000, "combinationDetailId": 4877, "product_productskus": [{ "product": 28069, "free3": "银灰色", "skuSalePrice": 5866, "free4": "智能", "skuId": 70398, "skuCode": "11003002", "skuKey": "28069|70398", "productNum": 1 }, { "product": 28069, "free3": "银灰色", "skuSalePrice": 5866, "free4": "非智能", "skuId": 70415, "skuCode": "11003003", "skuKey": "28069|70415" }, { "product": 28069, "free3": "白色", "skuSalePrice": 5866, "free4": "智能", "skuId": 70416, "skuCode": "11003004", "skuKey": "28069|70416" }, { "product": 28069, "free3": "白色", "skuSalePrice": 5866, "free4": "非智能", "skuId": 70417, "skuCode": "11003005", "skuKey": "28069|70417" }], "isBatchManage": false, "isExpiryDateManage": false, "name": "米动手表青春版", "productPicUrl": "/photo/products/909/20170926/lm_8eb098c8-d1ec-4e0f-a594-eef4ed2512cc.jpg", "isSerialNoManage": false, "isPriceChangeAllowed": false, "skuId": 70398, "goodsKey": "369|28069", "free3": "银灰色", "skuSalePrice": 5866, "free4": "智能", "skuCode": "11003002", "skuKey": "28069|70398" }] } }
  const dataSource = []
  const ts = new Date().valueOf();
  const checkedEmployee = getCheckedEmployee();
  const billingStatus = allState.uretailHeader.toJS().billingStatus;
  // let backBill_checked = allState.product.toJS().backBill_checked;
  const backBill_checked = allState.product.get('backBill_checked');
  let positiveOrNegative = 1; let isBackBill = false;
  if (productFQuantityBeNegative(billingStatus) && backBill_checked) {
    positiveOrNegative = -1;
    isBackBill = true;
  }
  if (products.sku) {
    products.sku.forEach(item => {
      const sku = { key: `${item.skuKey}_${ts}`, bCanDiscount: !isBackBill, bFixedCombo: false };
      _transferRefer2Bill(item, sku);
      sku.fQuantity = (item.quantity !== undefined) ? (item.quantity * positiveOrNegative) : positiveOrNegative; // 赵哲新需求加 参照带下数量和金额
      if (cb.rest.interMode === 'self')
        sku.fQuantity = (item.fQuantity !== undefined) ? (item.fQuantity * positiveOrNegative) : sku.fQuantity;
      if (cb.rest.terminalType == 3) {
        sku.fQuotePrice = item.skuSalePrice || 0;
        sku.fQuantity = (item.fQuantity) * positiveOrNegative;
      } else {
        sku.fQuotePrice = item.skuSalePrice;
      }
      /* sku页签重赋fQuotePrice的值 */
      sku.fQuoteMoney = (item.money !== undefined) ? formatMoney((item.money * positiveOrNegative)) : formatMoney((sku.fQuotePrice * positiveOrNegative));
      sku.fPrice = sku.fQuotePrice;
      sku.fMoney = (item.money !== undefined) ? formatMoney((item.money * positiveOrNegative)) : formatMoney((sku.fPrice * positiveOrNegative));
      if (cb.rest.terminalType == 3 || cb.rest.interMode === 'self') {
        /* modify by jinzh1  移动+大屏 商品参照更改数量需要重新计算fMoney   但扫码商品不需要 */
        // if(!sku.bScanSource){
        // sku.fQuoteMoney = (item.money !== undefined) ? formatMoney((item.money * sku.fQuantity)) : formatMoney((sku.fQuotePrice * sku.fQuantity));
        // sku.fMoney = (item.money !== undefined) ? formatMoney((item.money * sku.fQuantity)) : formatMoney((sku.fPrice * sku.fQuantity));
        /* modify by jinzh1 商品参照更改数量重新计算   item.money为扫码来源金额 不在计算 */
        sku.fQuoteMoney = formatMoney((sku.fQuotePrice * sku.fQuantity));
        sku.fMoney = formatMoney((sku.fPrice * sku.fQuantity));
        // }
        sku.productskus = item.productskus
        sku.key = `${item.exactKey}_${ts}`
      }
      sku.fDiscount = sku.fQuotePrice - sku.fPrice;
      if (billingStatus === status.NoFormerBackBill && backBill_checked)
        sku.foldPrice = sku.fQuotePrice;
      sku.productAlbums = item.productAlbums // 自助大屏商品图
      if(item.promotioninfo) sku.promotioninfo = item.promotioninfo
      if(item.MemberInfo) sku.MemberInfo = item.MemberInfo
      Object.assign(sku, checkedEmployee);
      sku.specsBtn = false;
      // const specs = [];
      // for (let attr in item) {
      //   if (attr.startsWith('free'))
      //     specs.push(item[attr]);
      // }
      // sku.specs = specs.join(',');
      sku.specs = item.propertiesValue || ''
      changeDefineValue('skuTab', sku)
      dataSource.push(sku);
    });
  }
  if (products.goods) {
    products.goods.forEach(item => {
      const sku = {
        key: `${item.id}_${ts}`,
        fQuantity: positiveOrNegative,
        bCanDiscount: !isBackBill,
        bFixedCombo: false
      };
      _transferRefer2Bill(item, sku);
      sku.fQuotePrice = item.salePrice;
      /* goods页签重赋fQuotePrice的值 */
      sku.fQuoteMoney = formatMoney(sku.fQuotePrice * positiveOrNegative);
      sku.fPrice = sku.fQuotePrice;
      sku.fMoney = formatMoney(sku.fPrice * positiveOrNegative);
      sku.fDiscount = sku.fQuotePrice - sku.fPrice;
      if (cb.rest.interMode === 'touch') {
        sku.productskus = item.productskus
      }
      if (billingStatus === status.NoFormerBackBill && backBill_checked)
        sku.foldPrice = sku.fQuotePrice;
      Object.assign(sku, checkedEmployee);
      item.skuId ? (sku.specsBtn = false) : (sku.specsBtn = true);
      changeDefineValue('goodsTab', sku)
      dataSource.push(sku);
    });
  }
  if (products.combo) {
    // let fixedComboDiscount = 0;
    for (const attr in products.combo) {
      const { comboData, clap } = products.combo[attr];
      const combo = {
        key: `${comboData.id}_${ts}`,
        fQuantity: positiveOrNegative,
        title: comboData.name,
        fPrice: comboData.packageDiscountDrice,
        bFixedCombo: true
      };
      combo.fMoney = formatMoney(combo.fPrice * positiveOrNegative);
      combo.fQuotePrice = combo.fMoney;
      combo.fQuoteMoney = 0;
      combo.fPromotionPrice = combo.fPrice
      Object.assign(combo, checkedEmployee);
      combo.children = [];
      clap.forEach(item => {
        const sku = {
          key: `${comboData.id}|${item.skuKey}_${ts}`,
          fQuantity: (item.productNum * positiveOrNegative),
          fPrice: item.favorablePrice || 0,
          bCanDiscount: !isBackBill,
          bFixedCombo: true
        };
        _transferRefer2Bill(item, sku);
        sku.iPromotionProduct = 5 /* 0、普通1、赠品2、 加购商品3、 搭配商品4、 送克数商品5、 套餐商品 */
        sku.fQuotePrice = item.skuSalePrice;
        /* 重赋fQuotePrice的值 */
        sku.fQuoteMoney = formatMoney(sku.fQuotePrice * sku.fQuantity);
        combo.fQuoteMoney += sku.fQuoteMoney
        // sku.fMoney = sku.fPrice * sku.fQuantity;
        sku.fMoney = formatMoney(sku.fPrice * positiveOrNegative);
        sku.fPrice = sku.fMoney / sku.fQuantity;
        sku.fDiscount = sku.fQuoteMoney - sku.fMoney;
        sku.fDiscountRate = sku.fPrice / sku.fQuotePrice; // 折扣率
        sku.fPromotionDiscount = sku.fDiscount
        sku.productNum = item.productNum;
        if (billingStatus === status.NoFormerBackBill && backBill_checked)
          sku.foldPrice = sku.fQuotePrice;
        Object.assign(sku, checkedEmployee);
        // const specs = [];
        // for (let attr in item) {
        //   if (attr.startsWith('free'))
        //     specs.push(item[attr]);
        // }
        // sku.specs = specs.join(',');
        sku.specs = item.propertiesValue || ''
        changeDefineValue('goodsTab', sku)
        sku[promotionsChildrenField] = [{
          iPromotionType: comboData.iPromotionType,
          iPromotionid: comboData.id,
          fAmount: sku.fQuoteMoney - sku.fMoney,
          fQuantity: 1,
          cPromotionTypeName: comboData.cPromotionTypeName,
          cPromotionName: comboData.name,
          referComboKey: combo.key,
          comboPrice: sku.fPrice,
          comboMoney: sku.fMoney
        }];
        combo.children.push(sku);
      });
      // fixedComboDiscount += combo.fQuoteMoney - combo.fMoney;
      dataSource.push(combo);
    }
    // moneyMap.Promotion.value += fixedComboDiscount;
  }
  const exportData = {dataSource}
  afterAddProduct(exportData, products)
  return exportData;
}

const clearMoneyMap = () => {
  for (const attr in moneyMap) {
    const item = moneyMap[attr];
    item.value = 0;
    if (!item.hasOwnProperty('done')) continue;
    item.done = false;
  }
}

export function calcMoney (products, isAdd) {
  expandedRowKeys = [];
  let total = 0; let member = 0; let real = 0; let totalQuantity = 0; let backDiscount = 0; let oldDiscount = 0; let promotion_value = 0;
  let go_zero = 0; let scene_value = 0;
  products.forEach((item, index) => {
    if (item.bFixedCombo)
      expandedRowKeys.push(item.key);
    total += item.fQuoteMoney;
    // if (item.per_fVIPDiscount != undefined && item.fQuantity)
    //   products[index].fVIPDiscount = item.per_fVIPDiscount * item.fQuantity;
    member += item.fVIPDiscount || 0;
    real += item.fMoney ? item.fMoney : 0;
    if (item.children) {
      item.children.forEach(ele => {
        totalQuantity += ele.fQuantity;
        backDiscount += ele.fCoDiscount || 0;
        oldDiscount += ele.foldDiscount || 0;
        if (ele.fPromotionDiscount && isAdd)
          ele.fPromotionDiscount_origin = ele.fPromotionDiscount
        promotion_value += ele.fPromotionDiscount || 0;
        scene_value += ele.fSceneDiscount || 0;
        go_zero += ele.fEffaceMoney || 0;
      })
    } else {
      totalQuantity += +(item.fQuantity);
      backDiscount += item.fCoDiscount || 0;
      oldDiscount += item.foldDiscount || 0;
      if (item.fPromotionDiscount && isAdd)
        item.fPromotionDiscount_origin = item.fPromotionDiscount
      promotion_value += item.fPromotionDiscount || 0; // 赠品行的促销金额
      scene_value += item.fSceneDiscount || 0;
      go_zero += item.fEffaceMoney || 0;
    }
  });
  moneyMap.Total.value = total;
  moneyMap.Member.value = member;
  moneyMap.Real.value = formatNum('money', real);
  moneyMap.Promotion.value = promotion_value;
  moneyMap.Scene.value = scene_value;
  moneyMap.Zero.value = go_zero;
  moneyMap.TotalQuantity.value = totalQuantity;
  moneyMap.BackDiscount.value = backDiscount;
  moneyMap.FoldDiscount.value = oldDiscount;
  _calcSomeMoney();
}

const _calcSomeMoney = () => {
  let discountSum = 0;
  preferentials.forEach(item => {
    discountSum += parseFloat(moneyMap[item].value);
  });
  moneyMap.Preferential.value = discountSum;
  if (currentStatus === status.PresellBack)
    moneyMap.Gathering.value = moneyMap.Deposit.value;
  // else if (currentStatus === status.Shipment)
  //   moneyMap.Gathering.value = moneyMap.Real.value - discountSum - moneyMap.Deposit.value;
  else if (currentStatus === status.OnlineBill)
    moneyMap.Gathering.value = moneyMap.Real.value + moneyMap.Freight.value - moneyMap.Deposit.value;
  else if (currentStatus === status.FormerBackBill)
    moneyMap.Gathering.value = moneyMap.Real.value
  // moneyMap.Gathering.value = moneyMap.Real.value - formBackUnreceivable; //王久龄说需求改动
  else {
    if (cb.rest.terminalType === 3) {
      moneyMap.Gathering.value = moneyMap.Real.value - moneyMap.Deposit.value;
      if (currentStatus === status.CashSale) {
        moneyMap.Gathering.value = moneyMap.Real.value;
      }
    } else {
      moneyMap.Gathering.value = moneyMap.Real.value - moneyMap.Deposit.value;
    }
  }
}

const calcComboMoney = function (comboData) {
  comboData.fMoney = 0;
  comboData.fQuoteMoney = 0;
  comboData.fPrice = 0;
  comboData.fQuotePrice = 0;
  let childPromotion = 0; let childDiscount = 0;
  comboData.children.forEach(item => {
    comboData.fMoney += item.fMoney;
    comboData.fQuoteMoney += item.fQuoteMoney;
    // comboData.fPrice += item.fPrice; // 这样会有套餐实销价格和实销金额不相等情况
    comboData.fQuotePrice += item.fQuotePrice;
    // 固定套餐商品有调价单的话折扣额错误
    // if (!item.fPromotionDiscount)
    //   item.fPromotionDiscount = item.fDiscount; // 套餐行数据里的促销折扣额
    item.fPromotionDiscount = item.fDiscount = (item.fQuoteMoney - item.fMoney)
    childPromotion += item.fPromotionDiscount ? formatNum('money', item.fPromotionDiscount) : 0
    childDiscount += item.fDiscount ? formatNum('money', item.fDiscount) : 0
    // childPromotion += item.fPromotionDiscount_origin
  });
  comboData.fPromotionDiscount = childPromotion;
  comboData.fDiscount = childDiscount;
  comboData.fPrice = comboData.fMoney / comboData.fQuantity // 套餐实效价格由实销金额来算
  comboData.fPromotionPrice = comboData.fPrice
}

const buildComboData = function (iPromotionType, iPromotionid, cPromotionName, keys, referComboKey, iEmployeeid) {
  const ts = new Date().valueOf();
  // let key = `${iPromotionType}_${iPromotionid}_${ts}`;
  const promotionKey = `${iPromotionType}_${iPromotionid}_${ts}`;
  let key = referComboKey != undefined ? referComboKey : promotionKey;
  if (keys[key]) {
    const index = keys[key];
    key = key + '_' + index;
    keys[key] = index + 1;
  } else {
    keys[key] = 1;
  }
  expandedRowKeys.push(key);
  return {
    iEmployeeid: iEmployeeid,
    bFixedCombo: true,
    key,
    type: iPromotionType,
    id: iPromotionid,
    title: cPromotionName,
    children: []
  };
}

export const transferProducts = function (products) {
  expandedRowKeys = [];
  const keys = {};
  const recursiveProducts = [];
  let comboData = null;
  products.forEach(item => {
    const { key } = item;
    if (keys[key]) {
      const index = keys[key];
      item.key = key + '_' + index;
      keys[key] = index + 1;
    } else {
      keys[key] = 1;
    }
    const bFixedCombo = !!(item.bFixedCombo !== 'true' && item[promotionsChildrenField] && item[promotionsChildrenField].length && item[promotionsChildrenField][0].iPromotionType === 4 && item.ikitType != 2 && item.ikitType != 1);
    // const bFixedCombo = (item.bFixedCombo && item.bFixedCombo !== 'false') && item[promotionsChildrenField] && item[promotionsChildrenField].length && item[promotionsChildrenField][0].iPromotionType === 4 ? true : false;
    if (bFixedCombo) {
      // item.fPrice = item[promotionsChildrenField][0].comboPrice;
      // item.fMoney = item[promotionsChildrenField][0].comboMoney;
      item.bFixedCombo = true;
      const { iPromotionType, iPromotionid, cPromotionName, referComboKey } = item[promotionsChildrenField][0];
      if (!comboData) {
        comboData = buildComboData(iPromotionType, iPromotionid, cPromotionName, keys, referComboKey, item.iEmployeeid);
        comboData.children.push(item);
      } else {
        // const isRepeat = comboData.children.find(childItem => {
        //   return childItem.product === item.product && childItem.productsku === item.productsku;
        // });
        if (comboData.type === iPromotionType && comboData.id === iPromotionid) {
          comboData.children.push(item);
        } else {
          calcComboMoney(comboData);
          recursiveProducts.push(comboData);
          comboData = buildComboData(iPromotionType, iPromotionid, cPromotionName, keys, referComboKey, item.iEmployeeid);
          comboData.children.push(item);
        }
      }
      comboData.fQuantity = (item[promotionsChildrenField][0].fQuantity);
      item.per_fDiscount = item.fDiscount / comboData.fQuantity;
    } else {
      if (comboData) {
        calcComboMoney(comboData);
        recursiveProducts.push(comboData);
        comboData = null;
      }
      recursiveProducts.push(item);
    }
  });
  if (comboData) {
    calcComboMoney(comboData);
    recursiveProducts.push(comboData);
    comboData = null;
  }
  return recursiveProducts;
}

export const transferProducts2Flatten = function (products) {
  const flattenProducts = [];
  products.forEach(item => {
    if (item.children) {
      item.children.forEach(childItem => {
        flattenProducts.push(childItem);
      });
    } else {
      flattenProducts.push(item);
    }
  });
  return flattenProducts;
}

const executePreferential = ($$state, payload) => {
  const { key, value } = payload;
  const products = transferProducts(value[productsChildrenField]);
  // products.forEach(item => {
  //   item.fDiscount = item.fQuotePrice - item.fPrice;
  // });
  let focusedRow = $$state.get('focusedRow');
  if (Immutable.Map.isMap(focusedRow))
    focusedRow = focusedRow.toJS()
  const focusedKey = focusedRow && focusedRow.key;
  let focusedRow_new = products.find(item => {
    return item.key === focusedKey;
  });
  if (!focusedRow_new) {
    for (let i = 0, len = products.length; i < len; i++) {
      const element = products[i];
      if (element.bFixedCombo) {
        const focusedRow_comboSku = element.children.find(ele => {
          return ele.key === focusedKey
        })
        if (focusedRow_comboSku) {
          focusedRow_new = focusedRow_comboSku;
          break
        }
      }
    }
  }
  const coupons = value[couponsChildrenField];
  if (key !== 'Real') {
    moneyMap[key].value = value[moneyMap[key].field];
    moneyMap[key].done = true;
  }
  moneyMap.Real.value = value[moneyMap.Real.field];
  _calcSomeMoney();
  globalProducts = products;
  beforeUpdateMoneyMap({moneyMap, type: 'preferential', key})
  cb.events.execute('communication', { products: getSecondScreedProducts(products), expandedRowKeys, moneyMap, focusedRow: focusedRow_new });
  return $$state.merge({
    products,
    expandedRowKeys,
    coupons,
    money: moneyMap,
    canModify: (key === 'Real' || (key === 'Scene' && value.doneActiveKey === 'dhzk')) ? $$state.get('canModify') : false
  }).set('focusedRow', focusedRow_new);
}

const cancelPreferential = ($$state, payload) => {
  const { key, value } = payload;
  const products = transferProducts(value[productsChildrenField]);
  // products.forEach(item => {
  //   item.fDiscount = item.fQuotePrice - item.fPrice;
  // });
  let focusedRow = $$state.get('focusedRow');
  if (Immutable.Map.isMap(focusedRow))
    focusedRow = focusedRow.toJS()
  const focusedKey = focusedRow && focusedRow.key;
  let focusedRow_new = products.find(item => {
    return item.key === focusedKey;
  });
  if (!focusedRow_new) {
    for (let i = 0, len = products.length; i < len; i++) {
      const element = products[i];
      if (element.bFixedCombo) {
        const focusedRow_comboSku = element.children.find(ele => {
          return ele.key === focusedKey
        })
        if (focusedRow_comboSku) {
          focusedRow_new = focusedRow_comboSku;
          break
        }
      }
    }
  }
  if (!focusedRow_new)
    focusedRow_new = products[products.length - 1]
  const coupons = value[couponsChildrenField];
  moneyMap[key].value = value[moneyMap[key].field];
  moneyMap[key].done = false;
  moneyMap.Real.value = value[moneyMap.Real.field];
  /* add by jinzh1  取消促销活动 重新赋会员优惠 */
  moneyMap.Member.value = value[moneyMap.Member.field];
  if (key === 'Promotion') { // 促销清除赠品行
    let total_sum = 0; let quantity_sum = 0;
    products.forEach(ele => {
      total_sum += ele.fQuoteMoney;
      quantity_sum += ele.fQuantity;
    })
    moneyMap.Total.value = total_sum;
    moneyMap.TotalQuantity.value = quantity_sum;
    // currentPromotionKey = null;
    // switchPromotion = null;
    promotionMap = {};
  }

  /* add by jinzh1 取消现场折扣后 重算moneyMap
  单行折扣执行后   在执行整单  在取消后 表头的金额会不对  需重算
  */
  if(key == 'Scene')
    calcMoney(products)
  else
    _calcSomeMoney();

  let canModify = true;
  for (const attr in moneyMap) {
    /* add by jinzh1 现场折扣不走这个判断 */
    if (moneyMap[attr].done && attr != 'Scene') {
      canModify = false;
      break;
    }
  }
  globalProducts = products;
  beforeUpdateMoneyMap({moneyMap, type: 'preferentialCancel', key})
  cb.events.execute('communication', { products: getSecondScreedProducts(products), expandedRowKeys, moneyMap, focusedRow: focusedRow_new });
  return $$state.merge({
    products,
    expandedRowKeys,
    coupons,
    money: moneyMap,
    canModify
  }).set('focusedRow', focusedRow_new);
}

const isChangeGoods = (newProducts) => {
  const billingViewModel = getBillingViewModel();
  if (!billingViewModel) {
    cb.utils.alert('正在初始化，请稍后重试', 'error');
    return false
  }
  return billingViewModel.execute('isChangeGoods', { newProducts })
}

const exchangeGoods = (products, originProducts) => {
  products.map(product => {
    if (product.has_go_this_lz) return
    /* 以取价维度做过滤条件 */
    if (product.product_productOfflineRetail_retailPriceDimension && product.product_productOfflineRetail_retailPriceDimension != 1) return
    if (product.retailPriceDimension && product.retailPriceDimension != 1) return
    if (product.retailPriceDimension == 1 && product.productvirtualProductAttribute == 9) return
    if (product.ikitType == 1 || product.ikitType == 2) return
    if (product.fQuantity < 0) { /* 新增退货行 */
      if (!backBillMapping[product.product]) {
        backBillMapping[product.product] = {};
        backBillMapping[product.product][product.key] = {
          quantity: product.fQuantity * -1,
          rowData: product,
          hQuantity: 0
        }
      } else {
        backBillMapping[product.product][product.key] = {
          quantity: product.fQuantity * -1,
          rowData: product,
          hQuantity: 0
        }
      }
    }
    if (product.fQuantity > 0 && product.iPromotionProduct !== 1) { /* 新增换货行 */
      if (backBillMapping[product.product]) {
        for (var item in backBillMapping[product.product]) {
          const rowKey = backBillMapping[product.product][item]
          if (rowKey.quantity > rowKey.hQuantity) {
            if (cb.rest.terminalType === 3 && product.fQuantity > rowKey.quantity) {
              cb.utils.alert('当前换货行数量不能大于退货行数量', 'info');
              // callBack(product); // 找不到callback的定义，将其注释
              return;
            }
            const newRow = getRowByKey(rowKey.rowData.key, originProducts) // 有后更新的行数据
            if (newRow) rowKey.rowData = newRow
            const backQuantity = rowKey.rowData.fQuantity; const exchangeQuantity = product.fQuantity;
            product.fPrice = rowKey.rowData.fPrice // 改换货行实销价
            product.fQuotePrice = rowKey.rowData.fQuotePrice
            product.fQuoteMoney = formatMoney(product.fQuotePrice * product.fQuantity)
            product.fCoDiscount = formatMoney((rowKey.rowData.fCoDiscount / Math.abs(backQuantity)) * -1 * exchangeQuantity)
            product.foldDiscount = formatMoney((rowKey.rowData.foldDiscount / Math.abs(backQuantity)) * -1 * exchangeQuantity)
            product.fDiscount = formatMoney((rowKey.rowData.fDiscount / Math.abs(backQuantity)) * -1 * exchangeQuantity) // 解挂不能+=
            product.fDiscountRate = rowKey.rowData.fDiscountRate;
            product.fMoney = formatMoney(product.fPrice * product.fQuantity)
            product.bCanDiscount = false; // 换货行参与折扣计算设为false
            rowKey.hQuantity += exchangeQuantity;
            if (!exchangeBillMapping[product.key]) {
              exchangeBillMapping[product.key] = item;
            }
            break;
          }
        }
      }
    }
    product.has_go_this_lz = true
    /* 原单退货非原单退货只走一次exchangeGoods，换货不重新取价 */
  })
}
const exchangeGoods_sum = (products, product, index) => {
  const currentRowKey = product.key;
  if (exchangeBillMapping[currentRowKey]) { // 当前行为换货行
    const rowKey = exchangeBillMapping[currentRowKey]
    const canBackQuantity = backBillMapping[product.product][rowKey].quantity - backBillMapping[product.product][rowKey].hQuantity // 可退货数量
    const newAddQuantity = product.fQuantity - (products[index].fQuantity) // 当前行数量的 增加值 (可正 可负数)
    if (newAddQuantity > 0) {
      if (canBackQuantity < newAddQuantity) {
        cb.utils.alert('当前换货行数量不能大于退货行数量', 'error')
        return false
      } else {
        backBillMapping[product.product][rowKey].hQuantity = backBillMapping[product.product][rowKey].hQuantity + newAddQuantity
      }
    }
    if (newAddQuantity < 0) {
      backBillMapping[product.product][rowKey].hQuantity = backBillMapping[product.product][rowKey].hQuantity + newAddQuantity
    }
  }
  if (backBillMapping[product.product] && backBillMapping[product.product][currentRowKey]) { // 当前行为退货行
    const row = backBillMapping[product.product][currentRowKey];
    var newAddQuantity = product.fQuantity - (products[index].fQuantity) // 当前行数量的 增加值
    const beforeChangeFprice = products[index].fPrice;
    const afterChangeFprice = product.fPrice;
    const afterChangeDiscount = product.fCoDiscount;
    row.rowData.fCoDiscount = afterChangeDiscount;
    /* 更新退货行map中的折扣额 */
    row.rowData.fPrice = afterChangeFprice; // 一律在这跟新退货map中退货行的实销价
    if (newAddQuantity < 0) { // 退货数量增加
      row.quantity = Math.abs(product.fQuantity);
    }
    if (newAddQuantity > 0) { // 退货数量减小
      if (row.quantity <= row.hQuantity) {
        cb.utils.alert('当前商品的退货数量不能小于换货数量', 'error');
        return false
      } else {
        row.quantity = Math.abs(product.fQuantity);
      }
    }
    /* 退货行改价格 */
    if (afterChangeFprice != beforeChangeFprice) {
      const backRows = backBillMapping[product.product];
      for (const exchangeRow in exchangeBillMapping) {
        for (const rowKey in backRows) {
          if (exchangeBillMapping[exchangeRow] == rowKey) {
            products.forEach(ele => {
              if (ele.product == product.product && ele.key == exchangeRow) {
                ele.fCoDiscount = formatMoney(afterChangeDiscount * -1)
                if (ele.fDiscount) {
                  ele.fDiscount += formatMoney(afterChangeDiscount * -1)
                } else {
                  ele.fDiscount = ele.fCoDiscount
                }
                ele.fPrice = afterChangeFprice;// 换货行实销价等于退货行的实销价
                ele.fMoney = formatMoney(ele.fPrice * ele.fQuantity)
              }
            })
          }
        }
      }
    }
  }
  return true
}
const exchangeGoods_delete = (products, rowKey, index) => {
  if(index == -1) return;
  const product = products[index];
  /* 删除退货行 */
  if (product.fQuantity < 0) {
    let hasExchangeRow = false;
    for (const attr in exchangeBillMapping) {
      if (exchangeBillMapping[attr] == rowKey) {
        hasExchangeRow = true;
        break
      }
    }
    if (hasExchangeRow) {
      cb.utils.alert('当前退货行存在对应的换货行，不能删除!', 'error');
      return false;
    } else {
      if (backBillMapping[product.product] && backBillMapping[product.product][rowKey]) delete backBillMapping[product.product][rowKey]
      if (backBillMapping[product.product] && backBillMapping[product.product].length == 0) delete backBillMapping[product.product]
    }
  }
  /* 删除换货行 */
  if (product.fQuantity > 0) {
    if (exchangeBillMapping[rowKey]) {
      const currentRowData = products[index];
      const currentBackRow = backBillMapping[product.product][exchangeBillMapping[rowKey]] // 当前换货行对应退货行的数据
      currentBackRow.hQuantity = currentBackRow.hQuantity - currentRowData.fQuantity;
      delete exchangeBillMapping[rowKey];
    }
  }
  return true
}

export function modifyProductInfo (productInfo) {
  return function (dispatch) {
    dispatch(genAction('PLATFORM_UI_BILLING_UPDATE_PRODUCT_INFO', productInfo));
  }
}

/* 是否允许新增商品行 */
export function dealReferReturnProducts (obj) {
  return function (dispatch, getState) {
    const allState = getState();
    // const { canModify, products } = getState().product.toJS();
    const productRedux = allState.product;
    const canModify = productRedux.get('canModify');
    const products = globalProducts;
    /* 是否是补序列号 */
    if (!deliveryInspect(products, obj, dispatch, getState)) return
    const promotionFilter = productRedux.get('promotionFilter') ? productRedux.get('promotionFilter').toJS() : null;
    const { billingStatus, infoData } = allState.uretailHeader.toJS();
    // let { promotionFilter } = allState.product.toJS();
    // let copy_products = JSON.parse(JSON.stringify(products));
    // if (promotionFilter && promotionFilter.length > 0) {
    //   let originData = (obj.sku && obj.sku.length > 0) ? obj.sku : obj.goods; //pc只能obj.sku，触屏还可以为obj.goods
    //   for (let n = 0; n < originData.length; n++) {
    //     let newRow = originData[n];
    //     let newRowKey = `${newRow.id}|${newRow.skuId}`;
    //     let productsHasGift = false; // products中有赠品
    //     let willAppendGift = false; // refer中已有可以像列表中添加的赠品
    //     let oldProductsObj = {}; // oldProducts同一促销id 记录
    //     for (let p = 0; p < products.length; p++) {
    //       let row = products[p];
    //       if (row.iPromotionProduct == 1) { // 界面中有赠品
    //         // if((row.productsku && row.productsku == newRow.skuId) || (!row.productsku && row.product == newRow.id)){
    //         let findedRow = addNewGift(copy_products, promotionFilter, newRow, true);
    //         if (!findedRow) return
    //         let newRow_iPromotionid = findedRow.iPromotionid;
    //         let newRow_isLimitPurchase = findedRow.isLimitPurchase;
    //         let { isHas, currentSon } = checkPidInSon(newRow_iPromotionid, newRow_isLimitPurchase, row.promotionwrite, newRow, row)
    //         if (isHas) { // 界面行中赠品促销ID是否等于新增赠品促销ID，或界面中赠品key和新增赠品key是否相等（限购）
    //           let _flagId = oldProductsObj[currentSon.iPromotionid];
    //           let _flagKey = oldProductsObj[newRowKey];
    //           let oldRowKey = `${row.product}|${row.productsku}`
    //           if (jumpNextLoop(_flagId, _flagKey, currentSon.isLimitPurchase, oldRowKey, newRowKey)) continue // oldProducts中同一促销id的商品不重复循环（走currentNum）
    //           oldProductsObj[currentSon.iPromotionid] = currentSon.iPromotionid;
    //           oldProductsObj[newRowKey] = oldRowKey
    //           let totalQuantity = row.totalQuantity;
    //           let currentNum = getCurrentPromotionId_num(copy_products, row, currentSon.isLimitPurchase);
    //           if (currentNum + 1 > totalQuantity) {
    //             cb.utils.alert('已达到当前促销活动最大赠品数量！', 'error');
    //             return
    //           } else {
    //             let new_row = transferReferProduct({ sku: [newRow] }, allState)
    //             // 将商品新增为赠品
    //             newRow.promotionwrite = row.promotionwrite;
    //             newRow.totalQuantity = row.totalQuantity;
    //             newRow.fPrice = row.fPrice;
    //             newRow.promotionTips = row.promotionTips;
    //             newRow.iPromotionProduct = 1;
    //             new_row[0].promotionwrite = row.promotionwrite;
    //             new_row[0].totalQuantity = row.totalQuantity;
    //             new_row[0].fPrice = row.fPrice;
    //             new_row[0].promotionTips = row.promotionTips;
    //             new_row[0].iPromotionProduct = 1;
    //             new_row[0].promotion_id = row.promotion_id;
    //             new_row[0].isLimitPurchase = row.isLimitPurchase;
    //             copy_products.push(new_row[0]);
    //             willAppendGift = true;
    //             break
    //           }
    //         }
    //         if (!productsHasGift) productsHasGift = true
    //       }
    //       // 循环到最后也没找到对应促销id（赠品）, 判断所有促销id的赠品与当前已有赠品数量比较是否 新增
    //       if (p == products.length - 1 && productsHasGift && !willAppendGift) {
    //         let { tolNum, nowNum } = checkPromotionFilter(promotionFilter, copy_products);
    //         if (nowNum + 1 > tolNum) {
    //           cb.utils.alert('已达到当前促销活动最大赠品数量！', 'error');
    //           return
    //         } else {
    //           addNewGift(copy_products, promotionFilter, newRow);
    //           /* 参照新增多个赠品，校验每个赠品符合条件后往暂存（copy_products）新增该商品*/
    //           /* 蔡河威不确定格式，promotionwrite前段传对象格式，服务返回数组格式*/
    //           // newRow.promotionwrite = [newRow.promotionwrite] 改回数组格式
    //           newRow.fQuantity = 1
    //           copy_products.push(newRow)
    //         }
    //       }
    //     }
    //     // 界面中无赠品
    //     if (!productsHasGift) {
    //       let { tolNum } = checkPromotionFilter(promotionFilter, products);
    //       let giftNum = originData.length;
    //       let canOutput = isHavePromotionNumOver(originData, promotionFilter);
    //       if (giftNum <= tolNum && canOutput)
    //         addNewGift(null, promotionFilter, newRow);
    //       else {
    //         cb.utils.alert('已达到当前促销活动最大赠品数量！', 'error');
    //         return
    //       }
    //     }
    //   }
    //   dispatch(addProduct(obj))
    //   return
    // }
    const callback = async function () {
      for (const attr in moneyMap) {
        /* jinzh1  现场折扣不参与此判断 */
        if (moneyMap[attr].done && !canModify && attr != 'Scene') {
          cb.utils.alert(`已经执行了${moneyMap[attr].text}，不能再新增商品！`, 'error');
          return
        }
      }
      /* 已执行过现场折扣  需判断是否整单都执行了现场折扣 */
      if (moneyMap.Scene.done) {
        const doneActiveKey = allState.discount.toJS().doneActiveKey;
        if (doneActiveKey == 'zdzk') {
          cb.utils.alert('已经执行了整单折扣，不能再新增商品！', 'error');
          return
        }
      }
      if (billingStatus === status.Shipment && infoData.bDeliveryModify === false) {
        cb.utils.alert('交货不能修改商品时，不能新增商品！', 'error');
        return
      }
      if (billingStatus === status.PresellBack) {
        cb.utils.alert('预订退订状态下不能新增商品！', 'error');
        return
      }
      const returnData = await beforeAddProduct(obj, getState)
      if (!returnData) return
      // if (billingStatus === status.OnlineBill) {
      //   cb.utils.alert('电商订单状态下不能新增商品！', 'error');
      //   return
      // }
      // if (billingStatus === status.OnlineBackBill) {
      //   cb.utils.alert('电商退货状态下不能新增商品！', 'error');
      //   return
      // }
      dispatch(addProduct(obj))
    }
    // if(!beforeAddGift(dispatch, promotionFilter, obj, products, callback)) return
    beforeAddGift(dispatch, promotionFilter, obj, products, callback)
  }
}

const beforeAddGift = (dispatch, promotionFilter, obj, products, callback) => {
  const billingViewModel = getBillingViewModel();
  if (!billingViewModel) {
    cb.utils.alert('正在初始化，请稍后重试', 'error');
    return false
  }
  const wrapFunc = (obj) => {
    dispatch(addProduct(obj))
  }
  return billingViewModel.promiseExecute('beforeAddGift', {wrapFunc, checkPromotionFilter, promotionFilter, obj, products, promotionMap}, callback)
}

/**
 * 无限购：界面商品中同一促销id赠品不重复循环
 * 限购：界面商品中同一促销id并且同一赠品不重复循环
 * 不重复循环：已经算入了赠品已选数量，不再重复计算
*/
// const jumpNextLoop = (_flagId, _flagKey, isLimitPurchase, oldRowKey, newRowKey) => {
//   if (_flagId && !isLimitPurchase)
//     return true
//   if (_flagKey && isLimitPurchase)
//     return true
//   if (!_flagKey && isLimitPurchase && oldRowKey != newRowKey)
//     return true
//   return false
// }

/**
 * @param {*} newRow_iPromotionid : 新加赠品所属的促销id
 * @param {*} sonPromotionwrite : 界面中商品行中促销孙表
 *  newRow oldRow : 当为限购时，不止要促销id相同还要赠品key相同（界面已有赠品key == 新增赠品key）
 * 结果:判断界面中该商品行促销孙表中是否有当前新增赠品所属的促销id，并导出该促销孙表中的信息
 */
// const checkPidInSon = (newRow_iPromotionid, newRow_isLimitPurchase, sonPromotionwrite, newRow, oldRow) => {
//   let isHas = false, currentSon = null;
//   let newRowKey = `${newRow.id}|${newRow.skuId}`;
//   let oldRowKey = `${oldRow.product}|${oldRow.productsku}`;
//   sonPromotionwrite.forEach((ele, index) => {
//     if (ele.iPromotionid == newRow_iPromotionid) {
//       if ((oldRowKey == newRowKey && newRow_isLimitPurchase) || !newRow_isLimitPurchase)
//         isHas = true;
//       currentSon = ele
//     }
//   })
//   return { isHas, currentSon }
// }

/* 参照带出赠品是否超出其所属促销id的最大数量 */
// const isHavePromotionNumOver = (originData, promotionFilter) => {
//   let mockMap = {}
//   for (let i = 0; i < originData.length; i++) {
//     let ele = originData[i];
//     let { iPromotionid, flotQuantity, isLimitPurchase } = addNewGift(null, promotionFilter, ele, true)
//     let key = isLimitPurchase ? `${ele.id}|${ele.skuId}` : iPromotionid
//     if (mockMap[key]) {
//       let num = mockMap[key].beQuantity;
//       num += 1
//       mockMap[key] = { flotQuantity, beQuantity: num }
//     } else {
//       mockMap[key] = { flotQuantity, beQuantity: 1 }
//     }
//   }
//   for (let attr in mockMap) {
//     if (mockMap[attr].flotQuantity < mockMap[attr].beQuantity)
//       return false
//   }
//   return true
// }
// 参照赠品匹配赠品信息
// export const addNewGift = (oldProduct, promotionFilter, newRow, isReturn, isSwitch) => {
//   for (let a = 0; a < promotionFilter.length; a++) {
//     let promotion = promotionFilter[a];
//     if (isSwitch) { // 先录赠品，转换字段
//       newRow.ppath = newRow.product_productClass_path;
//       newRow.skuId = newRow.productsku;
//       newRow.id = newRow.product;
//       //newRow.skuTags = newRow.skuTags; 商品对照中没有此字段
//     }
//     if (promotion.itemtype === 6 && !isReturn) {
//       newRow.promotionTips = `${promotion.cPromotionName}`;
//       newRow.giftKg = promotion
//     }
//     if (promotion.itemtype === 7) {
//       let ppathArr = newRow.ppath.split('|');
//       const newRowPid = (target) => {
//         let index = ppathArr.findIndex(ele => {
//           return ele == target
//         })
//         return index !== -1 ? true : false
//       }
//       if (promotion.filterType === 6) { //赠品范围为全部
//         if (dealGiftBelong(oldProduct, promotion, newRow)) continue
//         if (isReturn)
//           return { iPromotionid: promotion.iPromotionid, flotQuantity: promotion.flotQuantity, isLimitPurchase: promotion.isLimitPurchase }
//         newRow.totalQuantity = promotion.flotQuantity;
//         newRow.promotionwrite = [promotion];
//         newRow.fPrice = promotion.flotPrice;
//         newRow.promotionTips = promotion.cPromotionName;
//         newRow.iPromotionProduct = 1;
//         newRow.promotion_id = promotion.iPromotionid;
//         newRow.isLimitPurchase = promotion.isLimitPurchase;
//         continue
//       }
//       if (promotion.skuid !== 0 && promotion.skuid === newRow.skuId) {
//         if (dealGiftBelong(oldProduct, promotion, newRow)) continue
//         if (isReturn)
//           return { iPromotionid: promotion.iPromotionid, flotQuantity: promotion.flotQuantity, isLimitPurchase: promotion.isLimitPurchase }
//         newRow.totalQuantity = promotion.flotQuantity;
//         newRow.promotionwrite = [promotion];
//         newRow.fPrice = promotion.flotPrice;
//         newRow.promotionTips = promotion.cPromotionName;
//         newRow.iPromotionProduct = 1;
//         newRow.promotion_id = promotion.iPromotionid;
//         newRow.isLimitPurchase = promotion.isLimitPurchase;
//         continue
//       } else if (promotion.productid && promotion.productid === newRow.id) {
//         if (dealGiftBelong(oldProduct, promotion, newRow)) continue
//         if (isReturn)
//           return { iPromotionid: promotion.iPromotionid, flotQuantity: promotion.flotQuantity, isLimitPurchase: promotion.isLimitPurchase }
//         newRow.totalQuantity = promotion.flotQuantity;
//         newRow.promotionwrite = [promotion];
//         newRow.fPrice = promotion.flotPrice;
//         newRow.promotionTips = promotion.cPromotionName;
//         newRow.iPromotionProduct = 1;
//         newRow.promotion_id = promotion.iPromotionid;
//         newRow.isLimitPurchase = promotion.isLimitPurchase;
//         continue
//       } else if (promotion.productClassid && newRowPid(promotion.productClassid)) {// 商品类别id  product_productClass_path
//         if (dealGiftBelong(oldProduct, promotion, newRow)) continue
//         if (isReturn)
//           return { iPromotionid: promotion.iPromotionid, flotQuantity: promotion.flotQuantity, isLimitPurchase: promotion.isLimitPurchase }
//         newRow.totalQuantity = promotion.flotQuantity;
//         newRow.promotionwrite = [promotion];
//         newRow.fPrice = promotion.flotPrice;
//         newRow.promotionTips = promotion.cPromotionName;
//         newRow.iPromotionProduct = 1;
//         newRow.promotion_id = promotion.iPromotionid;
//         newRow.isLimitPurchase = promotion.isLimitPurchase;
//         continue
//       } else if (promotion.tagid) {// 标签id
//         if (newRow.skuTags) {
//           let hasTagid = newRow.skuTags.findIndex(tag => {
//             return tag.tagId == promotion.tagid;
//           })
//           if (hasTagid !== -1) {
//             if (dealGiftBelong(oldProduct, promotion, newRow)) continue
//             if (isReturn)
//               return { iPromotionid: promotion.iPromotionid, flotQuantity: promotion.flotQuantity, isLimitPurchase: promotion.isLimitPurchase }
//             newRow.totalQuantity = promotion.flotQuantity;
//             newRow.promotionwrite = [promotion];
//             newRow.fPrice = promotion.flotPrice;
//             newRow.promotionTips = promotion.cPromotionName;
//             newRow.iPromotionProduct = 1;
//             newRow.promotion_id = promotion.iPromotionid;
//             newRow.isLimitPurchase = promotion.isLimitPurchase;
//             continue
//           }
//         }
//       }
//     }
//   }
//   if (isReturn) {
//     cb.utils.alert('已达到当前促销活动最大赠品数量！', 'error');
//   }
// }
/* 两个促销都有同一赠品，赠品属于哪一促销 */
/* 确定新增赠品与界面中赠品（同一商品）是否属于同一促销活动才会调用 */
// export function dealGiftBelong(oldProduct, promotion, newRow) {
//   if (!oldProduct) return
//   let newKey = `${newRow.id}|${newRow.skuId}`;
//   let arr = oldProduct.filter(ele => {
//     let oldKey = `${ele.product}|${ele.productsku}`
//     return (ele.iPromotionProduct == 1 && oldKey == newKey && ele.promotion_id == promotion.iPromotionid)
//   })
//   if (!arr.length) return
//   let total = arr[0].totalQuantity;
//   let num = 0
//   arr.forEach(item => {
//     num += item.fQuantity
//   })
//   if (num >= total)
//     return 'full'
// }

export function getExchangeBillMapping () {
  return exchangeBillMapping;
}

/* 促销活动执行回调 */
export function beforeOpenRefer (products) {
  return function (dispatch, getState) {
    products.forEach(product => {
      if (product.promotionfilter) {
        // if (!judgeGiftQuantity(product.promotionfilter, products)) return
        // dispatch(genAction('PLATFORM_UI_BILLING_SET_OPTIONS', { promotionFilter: product.promotionfilter }))
        for (let i = 0; i < product.promotionfilter.length; i++) {
          const ele = product.promotionfilter[i];
          if (ele.itemtype === 6 || ele.itemtype === 7)
            dispatch(setSearchBoxFocus(true));
          if (env.INTERACTIVE_MODE === 'touch')
            dispatch(getPromotionData(product.promotionfilter))
          break;
        }
      }
    })
  }
}

// refer数据与开单行数据对接
const makePromotionGiftMap = (promotionFilter, referProducts, newProducts, dispatch, products) => {
  /* 控制promotionFilter状态的清除 */
  // if (!promotionFilter) return
  // let referNum = 0; // 参照带入赠品的数量
  const dataSource = (referProducts.sku && referProducts.sku.length > 0) ? referProducts.sku : referProducts.goods
  dataSource.forEach(sku => {
    newProducts.forEach(product => {
      if ((product.productsku === sku.skuId && product.product === sku.id) || (product.productsku !== sku.skuId && product.product === sku.id)) {
        if (sku.totalQuantity) product.totalQuantity = sku.totalQuantity;
        if (sku.promotionwrite) product.promotionwrite = sku.promotionwrite;
        if (sku.promotion_id) product.promotion_id = sku.promotion_id;
        if (sku.isLimitPurchase != undefined) product.isLimitPurchase = sku.isLimitPurchase;
        if (sku.fPrice !== undefined) {
          product.fPrice = sku.fPrice;
          product.fMoney = formatMoney(product.fQuantity * product.fPrice)
        }
        if (sku.promotionTips) product.promotionTips = sku.promotionTips;
        if (sku.iPromotionProduct) product.iPromotionProduct = sku.iPromotionProduct;
        if (sku.giftKg) product.giftKg = sku.giftKg;
        if (sku._giftInfo) {
          const { totalQuantity, cPromotionName, promotion_id, isLimitPurchase, fPrice, giftKg} = sku._giftInfo;
          if (totalQuantity) product.totalQuantity = totalQuantity;
          product.promotionwrite = [sku._giftInfo];
          if (promotion_id) product.promotion_id = promotion_id;
          if (isLimitPurchase != undefined) product.isLimitPurchase = isLimitPurchase;
          if (fPrice !== undefined) {
            product.fPrice = fPrice;
            product.fMoney = formatMoney(product.fQuantity * product.fPrice)
          }
          product.promotionTips = cPromotionName;
          product.iPromotionProduct = 1;
          product._giftInfo = sku._giftInfo;
          if (sku._giftInfo._childFiled) Object.assign(product, sku._giftInfo._childFiled)
          if (giftKg) product.giftKg = giftKg;
        }
        // referNum += product.fQuantity
      }
    })
  })
  // newProducts.forEach(newP => {
  //   referNum += newP.fQuantity
  // })
  // /* 控制promotionFilter状态的清除 */
  // if (!promotionFilter) return
  // let { tolNum, nowNum } = checkPromotionFilter(promotionFilter, products);
  // if (tolNum == nowNum + referNum) dispatch(genAction('PLATFORM_UI_BILLING_SET_OPTIONS', { promotionFilter: null }))
}

export function getQuantityByMaterKey (giftKey, products) {
  let cQuantity = 0; let ceilQuantity = 0; let nowQuantity = 0;
  const current = products.find(ele => {
    return ele.key == giftKey
  })
  /** 只包含赠品的促销信息集合 */
  const uniqPromoIdArr = onlyGiftPromotionFilter(current.promotionwrite);
  /* 找到与当前赠品行相同促销id的数量之和 */
  const currentNum = getCurrentPromotionId_num(products, current, uniqPromoIdArr[0].isLimitPurchase)
  ceilQuantity = current.totalQuantity;
  nowQuantity = currentNum;
  // products.forEach(element => {
  //   if((element.productsku && element.productsku === current.productsku) || (!element.productsku && element.product === current.product)){
  //     nowQuantity += element.fQuantity
  //   }
  // })
  cQuantity = ceilQuantity - nowQuantity;
  return cQuantity;
}

/**
 * 获取当前促销id下的总赠品数量，限购类型除外（id相同，key相同的赠品数量和）
 */
const getCurrentPromotionId_num = (products, current, limit) => {
  let currentNum = 0
  products.forEach(element => {
    if (element.iPromotionProduct === 1 && element.promotionwrite[0].iPromotionid == current.promotionwrite[0].iPromotionid) {
      if (!limit)
        currentNum += element.fQuantity
      if (limit && element.product === current.product && element.productsku === current.productsku)
        currentNum += element.fQuantity
    }
  })
  return currentNum;
}

const getRowByKey = (key, products) => {
  const row = products.find(ele => {
    return key == ele.key;
  });
  return row;
}

// export function setPromotionMasterMap(product, newQuantity) {
//   return function (dispatch, getState) {
//     // let { promotionFilter, products } = getState().product.toJS();
//     const productRedux = getState().product;
//     let products = globalProducts;
//     let promotionFilter = productRedux.get('promotionFilter') ? productRedux.get('promotionFilter').toJS() : null;
//     let { tolNum, nowNum } = checkPromotionFilter(promotionFilter, products);
//     let current = products.find(ele => {
//       return ele.key == product.key
//     })
//     let currentNum = current.fQuantity;
//     nowNum = nowNum - currentNum;
//     /* 总赠品数量达到与否 控制promotionFilter状态的开关*/
//     if (tolNum > nowNum + newQuantity) getPromotionFilterFromProduct(promotionFilter, products, dispatch);
//     if (tolNum <= nowNum + newQuantity) dispatch(genAction('PLATFORM_UI_BILLING_SET_OPTIONS', { promotionFilter: null }))
//   }
// }

export function judgeGiftQuantity (promotionFilter, products) {
  if (!promotionFilter) return false
  return true
  // let { tolNum, nowNum, nowMoney, tolMoney } = checkPromotionFilter(promotionFilter, products);
  // if (tolNum && tolNum > nowNum)
  //   return true
  // else if (tolMoney && tolMoney > nowMoney)
  //   return true
  // else
  //   return false
}

const checkPromotionFilter = (promotionFilter, products) => {
  const obj = { tolNum: 0, nowNum: 0, tolMoney: 0, nowMoney: 0 };
  const billingViewModel = getBillingViewModel();
  if (!billingViewModel) {
    cb.utils.alert('正在初始化，请稍后重试', 'error');
    return false
  }
  billingViewModel.execute('calcGiftNum', { obj })
  return obj

  // let tolNum = 0, nowNum = 0;
  // if (!promotionFilter) return { tolNum, nowNum }
  // // promotionFilter.forEach(promotion => {
  // //   if(promotion.itemtype===7)
  // //     tolNum += promotion.flotQuantity;
  // // })
  // /* 去掉同一促销id的元素 */
  // let arr = [promotionFilter[0]];
  // for (let t = 1; t < promotionFilter.length; t++) {
  //   let element = promotionFilter[t];
  //   let currentEle = false;
  //   for (let i = 0; i < arr.length; i++) {
  //     let item = arr[i];
  //     // promotionfilter中可能一个限购一个不限购
  //     /* iPromotionType=5 搭配限购：限购商品与不限购商品都是定位到确定单个商品上 */
  //     if (item.iPromotionid == element.iPromotionid && element.iPromotionType != 5) {
  //       currentEle = true
  //     }
  //   }
  //   if (!currentEle) arr.push(element)
  // }
  // arr.forEach(ele => {
  //   if (ele.itemtype === 7)
  //     tolNum += ele.flotQuantity;
  // })
  // products.forEach(product => {
  //   if (product.iPromotionProduct == 1) {
  //     nowNum += product.fQuantity
  //   }
  // })
  // return { tolNum, nowNum };
}

/* 退货弹框 */
export function openBackModal (before_products, products) {
  return function (dispatch, getState) {
    const returnseasonentry = getOptions().returnseasonentry ? getOptions().returnseasonentry.value : false;
    const billingStatus = getState().uretailHeader.toJS().billingStatus;
    // let backBill_checked = getState().product.toJS().backBill_checked;
    const backBill_checked = getState().product.get('backBill_checked');

    let canOpen = false;
    if ((returnseasonentry === true || returnseasonentry === 'true') && (billingStatus == status.FormerBackBill || billingStatus == status.NoFormerBackBill && backBill_checked == true)) { // 退货原因必输
      canOpen = true;
      for (let i = 0, len = before_products.length; i < len; i++) {
        const product = before_products[i];
        if (!product.iBackid) {
          canOpen = false;
          break
        }
      }
      if (products[0].fQuantity > 0)
        canOpen = false
      if (products[0].iBackid)
        canOpen = false;
    }
    if (canOpen === true) {
      dispatch(setFocusedRow(products[0]));
      const flatProducts = transferProducts2Flatten(products);
      const filterFlatProducts = flatProducts.filter(ele => {
        return ele.fQuantity < 0
      })
      dispatch(showModal('UpdateBackInfo', filterFlatProducts))
    }
  }
}

/* 预交 + bDeliveryModify=false 不能改数量 */
export function shipmentCantModifySum (uretailHeader) {
  const { billingStatus, infoData } = uretailHeader;
  if (billingStatus == status.Shipment && infoData.bDeliveryModify === false)
    return true
  return false
}

export function inspectMonyMapDone () {
  const { Scene, Coupon } = moneyMap;
  if (Scene.done || Coupon.done || moneyMap.Point.done)
    return true
  return false
}

export function touchClearCart () {
  return function (dispatch) {
    dispatch(genAction('PLATFORM_UI_BILLING_CLEAR'))
  }
}
/* 移动端新增商品 canOpen */
export function mobileReferCanOpen () {
  return function (dispatch, getState) {
    const { canModify } = getState().product.toJS();
    const allState = getState();
    const { billingStatus, infoData } = allState.uretailHeader.toJS();
    for (const attr in moneyMap) {
      /* jinzh1  现场折扣不参与此判断 */
      if (moneyMap[attr].done && !canModify && attr != 'Scene') {
        cb.utils.alert(`已经执行了${moneyMap[attr].text}，不能再新增商品！`, 'error');
        return false
      }
    }
    /* 已执行过现场折扣  需判断是否整单都执行了现场折扣 */
    if (moneyMap.Scene.done) {
      const doneActiveKey = allState.discount.toJS().doneActiveKey;
      if (doneActiveKey == 'zdzk') {
        cb.utils.alert('已经执行了整单折扣，不能再新增商品！', 'error');
        return false
      }
    }
    if (billingStatus === status.Shipment && infoData.bDeliveryModify === false) {
      cb.utils.alert('交货不能修改商品时，不能新增商品！', 'error');
      return false
    }
    if (billingStatus === status.PresellBack) {
      cb.utils.alert('预订退订状态下不能新增商品！', 'error');
      return false
    }
    return true
  }
}
/* 开单行的行号 */
const setRowNumber = (products) => {
  if (!products.length) return
  let num = 1;
  products.forEach(product => {
    product.rowNumber = num;
    num++
  })
}

export function handleAfterSaleServerData (originMemId, type, products, originalProducts, callback) {
  return function (dispatch, getState) {
    if (products.length)
      dispatch(setReceiptHang(false));
    // presellProducts = originalProducts;
    const checkedEmployee = getCheckedEmployee();
    products.forEach(item => {
      Object.assign(item, checkedEmployee);
    });
    addProductDispatch(dispatch, getState, products);
    callback && callback()
  }
}

export function getGlobalProducts () {
  return globalProducts;
}

const getSecondScreedProducts = (products) => {
  const newProducts = [];
  products.map(product => {
    const obj = {
      rowNumber: product.rowNumber, product_cName: product.product_cName, bFixedCombo: product.bFixedCombo,
      fQuantity: product.fQuantity, fPrice: product.fPrice, fMoney: product.fMoney, title: product.title,
      specs: product.specs, iPromotionProduct: product.iPromotionProduct
    };
    if (product.children) {
      const children = [];
      product.children.map(child => {
        children.push({
          rowNumber: product.rowNumber, product_cName: product.product_cName, bFixedCombo: product.bFixedCombo,
          fQuantity: product.fQuantity, fPrice: product.fPrice, fMoney: product.fMoney, specs: product.specs
        })
      });
      obj.children = children;
    }
    newProducts.push(obj);
  });
  return newProducts;
}

export function getMallField2RetailField () {
  return productRefer2BillKeyFieldMap
}

/* vm扩展控制 */
const beforeAddProduct = async (obj, getState) => {
  const billingViewModel = getBillingViewModel();
  if (!billingViewModel) {
    cb.utils.alert('正在初始化，请稍后重试', 'error');
    return false
  }
  return billingViewModel.warpPromiseExecute('beforeAddProduct', {referProduct: obj})
}

const afterAddProduct = (exportData, products) => {
  const billingViewModel = getBillingViewModel();
  if (billingViewModel) {
    return billingViewModel.execute('afterAddProduct', {exportData, products})
  }
  return true
}

export const productFQuantityBeNegative = (billingStatus) => {
  if (billingStatus === 'NoFormerBackBill')
    return true
  const billingViewModel = getBillingViewModel();
  if (!billingViewModel) return false
  if (billingViewModel.getParams && billingViewModel.getParams().bStorageCardBackBill)
    return true
  if (billingViewModel.getParams && billingViewModel.getParams().bCardCouponBack)
    return true
  return false
}

/* 扩展字段映射 */
const mallToRetailFieldMap = (referItem, billItem) => {
  const billingViewModel = getBillingViewModel();
  billingViewModel && billingViewModel.execute('mallToRetailFieldMap', { referItem, billItem })
}

const beforeDeleteProductLogic = (deleteRow) => {
  const billingViewModel = getBillingViewModel();
  if (!billingViewModel) {
    cb.utils.alert('正在初始化，请稍后重试', 'error');
    return false
  }
  return billingViewModel.execute('beforeDeleteProductLogic', {deleteRow})
}

const beforeDeleteProductCheck = (key) => {
  const billingViewModel = getBillingViewModel();
  if (!billingViewModel) {
    cb.utils.alert('正在初始化，请稍后重试', 'error');
    return false
  }
  return billingViewModel.execute('beforeDeleteProductCheck', {key})
}

const beforeUpdateMoneyMap = (params) => {
  const billingViewModel = getBillingViewModel();
  if (!billingViewModel) {
    cb.utils.alert('正在初始化，请稍后重试', 'error');
    return false
  }
  return billingViewModel.execute('beforeUpdateMoneyMap', params)
}

const beforeModifyQuantityLogic = (product, num) => {
  const billingViewModel = getBillingViewModel();
  if (!billingViewModel) {
    cb.utils.alert('正在初始化，请稍后重试', 'error');
    return false
  }
  return billingViewModel.execute('beforeModifyQuantityLogic', {product, num})
}

const beforeMergeSameProduct = (newEle, oldEle, middle) => {
  const billingViewModel = getBillingViewModel();
  if (!billingViewModel) {
    cb.utils.alert('正在初始化，请稍后重试', 'error');
    return false
  }
  return billingViewModel.execute('beforeMergeSameProduct', {newEle, oldEle, middle})
}

const afterModifyQuotePrice = (product, type, entry) => {
  const billingViewModel = getBillingViewModel();
  if (!billingViewModel) {
    cb.utils.alert('正在初始化，请稍后重试', 'error');
    return false
  }
  return billingViewModel.execute('afterModifyQuotePrice', {product, type, entry})
}

/* 获取product里的常量 */
export function getProductConstant (type) {
  const obj = {
    promotionMap: promotionMap
  }
  if (extendConstant[type] !== undefined )
    return extendConstant[type]
  return obj[type]
}

export function setProductConstant (obj) {
  const { key, value } = obj
  if (key === undefined || value === undefined) return
  if (extendConstant[key] !== undefined)
    extendConstant[key] = value
}
