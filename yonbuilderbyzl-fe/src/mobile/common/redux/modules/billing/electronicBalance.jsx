import Immutable from 'immutable'
import {genAction, getMultiplication} from '@mdf/cube/lib/helpers/util'
import { formatNum } from './mix'
import {checkBeforeOpenQuantity} from './quote'
import {getFixedNumber} from './paymode'
import { calcPromotionDiscount } from './product'
import _ from 'lodash'
import addEventListener from 'add-dom-event-listener'

// 字符串'false'或者'true'转换为Boolean类型
// @param {String}
// return {Boolean }

function convertStringToBoolean (str) {
  switch (_.trim(str)) {
    case 'false':
      return false
    case 'true':
      return true
  }
}

// 电子秤参数
export const operationConfig = {
  keepWeigh: false, // 持续称重模式
  showTare: true, // 显示去皮按钮
  // info 开发使用true， 调试完使用false
  /* ！！！开发调试完成之后，一定不要把此参数提交 */
  bMatch: false // 是否已经适配电子秤, 默认是false，
}

let transparentMask

// 初始化
export const initElectronEvent = function (dispatch) {
  if (window) { // && window.Electron    update:yangleih  19.05.24 适配商米电子秤
    // 存取电子秤配置信息  update:yangleih  19.05.24   window.Electron(windows)  window.AElectron(android)
    let scaleConfig = null;
    if(window.Electron) {
      scaleConfig = cb.electron.getSharedObject('scaleConfig');
      if (!scaleConfig) {
        scaleConfig = cb.electron.getSharedObject();
      }
    }else if(window.AElectron) {
      scaleConfig = cb.electron.getAndroidObject() === '{}' ? null : cb.electron.getAndroidObject();
      if(!scaleConfig) {
        scaleConfig = {bContinuedDataRead: false, bPeelingButton: true, bMatch: true}; // 设置默认方案
      }
      scaleConfig = {configurations: [scaleConfig]};
    }
    const remoteConfig = _.get(scaleConfig, 'configurations.0')
    if (!remoteConfig) {
      return
    }
    // 更新配置
    operationConfig.keepWeigh = convertStringToBoolean(remoteConfig.bContinuedDataRead)
    operationConfig.showTare = convertStringToBoolean(remoteConfig.bPeelingButton)
    operationConfig.bMatch = convertStringToBoolean(remoteConfig.bMatch)

    // 注册渲染线程通信事件  update:yangleih  19.05.24
    let ipcRenderer = null
    if(window.Electron) {
      ipcRenderer = Electron.ipcRenderer
    }
    const electronicBalanceOnChange = function (event, arg) {
      console.log('取重:')
      console.log(arg)
      const dataSource = JSON.parse(arg);
      const weigh = dataSource.underOverFlowFg == 1 ? 'UF' : dataSource.weight;
      const tare = dataSource.tare;
      // if (!isNaN(weigh) && weigh<0) /* 去皮 负数不写入商品行 孙俪*/
      //  return
      const isStable = dataSource.stabilizeFg /* 称是否已经稳重 */
      dispatch(electronicBalanceChange({tare, weigh, isStable}))
    }

    // 向electronModel写入是否持续称重
    // let electronModel = getState()['electronicBalance'].get('electronModel');
    // if(electronModel){
    //   electronModel.setState('keepWeigh',operationConfig.keepWeigh);
    // }

    if (operationConfig.bMatch) {
      let removed = false
      // 打开电子秤
      if(window.Electron) {
        cb.electron.sendOrder('open')
      }else if(window.AElectron) {
        window.plus.JavaToJs.HardwareInterface('electron', 'open');
      }

      // 订阅服务端推送   update:yangleih  19.05.24
      if(ipcRenderer) {
        ipcRenderer.addListener('electronicBalance-change', electronicBalanceOnChange)
      }else if(window.AElectron) {
        // android适配电子秤
        cb.events.un('electronicBalance-change');
        cb.events.on('electronicBalance-change', electronicBalanceOnChange)
      }

      // 连续称重模式下初始化遮罩组件
      if (operationConfig.keepWeigh) {
        transparentMask = new TransparentMask('touch_touchContent_focused-cell', () => {
          dispatch(reWeigh())
          dispatch(genAction('PLATFORM_UI_BILLING_ELECTRONIC_BALANCE_UPDATEKEY', null))
        })
      }

      const remove = function () {
        if (!removed) {
          if(ipcRenderer) {
            ipcRenderer.removeListener('electronicBalance-change', electronicBalanceOnChange)
          }else{
            cb.events.un('electronicBalance-change');
            // android适配电子秤
          }
          // 卸载遮罩组件的绑定事件
          transparentMask && transparentMask.destroy()
          // 关闭电子秤

          if(window.Electron) {
            cb.electron.sendOrder('close')
          }else if(window.AElectron) {
            window.plus.JavaToJs.HardwareInterface('electron', 'close');
          }
          removed = true
        }
      }
      // 页面不走router渲染时 注册unload事件
      window.onbeforeunload = remove

      return {
        remove
      }
    }

    return false
  }
}

