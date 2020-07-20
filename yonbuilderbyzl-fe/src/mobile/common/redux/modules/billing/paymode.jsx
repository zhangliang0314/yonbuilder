import Immutable from 'immutable'
import { genAction, proxy, getRoundValue } from '@mdf/cube/lib/helpers/util'
import { getRetailVoucherData, getOptions, canOpenSettleModal, checkShipmentValue, afterPayModalClose, save, save_mobile } from './mix'
import { getCommonParams } from './uretailHeader'
import _ from 'lodash'
import { push, goBack } from 'react-router-redux'
import { refundorcancel, usepos, opencashdrawnocheck } from 'src/common/redux/modules/billing/localNode'
import { Format } from '@mdf/cube/lib/helpers/formatDate'
import { getBillingViewModel } from './config'
const cbError = (title) => {
  cb.utils.alert({
    title,
    type: 'error'
  })
}

const viewNodeFunc = {}
export const ConfigOptions = {}

let cacheDelZero = null;/* add by jinzh1  缓存抹零业务参数配置 */

export const getFixedNumber = _.bind(function (value, name) {
  name = name || 'amountofdecimal'
  const precision = _.get(this, `${name}.value`)
  value = isNaN(value) ? 0 : value
  // 参数错误的时候, 返回原值
  if (isNaN(precision)) {
    return value
  }
  return getRoundValue(value, precision)
}, ConfigOptions)

/*
1 zh-cn 现金
2 zh-cn 银联卡
3 zh-cn 支付宝
4 zh-cn 微信
5 zh-cn 会员钱包
6 zh-cn 畅捷支付(银行卡)
7 zh-cn 畅捷支付(支付宝-扫手机付款码)
8 zh-cn 畅捷支付(微信-扫手机付款码)
9 zh-cn 其他
10 zh-cn 收钱吧
11 zh-cn 杉德支付
12 zh-cn 银商咨询预付卡
17 zh-cn 兴业银行支付
15 zh-cn 平安银行支付(刷卡)
16 zh-cn 平安银行支付(扫码)
13 zh-cn 无硬件POS通
14 zh-cn 营销联盟
19 zh-cn 聚合支付(微信、支付宝扫码)
18 zh-cn 储值卡
20 zh-cn 线上商城收款
21 zh-cn 卡券
22 zh-cn 银联商务
*/
/* const generateFixed = function (precision) {
  // 参数错误的时候, 返回原值
  if (isNaN(precision)) {
    return function (value) {
      return value
    }
  }
  return function (value) {
    value = isNaN(value) ? 0 : value
    return Number(value).toFixed(precision)
  }
} */
const $$initialState = Immutable.fromJS({
  payment: Immutable.Map(),
  paymodes: Immutable.Map(),
  currentFocus: '-1',
  visible: false,
  shortCutOpen: 0,
  delZero: Immutable.Map(),
  settle: Immutable.Map(),
  quickPay: [],
  // 快捷键切换支付方式
  shortCutToggle: '-1',
  finalSettle: 0,
  onSettle: false,
  hidePaymodes: Immutable.Map(),
  currentPayment: '-1',
  receipts: 0
})

let isDefaultSettleing = false;
let isShortCuting = false;

