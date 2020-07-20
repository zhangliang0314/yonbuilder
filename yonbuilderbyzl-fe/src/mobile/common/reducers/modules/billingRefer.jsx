import Immutable from 'immutable';
import { genAction } from '@mdf/cube/lib/helpers/util';
import { getAvailable } from 'src/common/redux/modules/billing/editRow';
import { salesOk } from 'src/common/redux/modules/billing/salesClerk';

const $$initialState = Immutable.fromJS({
  dataSource: [], /* 参照数据源 */
  title: '', /* 参照标题 */
  reduxName: '', /**/
  returnType: 'default', /* 拓展属性  目前支持 default/define */
  defineName: '', /* returnType 为define时 启用 */
  showType: 'operator', /* 显示类型   暂支持operator/other  影响显示 */
  checkedRow: {
    compareItem: null, /* 比较字段 */
    row: [], /* 比较字段值的数组 */
  },
  showItem: {/* 参照行 显示的item */
    cItemName: '', /* 显示行的cItemName */
    childrenItem: [], /* 预留  显示行的子数据的 cItemName */
  }
});

export default ($$state = $$initialState, action) => {
  switch (action.type) {
    case 'BILLING_REFER_INIT_DATA':
      return $$state.merge(action.payload);
    default:
      return $$state;
  }
}
export function referReturn (row, reduxName) {
  return function (dispatch, getState) {
    const { returnType, defineName } = getState().billingRefer.toJS();
    let returnData = row;
    if (returnType == 'define') {
      returnData = { name: defineName, value: row };
    }
    if (returnType == 'editRow-warehouse')
      dispatch(getAvailable(row.warehouse));
    dispatch(genAction('BILLING_REFER_' + reduxName + '_RETURN', returnData));
    if (returnType == 'salesClerk')
      dispatch(salesOk());
  }
}
