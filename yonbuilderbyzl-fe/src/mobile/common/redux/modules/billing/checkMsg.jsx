import Immutable from 'immutable';
import { genAction, proxy } from '@mdf/cube/lib/helpers/util';
import { getRetailVoucherData } from './mix';
import { getGlobalProducts } from './product';
import { getBillingViewModel } from './config';
// import _ from 'lodash';
const $$initialState = Immutable.fromJS({
  showDiscountMsgCheck: false, /* 是否显示折扣验证码发送及验证弹窗 */
  needCheckInfo: {},
  needCheckInfo_flp: {}, /* 价格审批信息 */
  mKey: null,
  approvalKey: null, /* 移动审批 key */
  mobileMessageId: null, /* 移动审批  id */
  waiting: false,
  second: 60,
  alreadySend: false,
  msgType: 1, /* 发送短信验证的类型  1 价格审批验证 现场折扣/最低售价  */
  phoneField: 'mphone', /* 发送短信的手机号字段   mphone价格审批人手机号  */
  bDiscountAppr: false, /* 是否现场折扣移动审批 */

})
// reducer
export default ($$state = $$initialState, action) => {
  switch (action.type) {
    case 'PLATFORM_UI_BILLING_CHECKMSG_SET_COMMONDATA':
      return $$state.merge(action.payload);
    case 'PLATFORM_UI_BILLING_CHECKMSG_CLEAR':
    case 'PLATFORM_UI_BILLING_CLEAR':
      return $$state.merge({
        showDiscountMsgCheck: false, needCheckInfo: {}, mKey: null, waiting: false,
        second: 60, alreadySend: false, bDiscountAppr: false
      });
    default:
      return $$state;
  }
}
export function setData (val) {
  return function (dispatch) {
    dispatch(genAction('PLATFORM_UI_BILLING_CHECKMSG_SET_COMMONDATA', val));
  }
}
export function cancelClear () {
  return function (dispatch) {
    dispatch(genAction('PLATFORM_UI_BILLING_CHECKMSG_CLEAR'));
  }
}
export function checkDiscountOperator (getState, dispatch, payType) {
  return new Promise(function (resolve) {
    if (!beforeCheckDiscountOperator()) {
      resolve(false)
      return;
    }
    const products = getGlobalProducts();
    let { needCheckInfo, showDiscountMsgCheck } = getState.checkMsg ? getState.checkMsg : getState().checkMsg.toJS();
    /* 校验现场折扣 */
    products.map((product, rowIndex) => {
      const { mphone, apprStatus, key, iSupperOperatorid, iSupperOperatorid_name } = product;
      if (mphone) {
        if (apprStatus != 2) showDiscountMsgCheck = true;
        if (needCheckInfo[mphone] && needCheckInfo[mphone].apprStatus != 2) { /* 已存在 */
          needCheckInfo[mphone].apprStatus = apprStatus;
        } else {
          for (var phone in needCheckInfo) {
            if (needCheckInfo[phone].rowKey == key && phone != mphone)
              delete needCheckInfo[phone]
          }
          needCheckInfo[mphone] = {
            iSupperOperatorid: iSupperOperatorid,
            iSupperOperatorid_name: iSupperOperatorid_name,
            apprStatus: apprStatus,
            mphone: mphone, checkCode: '', info: '', infoType: '', rowKey: key
          }
        }
      }
    });
    if (showDiscountMsgCheck) {
      dispatch(genAction('PLATFORM_UI_BILLING_CHECKMSG_SET_COMMONDATA', { showDiscountMsgCheck, needCheckInfo }))
    }
    resolve(!showDiscountMsgCheck);
  });
}

export function sendMsg (callback) {
  return function (dispatch, getState) {
    const { msgType, phoneField } = getState().checkMsg.toJS();
    dispatch(genAction('PLATFORM_UI_BILLING_CHECKMSG_SET_COMMONDATA', { alreadySend: true }))

    const retail = getRetailVoucherData(getState());
    let url = '';
    if (window.location.origin == 'http://localhost:3003')
      url = 'http://10.10.13.131:3003/discount';
    else
      url = window.location.origin + '/discount';
    const config = {
      url: '/thirdparty/member/localediscountmessage',
      method: 'POST',
      params: {
        data: JSON.stringify(retail),
        discountdata: { url: url, msgType: msgType, phoneField: phoneField },
      }
    };
    proxy(config)
      .then(function (json) {
        if (json.code !== 200) {
          cb.utils.alert(json.message, 'error');
          dispatch(genAction('PLATFORM_UI_BILLING_CHECKMSG_SET_COMMONDATA', { alreadySend: false }))
          return
        }
        const data = JSON.parse(json.data);
        const { needCheckInfo } = getState().checkMsg.toJS();
        for (var key in needCheckInfo) {
          needCheckInfo[key].info = '验证码发送成功';
          needCheckInfo[key].infoType = 'success';
        }
        dispatch(genAction('PLATFORM_UI_BILLING_CHECKMSG_SET_COMMONDATA', {
          needCheckInfo, mKey: data.mkey, waiting: true, alreadySend: true
        }))
        if (callback) callback();
      });
  }
}
export function checkMsCode () {
  return function (dispatch, getState) {
    const { needCheckInfo, mKey, msgType, phoneField } = getState().checkMsg.toJS();
    const retail = getRetailVoucherData(getState());
    const message = [];
    for (var key in needCheckInfo) {
      message.push({ phone: key, code: needCheckInfo[key].checkCode })
    }
    const config = {
      url: '/thirdparty/member/sendcodecheck',
      method: 'POST',
      params: {
        key: mKey,
        message: JSON.stringify(message),
        data: JSON.stringify(retail),
        msgType: msgType
      }
    };
    proxy(config)
      .then(function (json) {
        if (json.code !== 200) {
          cb.utils.alert(json.message, 'error');
          return
        }
        const data = JSON.parse(json.data);
        let allowClose = true;
        const retailVouchDetails = data.retailVouchDetails;
        retailVouchDetails.map(detail => {
          if (detail.iSupperOperatorid) {
            if (detail.apprStatus == 2) {
              if (needCheckInfo[detail[phoneField]]) {
                needCheckInfo[detail[phoneField]].info = '验证成功';
                needCheckInfo[detail[phoneField]].infoType = 'success';
              }
            } else {
              if (detail[phoneField]) {
                if (needCheckInfo[detail[phoneField]]) {
                  needCheckInfo[detail[phoneField]].info = '验证码错误';
                  needCheckInfo[detail[phoneField]].infoType = 'error';
                  allowClose = false;
                }
              }
            }
          }
        })
        if (allowClose) {
          dispatch(genAction('PLATFORM_UI_BILLING_CHECKMSG_SET_COMMONDATA', {
            showDiscountMsgCheck: false, needCheckInfo: {}, msgType: 1, phoneField: 'mphone'
          }))
          dispatch(genAction('PLATFORM_UI_BILLING_DISCOUNT_UPDATE_PRODUCTS', retailVouchDetails));
        } else {
          dispatch(genAction('PLATFORM_UI_BILLING_CHECKMSG_SET_COMMONDATA', {
            needCheckInfo
          }))
        }
      });
  }
}
const beforeCheckDiscountOperator = () => {
  const billingViewModel = getBillingViewModel()
  if (!billingViewModel) {
    cb.utils.alert('正在初始化，请稍后重试', 'error');
    return false
  }
  return billingViewModel.execute('beforeCheckDiscountOperator')
}