// reducer
export default ($$state = $$initialState, action) => {
  switch (action.type) {
    case 'PLATFORM_UI_BILLING_QUERY_PAYMENT':
      if (cb.rest.terminalType == 3)
        return $$state.withMutations(state => {
          let defaultPaymentId = '-1'
          state.set('payment', Immutable.Map().withMutations(p => {
            _.forEach(action.payload, (v) => {
              v.paymethodId += ''
              p.set(v.paymethodId, Immutable.Map(v))
              if (v.isDefault) {
                defaultPaymentId = v.paymethodId
              }
            })
            return p
          })
          )
            .set('currentPayment', defaultPaymentId)
        })
      else
        return $$state.set('payment', Immutable.Map().withMutations(p => {
          _.forEach(action.payload, (v) => {
            v.paymethodId += ''
            if (v.isDefault) // 默认支付方式不遵循设置的顺序 丹总
              v.orderBy = -1
            p.set(v.paymethodId, Immutable.Map(v))
          })
          return p
        })
        )

    // 批量更新支付金额
    case 'PLATFORM_UI_BILLING_SET_PAYMODES':

      return $$state.set('paymodes', Immutable.Map().withMutations(p => {
        _.forEach(action.payload, (v) => {
          v.paymethodId += ''
          p.set(v.paymethodId, Immutable.Map(v))
        })
        return p
      })
      )

    // 备份当前订单的支付数据
    case 'PLATFORM_UI_BILLING_BACKUP_BILL_PAYMODES':
      return $$state.set('billPaymodes', $$state.get('payment').mergeDeep(Immutable.Map().withMutations(p => {
        _.forEach(action.payload, (v) => {
          v.paymethodId += ''
          p.set(v.paymethodId, Immutable.Map(v))
        })
        return p
      })))
    case 'PLATFORM_UI_BILLING_PAYMODE_EXTEND_SET_OPTIONS':
    case 'PLATFORM_UI_PAYMODE_ADD_HIDE_PAYMODES':
    case 'PLATFORM_UI_BILLING_LOAD_PAYDATA':
      return $$state.merge(action.payload)
    case 'PLATFORM_UI_BILLING_FINAL_SETTLE':
      return $$state.update('finalSettle', v => ++v)

    // 付款方式集合切换焦点
    case 'PLATFORM_UI_BILLING_TOGGLE_FOCUS':
      return $$state.set('currentFocus', action.payload.paymethodId)

    case 'PLATFORM_UI_BILLING_SHORTCUT_TOGGLE_FOCUS':
      return $$state.set('shortCutToggle', action.payload.paymethodId)

    // 默认结算
    case 'PLATFORM_UI_BILLING_OPEN_DEFAULT_PAYMODAL': {
      const defaultPaymode = $$state.get('payment').findKey(paymode => paymode.get('isDefault'))
      const hidePaymodes = $$state.get('hidePaymodes');
      if (typeof defaultPaymode === 'undefined') {
        cb.utils.alert({
          title: '请先设置默认的支付方式',
          type: 'error'
        })
        return $$state
      }
      return $$state.merge({
        visible: true,
        currentFocus: defaultPaymode,
        paymodes: $$state.get('payment').update(defaultPaymode, paymode => paymode.merge({
          show: true,
          value: action.payload.value
        })).concat(hidePaymodes)
      })
    }
    // 快捷结算
    case 'PLATFORM_UI_BILLING_OPEN_SHORTCUT_PAYMODAL':
      return $$state.merge({
        paymodes: $$state.get('payment').update(action.payload.paymethodId, paymode => paymode.merge({
          show: true,
          value: action.payload.value,
        }))
      }).update('shortCutOpen', v => ++v)

    // 关闭结算弹窗
    case 'PLATFORM_UI_BILLING_CLOSE_PAYMODAL':
      // case 'PLATFORM_UI_BILLING_CLEAR':
      if (window.__onSettleMask) {
        window.__onSettleMask.destroy()
        window.__onSettleMask = null
      }
      return $$state.merge({ currentFocus: '-1', visible: false, onSettle: false })

    // 更新结算方式集合
    case 'PLATFORM_UI_BILLING_UPDATE_PAYMODE':
      return $$state.update('paymodes', paymodes => {
        return paymodes.withMutations(maps => {
          // 支付方式的金额符号与应付金额的符号必须相同
          if (_.has(action.payload.data, 'value')) {
            let v = action.payload.data.value

            if (action.payload.realTotal >= 0) {
              if (isNaN(v)) {
                v = '0.00'
              }
              action.payload.data.value = (v + '').replace(/-/, '')
            } else {
              if (!(v + '').match(/-/)) {
                action.payload.data.value = '-' + v
              }
            }
          }

          maps.update(action.payload.index, paymode => paymode.merge(action.payload.data))

          // // 应收金额为负的时候不记录找零
          // if (action.payload.realTotal < 0) {
          //   return
          // }

          // // 获取可找零金额
          // let maxzerolim = _.get(ConfigOptions, 'maxzerolim.value')
          // maxzerolim = getFixedNumber(maxzerolim)

          // // 计算当前找零金额
          // let currentChange = getFixedNumber(maps.reduce(function (a, b) {
          //   return getFixedNumber(Number(a) + Number(b.get('value') || 0))
          // }, 0) - action.payload.realTotal)

          // // 抹零限额开启时， 限制抹零金额
          // if (maxzerolim != 0 && currentChange > maxzerolim) {
          //   cb.utils.alert({ title: '最大找零金额为：' + maxzerolim })
          //   //maps.updateIn([action.payload.index, 'value'], v => (v - getFixedNumber(currentChange - maxzerolim)))
          //   //currentChange = maxzerolim
          // }

          // //有现金(paymentType为1)支付时记录找零
          // const cashPayKey = maps.findKey(map => map.get('paymentType') == 1 && map.get('show') && map.get('value') >0)
          // if (cashPayKey) {
          //   maps.update(cashPayKey, cashPay => {
          //     if (cashPay.get('show')) {
          //       return cashPay.set('change', currentChange
          //       )
          //     }
          //     return cashPay.set('change', 0)
          //   })
          // }
        })
      })

    // 删除结算方式
    case 'PLATFORM_UI_BILLING_DELETE_PAYMODE': {
      const obj = action.payload.obj || {};
      return $$state.updateIn(['paymodes', action.payload.index], paymode => {
        return paymode.merge({
          show: false,
          value: 0,
          ...obj,
        })
      }).set('currentFocus', '-1')
    }

    // 微信,支付宝和储值卡添加卡号
    case 'PLATFORM_UI_BILLING_ADD_CARD':

      return $$state.withMutations(state => {
        _.forEach(action.payload.arr, item => {
          state.setIn(['paymodes', ...(item.keyPath)], item.value)
          // 储值卡添加后端所需参数
          if (item.isStoredValueCard) {
            state.setIn(['paymodes', item.keyPath[0], 'backUrl'], action.payload.backUrl)
          }
        })
        return state
      })

    // 切换是否使用抹零功能
    case 'PLATFORM_UI_BILLING_TOGGLE_DELZERO':
      // return $$state.updateIn(['delZero', 'isDefaultValue'], v => !v /*action.payload.checked*/)
      return $$state.updateIn(['delZero', 'isDefaultValue'], v => action.payload.checked)

    /* ------------mobile------------------------------------------------------------------------------ */
    // ONLY FOR MOBILE 付款方式切换焦点
    case 'PLATFORM_UI_BILLING_TOGGLE_CURRENTPAYMENT':
      return $$state.set('currentPayment', action.currentPayment)

    // ONLY FOR MOBILE 写入paymodes
    case 'PLATFORM_UI_BILLING_SET_FINAL_PAYMODES':
      return $$state.set('paymodes', action.payload.paymodes)

    // ONLY FOR MOBILE 每次跳转结算详情时更新paymodes为payment
    case 'PLATFORM_UI_BILLING_INIT_PAYMODES':
      return $$state.set('paymodes', $$state.get('payment'))
    /* 退货和默认的结算方式选择 */
    case 'PLATFORM_UI_BILLING_MOBILE_SET_DEFAULT_PAYMODAL': {
      const _defaultPaymode = $$state.get('payment').findKey(paymode => paymode.get('isDefault'))
      if (typeof _defaultPaymode === 'undefined') {
        cb.utils.alert({
          title: '请先设置默认的支付方式',
          type: 'error'
        })
        return $$state
      }
      return $$state.merge({
        currentPayment: _defaultPaymode,
        paymodes: $$state.get('payment').update(_defaultPaymode, paymode => paymode.merge({
          show: true,
          value: action.payload.value
        }))
      })
    /* const currentPayment = $$state.get('currentPayment')
    if (currentPayment == '-1') {
      cb.utils.alert({
        title: '请先设置支付方式',
        type: 'error'
      })
      return $$state
    }
    return $$state.set('paymodes', $$state.get('payment').update(currentPayment, paymode => paymode.merge({
      show: true,
      value: action.payload.value
    }))) */
    }
    case 'PLATFORM_UI_BILLING_MOBILE_RESET_PAYMODES': {
      const payment = $$state.get('payment');
      return $$state.set('paymodes', payment)
    }
    // 大屏特殊结算
    case 'PLATFORM_UI_BILLING_SELF_ADD_PAYMODE': {
      const paymode = {};
      paymode[action.payload.paymentType] = action.payload;
      const t = $$state.set('paymodes', $$state.get('paymodes').mergeDeep(paymode))
      return t
    }
    /* add by jinzh1 结算、新开单 重置抹零业务参数配置 */
    case 'PLATFORM_UI_BILLING_CLEAR':
      if (cacheDelZero)
        return $$state.updateIn(['delZero', 'isDefaultValue'], v => cacheDelZero.isDefaultValue).merge({hidePaymodes: Immutable.Map()});
      else
        return $$state.merge({hidePaymodes: Immutable.Map()});
    default:
      return $$state;
  }
}

export function loadPayment (data, shortcutArr) {
  return function (dispatch) {
    dispatch(genAction('PLATFORM_UI_BILLING_QUERY_PAYMENT', data))
    if (cb.rest.terminalType != 3)
      dispatch(genAction('PLATFORM_UI_BILLING_LOAD_PAYDATA', {
        shortcutArr
      }))
  }
}

export function loadQuickPaymodes (quickPay) {
  return function (dispatch) {
    dispatch(genAction('PLATFORM_UI_BILLING_LOAD_PAYDATA', {
      quickPay
    }))
  }
}

export function loadConfig (data, malingdefault) {
  return function (dispatch) {
    let delZero, settle;
    data.forEach(item => {
      if (item.command === 'DeleteZero') {
        cacheDelZero = item;
        delZero = item;
      }
      else if (item.command === 'Settle')
        settle = item;
    })
    const defaultDelZero = (malingdefault && malingdefault.value) ? {isDefaultValue: true} : {}
    dispatch(genAction('PLATFORM_UI_BILLING_LOAD_PAYDATA', {
      delZero: delZero || defaultDelZero,
      settle: settle || {}
    }))

    // 初始化配置参数
    _.extend(ConfigOptions, getOptions())
  }
}

// 记录促销前的数据
export function backUpBeforePreferential (backupData) {
  return {
    type: 'PLATFORM_UI_BILLING_LOAD_PAYDATA',
    payload: {
      backupData
    }
  }
}

// 关闭结算弹窗

export function closePaymodal (isComplete) {
  return function (dispatch, getState) {
    const backupData = getState().paymode.toJS().backupData
    // isComplete 是否完成订单
    if (isComplete) {
      dispatch(backUpBeforePreferential(false))
    } else {
      // 已经执行过促销的需要取消
      if (backupData) {
        dispatch(genAction('PLATFORM_UI_BILLING_CANCEL_PREFERENTIAL_UPDATE_PRODUCTS', {
          key: 'Zero',
          value: backupData,
        }));
      }
      dispatch(afterPayModalClose())
      beforePayModalClose()
    }
    dispatch(genAction('PLATFORM_UI_BILLING_CLOSE_PAYMODAL'))
    clearAfterPayModalClose()
  }
}

/* add by jinzh1  移动端  返回取消抹零 */
export function closePaymodalByMobile () {
  return function (dispatch, getState) {
    const backupData = getState().paymode.toJS().backupData
    if (backupData) {
      dispatch(genAction('PLATFORM_UI_BILLING_CANCEL_PREFERENTIAL_UPDATE_PRODUCTS', {
        key: 'Zero',
        value: backupData,
      }));
    }
  }
}

// 批量更新结算方式
export function setPaymodes (obj) {
  return function (dispatch, getState) {
    dispatch(genAction('PLATFORM_UI_BILLING_SET_PAYMODES', obj));
  }
}

