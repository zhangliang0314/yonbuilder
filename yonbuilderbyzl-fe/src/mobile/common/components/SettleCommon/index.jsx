// 开单结算:    抽离pc端和触屏版view层公用方法

import _ from 'lodash'
// import React, { Component } from 'react'
import {
  ConfigOptions,
  getFixedNumber
} from 'src/common/redux/modules/billing/paymode'

export const cbError = (title) => {
  cb.utils.alert({
    title,
    type: 'error'
  })
}
export const paymentIconDict = {
  1: 'xianjin',
  2: 'yinhangqia',
  3: 'zhifubao',
  4: 'weixin',
  5: 'chuzhiqia',
  6: 'changjiezhifu',
  7: 'changjiezhifu',
  8: 'changjiezhifu',
  10: 'shouqianba',
  11: 'shandezhifu'
}

// 纯函数方法

// 判断某种支付方式是否在使用
/*
* @{Object} 支付信息组
* @{String|Number} 支付类型
* return {Boolean}
* */
export function isPaymentTypeInUse (paymodes, paymentType) {
  return _.some(paymodes, pay => {
    return pay.paymentType == paymentType && pay.show && pay.value != 0
  })
}

// 获取在使用的结算方式
/*
* @{Object} 支付信息组
* return {Array}
* */
export function getPaymentTypeInUse (paymodes) {
  return _.filter(paymodes, pay => {
    return pay.show && pay.value != 0
  })
}

/* ---------------------我是华丽丽的分割线------------------------------------ */

// 以下方法使用时需要绑定view层组件的this

//  uretailHeader, receivable, receipts, paymode.paymodes

// 可赊销上限校验
function isUnderCredit (realname, receipts, receivable, isControlCredit, canCreditAmount, iCustomerid, bCusCreCtl, creditBalance, iCustomerName) {
  // 会员档案“控制信用”为是
  if (isControlCredit == 1) {
    if (Number(canCreditAmount) + Number(receipts) - Number(receivable) < 0) {
      cbError(`${realname}可用余额${canCreditAmount}，本单应收金额${receivable}，余额不足。`)
      return false
    }
  }

  // 表头客户非空，且客户档案“控制信用”为是
  if (iCustomerid !== '' && bCusCreCtl == 1) {
    if (Number(creditBalance) + Number(receivable) - Number(receipts) < 0) {
      cbError(`${iCustomerName}可用余额${creditBalance}，本单应收金额${receivable}，余额不足。`)
      return false
    }
  }

  return true
}

