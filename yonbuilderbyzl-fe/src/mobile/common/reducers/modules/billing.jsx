import Immutable from 'immutable';
import { genAction } from '@mdf/cube/lib/helpers/util';
// import { initConfig } from 'src/common/redux/modules/billing/config'
import { getDefaultBusinessType } from 'src/common/redux/modules/billing/reserve'

/* NavBar右侧状态 navBarState
*默认状态： ‘default’
*编辑状态： 'edit'
*/

const initialState = {
  navBarState: 'default',
  reBillingVisible: false, /* 新开单的popover */
  eiditDeleteMap: {}, /* 编辑状态要删除的商品 */
  isTop: false, /* 是否吸顶 */
  isAgainBilling: false, /** *是否继续开单 */
  isReturnSale: true, /** 是否选中退货商品 **/
}

export default ($$state = Immutable.fromJS(initialState), action) => {
  switch (action.type) {
    case 'URETAIL_MOBILE_BILLINGTOUCH_SET_OPTIONS':
      return $$state.merge(action.payload)
    case 'PLATFORM_UI_BILLING_CLEAR':
      return $$state.merge({ isAgainBilling: false, isReturnSale: true });
    default:
      return $$state
  }
}

export function init (billingStatus) { // 预留回调方法，当退订、交货进入初始完后调用
  return async function (dispatch) {
    /* 获取默认业务类型 */
    dispatch(getDefaultBusinessType(1));
  }
}

// const loadOption = async function () {
//   const config = {
//     url: 'option/getOptionsByParams',
//     method: 'POST'
//   };
//   const json = await proxy(config);
//   const option = {};
//   if (json.code === 200) {
//     json.data.forEach(item => {
//       const { name, value } = item;
//       option[name] = value;
//     });
//   }
//   cb.rest.AppContext.option = option;
// }

export function setOptions (obj) {
  return function (dispatch) {
    dispatch(genAction('URETAIL_MOBILE_BILLINGTOUCH_SET_OPTIONS', obj))
  }
}