// 更新结算方式
export function updatePaymode (obj) {
  return function (dispatch, getState) {
    const realTotal = getFixedNumber(getState().product.getIn(['money', 'Gathering', 'value']))
    dispatch(genAction('PLATFORM_UI_BILLING_UPDATE_PAYMODE', { realTotal, ...obj }));
  }
}

// 删除结算方式
export function deletePaymode (index, data) {
  const obj = {};
  beforeDeletePaymode(obj, data)
  return {
    type: 'PLATFORM_UI_BILLING_DELETE_PAYMODE',
    payload: {
      index,
      obj,
    }
  }
}

// 微信,支付宝添加卡号
export function addCard (arr) {
  return function (dispatch, getState) {
    dispatch(genAction('PLATFORM_UI_BILLING_ADD_CARD', {
      arr,
      // 储值卡save回调参数
      backUrl: `${location.origin}/uniformdata/thirdparty/member/cardcallback?token=${getState().user.toJS().token}`
    }));
  }
}

// 最终结算
export function finalSettle () {
  return {
    type: 'PLATFORM_UI_BILLING_FINAL_SETTLE'
  }
}

// 默认结算
export function defaultSettle () {
  return function (dispatch, getState) {
    if (isDefaultSettleing) return
    isDefaultSettleing = true
    canOpenSettleModal(getState, dispatch, 'default').then(canOpen => {
      if (!canOpen) {
        isDefaultSettleing = false
        return
      }
      // 'PresellBack': /*退订*/

      const currentState = getState()
      const uretailHeader = currentState.uretailHeader.toJS()
      const billingStatus = uretailHeader.billingStatus

      const { iOwesState = 0 } = uretailHeader.infoData

      // if (billingStatus === 'PresellBack' ) {
      if (billingStatus === 'PresellBack' || billingStatus === 'FormerBackBill') {
        // 应收金额
        // const gathering = getFixedNumber(currentState['product'].toJS().money.Gathering.value)

        // 抹零
        getDelZeroResult(dispatch, getState).then(async (result) => {
          const obj = { result }
          if (!(await afterFinalDefaultSettle(dispatch, obj))) {
            isDefaultSettleing = false
            return
          }
          if (result >= 0) {
            dispatch(genAction('PLATFORM_UI_BILLING_OPEN_DEFAULT_PAYMODAL', {
              // 可赊销时默认结算设置代入金额为0
              value: iOwesState == 1 ? 0 : result
            }))
          } else {
            const paymodes = currentState.paymode.toJS().billPaymodes
            const inUse = []
            // 只使用一种支付方式时更新为实时金额
            _.forEach(paymodes, (pay, paymethodId) => {
              if (pay.show && Number(pay.value) !== 0) {
                inUse.push(paymethodId)
              }
            })
            if (inUse.length === 1) {
              paymodes[inUse[0]].value = result
            }

            dispatch(genAction('PLATFORM_UI_BILLING_LOAD_PAYDATA', {
              visible: true,
              paymodes: Immutable.fromJS(paymodes),
              currentFocus: inUse[0] + ''
            }))
          }
          isDefaultSettleing = false
        })
      } else if (billingStatus === 'OnlineBackBill') {
        isDefaultSettleing = false
        dispatch(save(data => {
          cb.utils.alert('电商结算成功', 'success')
        }, result => {
          cb.utils.alert('电商结算失败', 'error')
        }))
      } else {
        getDelZeroResult(dispatch, getState)
          .then(async (result) => {
            const obj = { result }
            if (!(await afterFinalDefaultSettle(dispatch, obj))) {
              isDefaultSettleing = false
              return
            }
            result = obj.result
            dispatch(genAction('PLATFORM_UI_BILLING_OPEN_DEFAULT_PAYMODAL', {
              value: iOwesState == 1 ? 0 : result
            }))
            isDefaultSettleing = false
          })
      }
    })
  }
}

const afterFinalDefaultSettle = async (dispatch, obj) => {
  const billingViewModel = getBillingViewModel();
  if (!billingViewModel) {
    cb.utils.alert('正在初始化，请稍后重试', 'error');
    return false
  }
  const hidePaymodes = {}
  return billingViewModel.warpPromiseExecute('afterFinalDefaultSettle', { hidePaymodes, obj })
}

// 快捷结算
export function shortcutSettle (paymethodId) {
  return function (dispatch, getState) {
    if (isShortCuting) return
    window.__loadingModal = viewNodeFunc.openLoadingModal()
    isShortCuting = true
    const billingStatus = getState().uretailHeader.toJS().billingStatus
    // 'PresellBack': /*退订*/
    // 'FormerBackBill':/*原单退货*/
    // 'NoFormerBackBill':/*非原单退货*/
    // 'OnlineBackBill':/*电商退货*/

    if (billingStatus === 'OnlineBackBill' || billingStatus === 'PresellBack' || billingStatus === 'FormerBackBill' || billingStatus === 'NoFormerBackBill') {
      cb.utils.alert({
        title: '该状态下不能使用快捷结算',
        type: 'error'
      })
      isShortCuting = false
      closeLoadingModal('quickPay')
      return
    }

    canOpenSettleModal(getState, dispatch, 'shortcut').then(canOpen => {
      if (!canOpen) {
        isShortCuting = false
        closeLoadingModal('quickPay')
        return
      }
      paymethodId += ''
      getDelZeroResult(dispatch, getState)
        .then(result => {
          if (!afterFinalShortCutSettle(result, paymethodId)) return
          dispatch(genAction('PLATFORM_UI_BILLING_OPEN_SHORTCUT_PAYMODAL', {
            paymethodId,
            value: result
          }))
          const payment = getState().paymode.get('payment')
          let paymentType = ''
          payment && payment.map(ele => {
            if (ele.get('paymethodId') == paymethodId) paymentType = ele.get('paymentType')
          })
          if (paymentType != 1 && paymentType != 9)
            closeLoadingModal('quickPay')
          isShortCuting = false
        })
    })
  }
}

const afterFinalShortCutSettle = (result, paymethodId) => {
  const billingViewModel = getBillingViewModel();
  if (!billingViewModel) {
    cb.utils.alert('正在初始化，请稍后重试', 'error');
    return false
  }
  return billingViewModel.execute('afterFinalShortCutSettle', {result, paymethodId})
}

export const closeLoadingModal = (type) => {
  // if (!type || 'quickPay'){
  if (window.__loadingModal) {
    window.__loadingModal.destroy()
    window.__loadingModal = null
  }
  // }
}

export function interventionShortCutView (paymodes, callback) {
  const billingViewModel = getBillingViewModel();
  if (!billingViewModel) {
    cb.utils.alert('正在初始化，请稍后重试', 'error');
    return
  }
  billingViewModel.promiseExecute('interventionShortCutView', { paymodes }, function () {
    callback && callback()
  })
}

// 切换支付方式input焦点
export function toggleFocus (paymethodId) {
  paymethodId += ''
  return {
    type: 'PLATFORM_UI_BILLING_TOGGLE_FOCUS',
    payload: {
      paymethodId
    }
  }
}

// 切换支付方式快捷键

export function togglePaymentType (paymethodId) {
  paymethodId += ''
  return {
    type: 'PLATFORM_UI_BILLING_SHORTCUT_TOGGLE_FOCUS',
    payload: {
      paymethodId
    }
  }
}

// 切换是否使用抹零功能
export function toggleDelZero (checked) {
  return {
    type: 'PLATFORM_UI_BILLING_TOGGLE_DELZERO',
    payload: {
      checked
    }
  }
}

