import { createAction } from 'redux-actions';
import * as MineActions from '../constants/mine';
import { genAction, proxy } from '@mdf/cube/lib/helpers/util'
import { goBack } from 'react-router-redux'
import Immutable from 'immutable'

export const pageDisplay = createAction(MineActions.MINE_MODIFY_DISPLAY);
export const modifyMineInfo = createAction(MineActions.MINE_MODIFY_INFO);
export const modifyNickName = createAction(MineActions.MINE_MODIFY_NICKNAME);
export const modifyInfo = createAction(MineActions.MINE_INFO);
export const departmentList = createAction(MineActions.DEPARTMENT_lIST);

export function saveInfo (noBack) {
  return async (dispatch, getState) => {
    var user = getState().mine.get('user').toJS();
    const config = {
      url: 'user/save',
      method: 'POST',
      params: user,
      options: { token: true }
    }
    var json = await proxy(config);
    if (json.code !== 200) {
      cb.utils.Toast(json.message + '信息修改失败！！', 'error');
    } else {
      var loginUser = Immutable.fromJS(getState().user).merge(user);

      dispatch(genAction('PLATFORM_DATA_USER_ACCOUNT_MERGE_INFO', loginUser));
      cb.utils.Toast('信息修改成功！！', 'success');
      if(!noBack) {
        dispatch(goBack());
      }
    }
  }
}

export function getInfo () {
  return async function (dispatch, getState) {
    const config = {
      url: 'user/find',
      method: 'GET',
      options: { token: true }
    };
    const json = await proxy(config);
    if (json.code !== 200) {
      console.log(json.message + '信息获取出错...');
    } else {
      const userInfo = json.data;
      // let tempUser = Immutable.fromJS({id:userInfo.id,nickName:userInfo.nickName,avatar:userInfo.avatar});
      dispatch(genAction(MineActions.MINE_MODIFY_INFO, getState().mine.get('user').merge(userInfo)));
    }
  }
}

export function detailInfo () {
  return async function (dispatch, getState) {
    const config = {
      url: 'membercenter/bill/detail',
      method: 'GET',
      options: { token: true }
    };
    const json = await proxy(config);
    if (json.code !== 200) {
      console.log(json.message + '信息获取出错...');
    } else {
      const userInfo = json.data;
      const tempUser = Immutable.fromJS({ id: userInfo.id, nickName: userInfo.nickName, avatar: userInfo.avatar });
      dispatch(genAction(MineActions.MINE_MODIFYSTORE_INFO, getState().mine.get('store').merge(tempUser)));
    }
  }
}

export function changePwd (data, callback) {
  return async function (dispatch, getState) {
    const config = {
      url: 'user/changepwd',
      method: 'POST',
      params: data,
      options: { token: true }
    };
    const json = await proxy(config);
    if (json.code !== 200) {
      // cb.utils.alert(json.message, 'error');
      callback(1, json);
    } else {
      // cb.utils.alert('修改密码成功!', 'success');
      callback(0, json);
    }
  }
}

export function departmentInfo (callback) {
  return async function (dispatch, getState) {
    const config = {
      url: 'pub/ref/getRefMeta',
      method: 'GET',
      params: {refCode: 'aa_department'},
      options: { token: true }
    };
    const json = await proxy(config);
    if (json.code !== 200) {
      callback(1, json.message);
      console.log(json.message + '信息获取出错...');
    } else {
      const info = json.data.refEntity;
      let url = 'bill/ref/getRefData';
      // if(info.cRefType==='aa_operator'){
      url = 'membercenter/bill/ref/getRefData';
      // }
      const configs = {
        url: url,
        method: 'POST',
        params: { dataType: info.cTpltype.toLowerCase(), refCode: info.refType },
        options: { token: true }
      };
      const jsons = await proxy(configs);
      if (jsons.code !== 200) {
        callback(2, jsons.message);
        console.log(jsons.message + '信息获取出错...');
      } else {
        dispatch(genAction(MineActions.DEPARTMENT_lIST, jsons.data));
        callback(0, jsons);
      }
    }
  }
}
