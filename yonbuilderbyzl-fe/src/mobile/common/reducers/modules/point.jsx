import Immutable from 'immutable';
import { genAction, proxy } from '@mdf/cube/lib/helpers/util';
import _ from 'lodash'
import { getRetailVoucherData } from 'src/common/redux/modules/billing/mix';

let pointBackup = null;
const $$initialState = Immutable.fromJS({
  maxpoints: 0,
  memberpoints: 0,
  memo: 0,
  minpoints: 0,
  moneyuse: 0,
  mpoint: 0,
  nmoney: 0,
  points: 0
})

// reducer
export default ($$state = $$initialState, action) => {
  switch (action.type) {
    case 'BILLING_POINT_SET_DATA':
      return $$state.merge(action.payload);
    case 'PLATFORM_UI_BILLING_CLEAR':
      pointBackup = null;
      return $$state.merge({
        maxpoints: 0,
        memberpoints: 0,
        memo: 0,
        minpoints: 0,
        moneyuse: 0,
        mpoint: 0,
        nmoney: 0,
        points: 0
      });
    default:
      return $$state;
  }
}

export function getPoint () {
  return function (dispatch, getState) {
    const { money } = getState().product.toJS();
    // const { billingStatus } = getState().uretailHeader.toJS();
    const bcoupon = money.Coupon.done ? 1 : 0;
    const bpromotion = money.Promotion.done ? 1 : 0;
    const vouchData = getRetailVoucherData(getState());
    const config = {
      url: 'thirdparty/member/pointuse',
      method: 'POST',
      params: {
        bcoupon: bcoupon,
        bpromotion: bpromotion,
        data: JSON.stringify(vouchData),
        points: 0,
      }
    };
    proxy(config)
      .then(json => {
        if (json.code !== 200) {
          // cb.utils.alert('获取积分信息失败', 'error');
          return;
        }
        const data = json.data;
        // if (billingStatus === 'Shipment') {
        //   let moneyuse = money.Gathering.value;
        //   moneyuse = parseFloat(moneyuse).toFixed(cb.rest.AppContext.option.amountofdecimal);
        //   const points = moneyuse * data.mpoint;
        //   if (points <= data.points) {
        //     data.moneyuse = moneyuse;
        //     data.points = points;
        //   }
        // }
        dispatch(genAction('BILLING_POINT_SET_DATA', data));
      });
  }
}
export function rollBackPoint () {
  return function (dispatch) {
    if (_.isNull(pointBackup)) return
    dispatch(genAction('PLATFORM_UI_BILLING_CANCEL_PREFERENTIAL_UPDATE_PRODUCTS', {
      key: 'Point', value: pointBackup
    }));
    dispatch(genAction('BILLING_POINT_SET_DATA', {
      maxpoints: 0,
      memberpoints: 0,
      memo: 0,
      minpoints: 0,
      moneyuse: 0,
      mpoint: 0,
      nmoney: 0,
      points: 0
    }));
    pointBackup = null;
  }
}
export function usePonit (bBackup) {
  return function (dispatch, getState) {
    if (bBackup) {
      dispatch(genAction('PLATFORM_UI_BILLING_CANCEL_PREFERENTIAL_UPDATE_PRODUCTS', {
        key: 'Point', value: pointBackup
      }));
      pointBackup = null;
      return
    }
    const { money } = getState().product.toJS();
    const { points } = getState().point.toJS();
    const bcoupon = money.Coupon.done ? 1 : 0;
    const bpromotion = money.Promotion.done ? 1 : 0;
    const vouchData = getRetailVoucherData(getState());
    const config = {
      url: 'thirdparty/member/pointuse',
      method: 'POST',
      params: {
        bcoupon: bcoupon,
        bpromotion: bpromotion,
        data: JSON.stringify(vouchData),
        points: points,
      }
    };
    proxy(config)
      .then(json => {
        if (json.code !== 200) {
          cb.utils.alert('分配积分信息失败。错误信息 = ' + JSON.stringify(json), 'error');
          return;
        }
        if (!pointBackup) pointBackup = vouchData;
        dispatch(genAction('PLATFORM_UI_BILLING_EXECUTE_PREFERENTIAL_UPDATE_PRODUCTS', {
          key: 'Point', value: json.data.data
        }));
      });
  }
}