function getShouldDelZero (currentState) {
  const { infoData, billingStatus } = currentState.uretailHeader.toJS()
  let { delZero: { isDefaultValue } } = currentState.paymode.toJS()
  // let lineConnection = currentState.offLine.get('lineConnection')

  // 总金额为0, 不再执行抹零操作
  const value = Number(currentState.product.getIn(['money', 'Gathering', 'value']))
  if (value === 0) {
    return false
  }
  // if (!lineConnection && cb.rest.interMode === 'touch') {
  //   return false
  // }
  switch (billingStatus) {
    // 电商退货 不进行抹零
    case 'OnlineBackBill':
    // 电商订单  不进行抹零
    case 'OnlineBill':
    // 退订不进行抹零
    case 'PresellBack': /* 退订 */
      isDefaultValue = false
      break

    // 预订状态且“交货时可修改商品”为是, 不进行抹零
    case 'PresellBill':
      if (infoData.bDeliveryModify) {
        isDefaultValue = false
      }
      break
    // 交货状态且“交货时可修改商品”为否, 不进行抹零
    case 'Shipment':
      if (!infoData.bDeliveryModify) {
        isDefaultValue = false
      }
      break
  }

  return isDefaultValue
}

// save前设置预订额
export function setPresellMoney (value) {
  return {
    type: 'PLATFORM_UI_BILLING_PRESELL_PAY_MONEY',
    payload: value
  }
}

export function toggleSettleStatus (onSettle) {
  if (onSettle === false && window.__onSettleMask) {
    window.__onSettleMask.destroy()
    window.__onSettleMask = null
    closeLoadingModal('quickPay')
  }
  return {
    type: 'PLATFORM_UI_BILLING_LOAD_PAYDATA',
    payload: {
      onSettle
    }
  }
}
/* ----mobile-only------------------------------------------------------------------------------- */
export function gotoSettleDetail () {
  return function (dispatch, getState) {
    dispatch({
      type: 'PLATFORM_UI_BILLING_INIT_PAYMODES'
    })

    canOpenSettleModal(getState, dispatch).then(result => {
      if (result) {
        dispatch(push('/settleDetail'))
        dispatch(finalUpdateBeforeSettle())
      }
    })
  }
}
// save前设置预订额及现场折扣
export function setPresellAndSceneMoney (value) {
  return function (dispatch, getState) {
    // let money = getState().product.toJS().money;
    // let scene = getFixedNumber(parseFloat(money.Total.value) - parseFloat(value));
    dispatch(genAction('PLATFORM_UI_BILLING_PRESELL_AND_SCENE_PAY_MONEY', value));
  }
}
// save修改订金金额
export function setDepositMoney (value) {
  return {
    type: 'PLATFORM_UI_BILLING_DEPOSIT_PAY_MONEY',
    payload: value
  }
}
// 切换支付方式input焦点
export function toggleCurrentPayment (paymethodId) {
  paymethodId += ''
  return {
    type: 'PLATFORM_UI_BILLING_TOGGLE_CURRENTPAYMENT',
    currentPayment: paymethodId

  }
}
export function getDelZeroResult (dispatch, getState) {
  const currentState = getState()
  const shouldDelZero = getShouldDelZero(currentState)
  // 当前应付金额
  const value = getFixedNumber(currentState.product.getIn(['money', 'Gathering', 'value']))
  // 已付款金额
  const deposit = getFixedNumber(currentState.product.getIn(['money', 'Deposit', 'value']))
  let data = false
  const { billingStatus } = currentState.uretailHeader.toJS();
  const { MinPercentGiveMoneyPre } = currentState.reserve.toJS();
  return new Promise(function (resolve) {
    if (shouldDelZero) {
      data = getRetailVoucherData(currentState);
      dispatch(backUpBeforePreferential(data))
      const wipeZeroResult = wipeZero(getState, data, resolve, value)
      if (!wipeZeroResult) {
        afterWipeZero(data, dispatch, billingStatus, resolve, deposit)
        return
      }
      const config = {
        url: 'thirdparty/member/wipesmall',
        method: 'POST',
        params: {
          data: JSON.stringify(data)
        }
      };

      proxy(config)
        .then(json => {
          if (json.code !== 200) {
            cb.utils.alert(json.message, 'error')
            resolve(false)
            return
          }
          console.log('使用抹零')
          // 抹零后的结果
          const result = json.data.fMoneySum
          data = json.data
          dispatch(genAction('PLATFORM_UI_BILLING_EXECUTE_PREFERENTIAL_UPDATE_PRODUCTS', {
            key: 'Zero',
            value: json.data
          }))
          // 此时返回的是整单抹零的结果, 需要减去已付款金额
          if (billingStatus === 'PresellBill') {
            resolve(parseFloat(deposit) === 0 ? (getFixedNumber(Number(result) - deposit)) : deposit);
          } else {
            resolve(getFixedNumber(Number(result) - deposit))
          }
        })
    } else {
      if (billingStatus === 'PresellBill') {
        /* lz 将parseInt改为parseFloat */
        if (cb.rest.terminalType == 3) {
          resolve(parseFloat(deposit) === 0 ? (MinPercentGiveMoneyPre === 0 ? deposit : value) : deposit);
        } else {
          resolve(parseFloat(deposit) === 0 ? value : deposit);
        }
      } else {
        resolve(value)
      }
      dispatch(backUpBeforePreferential(data))
    }

    // dispatch(backUpBeforePreferential(data))
  })
}

/* 抹零服务 */
const wipeZero = (getState, data, resolve, value) => {
  const billingViewModel = getBillingViewModel();
  if (!billingViewModel) {
    cb.utils.alert('正在初始化，请稍后重试', 'error');
    resolve(value)
    return
  }
  return billingViewModel.execute('wipeZero', { data })
}

/* 抹零后 */
const afterWipeZero = (data, dispatch, billingStatus, resolve, deposit) => {
  console.log('使用本地抹零')
  // 抹零后的结果
  const result = data.fMoneySum
  // data = json.data
  dispatch(genAction('PLATFORM_UI_BILLING_EXECUTE_PREFERENTIAL_UPDATE_PRODUCTS', {
    key: 'Zero',
    value: data
  }))
  // 此时返回的是整单抹零的结果, 需要减去已付款金额
  if (billingStatus === 'PresellBill') {
    resolve(parseFloat(deposit) === 0 ? (getFixedNumber(Number(result) - deposit)) : deposit);
  } else {
    resolve(getFixedNumber(Number(result) - deposit))
  }
}

export function setFinalPaymodes ({ isStorageUsed, paidIn, paymentId, storage_balance } = {}) {
  return (dispatch, getState) => {
    const currentState = getState()
    const realTotal = getFixedNumber(currentState.product.getIn(['money', 'Gathering', 'value']))
    const { billingStatus, MinPercentGiveMoneyPre } = currentState.uretailHeader.toJS()

    const finalTotal = isStorageUsed ? getFixedNumber(Number(storage_balance) + Number(paidIn)) : paidIn

    let finalPaymodes; let currentChange = 0// 计算当前找零金额

    const p = new Promise(resolve => {
      finalPaymodes = currentState.paymode.get('paymodes').withMutations(maps => {
        if (isStorageUsed) {
          const storagePayKey = maps.findKey(map => map.get('paymentType') == 5)
          maps.update(storagePayKey, v => {
            return v.set('value', storage_balance).set('show', true)
          })
        }

        maps.update(paymentId, v => {
          return v.set('value', paidIn).set('show', true)
        })

        // 获取可找零金额
        let maxzerolim = _.get(ConfigOptions, 'maxzerolim.value')
        maxzerolim = getFixedNumber(maxzerolim)

        // 计算当前找零金额
        currentChange = getFixedNumber(maps.reduce(function (a, b) {
          return getFixedNumber(Number(a) + Number(b.get('value') || 0))
        }, 0) - Number(realTotal))

        // 判断付款金额是否满足需求
        if (billingStatus != 'FormerBackBill') {
          if (getFixedNumber(finalTotal - _.multiply(realTotal, MinPercentGiveMoneyPre) * 0.01) < 0) {
            cb.utils.alert({ title: '实收金额不等于应收金额。', type: 'error' })
            resolve(false)
            return
          }
        }

        // 找零限额开启时， 限制抹零金额
        if (maxzerolim != 0 && currentChange > maxzerolim) {
          cb.utils.alert({ title: '最大找零金额为：' + maxzerolim, type: 'error' })
          // maps.updateIn([action.payload.index, 'value'], v => (v - getFixedNumber(currentChange - maxzerolim)))
          // currentChange = maxzerolim

          resolve(false)
          return
        }

        // 有现金(paymentType为1)支付时记录找零
        const cashPayKey = maps.findKey(map => map.get('paymentType') == 1)
        if (cashPayKey) {
          maps.update(cashPayKey, cashPay => {
            if (cashPay.get('show')) {
              return cashPay.set('change', currentChange)
            }
            return cashPay.set('change', 0)
          })
        }

        resolve(true)
      })
    })
    p.then((result) => {
      if (result) {
        dispatch(genAction('PLATFORM_UI_BILLING_SET_FINAL_PAYMODES', {
          paymodes: finalPaymodes
        }))
        dispatch(handleSave({
          billingStatus,
          receivable: realTotal, // 应收
          receipts: isStorageUsed ? getFixedNumber(getFixedNumber(storage_balance) + getFixedNumber(paidIn)) : getFixedNumber(paidIn), // 实收
          currentChange, // 找零
          paymodes: finalPaymodes.toJS()
        }))
      }
    })
  }
}

