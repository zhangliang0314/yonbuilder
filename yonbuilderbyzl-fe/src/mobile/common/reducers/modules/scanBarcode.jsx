// import Immutable from 'immutable';
import { genAction } from '@mdf/cube/lib/helpers/util';
import { Youhuiquan_InputCoupon } from 'src/common/redux/modules/billing/actions';

// const $$initialState = Immutable.fromJS({

// })

export default function sendScanAction (value) {
  return function (dispatch) {
    if (value.reduxName == 'coupon') {
      dispatch(Youhuiquan_InputCoupon(value.data));
    } else {
      const key = value.reduxName && value.reduxName.trim().toUpperCase();
      dispatch(genAction(`PLATFORM_UI_${key}_SCAN_RETURN`, value.data));
    }
  }
}
