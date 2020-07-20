import Immutable from 'immutable';
import { genAction, proxy } from '@mdf/cube/lib/helpers/util';
// import _ from 'lodash'
import { OpenCashDrawer, opencashdrawnocheck } from './localNode';
import { updateSuperOperator, clearMsgInfo } from './discount';
// import { getGlobalProducts } from './product';

// let cacheDiscoutKey = null;
const $$initialState = Immutable.fromJS({
  visible: false,
  userCode: '', /* 操作员 */
  password: '', /* 密码 */
  checkCode: '', /* 验证码 */
  bMsgCheck: false, /* 是否短信验证模式 */
  title: '权限验证',
  hasTitle: true,
  user: {},
  authType: 'opencashbox',
  errInfo: '', /* 错误信息 */
  activeKey: '0', /* 激活的页签 0密码  1验证码 2移动审批 */
  waiting: false,
  second: 60,
  Operator_DataSource: [], /* 操作员数据源 */
  bUser: false, /* 是否选择营业员账号 */
})
// reducer
export default ($$state = $$initialState, action) => {
  switch (action.type) {
    /* modal显示/隐藏 */
    case 'PLATFORM_UI_BILLING_OPERATOR_SET_VISIBLE':
      return $$state.set('visible', action.payload);
    case 'PLATFORM_UI_BILLING_OPERATOR_SET_COMMON_DATA':
      return $$state.merge(action.payload);
    default:
      return $$state;
  }
}
/* 打开切换操作员 params为现场折扣参数 */
export function showOperator (hasTitle, bMsgCheck, authType, authCode, callback, params, sendMsgCallBack, noMsg, failCallback) {
  return function (dispatch, getState) {
    const data = { visible: true, hasTitle: hasTitle, authType: authType, authCode: authCode };
    if (bMsgCheck) data.bMsgCheck = bMsgCheck;
    if (callback) data.callback = callback;
    if (failCallback) data.failCallback = failCallback;
    if (sendMsgCallBack) data.sendMsgCallBack = sendMsgCallBack;
    if (noMsg) data.noMsg = noMsg;
    dispatch(genAction('PLATFORM_UI_BILLING_OPERATOR_SET_COMMON_DATA', data));
    dispatch(getOperatorDataSource(params));
  }
}
/* 操作员数据源 */
export function getOperatorDataSource (params) {
  return function (dispatch, getState) {
    const storeId = getState().user.toJS().storeId;
    const { authCode, authType } = getState().operator.toJS();
    const config = {
      url: 'user/getUserListByAuthid',
      method: 'POST',
      params: { storeid: storeId, authid: authCode, bhaveself: false, bhaveadmin: false }
    };
    /* 现场折扣 过滤当前折扣权限 */
    if (params && params.bdiscount) {
      config.params.bdiscount = params.bdiscount;
      config.params.discount = params.discount;
      config.params.golddiscount = params.golddiscount;
      config.params.ratediscount = params.ratediscount;
      config.params.memberid = params.memberid;
      config.params.product = params.product;
    }
    /* add by jinzh1 最低售价过滤 */
    if (params && !cb.utils.isEmpty(params.bBottomPriceApproval)) {
      config.params.bBottomPriceApproval = params.bBottomPriceApproval;
    }
    if (authType == 'opencashbox') config.params.bhaveself = true;
    proxy(config)
      .then(function (json) {
        if (json.code !== 200) {
          cb.utils.alert(json.message, 'error');
        }
        const data = { Operator_DataSource: [] };
        data.Operator_DataSource = json.data ? JSON.parse(json.data) : [];
        if (data.Operator_DataSource[0]) {
          data.userCode = data.Operator_DataSource[0].code;
          data.user = data.Operator_DataSource[0];
        }
        dispatch(genAction('PLATFORM_UI_BILLING_OPERATOR_SET_COMMON_DATA', data));
      });
  }
}
/* 发送验证码 */
export function sendSms (mobile, callback) {
  return function (dispatch, getState) {
    /* 现场折扣模式 */
    const { authType, sendMsgCallBack } = getState().operator.toJS();
    if (authType == 'scenediscount' && sendMsgCallBack) {
      const key = 'YXY' + new Date().getTime() + 'DISCOUNT';
      // cacheDiscoutKey = key;
      sendMsgCallBack(key);
      callback();
      return
    }
    const config = { url: 'user/smscode', method: 'POST', params: { phone: mobile } };
    proxy(config)
      .then(function (json) {
        if (json.code !== 200) {
          dispatch(genAction('PLATFORM_UI_BILLING_OPERATOR_SET_COMMON_DATA', { errInfo: json.message }));
        } else {
          dispatch(genAction('PLATFORM_UI_BILLING_OPERATOR_SET_COMMON_DATA', { waiting: true, errInfo: null }));
          callback();
        }
      });
  }
}
/* 控制modal */
export function setRepairModal (visible, isOk) {
  return function (dispatch, getState) {
    const operator = getState().operator.toJS();
    if (isOk) {
      const { bMsgCheck, activeKey, user } = operator;
      const config = { url: '', method: 'POST', params: '' };
      if (operator.authType == 'opencashbox') {
        if (process.env.__CLIENT__ && !window.plus && !cb.electron.getSharedObject()) {
          dispatch(OpenCashDrawer({ username: operator.userCode, password: operator.password }, json => {
            if (json.code !== 200) {
              dispatch(genAction('PLATFORM_UI_BILLING_OPERATOR_SET_COMMON_DATA', { errInfo: json.message }));
            } else {
              dispatch(clearOperator())
              if (operator.callback) {
                dispatch(genAction('PLATFORM_UI_BILLING_DISCOUNT_SET_OPERATOR', user));
                operator.callback();
              }
            }
          }));
          return;
        }
      }
      if (!bMsgCheck || activeKey == '0') {
        // if (operator.authType == 'lowestprice')
        //   config.url = 'user/operation/check/scenediscount';
        // else
        config.url = 'user/operation/check/' + operator.authType;
        config.params = { username: operator.userCode, password: operator.password };
      } else { /* 短信验证模式 */
        // config.url = 'thirdparty/member/sendcodecheck';
        // config.params = { 'code': operator.checkCode,'key': cacheDiscoutKey}
        if (operator.authType == 'scenediscount')
          dispatch(getUserDiscounts(user, operator.sendMsgCallBack || operator.callback));
        if (activeKey == 2)
          dispatch(genAction('PLATFORM_UI_BILLING_CHECKMSG_SET_COMMONDATA', { bDiscountAppr: true }));
        dispatch(clearOperator())
        return
      }
      proxy(config)
        .then(function (json) {
          if (json.code !== 200) {
            dispatch(genAction('PLATFORM_UI_BILLING_OPERATOR_SET_COMMON_DATA', { errInfo: json.message }));
          } else {
            if (operator.callback) {
              dispatch(genAction('PLATFORM_UI_BILLING_DISCOUNT_SET_OPERATOR', user));
              if (operator.authType == 'scenediscount' && !operator.noMsg) {
                dispatch(getUserDiscounts(user, operator.callback));
              } else {
                operator.callback();
              }
            } else {
              if (operator.authType == 'opencashbox')
                opencashdrawnocheck();
            }
            dispatch(clearOperator())
          }
        });
    } else {
      dispatch(clearOperator());
      dispatch(clearMsgInfo());
      operator.failCallback && operator.failCallback()
    }
  }
}
/* 获取当前操作员现场折扣权限 */
export function getUserDiscounts (operator, callback) {
  return function (dispatch, getState) {
    const { activeKey } = getState().operator.toJS();
    let bMsgCheck = false;
    if (activeKey == 1) bMsgCheck = true;
    const config = {
      url: '/role/getRoleLocaleDiscountAuth',
      method: 'GET',
      params: { opreatorId: operator.id }
    };
    proxy(config)
      .then(function (json) {
        if (json.code !== 200) {
          cb.utils.alert(json.message, 'error');
        }
        const data = json.data ? json.data.localeDiscountData : [];
        dispatch(updateSuperOperator(operator, data, bMsgCheck));
        callback();
        //   dispatch(genAction('PLATFORM_UI_BILLING_DISCOUNT_SET_COMMONDATA', { userdiscounts: data }));
      });
  }
}
/* 操作员改变 */
export function setOperator (userCode, user) {
  return function (dispatch) {
    const data = { userCode: userCode, user: user, bUser: false }
    dispatch(genAction('PLATFORM_UI_BILLING_OPERATOR_SET_COMMON_DATA', data));
  }
}
/* 密码改变 */
export function setPassword (password) {
  return function (dispatch) {
    dispatch(genAction('PLATFORM_UI_BILLING_OPERATOR_SET_COMMON_DATA', { password: password }))
  }
}
/* 页签切换 */
export function changeTab (key) {
  return function (dispatch) {
    dispatch(genAction('PLATFORM_UI_BILLING_OPERATOR_SET_COMMON_DATA', { activeKey: key }))
  }
}
export function setCommonData (data) {
  return function (dispatch) {
    dispatch(genAction('PLATFORM_UI_BILLING_OPERATOR_SET_COMMON_DATA', data));
  }
}
export function clearOperator () {
  return function (dispatch) {
    const data = {
      visible: false, userCode: '', password: '', checkCode: '', bMsgCheck: false, title: '权限验证',
      user: {}, authType: 'opencashbox', errInfo: '', activeKey: '0', Operator_DataSource: [], noMsg: false,
      sendMsgCallBack: null,
    }
    // cacheDiscoutKey = null;
    dispatch(genAction('PLATFORM_UI_BILLING_OPERATOR_SET_COMMON_DATA', data))
  }
}