/*
* @params: Object {
* isStorageUsed: 是否已经使用储值卡
* paymentId: 当前结算方式ID
* paymentType: 结算方式类型
* receivable: 当前结算方式应收款
* storage_balance: 储值卡余额
* billingStatus: 订单状态
* }
* */
export function handleSettlePayment ({ isStorageUsed, paymentId, paymentType, paidIn, billingStatus, storage_balance, minReceivable } = {}) {
  return (dispatch, getState) => {
    if (!checkShipmentValue(getState, dispatch)) {
      return;
    }
    // todo 折扣比例
    switch (paymentType) {
      // 储值卡
      case 5:
      //  return '先扫码'
      // return dispatch(handleStoreCard({paymentId, paidIn, billingStatus, storage_balance}))
      // 支付宝, 微信 promise
      /* return dispatch(push('/scan', {
        isStorageUsed, paymentId, paymentType, paidIn, billingStatus, storage_balance
      })) */
      case 3:
      case 4:
      case 10:
      case 17:
      case 19:
        if ((billingStatus === 'NoFormerBackBill' || billingStatus === 'FormerBackBill') && paidIn < 0) {
          dispatch(setFinalPaymodes({
            paymentId,
            paidIn,
            storage_balance,
            isStorageUsed
          }))
          return;
        }
        if (parseFloat(paidIn) > 0)
          return dispatch(push('/scan', {
            isStorageUsed, paymentId, paymentType, paidIn, billingStatus, storage_balance
          }))
        else
          return dispatch(setFinalPaymodes({
            billingStatus: billingStatus,
            isStorageUsed,
            paymentId,
            paidIn: paidIn,
            storage_balance
          }))

      // 现金
      case 1:
        return dispatch(push('/setReceipts', {
          isStorageUsed,
          paymentId,
          paymentType,
          paidIn,
          billingStatus,
          storage_balance,
          minReceivable
        }))

      default:
        dispatch(setFinalPaymodes({
          paymentId,
          paidIn,
          storage_balance,
          isStorageUsed
        }))

      /* dispatch(jumpSettle({isUseStorage, paymentId})).then((result) => {
         handleSave(receivable, billingStatus, result, dispatch)
       }) */
    }
  }
}

export function handleStoreCard ({ paymentId, paidIn, billingStatus, storage_balance }) {
  return dispatch => {
    // 储值卡余额足够, 直接结算
    if (storage_balance && Number(paidIn) <= Number(storage_balance)) {
      dispatch(setFinalPaymodes({
        paymentId,
        paidIn
      }))
    } else {
      dispatch(push('/payContinue', {
        storage_balance,
        paidIn
      }))
    }
  }
}

export function handleSave ({ billingStatus, receivable, receipts, currentChange, paymodes } = {}) {
  return dispatch => {
    dispatch(save_mobile((data) => {
      let _temVoucher = data;
      if (!_temVoucher.code && !_temVoucher.vouchdate) {
        _temVoucher = JSON.parse(data).rm_retailvouch[0];
      }
      const lastBill = _.assign({}, _.pick(_temVoucher,
        [
          'vouchdate', // 订单时间
          'code', // 订单号
          'billingStatus'
        ]
      ), {
        billingStatus,
        receivable, // 应收
        receipts, // 实收
        currentChange, // 找零
        paymodes // 所有的支付方式
      })
      // 存放完成的订单
      localStorage.setItem('billing_lastBill', JSON.stringify(lastBill));
      dispatch(genAction('PLATFORM_UI_BILLING_DATASOURCE_REMOVE_CODE', _temVoucher.code));
      dispatch(push('/settleResult', lastBill))

      dispatch(closePaymodal(true))
    }, msg => {
      dispatch(toggleSettleStatus(false))
      cb.utils.alert({
        title: msg,
        type: 'error',
        onClose: () => {
          // 扫码结算出错  返回
          dispatch(goBack());
        }
      })
      // let promises = []
      // todo 错误处理 根据状态码回退或者撤销相关支付方式
    }))
  }
}

/*
* 写入支付码
*
* */
export function setScanCode ({ barCode, paymentId, paymentType }) {
  return dispatch => {
    dispatch(genAction('PLATFORM_UI_BILLING_ADD_CARD', {
      arr: [{ keyPath: [paymentId, 'authCode'], value: barCode }],
      // keyPath: [paymentId, 'authCode'],
      // value: barCode,
      // 储值卡
      isStoredValueCard: paymentType == 5
    }))
  }
}

// 处理退订，退货等退款相关业务
export function setOriginalPaymodes (originalPaymodes) {
  return (dispatch, getState) => {
    dispatch(genAction('PLATFORM_UI_BILLING_SET_FINAL_PAYMODES', {
      paymodes: _.map(originalPaymodes, p => {
        const { fMoney, ...others } = p
        return {
          fMoney: 0 - fMoney,
          ...others
        }
      })
    }))
  }
}

/* ***************************************************************** */
/* 将view层handleSave重构到redux */
export const reviewHandleSave = () => {
  return function (dispatch, getState) {
    const showSuccessModal = viewNodeFunc.showSuccessModal
    const { uretailHeader, paymode, product } = getState();
    const { billingStatus, infoData: { iOwesState = 0 } } = uretailHeader.toJS()
    const { paymodes } = paymode.toJS();
    const money = product.get('money').toJS()
    const lastPaymodes = _.cloneDeep(paymodes)
    // 应收
    const receivable = getFixedNumber(money.Gathering.value)
    // 实收
    const receipts = getFixedNumber(_.reduce(paymodes, (a, b) => {
      return Number(a) + (isNaN(b.value) ? 0 : Number(b.value))
    }, 0))
    // 结算调用接口前保存此单的数据
    const lastBill = { receivable, receipts }
    lastBill.billingStatus = billingStatus
    const { collectMoneyMethod } = getOptions();
    if (collectMoneyMethod && collectMoneyMethod.value === '2') lastBill.isSave = true

    /* modify by jinzh1  找零金额计算 */
    // lastBill.change = getChangeValue()
    lastBill.change = getChangeValue(paymodes, receipts, receivable)

    // 判断是否为预订状态， 设定预订金额
    if (billingStatus === 'PresellBill') {
      dispatch(setPresellMoney(Math.min(receipts, receivable)))
    } else {
      // 赊销状态, 修改金额使表头表体一致（为了后台校验通过  ^-.-^）
      if (iOwesState == 1) {
        if (Math.abs(lastBill.receipts) < Math.abs(lastBill.receivable)) {
          dispatch(setPresellMoney(_.minBy([Number(receipts), Number(receivable)], Math.abs)))
        }
      }
    }

    setTimeout(() => {
      // return
      dispatch(save(() => {
        // hide()
        // 存放完成的订单
        localStorage.setItem('billing_lastBill', JSON.stringify(lastBill))
        dispatch(closePaymodal(true))
        dispatch(toggleSettleStatus(false))
        setTimeout(() => {
          if (window.__loadingModal) {
            window.__loadingModal.destroy()
            window.__loadingModal = null
          }
          showSuccessModal(lastBill)
          // 使用现金'1'或者其他'9'支付方式时， 开钱箱  finally
          if (shouldOpenCash(lastPaymodes)) {
            if (process.env.__CLIENT__ && process.env.INTERACTIVE_MODE !== 'touch') {
              const proxy = opencashdrawnocheck();
              proxy && proxy.then(json => {
                if (json.code == 200) {
                  console.log('打开钱箱成功')
                } else if (json.code == 500) {
                  // 未接钱箱
                  console.log('本地未接钱箱')
                } else {
                  // code == '999'
                  cb.utils.alert({
                    title: json.message,
                    content: '打开钱箱失败',
                    type: 'error'
                  })
                }
              })
            } else {
              if (window.plus) plus.JavaToJs.HardwareInterface('opencashbox');
            }
          }
        }, 0)
      }, msg => {
        dispatch(toggleSettleStatus(false))
        if (window.__loadingModal) {
          window.__loadingModal.destroy()
          window.__loadingModal = null
          // 快捷支付失败时恢复状态
          dispatch(closePaymodal(false))
        }
        cb.utils.alert({
          title: msg,
          type: 'error'
        })
        saveAndHandleError(paymodes);
      }))
    })
  }
}

