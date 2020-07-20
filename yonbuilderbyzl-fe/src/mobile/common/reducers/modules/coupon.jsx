import React from 'react';
import Immutable from 'immutable';
import { genAction, proxy } from '@mdf/cube/lib/helpers/util';
import { goBack } from 'react-router-redux';
import _ from 'lodash'
import { Modal } from 'antd-mobile';
import { getRetailVoucherData } from 'src/common/redux/modules/billing/mix';

const $$initialState = Immutable.fromJS({
  couponData: [], /* 优惠券列表 */
  checkedRow: {}, /* 选中行key */
  checkedList: [], /* 选中数据 */
  noUseData: [], /* 不可用优惠券列表 */
  couponSn: null, /* 扫描的优惠卷sn吗 */
})
let couponBackUp = null;
// reducer
export default ($$state = $$initialState, action) => {
  switch (action.type) {
    case 'BILLING_COUPON_SET_COUPONDATA':
      return $$state.merge({ couponData: action.payload });
    case 'BILLING_COUPON_SET_CHECKEDROW':
      return $$state.merge({ checkedRow: action.payload });
    case 'BILLING_COUPON_SET_COMMON_DATA':
      return $$state.merge(action.payload);
    case 'PLATFORM_UI_BILLING_RESTORE_PREFERENTIAL_COUPON_BACKUP':
      couponBackUp = action.payload.couponBackUp;
      return $$state.merge({
        checkedRow: action.payload.checkedRow,
        checkedList: action.payload.checkedList,
      });
    case 'PLATFORM_UI_BILLING_CLEAR':
      couponBackUp = null;
      return $$state.merge({
        couponData: [],
        checkedRow: {},
        checkedList: [],
        noUseData: [],
      });
    case 'PLATFORM_UI_COUPON_SCAN_RETURN': {
      const couponData = $$state.get('couponData').toJS();
      if (!couponData) return $$state;
      const newData = [];
      // val 未定义，因此注释本段代码
      // for (var i = 0; i < couponData.length; i++) {
      //   if (couponData[i].sn == val) {
      //     newData.push(couponData[i]);
      //     break;
      //   }
      // }

      // data未定义，因此注释本段代码
      // if (data.length < 1) {
      // cb.utils.alert('无此优惠卷！', 'error');
      // return $$state;
      // }
      return $$state.merge({ couponSn: action.payload, couponData: newData });
    }
    default:
      return $$state;
  }
}
export function setData (val) {
  return function (dispatch) {
    dispatch(genAction('BILLING_COUPON_SET_COMMON_DATA', val));
  }
}
export function clearCoupon () {
  return function (dispatch) {
    dispatch(genAction('BILLING_COUPON_SET_COMMON_DATA', {
      couponData: [],
      checkedRow: {},
      checkedList: [],
      noUseData: [],
    }));
  }
}
export function modifyCouponData (newData) {
  return function (dispatch) {
    dispatch(genAction('BILLING_COUPON_SET_COUPONDATA', newData))
  }
}
export function getCouponData () {
  return function (dispatch, getState) {
    const { memberInfo } = getState().member.toJS();
    const { storeId } = getState().user.toJS();
    const { checkedRow } = getState().coupon.toJS();
    const data = getRetailVoucherData(getState());
    const { money } = getState().product.toJS();
    const bpoint = money.Point.done ? 1 : 0;
    const bpromotion = money.Promotion.done ? 1 : 0;
    const params = {
      mid: memberInfo.data ? memberInfo.data.mid : undefined,
      storeid: storeId,
      data: JSON.stringify(data),
      bpoint: bpoint,
      bpromotion: bpromotion
    };
    const config = {
      url: 'thirdparty/member/querymyusecoupon',
      method: 'POST',
      params: params,
      showLoading: true,
    };
    proxy(config)
      .then(json => {
        if (json.code !== 200) return;
        const data = json.data;
        const couponData = []; const noUseData = [];

        data && data.map(item => {
          if (item.buse) {
            const key = item.id + '_' + item.coupon_id;
            if (!checkedRow[key]) checkedRow[key] = false;
            couponData.push(item);
          } else {
            noUseData.push(item);
          }
        });
        dispatch(genAction('BILLING_COUPON_SET_COMMON_DATA', {
          couponData: couponData,
          checkedRow: checkedRow,
          noUseData: noUseData
        }));
      });
  }
}
/* 选择优惠卷 */
export function chooseCoupon (key, row) {
  return function (dispatch, getState) {
    const { checkedRow, checkedList } = getState().coupon.toJS();
    const { money } = getState().product.toJS();
    const bpoint = money.Point.done ? 1 : 0;
    const bpromotion = money.Promotion.done ? 1 : 0;

    const bChoose = !checkedRow[key];
    if (!bChoose) { /* 反选 */
      let index = 0;
      checkedList.map((checkRow, i) => {
        const checkRowKey = checkRow.id + '_' + checkRow.coupon_id;
        if (checkRowKey == key) index = i;
      });
      checkedList.splice(index, 1);
      checkedRow[key] = bChoose;
      dispatch(setData({
        checkedRow, checkedList
      }));
      return
    }
    const voucherData = getRetailVoucherData(getState());
    const config = {
      url: 'thirdparty/member/couponcanuse',
      method: 'POST',
      params: {
        bpoint: bpoint,
        bpromotion: bpromotion,
        coupon: JSON.stringify(row),
        coupons: JSON.stringify(checkedList),
        data: JSON.stringify(voucherData)
      }
    };
    proxy(config)
      .then(json => {
        if (json.code !== 200) {
          cb.utils.alert(json.message, 'error')
          return;
        }
        const { flag, message, coupons, coupon } = json.data;
        let bExecute = false;
        if (flag == 0) { /* 失败 */
          cb.utils.alert('不能选择当前优惠券。' + (message || '').toString(), 'error');
          return;
        } else if (flag == 1) { /* 成功 */
          bExecute = true
        } else { /* 需要确认 */
          Modal.alert(<div className='icon_wenhao' />, message || '优惠券金额将超出应收金额，是否继续？', [
            { text: '取消' },
            {
              text: '确定',
              onPress: () => {
                bExecute = true;
                checkedRow[key] = bChoose;
                coupons.push(coupon);
                dispatch(setData({
                  checkedRow, checkedList: coupons
                }));
              }
            },
          ])
        }
        if (bExecute) { /* 继续执行优惠卷 */
          checkedRow[key] = bChoose;
          coupons.push(coupon);
          dispatch(setData({
            checkedRow, checkedList: coupons
          }));
        }
      });
  }
}
/* 回滚 */
export function rollBackCoupon () {
  return function (dispatch) {
    if (_.isNull(couponBackUp)) return
    dispatch(genAction('PLATFORM_UI_BILLING_CANCEL_PREFERENTIAL_UPDATE_PRODUCTS', {
      key: 'Coupon', value: couponBackUp
    }));
    couponBackUp = null;
    dispatch(clearCoupon());
  }
}
/* 执行优惠券 */
export function executeCoupon () {
  return function (dispatch, getState) {
    const { checkedList } = getState().coupon.toJS();
    const voucherData = couponBackUp || getRetailVoucherData(getState());
    if (checkedList.length == 0) {
      dispatch(genAction('PLATFORM_UI_BILLING_CANCEL_PREFERENTIAL_UPDATE_PRODUCTS', {
        key: 'Coupon', value: couponBackUp
      }));
      dispatch(goBack());
      couponBackUp = null;
      return
    }
    const config = {
      url: 'thirdparty/member/coupondivide',
      method: 'POST',
      params: {
        coupons: JSON.stringify(checkedList),
        data: JSON.stringify(voucherData)
      }
    };
    proxy(config)
      .then(json => {
        if (json.code !== 200) {
          cb.utils.alert('分摊优惠券失败。信息:' + (json.message ? json.message : JSON.stringify(json)).toString(), 'error');
          return;
        }
        if (!couponBackUp) couponBackUp = voucherData;
        dispatch(genAction('PLATFORM_UI_BILLING_EXECUTE_PREFERENTIAL_UPDATE_PRODUCTS', {
          key: 'Coupon', value: json.data, backup: {
            checkedRow: {},
            checkedList: [],
            couponBackUp: couponBackUp
          }
        }));
        dispatch(goBack());
      });
  }
}