const $$initialState = Immutable.fromJS({
  tare: '0.000', // 皮重
  weigh: '0.000', // 重量
  focusedProductUid: null,
  tareVisible: false, // 二次去皮modal
  electronModel: null, // 存放电子秤对应的model
})

// reducer
export default ($$state = $$initialState, action) => {
  switch (action.type) {
    case 'PLATFORM_UI_BILLING_ELECTRONIC_SET_COMMON':
    case 'PLATFORM_UI_BILLING_ELECTRONIC_BALANCE_CHANGE':
      if (action.payload.tareVisible) {
        window._panelInstanceList && window._panelInstanceList.forEach(panel => {
          if (panel.instanceName && panel.instance)
            panel.instance.state.visible && panel.instance.showOff()
        })
      }
      return $$state.merge(action.payload)
    case 'PLATFORM_UI_BILLING_ELECTRONIC_BALANCE_UPDATEKEY':
      return $$state.set('focusedProductUid', action.payload)
    default:
      return $$state
  }
}

const invalidWeigh = (currentState) => {
  const electronicBalanceState = currentState.electronicBalance;
  const isStable = electronicBalanceState.get('isStable')
  const weigh = isStable ? electronicBalanceState.get('weigh') : '-1'
  if (weigh < 0) {
    cb.utils.alert('重量不合法！', 'error');
    return false
  }
  return true
}

// 重称: reWeigh
export function reWeigh (bCheck) {
  return (dispatch, getState) => {
    const currentState = getState()
    // 当前有focus行并且为可称重商品
    const focusedRow = currentState.product.get('focusedRow')
    const electronModel = currentState.electronicBalance.get('electronModel');
    /** *当缓存在redux中的electronModel不为空时，则进行赋值 ***/
    if(electronModel) {
      electronModel.setValue(getInputWeigh(currentState), true);
      electronModel.execute('reweigh', getInputWeigh(currentState));
      return;
    }
    if (_.isNull(focusedRow)) return
    if(!invalidWeigh(currentState)) return
    const weigh = getInputWeigh(currentState)
    /* lz todo 连续称重模式第二次确认商品的时候，重量变成不合法或小于0 提示return */
    if (getFromMapOrObject(focusedRow, 'enableWeight')) {
      dispatch(checkBeforeOpenQuantity('Quantity', weigh, bCheck))
    }
  }
}

// 写入商品行
export function addEnableWeightProduct (product) {
  return (dispatch, getState) => {
    if (product.enableWeight) {
      const currentState = getState()
      const $$electronicBalance = currentState.electronicBalance
      if (typeof $$electronicBalance === 'undefined') {
        // cb.utils.alert('PC端暂不开放电子秤')
        return product
      }
      if (!operationConfig.bMatch) {
        cb.utils.alert('本地未适配电子秤')
        return product
      }

      if (operationConfig.keepWeigh) {
        transparentMask.show()
        // dispatch(genAction('PLATFORM_UI_BILLING_ELECTRONIC_BALANCE_UPDATEKEY', `${product.key.replace(/_\d+/, '')}`))
        // dispatch(genAction('PLATFORM_UI_BILLING_ELECTRONIC_BALANCE_UPDATEKEY', product.product + '|' + product.productsku))
        product.fQuantity = 0
        product.fQuoteMoney = 0
        product.fMoney = 0
        return product
      } else {
        product.fQuantity = getInputWeigh(currentState)
        product.fQuoteMoney = formatNum('money', getMultiplication(product.fQuantity, product.fQuotePrice, 'Multiplication'));
        product.fMoney = formatNum('money', getMultiplication(product.fQuantity, product.fPrice, 'Multiplication'));
        calcPromotionDiscount(product, product.fQuantity)
        return product
      }
    }
  }
}