const getChangeValue = (paymodes, receipts, receivable) => {
  let cashInUse = false
  _.forEach(paymodes, pay => {
    if (pay.paymentType == 1 && pay.value > 0) {
      cashInUse = true
    }
  })
  return cashInUse && getFixedNumber(receipts - receivable) > 0 && getFixedNumber(receipts - receivable)
}

const shouldOpenCash = (paymodes) => {
  // 使用现金'1'或者其他'9'支付方式时， 开钱箱 => lz 根据支付方式走
  return _.some(paymodes, paymode => {
    if (paymode.isOpenCashDrawer) {
      return paymode.show && Number(paymode.value) !== 0
    }
    return false
  })
}

/* 取view层页面结构 */
export const getViewNodeFunc = (type, callback) => {
  viewNodeFunc[type] = callback
}

/* 支付宝弹窗／走硬件支付 */
export const allPaymentTypeInStorage = (isQuickPay) => {
  return function (dispatch, getState) {
    const promises = []
    const { paymode } = getState();
    const paymodes = paymode.toJS().paymodes;
    // 过滤在使用的支付方式并且根据paymentType的值排序决定同步执行的顺序
    const finallyPaymodes = _.sortBy(_.filter(paymodes, paymode => paymode.show && paymode.value != 0), 'paymentType')
    _.forEach(finallyPaymodes, (paymode) => {
      if (paymode.paymentType == 3 || paymode.paymentType == 4 || paymode.paymentType == 5 || paymode.paymentType == 10) {
        promises.push(() => {
          return viewNodeFunc.inputConfirm(paymode, isQuickPay)
        })
      } else if (paymode.paymentType == 6 || paymode.paymentType == 7 || paymode.paymentType == 8) {
        promises.push(() => {
          return dispatch(reviewChangjiePay(paymode, isQuickPay, ''))
        })
      } else if (paymode.paymentType == 11) {
        promises.push(() => {
          return dispatch(reviewChangjiePay(paymode, isQuickPay, 'sandPay'))
        })
      } else if (paymode.paymentType == 2) {
        promises.push(() => {
          return dispatch(reviewChangjiePay(paymode, isQuickPay, 'unionPay'))
        })
      } else if (paymode.paymentType == 12) {
        promises.push(() => {
          return dispatch(reviewChangjiePay(paymode, isQuickPay, 'laochangPay'))
        })
      } else if (paymode.paymentType == 13) {
        promises.push(() => {
          return viewNodeFunc.inputConfirm(paymode, isQuickPay).then(result => {
            return dispatch(reviewChangjiePay(paymode, isQuickPay, 'nohardwarePay', { authcode: result.value }))
          })
        })
      } else if (paymode.paymentType == 14) {
        promises.push(() => {
          return dispatch(reviewChangjiePay(paymode, isQuickPay, 'lolPay'))
        })
      } else {
        // if (isQuickPay) {
        //   window.__loadingModal = viewNodeFunc.openLoadingModal()
        // }
      }
    })
    AfterAllPaymentTypeInStorage(finallyPaymodes, promises, isQuickPay, dispatch, getState)
    return promises
  }
}

/* 新增pos支付方式 */
const AfterAllPaymentTypeInStorage = (paymodes, promises, isQuickPay, dispatch, getState) => {
  const billingViewModel = getBillingViewModel();
  if (!billingViewModel) {
    cb.utils.alert('正在初始化，请稍后重试', 'error');
    return false
  }
  const warpPayFunc = function () {
    return function (type, params = {}) {
      if (type === 'pos')
        return dispatch(reviewChangjiePay(...params))
      if (type === 'network')
        return viewNodeFunc.inputConfirm(...params)
      if (type === 'networkPos')
        return viewNodeFunc.inputConfirm(...params).then(result => {
          return dispatch(reviewChangjiePay(...params, { authcode: result.value }))
        })
    }
  }
  const extendData = { paymodes, promises, isQuickPay, warpPayFunc: warpPayFunc() }
  return billingViewModel.execute('AfterAllPaymentTypeInStorage', extendData)
}

/* 将view层changjiePay重构到redux */
const reviewChangjiePay = (paymode, isQuickPay, type, paramMap = {}) => {
  return function (dispatch, getState) {
    const { product } = getState()
    const money = product.get('money').toJS()
    const receivable = getFixedNumber(money.Gathering.value)
    const { authcode } = paramMap
    // 退款
    if (receivable < 0) {
      // 新的写法不限数组的长度
      if (paymode.originalSamePaymodes) {
        _.set(paymode.originalSamePaymodes, '0.fMoney', Math.abs(paymode.value))
        _.set(paymode.originalSamePaymodes, '0.gatheringvouchPaydetail[0].fAmount', Math.abs(paymode.value))
        return refundorcancelInOrder(paymode.originalSamePaymodes, type)
      } else {
        return new Promise(function (resolve, reject) {
          const options = dealPosData(type, 'backMoney', { paymode });
          refundorcancel(options, type).then(json => {
            if (json.code == 200) {
              resolve()
            } else {
              // cbError(`${paymodes[i].iPaymentid_name}退款失败, 金额为${0 - paymodes[i].fMoney}, ${json.message}`)
              // 原句如上，因eslint发现上面的 paymodes 和 i 均未定义，所以猜测应为 paymode
              cbError(`${paymode.iPaymentid_name}退款失败, 金额为${0 - paymode.fMoney}, ${json.message}`)
              reject(json)
            }
          })
        })
      }
    }

    // 付款
    if (receivable > 0) {
      return new Promise(function (resolve, reject) {
        const options = dealPosData(type, 'receiveMoney', { paymode, authcode });
        usepos(options, type).then(json => {
          if (json.code == 200) {
            if (_.isEmpty(json.data)) { // 赵哲加，pos的问题非让在前端判断
              cbError('pos返回成功，但无返回值！')
              reject(json)
              return
            }
            resolve({
              keyPath: [paymode.paymethodId, 'gatheringvouchPaydetail'],
              value: [json.data]
            })
          } else {
            cbError(`${json.message}`)
            reject(json)
          }
        }, error => {
          reject(error)
        })
      })
    }
    return Promise.resolve()
  }
}

const pseudoBacks = (type) => {
  const billingViewModel = getBillingViewModel();
  if (billingViewModel) {
    return billingViewModel.execute('extendPseuDoBack', type)
  }
}

