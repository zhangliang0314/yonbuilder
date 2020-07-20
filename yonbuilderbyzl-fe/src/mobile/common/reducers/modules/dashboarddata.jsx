import Immutable from 'immutable'
import { genAction, proxy } from '@mdf/cube/lib/helpers/util'
import _ from 'lodash'
// import { referReturn } from './billingRefer';

// 看板需要展示的数据字段
export const needShowKeys = [
  {
    name: 'moneyTotal',
    text: '销售金额',
    precisionType: 'amountofdecimal'
  }, {
    name: 'billNum',
    text: '成交笔数'
  }, {
    name: 'billAvgMoney',
    text: '客单价',
    precisionType: 'monovalentdecimal'
  }, {
    name: 'memberNum',
    text: '新增会员',
  }
]

/**
 * 数值格式化
 *
 * @param {Number|String} value 需要格式化的原始值.
 * @param {String}  type 小数位的类型, 系统配置的参数。type可为'amountofdecimal', 'monovalentdecimal', 'quantitydecimal', 'scaledecimal'等, 取自cb.rest.AppContext.option
 * @returns {string} 格式化后的值.
 *
 */
export const getFixedNumberFromSys = function (value, type) {
  const precision = _.get(cb.rest.AppContext, ['option', type])
  value = isNaN(value) ? 0 : value
  // 参数错误的时候, 返回原值
  if (isNaN(precision)) {
    return value
  }
  return Number(value).toFixed(precision)
}

// 看板需要展示的数据时间段
export const needShowDataRange = [
  { nameType: 'text', value: '昨天', key: 'yesterday' },
  { nameType: 'text', value: '近7天', key: 'seven' },
  { nameType: 'text', value: '近30天', key: 'thirty' }
]

const $$initialState = Immutable.fromJS({
  activeTab: 'yesterday'
})
export default ($$state = $$initialState, action) => {
  switch (action.type) {
    /*    case 'PLATFORM_UI_DASHBOARD_INIT':
          return $$state.set('data', action.payload); */
    case 'PLATFORM_UI_DASHBOARD_INIT_SUCCESS':
      return $$state.set('data', Immutable.fromJS(action.payload));

    case 'PLATFORM_UI_DASHBOARD_TOGGLE':
      return $$state.set('activeTab', action.payload);

    case 'PLATFORM_UI_HOME_SET_OPTIONS':
      return $$state.merge(action.payload);
    case 'PLATFORM_UI_BILLING_CLEAR':
      return $$state.merge({ taskListData: [], activeTab: 'yesterday' })
    default:
      return $$state;
  }
}

export function clear () {
  return function (dispatch) {
    dispatch(genAction('PLATFORM_UI_DASHBOARD_TOGGLE', 'yesterday'))
  }
}

// todo
export const getDashBoardData = () => dispatch => {
  // dispatch(genAction('PLATFORM_UI_DASHBOARD_INIT'))
  // todo proxy
  setTimeout(() => {
    // 重新组织数据
    const result = {}
    // data未定义，因此注释本段代码
    // _.forEach(data, item => {
    // result[item.key] = item
    // })
    dispatch(genAction('PLATFORM_UI_DASHBOARD_INIT_SUCCESS', result))
  }, 100)
}

// 经营概览
export function getTaskListData (options = {}) {
  return function (dispatch, getState) {
    // new Date(now.getTime() - 1000 * 60 * 60 * 24 * 15).format('yyyy-MM-dd');
    const now = new Date()
    const beginDate = options.beginDate || new Date(now.getTime() - 1000 * 60 * 60 * 24 * 1).format('yyyy-MM-dd');
    const endDate = options.endDate || new Date(now.getTime() - 1000 * 60 * 60 * 24 * 1).format('yyyy-MM-dd');
    const compareBeginDate = options.compareBeginDate || new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2).format('yyyy-MM-dd');
    const compareEndDate = options.compareEndDate || new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2).format('yyyy-MM-dd');
    const { storeId, showStore } = getState().user.toJS();
    const store_id = showStore === false ? '全部' : (options.store_id || storeId || '全部');
    const config = {
      url: '/report/getSaleAnalysisQueryData',
      // url: "/report/getSaleRankingQueryData",
      method: 'POST',
      params: {
        storeId: store_id,
        beginDate,
        endDate,
        compareBeginDate,
        compareEndDate
      }
    }
    proxy(config).then(json => {
      if (json.code === 200) {
        const sourceData = json.data;
        dispatch(genAction('PLATFORM_UI_HOME_SET_OPTIONS', { taskListData: sourceData }))
      } else {
        cb.utils.alert(json.message, 'error')
      }
    })
  }
}

export function setOptions (data) {
  return function (dispatch) {
    dispatch(genAction('PLATFORM_UI_DASHBOARD_SET_OPTIONS', data));
  }
}
