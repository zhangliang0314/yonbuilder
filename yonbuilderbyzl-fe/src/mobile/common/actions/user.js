import {createAction} from 'redux-actions'
import * as Actions from '../constants/user'
import Cookies from 'cookies-js'
import {proxy, genAction} from '@mdf/cube/lib/helpers/util'
import {replace} from 'react-router-redux'
import _ from 'lodash'
import moment from 'moment'

export const userAccoutEdit = createAction(Actions.USER_ACCOUNT_EDIT)
export const userPasswdEdit = createAction(Actions.USER_PASSWD_EDIT)
export const userSetData = createAction(Actions.USER_SET_DATA)
export const userLogin = function (successCallback, errCallback) {
  return function (dispatch, getState) {
    dispatch({
      type: Actions.USER_LOGIN
    })
    const params = _.pick(getState().user.toJS(), ['username', 'password'])
    const config = {
      url: 'user/login',
      method: 'POST',
      params: params,
      showLoading: false,
      options: {
        token: false,
        uniform: false
      }
    };
    proxy(config)
      .then(function (json) {
        if (json.code !== 200) {
          //  cb.utils.alert(json.message, 'error')
          dispatch({
            type: Actions.USER_LOGIN_FAILURE
          })
          errCallback(json.message)
          return;
        }

        if (json.data.leftTime == -1) {
          return
          // return dispatch(push('/expire'))
        }
        clearCache();
        localStorage.setItem('token', json.data.token);
        cb.rest.AppContext.token = json.data.token;

        getLoginUserInfo((loginUser) => {
          dispatch(userSetData(loginUser))
          successCallback()
        }, (error) => {
          /* dispatch({
            type: Actions.USER_LOGIN_FAILURE
          }) */

          cb.utils.alert(error, 'error')
        })

        /*   // cb.rest.ContextBuilder.construct();
           /!* 取组织门店 *!/
           let p = new Promise((resolve, reject) => {
             let arg = {
               url: 'user/getOrgsAndStores',
               method: 'GET',
             };
             proxy(arg)
               .then(json => {
                 if (json.code !== 200) {
                   cb.utils.alert(json.message, 'error')
                   dispatch({
                     type: Actions.USER_LOGIN_FAILURE
                   })
                   return;
                 }
                 dispatch(userSetData(json.data))
                 resolve();
               })
           })
           p.then(successCallback) */
      })
  }
}

export const logOut = function () {
  return (dispatch) => {
    // dispatch({
    //   type: 'PLATFORM_DATA_LOGIN_OUT',
    // })
    // todo 清理localstorage
    Cookies.expire('token')

    localStorage.removeItem('loginUser')
    localStorage.removeItem('token')
    localStorage.removeItem('defaultOrg');
    localStorage.removeItem('defaultStore');

    // dispatch(userSetData(null))
    dispatch(replace('/login'))
    dispatch(genAction('PLATFORM_UI_BILLING_DATASOURCE_REMOVE_CODE', ''))
    dispatch(genAction('PLATFORM_UI_BILLING_CLEAR', ''))
    // dispatch(clearMenu());
    // dispatch(clear());
  }
}

export async function getLoginUserInfo (onSuccess, onError) {
  /* 取组织门店 */
  const storeJson = await proxy({
    url: 'user/getOrgsAndStores',
    method: 'GET'
  })
  if (storeJson.code !== 200) {
    cb.utils.alert(storeJson.message, 'error')
    return onError(storeJson.message)
  }

  /* 取班次信息 */
  const gradesJson = await proxy({
    url: 'billTemplateSet/getGradeAndEmployee',
    method: 'GET'
  })

  if (gradesJson.code !== 200) {
    cb.utils.alert(gradesJson.message, 'error')
    return onError(gradesJson.message)
  }

  const userGrades = gradesJson.data.gradeInfo
  // 取默认班次
  const defaultGrade = userGrades.find(item => {
    const {startTime, endTime} = item
    if (startTime && endTime)
      return moment().isBetween(moment(startTime, 'HH:mm:ss'), moment(endTime, 'HH:mm:ss'));
    return false
  })
  if (!defaultGrade) {
    cb.utils.alert('没有可用的班次', 'error')
    // return
  }

  const loginUser = _.assign({}, storeJson.data, {
    userGrades,
    defaultGradeName: defaultGrade ? defaultGrade.name : null,
    gradeId: defaultGrade ? defaultGrade.id : null
  })

  return onSuccess(loginUser)
}

export function changeStore (value, name, inner) {
  return function (dispatch, getState) {
    if (inner) {
      dispatch(_changeStore(value, name, function () {
        // dispatch(afterStoreLoaded());
      }));
    } else {
      dispatch(_changeStore(value, name, function () {
        // dispatch(getGrades());
        // dispatch(genAction('PLATFORM_DATA_USER_ACCOUNT_STORE_CHANGED'));
        clearCache();
        const {userStores} = getState().user.toJS();
        const stores = userStores.filter(item => {
          return item.store === value;
        });
        if (stores && stores.length)
          localStorage.setItem('defaultOrg', stores[0].org_id);
        cb.route.refreshIndex();
      }));
    }
  }
}

const _changeStore = function (value, name, callback) {
  return function (dispatch) {
    const config = {
      url: 'user/changeOrgOrShop',
      method: 'POST',
      params: {
        storeId: value
      }
    }
    proxy(config)
      .then(json => {
        if (json.code !== 200) {
          cb.utils.alert(json.message, 'warning');
          return;
        }
        dispatch(genAction('PLATFORM_UI_BILLING_DATASOURCE_REMOVE_CODE', null));
        dispatch(genAction('PLATFORM_UI_BILLING_CLEAR', null));
        const info = {defaultStoreName: name, storeId: value};
        Object.assign(cb.rest.AppContext.user || {}, info);
        dispatch(genAction('USER_ACCOUNT_CHANGE_STORE', value));
        localStorage.setItem('defaultStore', value);
        callback();
      });
  }
}

const clearCache = () => {
  localStorage.removeItem('defaultGrade');
  localStorage.removeItem('billing_lastBill');
  localStorage.removeItem('billing_lastBillId');
  localStorage.removeItem('billing_printTemplate');
}