const refundorcancelfrompos = (i, paymodes, type) => {
  return new Promise(function (resolve, reject) {
    let options = null;
    const isCurrentDay = compareDate()
    if ((type === 'unionPay' || type === 'laochangPay' || type === 'lolPay' || type === 'nohardwarePay' || pseudoBacks(type)) && isCurrentDay) {
      options = dealPosData(type, 'backMoney', { back: true, pseudoBack: true, paymode: paymodes[i] })
    } else {
      options = dealPosData(type, 'backMoney', { back: true, paymode: paymodes[i] })
    }
    refundorcancel(options, type).then(json => {
      if (json.code == 200) {
        resolve({
          keyPath: [paymodes[i].paymethodId, 'gatheringvouchPaydetail'],
          value: [json.data],
          origin: 'pos',
          paymode: paymodes[i].paymethodId,
        })
      } else {
        cbError(`${paymodes[i].iPaymentid_name}退款失败, 金额为${0 - paymodes[i].fMoney}, ${json.message}`)
        reject(new Error())
      }
    })
  })
}

/* pos退款 */
export const refundorcancelInOrder = async (paymodes, type) => {
  for (let j = 0; j < paymodes.length; j++) {
    await refundorcancelfrompos(j, paymodes, type)
  }
}

/* pos支付的数据组织 */
/**
 * @param type: 哪种支付方式
 * @param way: 支付／退款
 * @param extendMap: 需要传递的扩展参数对象
 * @param viewModel: 零售收款viewmodel
 * @returns pos支付需要的参数对象
*/
export const dealPosData = (type, way, extendMap = {}, viewModel) => {
  /* back:退货, authcode: 无硬件所需, pseudoBack: 退货走撤销 */
  const { paymode, back, authcode, pseudoBack } = extendMap;
  let options = {};
  if (!type) { // 畅捷通支付
    if (way === 'receiveMoney') {
      options = {
        balatype: paymode.paymentType,
        balamoney: paymode.value
      }
    }
    if (way === 'backMoney') {
      options = {
        balamoney: back ? 0 - paymode.value : paymode.value,
        orderid: _.get(paymode, 'gatheringvouchPaydetail.0.orderid')
      }
    }
  }
  if (type === 'sandPay') {
    options = {
      CardType: '01',
      TransType: way === 'receiveMoney' ? '30' : '40',
      Money: back ? paymode.fMoney : paymode.value,
      storeCode: cb.rest.AppContext.user.userStores.find(ele => ele.store == cb.rest.AppContext.user.storeId).store_code,
      operatorCode: (cb.rest.AppContext.user || {}).id,
      ReferenceCode: '',
      VoucherCode: '',
      paytype: '11'
    }
    if (way === 'backMoney') {
      if (back) {
        options.ReferenceCode = _.get(paymode, 'gatheringvouchPaydetail.0.cTransactionCode');
        options.VoucherCode = _.get(paymode, 'gatheringvouchPaydetail.0.cVoucherCode');
      } else {
        const { ReferenceCode, VoucherCode } = _.get(paymode, 'gatheringvouchPaydetail.0');
        Object.assign(options, { ReferenceCode, VoucherCode })
      }
    }
  }
  if (type === 'unionPay' || type === 'laochangPay' || type === 'lolPay') {
    options = {
      CardType: (type === 'unionPay') ? '00' : (type === 'laochangPay' ? '01' : '03'),
      TransType: way === 'receiveMoney' ? '00' : ((back && !pseudoBack) ? '02' : '01'),
      Money: back ? paymode.fMoney : paymode.value,
      storeCode: cb.rest.AppContext.user.userStores.find(ele => ele.store == cb.rest.AppContext.user.storeId).store_code,
      operatorCode: (cb.rest.AppContext.user || {}).id,
      ReferenceCode: '',
      VoucherCode: '',
      paytype: (type === 'unionPay') ? '2' : (type === 'laochangPay' ? '12' : '14')
    }
    if (way === 'backMoney') {
      if (back) {
        options.ReferenceCode = _.get(paymode, 'gatheringvouchPaydetail.0.cTransactionCode');
        options.VoucherCode = _.get(paymode, 'gatheringvouchPaydetail.0.cVoucherCode');
        options.TradeDate = _.get(paymode, 'gatheringvouchPaydetail.0.dPayTime');
      } else {
        const { ReferenceCode, VoucherCode } = _.get(paymode, 'gatheringvouchPaydetail.0');
        Object.assign(options, { ReferenceCode, VoucherCode })
      }
    }
  }
  if (type === 'nohardwarePay') {
    options = {
      CardType: '02',
      TransType: way === 'receiveMoney' ? '00' : ((back && !pseudoBack) ? '02' : '01'),
      Money: back ? paymode.fMoney : paymode.value,
      storeCode: cb.rest.AppContext.user.userStores.find(ele => ele.store == cb.rest.AppContext.user.storeId).store_code,
      operatorCode: (cb.rest.AppContext.user || {}).id,
      ReferenceCode: '',
      VoucherCode: '',
      authCode: authcode,
      paytype: '13'
    }
    if (way === 'backMoney') {
      if (back) {
        options.ReferenceCode = _.get(paymode, 'gatheringvouchPaydetail.0.cTransactionCode');
        options.VoucherCode = _.get(paymode, 'gatheringvouchPaydetail.0.cVoucherCode');
        options.TradeDate = _.get(paymode, 'gatheringvouchPaydetail.0.dPayTime');
      } else {
        const { ReferenceCode, VoucherCode } = _.get(paymode, 'gatheringvouchPaydetail.0');
        Object.assign(options, { ReferenceCode, VoucherCode })
      }
    }
  }
  if (_.isEmpty(options)) {
    organizePosParams(type, way, extendMap, options, viewModel)
  }
  return options
}

/* 扩展新增pos支付的所需要的参数 */
const organizePosParams = function (type, way, extendMap, options, viewModel) {
  const billingViewModel = viewModel || getBillingViewModel();
  if (!billingViewModel) {
    cb.utils.alert('正在初始化，请稍后重试', 'error');
    return false
  }
  const extendData = { type, way, extendMap, options }
  billingViewModel.execute('afterOrganizePosParams', extendData)
}

export const canRefundorcancel = (callback) => {
  cb.utils.confirm('确认POS已经为闲置状态？', callback)
}

export const saveAndHandleError = (paymodes) => {
  // let promises = []
  // todo 错误处理 根据状态码回退或者撤销相关支付方式

  // 过滤出在使用的支付方式
  _.forEach(_.filter(paymodes, 'show'), paymode => {
    const paymentType = paymode.paymentType
    if (paymentType == 3 || paymentType == 4) {
      // todo 银联卡

    } else if (paymentType == 6 || paymentType == 7 || paymentType == 8) {
      const p = new Promise(resolve => {
        cb.utils.confirm('支付失败，需撤销畅捷支付。执行线上撤销？', () => {
          resolve(true)
        })
      })
      p.then(result => {
        // 畅捷支付
        refundorcancel({
          balamoney: paymode.value,
          orderid: _.get(paymode, 'gatheringvouchPaydetail.0.orderid')

        }).then(json => {
          if (json.code == 200) {
            cb.utils.alert('POS退款成功')
          } else {
            cb.utils.alert(`${json.message ? `POS退款失败:${json.message}` : 'POS退款失败'}`, 'error')
            saveAndHandleError(paymodes)
          }
        })
      })
    } else if (paymentType == 11) {
      const p = new Promise(resolve => {
        cb.utils.confirm('支付失败，需撤销杉德支付。执行线上撤销？', () => {
          resolve(true)
        })
      })
      p.then(result => {
        // 山德支付
        const options = dealPosData('sandPay', 'backMoney', { paymode })
        // promises.push(refundorcancel(options, 'sandPay'))
        refundorcancel(options, 'sandPay').then(json => {
          if (json.code == 200) {
            cb.utils.alert('POS退款成功')
          } else {
            cb.utils.alert(`${json.message ? `POS退款失败:${json.message}` : 'POS退款失败'}`, 'error')
            saveAndHandleError(paymodes)
          }
        })
      })
    } else if (paymentType == 2 || paymentType == 12) { // 银联卡、老昌卡
      const type = (paymentType == 2) ? 'unionPay' : 'laochangPay';
      const text = (paymentType == 2) ? '银联' : '老昌';
      const p = new Promise(resolve => {
        cb.utils.confirm(`支付失败，需撤销${text}支付。执行线上撤销？`, () => {
          resolve(true)
        })
      })
      p.then(result => {
        const options = dealPosData(type, 'backMoney', { paymode })
        refundorcancel(options, type).then(json => {
          if (json.code == 200) {
            cb.utils.alert('POS退款成功')
          } else {
            cb.utils.alert(`${json.message ? `POS退款失败:${json.message}` : 'POS退款失败'}`, 'error')
            saveAndHandleError(paymodes)
          }
        })
      })
    }
    afterSaveAndHandleError(paymode, paymodes)
  })
}

