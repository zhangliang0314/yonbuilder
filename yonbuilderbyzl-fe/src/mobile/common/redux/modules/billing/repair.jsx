import Immutable from 'immutable';
import { genAction } from '@mdf/cube/lib/helpers/util';
// import _ from 'lodash'
import * as format from '@mdf/cube/lib/helpers/formatDate';
import { SetRepair } from './uretailHeader';

const $$initialState = Immutable.fromJS({
  visible: false,
  repairDate: format.dateFormat(new Date(), 'yyyy-MM-dd HH:mm:ss'),
})

// reducer
export default ($$state = $$initialState, action) => {
  switch (action.type) {
    /* modal显示/隐藏 */
    case 'PLATFORM_UI_BILLING_REPAIR_SET_VISIBLE':
      return $$state.set('visible', action.payload);
    case 'PLATFORM_UI_BILLING_REPAIR_SET_COMMON_DATA':
      return $$state.merge(action.payload);
    default:
      return $$state;
  }
}
/* 点击左侧菜单-补单 */
export function showRepair () {
  return function (dispatch, getState) {
    const data = { visible: true };
    data.repairDate = format.dateFormat(new Date(), 'yyyy-MM-dd HH:mm:ss');
    dispatch(genAction('PLATFORM_UI_BILLING_REPAIR_SET_COMMON_DATA', data));
  }
}
/**/
export function setRepairModal (visible, bOK) {
  return function (dispatch, getState) {
    dispatch(genAction('PLATFORM_UI_BILLING_REPAIR_SET_VISIBLE', visible));
    if (bOK) {
      const repairDate = getState().repair.toJS().repairDate;
      dispatch(SetRepair({ bRepair: true, vouchdate: repairDate }));
    }
  }
}
export function changeRepairDate (date) {
  return function (dispatch) {
    dispatch(genAction('PLATFORM_UI_BILLING_REPAIR_SET_COMMON_DATA', { repairDate: date }));
  }
}
