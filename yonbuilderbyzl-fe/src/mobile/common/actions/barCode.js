import { createAction } from 'redux-actions'
import * as barCodeActions from '../constants/barCode';
import { genAction, proxy } from '@mdf/cube/lib/helpers/util'
import Immutable from 'immutable'

export const addBarCode = createAction(barCodeActions.ADD_BAR_CODE);
export const modifyBarCode = createAction(barCodeActions.MODIFY_BAR_CODE);
export const deleteBarCode = createAction(barCodeActions.DELETE_BAR_CODE);

const isTable = true;

export function scanReferReturn (keyword, time, callback) {
  return async function (dispatch, getState) {
    const billingStatus = getState().uretailHeader.toJS().billingStatus;
    let isBack = 0;
    if (billingStatus === 'FormerBackBill' || billingStatus === 'NoFormerBackBill') isBack = 1;
    const tableOrTree = isTable ? 'Y' : 'N';
    const config = {
      url: 'mall/bill/ref/getProducts.do',
      method: 'POST',
      params: {
        keyword: keyword,
        billDate: time,
        isReturn: isBack, // 非退货：0;退货：1
        showType: tableOrTree,
      }
    };
    const json = await proxy(config);
    if (json.code !== 200) {
      callback(null);
      // cb.utils.alert('未找到对应商品信息！', 'error');
      return
    }
    if (json.code === 200) {
      if (!json.data.type) {
        callback(null);
        // cb.utils.alert('未找到对应商品信息！', 'error');
        return
      }
      const data = json.data.data.recordList;
      if (!data[0]) {
        callback(null);
        // cb.utils.alert('未找到对应商品信息！', 'error');
        return
      }
      /* sku数据格式 */
      if (json.data.type === '1') {
        if (json.data.multiCode) {
          data.forEach(tempgoods => {
            tempgoods.fQuantity = 1;
            tempgoods.exactKey = tempgoods.id + '_' + tempgoods.skuId;
          })
          callback(data)
        } else {
          if (data.length == 1) {
            if (repeatSn(data, getState, '')) {
              cb.utils.alert('已经存在该序列号商品！', 'error')
              callback('');
              return
            }
            const tempgoods = data[0];
            tempgoods.fQuantity = 1;
            tempgoods.exactKey = tempgoods.id + '_' + tempgoods.skuId;
            callback(data);
            // 只有一条sku
            // 把这条数据放到弹出的界面中渲染
            // row.fQuantity = 1,row.exactKey=`${row.id}_${row.skuId}`; 把数据渲染出来；加减数量把fQuantity改变；点确定更新完的row；     goodsRefer.cartInfo.cartData.push(row)  => goodsRefer.cartInfo.numObj=>{row.exactKey: row.fQuantity }
          } else {
            callback(null);
            // 多条数据 抛出错误
            // cb.utils.alert('未找到对应商品信息！', 'error');
          }
        }
      }
    }
  }
}

/* 更新cartInfo */
export function updateCartInfo (row) {
  return function (dispatch, getState) {
    const { cartInfo } = getState().goodsRefer.toJS();
    const { cartData, numObj } = cartInfo;
    cartData.push(row);
    numObj[row.exactKey] = row.fQuantity;
    dispatch(genAction('URETAIL_MOBILE_GOODSREFER_SET_OPTIONS', { cartInfo }));
  }
}

/* 序列号判重lz */
export const repeatSn = (data, getState, type) => {
  if (!data || data.length < 1) return false
  const row = data[0];
  if (row.sn) {
    if (!type) {
      let products = getState().product.get('products')
      if (!Immutable.Iterable.isIterable(products)) products = Immutable.fromJS(products)
      for (const oldRow of products.values()) {
        if (row.sn == oldRow.get('cSerialNo')) {
          return true;
        }
      }
    }
    if (type === 'temp') {
      for (const oldRow of getState) {
        if (row.sn == oldRow.sn) {
          return true;
        }
      }
    }
  }
  return false;
}