/* 扩展支付失败时需要的撤销回滚 */
const afterSaveAndHandleError = (paymode, paymodes) => {
  const billingViewModel = getBillingViewModel();
  if (!billingViewModel) {
    cb.utils.alert('正在初始化，请稍后重试', 'error');
    return false
  }
  billingViewModel.execute('afterSaveAndHandleError', { paymode, cancel: dealCancel(paymodes) })
}

const dealCancel = (paymodes) => {
  return (paymode, type, text, extendmap = {}) => {
    const p = new Promise(resolve => {
      cb.utils.confirm(`支付失败，需撤销${text}支付。执行线上撤销？`, () => {
        resolve(true)
      })
    })
    p.then(result => {
      const options = dealPosData(type, 'backMoney', { paymode, ...extendmap })
      refundorcancel(options, type).then(json => {
        if (json.code == 200) {
          cb.utils.alert('POS退款成功')
        } else {
          cb.utils.alert(`${json.message ? `POS退款失败:${json.message}` : 'POS退款失败'}`, 'error')
          // billingViewModel.execute('afterSaveAndHandleError', { paymodes: showPaymodes, cancel: dealCancel(billingViewModel, showPaymodes) })
          saveAndHandleError(paymodes)
        }
      })
    })
  }
}

/* 储值卡支付弹出 */
export const enterStoreCart = (paymode, paymodes) => {
  return (dispatch) => {
    const billingViewModel = getBillingViewModel();
    if (!billingViewModel) {
      cb.utils.alert('正在初始化，请稍后重试', 'error');
      return false
    }
    billingViewModel.execute('storageCardPay', { paymode, paymodes })
  }
}

/* 结算方式卡片点击 */
export const afterPayTabsClick = (key, paymodes, obj, callback) => {
  return (dispatch) => {
    const billingViewModel = getBillingViewModel();
    if (!billingViewModel) {
      cb.utils.alert('正在初始化，请稍后重试', 'error');
      return false
    }
    return billingViewModel.promiseExecute('afterPayTabsClick', { key, paymodes, obj }, callback)
  }
}

/* 结算方式卡片删除前事件 */
const beforeDeletePaymode = (obj, data) => {
  const billingViewModel = getBillingViewModel();
  if (!billingViewModel) {
    cb.utils.alert('正在初始化，请稍后重试', 'error');
    return false
  }
  billingViewModel.execute('beforeDeletePaymode', { obj, paymode: data })
}

export function canOfflineSettle (arr, finallyPaymodes) {
  const billingViewModel = getBillingViewModel();
  if (!billingViewModel) {
    cb.utils.alert('正在初始化，请稍后重试', 'error');
    return false
  }
  billingViewModel.execute('canOfflineSettle', { arr, finallyPaymodes })
}

export function extendSettleViewControl () {
  const billingViewModel = getBillingViewModel();
  if (!billingViewModel) {
    // cb.utils.alert('正在初始化，请稍后重试', 'error');
    return {}
  }
  const showInfos = {}
  if (billingViewModel.getParams && billingViewModel.getParams().cCardRechargeStates === '退货充值')
    showInfos.BackDiscount = true
  return showInfos
}

const beforePayModalClose = () => {
  const billingViewModel = getBillingViewModel();
  if (!billingViewModel) {
    cb.utils.alert('正在初始化，请稍后重试', 'error');
    return false
  }
  return billingViewModel.execute('beforePayModalClose', {})
}

export function extendIsShowLastBill (isMounted) {
  if (!isMounted) return true
  const billingViewModel = getBillingViewModel();
  if (billingViewModel)
    return billingViewModel.execute('extendIsShowLastBill', {})
  else
    return true
}

export function extendIsShowPresellPercent (isMounted, iOwesState, billingStatus) {
  if (!isMounted) return false
  const billingViewModel = getBillingViewModel();
  if (billingViewModel)
    return billingViewModel.execute('extendIsShowPresellPercent', {iOwesState, billingStatus})
  else
    return false
}

export function beforeShortCutSetlle (lineConnection, item) {
  const billingViewModel = getBillingViewModel();
  if (!billingViewModel) {
    cb.utils.alert('正在初始化，请稍后重试', 'error');
    return false
  }
  return billingViewModel.execute('beforeShortCutSetlle', {lineConnection, item})
}

const clearAfterPayModalClose = () => {
  const billingViewModel = getBillingViewModel();
  if (!billingViewModel || !billingViewModel.payListModel) {
    cb.utils.alert('正在初始化，请稍后重试', 'error');
    return false
  }
  return billingViewModel.payListModel.execute('clearAfterPayModalClose', {})
}

/**
 * @param result 抹零运算后的值（mobile暂时为应收）
 * 取自defaultSettle, for mobile
*/
export function finalUpdateBeforeSettle () {
  return function (dispatch, getState) {
    const currentState = getState();
    const result = currentState.product.getIn(['money', 'Gathering', 'value'])
    const uretailHeader = currentState.uretailHeader.toJS()
    const billingStatus = uretailHeader.billingStatus
    /* const { iOwesState = 0 } = uretailHeader.infoData */
    const iOwesState = 0

    if (billingStatus === 'PresellBack' || billingStatus === 'FormerBackBill') {
      if (result >= 0) {
        dispatch(genAction('PLATFORM_UI_BILLING_MOBILE_SET_DEFAULT_PAYMODAL', {
          // 可赊销时默认结算设置代入金额为0
          value: iOwesState == 1 ? 0 : result
        }))
      } else {
        const paymodes = currentState.paymode.toJS().billPaymodes
        const inUse = []
        // 只使用一种支付方式时更新为实时金额
        _.forEach(paymodes, (pay, paymethodId) => {
          if (pay.show && Number(pay.value) !== 0) {
            inUse.push(paymethodId)
          }
        })
        if (inUse.length === 1) {
          paymodes[inUse[0]].value = result
        }

        dispatch(genAction('PLATFORM_UI_BILLING_LOAD_PAYDATA', {
          visible: true,
          paymodes: Immutable.fromJS(paymodes),
          currentFocus: inUse[0] + ''
        }))
      }
    }
    /* if (billingStatus === 'OnlineBackBill') {
      dispatch(save(data => {
        cb.utils.alert('电商结算成功')
      }, result => {
        cb.utils.alert('电商结算失败')
      }))
    } */
  }
}

/* mobile 退货是否更改支付方式 */
export function updatePaymodesDuetoBack () {
  return function (dispatch, getState) {
    const allState = getState()
    const result = allState.product.getIn(['money', 'Gathering', 'value'])
    if (result >= 0) return /* 应收大于0不走退货 */
    const currentPayment = allState.paymode.get('currentPayment')
    let paymodes = allState.paymode.get('paymodes')
    if (Immutable.Map.isMap(paymodes)) paymodes = paymodes.toJS();
    for (const attr in paymodes) {
      if (paymodes[attr].originValue !== undefined && paymodes[attr].show) {
        if (attr != currentPayment) {
          dispatch(genAction('PLATFORM_UI_BILLING_MOBILE_RESET_PAYMODES'))
          break
        }
      }
    }
  }
}

export function compareDate () {
  const __backBillDate = getCommonParams('__backBillDate');
  if (!__backBillDate) return false
  const currentDate = Format(new Date())
  const backBillDate = __backBillDate.split(' ')[0]
  if (backBillDate && backBillDate === currentDate) return true
  return false
}

export function getPaymodeConstant (type) {
  const obj = {
    isDefaultSettleing: isDefaultSettleing
  }
  return obj[type]
}