export async function validateSettle () {
  // 结算最终校验
  let { billingStatus, MinPercentGiveMoneyPre, controlType, infoData: { iOwesState = 0, isControlCredit = 0, canCreditAmount = 0, bCusCreCtl = 0, creditBalance = 0, iCustomerid = '', iCustomerName } } = this.props.uretailHeader
  const { paymodes, currentPayment } = this.props.paymode
  const realname = this.props.realname

  // 电商订单 不允许使用储值卡
  if (billingStatus === 'OnlineBill') {
    if (isPaymentTypeInUse(paymodes, 5)) {
      cbError('电商订单不允许使用会员储值')
      return false
    }

    if (getPaymentTypeInUse(paymodes).length > 1) {
      cbError('电商订单不允许使用多种支付方式')
      return false
    }
    // 电商订单会返MinPercentGiveMoneyPre为0， 这里手动改为100
    MinPercentGiveMoneyPre = 100
  }

  if (iOwesState == 1) {
    // 可以赊销的订单手动改MinPercentGiveMoneyPre为0
    MinPercentGiveMoneyPre = 0
  }

  // 获取可找零金额
  let maxzerolim = _.get(ConfigOptions, 'maxzerolim.value')
  if (isNaN(maxzerolim)) {
    cbError('未设置最大可找零金额')
    return false
  } else {
    maxzerolim = getFixedNumber(maxzerolim)
  }

  // 应收金额大于零
  if (this.receivable >= 0) {
    if (!isUnderCredit(realname, this.receipts, this.receivable, isControlCredit, canCreditAmount, iCustomerid, bCusCreCtl, creditBalance, iCustomerName)) {
      return false
    }

    // 现金有在使用时校验找零状态
    if (this.isCashUse()) {
      if (this.receipts - this.receivable > maxzerolim) {
        cbError('找零金额超出限制，最大找零为' + maxzerolim)
        return false
      }
      if (getFixedNumber(this.receipts - _.multiply(this.receivable, MinPercentGiveMoneyPre) * 0.01) >= 0) {
        return true
      }
    }

    // 预订状态
    if (billingStatus === 'PresellBill') {
      let lowLimitPre = getFixedNumber(_.multiply(this.receivable, MinPercentGiveMoneyPre) * 0.01)
      if (cb.rest.terminalType == 3) {
        MinPercentGiveMoneyPre = this.props.reserve.MinPercentGiveMoneyPre;
        lowLimitPre = getFixedNumber(_.multiply(this.receivable, MinPercentGiveMoneyPre) * 0.01)
        if (getFixedNumber(this.deposit - lowLimitPre) < 0) {
          cbError(`预订交款不得低于${lowLimitPre}, 比例不得低于${MinPercentGiveMoneyPre}%`)
          return false
        }
      } else {
        if (getFixedNumber(this.receipts - lowLimitPre) < 0) {
          if (controlType == 1) {
            cbError(`预订交款不得低于${lowLimitPre}, 比例不得低于${MinPercentGiveMoneyPre}%`)
            return false
          } else {
            return checkMPGMP(MinPercentGiveMoneyPre);
          }
        }
      }
      // 无现金支付时小于等于限制
      if (Number(this.receipts) > Number(this.receivable)) {
        cbError('无现金支付时实收大于应收，无法结算')
        return false
      }
      return true
    }
  } else {
    // 应收金额小于零
    if (cb.rest.terminalType == 3) {
      if ([1, 5, 9].indexOf(Number(paymodes[currentPayment].paymentType)) < 0) {
        if (typeof paymodes[currentPayment].originValue === 'undefined' && Number(paymodes[currentPayment].value) !== 0) {
          cbError(`退款时不能使用${paymodes[currentPayment].name}`)
          return false
        }
        if (typeof paymodes[currentPayment].originValue !== 'undefined' && paymodes[currentPayment].originValue != paymodes[currentPayment].value) {
          cbError(`${paymodes[currentPayment].name}退款金额不等于原单该支付方式的金额`)
          return false
        }
        let len = 0;
        for (var key in paymodes) {
          if (paymodes[key].originValue) len += 1;
        }
        if (len > 1) {
          cbError('暂不支持混合结算方式退货~')
          return false
        }
      }
    } else {
      // 除了(1，5，9)退款方式的金额是否相等
      for (const i in paymodes) {
        if ([1, 5, 9].indexOf(Number(paymodes[i].paymentType)) < 0 && paymodes[i].show) {
          if (typeof paymodes[i].originValue === 'undefined' && Number(paymodes[i].value) !== 0) {
            cbError(`退款时不能使用${paymodes[i].name}`)
            return false
          }

          if (typeof paymodes[i].originValue !== 'undefined' && paymodes[i].originValue != paymodes[i].value) {
            cbError(`${paymodes[i].name}退款金额不等于原单该支付方式的金额`)
            return false
          }
        }
      }
    }
  }

  // 退订状态忽略赊销标识
  if (billingStatus === 'PresellBack') {
    iOwesState = 0
  }

  if (iOwesState == 0 && (this.receivable != this.receipts)) {
    if (cb.rest.terminalType != 3) {
      cbError('应收不等于实收，无法结算')
      return false
    }
  }
  /* 没有结算方式，不允许结算 王久龄 */
  /* 移动端 不判断 */
  if (cb.rest.terminalType != 3) {
    const currentPays = [];
    for (const attr in paymodes) {
      if (paymodes[attr].show) currentPays.push(attr)
    }
    if (currentPays.length == 0) {
      cbError('至少选择一种结算方式')
      return false
    }
  }
  return true
}
function checkMPGMP (MinPercentGiveMoneyPre) {
  return new Promise(function (resolve) {
    cb.utils.confirm(`预订交款比例低于${MinPercentGiveMoneyPre}%, 确认结算？`, () => {
      resolve(true)
    }, () => {
      resolve(false)
    });
  });
}
