import Immutable from 'immutable';
import { genAction, proxy } from '@mdf/cube/lib/helpers/util';
// import _ from 'lodash'

const $$initialState = Immutable.fromJS({
  visible: false,
  password: '', /* 密码 */
  userName: '', /* 操作员姓名 */
  userAvatar: '', /* 操作员头像 */
  errInfo: '',
  gender: 0, /* 性别 */
})

// reducer
export default ($$state = $$initialState, action) => {
  switch (action.type) {
    /* modal显示/隐藏 */
    case 'PLATFORM_UI_BILLING_LOCKED_SET_VISIBLE':
      return $$state.set('visible', action.payload);
    case 'PLATFORM_UI_BILLING_LOCKED_SET_COMMON_DATA':
      return $$state.merge(action.payload);
    default:
      return $$state;
  }
}
/* 点击左侧菜单-锁屏 */
export function showLock () {
  return function (dispatch, getState) {
    const user = getState().user.toJS();
    const data = { visible: true, userName: user.name, userAvatar: user.avatar, gender: user.gender };
    dispatch(genAction('PLATFORM_UI_BILLING_LOCKED_SET_COMMON_DATA', data));
  }
}
/* 密码改变 */
export function setPassword (password) {
  return function (dispatch) {
    dispatch(genAction('PLATFORM_UI_BILLING_LOCKED_SET_COMMON_DATA', { password: password }));
  }
}
export function setErrInfo (errInfo) {
  return function (dispatch) {
    dispatch(genAction('PLATFORM_UI_BILLING_LOCKED_SET_COMMON_DATA', { errInfo: errInfo }));
  }
}
export function unLock (password) {
  return function (dispatch, getState) {
    const config = { url: 'user/operation/check/pwd', method: 'POST', params: { password: password } };
    proxy(config)
      .then(function (json) {
        if (json.code !== 200) {
          dispatch(genAction('PLATFORM_UI_BILLING_LOCKED_SET_COMMON_DATA', { errInfo: json.message }));
        } else {
          dispatch(clearLockScreen());
        }
      });
  }
}
export function clearLockScreen () {
  return function (dispatch, getState) {
    dispatch(genAction('PLATFORM_UI_BILLING_LOCKED_SET_COMMON_DATA', { visible: false, password: '', errInfo: '' }))
  }
}