export function electronicBalanceChange ({tare, weigh, isStable} = {}) {
  return (dispatch, getState) => {
    // 页面示数区展现
    dispatch(genAction('PLATFORM_UI_BILLING_ELECTRONIC_BALANCE_CHANGE', {
      tare: getFixedNumber(tare, 'quantitydecimal'),
      weigh: isNaN(weigh) ? weigh : getFixedNumber(weigh, 'quantitydecimal'),
      isStable
    }))

    // 前端页面处理逻辑

    const currentState = getState()

    const electronModel = currentState.electronicBalance.get('electronModel');
    /** *当缓存在redux中的electronModel不为空时，则进行赋值 ***/
    if (!operationConfig.keepWeigh) {
      if(electronModel && isStable ) {
        const weigh = currentState.electronicBalance.get('weigh')
        if (!isNaN(weigh) && weigh < 0) return
        electronModel.setValue(getInputWeigh(currentState), true);
        return;
      }
    }
    // 当前有focus行并且为可称重商品
    const focusedRow = currentState.product.get('focusedRow')
    if (_.isNull(focusedRow)) return

    if (getFromMapOrObject(focusedRow, 'enableWeight')) {
      if (operationConfig.keepWeigh) {
        // 可连续称重模式下 写入

        //  dispatch(checkBeforeOpenQuantity('Quantity', getInputWeigh(currentState)))
      } else {
        // 非可连续称重模式下为零状态写入
        if (getFromMapOrObject(focusedRow, 'fQuantity') == 0 && isStable) {
          const weigh = currentState.electronicBalance.get('weigh')

          if (!isNaN(weigh) && weigh < 0) return
          dispatch(checkBeforeOpenQuantity('Quantity', getInputWeigh(currentState)))
          // // 600ms内只执行一次
          // if (window._billing_writeWeigh) {
          //   clearTimeout(window._billing_writeWeigh)
          // }
          // window._billing_writeWeigh = setTimeout(() => {
          //   window._billing_writeWeigh = null
          //   let weigh = currentState['electronicBalance'].get('weigh')
          //   if (!isNaN(weigh) && weigh<0) return
          //   dispatch(checkBeforeOpenQuantity('Quantity', getInputWeigh(currentState)))
          // }, 600)
        }
      }
    }
  }
}

// 获取实际写入到商品行的重量
// 根据订单状态决定正负
function getInputWeigh (currentState) {
  const isStable = currentState.electronicBalance.get('isStable')
  const weigh = isStable ? currentState.electronicBalance.get('weigh') : '0'
  const billingStatus = currentState.uretailHeader.get('billingStatus')
  const backBill_checked = currentState.product.get('backBill_checked')
  switch (billingStatus) {
    // case "PresellBack":/*退订*/
    // case "FormerBackBill":/*原单退货*/
    // case "OnlineBackBill":/*电商退货*/
    //   return Number(getFixedNumber(0 - weigh, 'quantitydecimal'))
    case 'NoFormerBackBill':/* 非原单退货 */
      if (backBill_checked) {
        return Number(getFixedNumber(0 - weigh, 'quantitydecimal'))
      }
    default:
      return Number(getFixedNumber(weigh, 'quantitydecimal'))
  }
}

export function getFromMapOrObject (source, name) {
  if (source['@@__IMMUTABLE_MAP__@@']) {
    // if (Immutable.isImmutable(source)) {
    return source.get(name)
  }
  return source[name]
}

// 连续称重模式下的遮罩

class TransparentMask {
  constructor (focusedElementClassName, onHide) {
    this.focusedElementClassName = focusedElementClassName
    // 初始化响应区域

    this.onHide = onHide
    this.createMask()
  }

  createMask = () => {
    this.mask = document.getElementById('billing-TransparentMask')
    if (!this.mask) {
      this.mask = document.createElement('div')
      this.mask.setAttribute('id', 'billing-TransparentMask')
      document.body.appendChild(this.mask)
    }
    this.handler = addEventListener(this.mask, 'click', this.maskOnClick)
  }

  show = () => {
    this.mask.classList.add('show')
  }

  hide = () => {
    this.mask.classList.remove('show')
    if (typeof this.onHide === 'function') {
      this.onHide()
    }
  }

  destroy = () => {
    this.handler && this.handler.remove()
  }

  // 计算当前选中商品的可视坐标范围
  calculateRect = () => {
    let rect = {
      clientX: [0, 0],
      clientY: [0, 0]
    }
    const focusedElementCollect = document.getElementsByClassName(this.focusedElementClassName)
    const focusedElement = focusedElementCollect && focusedElementCollect[0]
    if (focusedElement) {
      const focusedRect = focusedElement.getBoundingClientRect()
      rect = {
        clientX: [focusedRect.left, focusedRect.left + focusedRect.width],
        clientY: [focusedRect.top, focusedRect.top + focusedRect.height],
      }

      return rect
    }
  }

  maskOnClick = (e) => {
    const rect = this.calculateRect()
    if (_.every(rect, (range, coordinateName) => {
      return e[coordinateName] > range[0] && e[coordinateName] < range[1]
    })) {
      this.hide()
    } else {
      cb.utils.alert('请先确认称重商品', 'error')
    }
  }
}

export function setCommon (obj) {
  return function (dispatch) {
    dispatch(genAction('PLATFORM_UI_BILLING_ELECTRONIC_SET_COMMON', obj))
  }
}

export function transformWeight (value, type) {
  if (isNaN(parseFloat(value))) return
  if (type === 'Kg') {
    return (value * 1000).toString()
  }
  if (type === 'g') {
    const transValue = getFixedNumber(value / 1000, 'quantitydecimal');
    return transValue
  }
}
