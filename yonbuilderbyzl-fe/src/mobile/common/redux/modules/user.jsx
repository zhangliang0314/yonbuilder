import Immutable from 'immutable';
// import fetch from 'isomorphic-fetch';
import Cookies from 'cookies-js';
import moment from 'moment';
// import uuid from 'uuid';

import ActionStatus from '@mdf/metaui-mobile/lib/constants/ActionStatus';
import env from '@mdf/metaui-mobile/lib/env';
import { genAction, proxy } from '@mdf/cube/lib/helpers/util';
import { getMenuTree, clearMenu } from '@mdf/metaui-mobile/lib/redux/tree';
import { addItem, clear } from '@mdf/metaui-mobile/lib/redux/tabs';
import { getLayOut, clearLayOut } from './home';
import { judge } from '../../helpers/canOpenBilling';
import { initConfig } from '../../redux/modules/billing/config';
import { getDefaultBusinessType } from 'src/common/redux/modules/billing/reserve'
import { getSalesList } from 'src/common/redux/modules/billing/salesClerk'
import { autoDeleteDB, perfectOption, timeTask } from 'src/common/redux/modules/billing/offLine'
import { IDB_getData } from '@mdf/metaui-mobile/lib/redux/indexedDB'
import { touch_getDefaultBusinessTypeConfig } from 'src/common/redux/modules/billing/reserve'

let cacheLoginData = {}; let _loginData; let _interMode;
const user = {
  usernameMsg: '',
  passwordMsg: '',
  errorMsg: '',
  id: null,
  username: '',
  password: '',
  corp_id: null,
  pubuts: null,
  bActivate: null,
  bEmailValid: null,
  bMobileValid: null,
  mobile: null,
  salt: null,
  iDeleted: null,
  bCorpRegister: false,
  dataSourceName: null,
  alias: null,
  token: null,
  accountCurrentKey: 'personalInfo',
  enableLogin: (process.env.NODE_ENV === 'development'),
  experienceList: [],
  loginModalVisible: null,
  userListData: [],
};

const $$initialState = Immutable.fromJS({
  // 用户属性
  ...user,
  // 登陆状态
  loginStatus: ActionStatus.READY
});

export default (state = $$initialState, action) => {
  switch (action.type) {
    case 'PLATFORM_UI_USER_INIT':
      if (process.env.__CLIENT__) {
        const loginUserBackup = state.get('loginUserBackup');
        if (!loginUserBackup)
          return state;
        const loginUser = loginUserBackup.toJS();
        cb.rest.AppContext.tenant = loginUser.tenant;
        delete loginUser.tenant;
        cb.rest.AppContext.option = loginUser.option;
        perfectOption()
        delete loginUser.option;
        cb.rest.AppContext.user = loginUser;
        if (cb.utils.getDevicesInfo) {
          const deviceInfo = cb.utils.getDevicesInfo();
          cb.rest.AppContext.device = deviceInfo;
        }
        return state;
      }
      buildUser(action.payload);
      return state.merge(action.payload);
    case 'PLATFORM_DATA_USER_LOGIN':
      return state.set('loginStatus', ActionStatus.ING);
    case 'PLATFORM_DATA_USER_LOGIN_SUCCEED':
      buildUser(action.payload);
      return state
        .set('loginStatus', ActionStatus.SUCCEED)
        .set('errorMsg', '')
        .merge(action.payload);
    case 'PLATFORM_DATA_USER_LOGIN_FAILURE':
      return state
        .set('loginStatus', ActionStatus.FAILURE)
        .merge(action.payload);
    case 'PLATFORM_DATA_LOGIN_OUT': {
      Cookies.expire('user');
      const nullData = {
        id: null,
        username: '',
        password: '',
        corp_id: null,
        pubuts: null,
        bActivate: null,
        bEmailValid: null,
        bMobileValid: null,
        mobile: null,
        salt: null,
        iDeleted: null,
        bCorpRegister: null,
        dataSourceName: null,
        alias: null,
        token: null,
      };
      return state
        .merge({ ...nullData, loginStatus: ActionStatus.READY });
    }
    case 'PLATFORM_DATA_USER_ACCOUNT_SET_ACCOUNT_MSG':
      return state.merge(action.payload)
    case 'PLATFORM_DATA_USER_ACCOUNT_SET_ACCOUNT_ACTIVE_KEY':
      return state.set('accountCurrentKey', action.payload)
    case 'PLATFORM_DATA_USER_ACCOUNT_CHANGE_ORG':
      return state.merge(action.payload);
    case 'PLATFORM_DATA_USER_ACCOUNT_CHANGE_STORE':
      return state.merge(action.payload);
    case 'PLATFORM_DATA_USER_ACCOUNT_CHANGE_GRADE':
      return state.merge(action.payload);
    case 'PLATFORM_DATA_USER_ACCOUNT_MERGE_INFO':
      return state.merge(action.payload);
    case 'PLATFORM_DATA_CORP_SYSTEMSET_PASS_LOGO':
    case 'PLATFORM_DATA_SET_EXPERIENCE_ACCOUNT':
      return state.merge(action.payload);
    case 'LOGIN_SAVE_USERLIST':
      return state.set('userListData', action.payload);
    case 'LOGIN_SHOW_MODAL':
      return state.set('loginModalVisible', action.payload);
    case 'LOGIN_UPDATE_CALLBACK':
      return state.set('afterLoginCallBack', action.payload);
    default:
      return state;
  }
}

const buildUser = (user) => {
  const { userOrgs, userStores, orgId, storeId } = user;
  let defaultOrgName, defaultStoreName;
  userOrgs && userOrgs.forEach(item => {
    if (item.org == orgId)
      defaultOrgName = item.org_name;
  });
  userStores && userStores.forEach(item => {
    if (item.store == storeId)
      defaultStoreName = item.store_name;
  })
  Object.assign(user, {
    defaultOrgName: defaultOrgName,
    defaultStoreName: defaultStoreName
  });
  user.loginUserBackup = JSON.parse(JSON.stringify(user));
};

export function usernameChange (value, usernameMsg) {
  return (dispatch) => {
    const obj = { username: value };
    if (value && usernameMsg)
      obj.usernameMsg = '';
    dispatch(genAction('PLATFORM_DATA_USER_LOGIN_FAILURE', obj));
  }
}

export function passwordChange (value, passwordMsg) {
  return (dispatch) => {
    const obj = { password: value };
    if (value && passwordMsg)
      obj.passwordMsg = '';
    dispatch(genAction('PLATFORM_DATA_USER_LOGIN_FAILURE', obj));
  }
}

const clearCache = () => {
  localStorage.removeItem('defaultGrade');
  localStorage.removeItem('billing_lastBill');
  localStorage.removeItem('billing_lastStatus');
  localStorage.removeItem('billing_lastBillId');
  localStorage.removeItem('billing_printTemplate');
}

const checkRegStatus = async (dispatch) => {
  const config = {
    url: 'register/checkRegStatus',
    method: 'GET'
  };
  const json = await proxy(config);
  if (!json.data) {
    setTimeout(function () {
      checkRegStatus(dispatch);
    }, 5000);
    return;
  }
  dispatch(login(_loginData));
}

const _showModal = (dispatch) => {
  const modalVisible = true;
  // 弹出Modal
  dispatch(changeModalState(modalVisible));
}

// 触屏登录处理，取第一个userList的userId
const _chooseDefaultAcc = async (dispatch, loginData, defaultAcc) => {
  clearCache();
  const data = { userId: defaultAcc };
  const config = {
    url: '/user/loginByUserId',
    method: 'POST',
    params: data
  };
  const json = await proxy(config);
  if (json.code == 200) {
    localStorage.setItem('userId', defaultAcc);
    dispatch(afterLogin(loginData));
  }
}

// 登录
export function login (data) {
  return async (dispatch) => {
    _loginData = data;
    dispatch(genAction('PLATFORM_DATA_USER_LOGIN'));
    if (process.env.NODE_ENV !== 'development' || data.username) {
      let usernameMsg = null; let passwordMsg = null;
      if (!data.username)
        usernameMsg = '登录账号不能为空';
      if (!data.password)
        passwordMsg = '密码不能为空';
      if (usernameMsg || passwordMsg) {
        dispatch(genAction('PLATFORM_DATA_USER_LOGIN_FAILURE', {
          usernameMsg,
          passwordMsg
        }));
        closeAwaitModal()
        return;
      }
    }
    else {
      data.username = 'xmcs001';
      data.password = '123456';
    }
    // 判断本地是否有userId
    if (localStorage.getItem('userId')) {
      const userId = { userId: localStorage.getItem('userId') };
      Object.assign(data, userId)
    }
    const config = {
      url: env.HTTP_USER_LOGIN,
      method: 'POST',
      options: { uniform: false, token: false },
      params: data
    };
    if (env.INTERACTIVE_MODE === 'touch') config.options.timeout = 3000
    const json = await proxy(config);

    if (json.code === 200) {
      /** if (cb.rest.terminalType === 2 && window.plus && window.plus.JavaToJs) {
        plus.JavaToJs.HardwareInterface('startSystemInfo');
      } **/
      localStorage.setItem('token', json.data.token);
      cb.rest.ContextBuilder.construct();

      if (json.data.leftTime == -1) {
        cb.route.pushPage('/expire');
        closeAwaitModal()
        return
      }
      const { regStatus } = json.data;
      if (!cb.utils.isEmpty(regStatus) && regStatus != '2') {
        if (window.__getLoginTouchMask)
          window.__getLoginTouchMask.init();
        checkRegStatus(dispatch);
        return;
      }
      if (env.INTERACTIVE_MODE === 'pc' && _interMode === 'touch' || env.INTERACTIVE_MODE === 'touch' && _interMode === 'pc') {
        dispatch(switchInterMode(_interMode));
        return;
      }
      // localStorage.setItem('token', json.data.token);
      // cb.rest.ContextBuilder.construct();
      const loginCallBack = () => {
        dispatch(afterLogin(data));
      }
      // 判断是否有多账号
      if (json.data.userList) {
        dispatch(genAction('LOGIN_SAVE_USERLIST', json.data.userList));
        dispatch(genAction('LOGIN_UPDATE_CALLBACK', loginCallBack));
        if (env.INTERACTIVE_MODE === 'pc') {
          // 是多账号，且本地有有效userId时(json.data有id)就不弹modal
          if (!(json.data.id)) {
            await _showModal(dispatch);
          } else {
            dispatch(afterLogin(data));
          }
        } else {
          // 不是pc端
          await _chooseDefaultAcc(dispatch, data, json.data.userList[0].userId);
        }
      } else {
        dispatch(afterLogin(data));
      }
    } else if (json.code === 500) {
      if (env.INTERACTIVE_MODE === 'touch') {
        const touchUser = localStorage.getItem('touchUser'); const cacheUser = touchUser && JSON.parse(touchUser)
        if (cacheUser.username == data.username && cacheUser.password == data.password && cb.rest.cache.isOpenDBCache) {
          cb.rest.ContextBuilder.construct();
          dispatch(genAction('PLATFORM_UI_OFF_LINE_CHANGE_LINE_CONNECT', { lineConnection: false }))
          IDB_getData({ key: 'loginData', dbTableName: 'offlineLogin' }).then(dbData => {
            initTouchLogin(dispatch, { cacheLoginData: dbData })
          }).catch(e => {
            console.error('离线登陆读取缓存数据错误' + e)
          })
        } else {
          let err = json.message
          if (cacheUser.username !== data.username && cb.rest.cache.isOpenDBCache) err = '网络不可用，必须使用上次登录的账号'
          if (cacheUser.password !== data.password && cb.rest.cache.isOpenDBCache) err = '网络不可用，密码必须与上次登录相同'
          closeAwaitModal()
          dispatch(genAction('PLATFORM_DATA_USER_LOGIN_FAILURE', { errorMsg: err }));
          console.error('错误代码：离线登录错误 ==>' + '错误信息：' + err);
        }
      } else {
        dispatch(genAction('PLATFORM_DATA_USER_LOGIN_FAILURE', { errorMsg: json.message }));
        console.error('错误代码：' + json.code + '错误信息：' + json.message);
      }
    } else {
      closeAwaitModal()
      dispatch(genAction('PLATFORM_DATA_USER_LOGIN_FAILURE', { errorMsg: json.message }));
      console.error('错误代码：' + json.code + '错误信息：' + json.message);
    }
  }
}

export function afterLogin (data) {
  return async function (dispatch) {
    const callback = typeof data === 'function' ? data : null;
    cacheLoginData = {}
    let config = {
      url: 'user/getOrgsAndStores',
      method: 'POST',
      options: {autoLogin: false}
    };
    let json = await proxy(config);
    cacheLoginData.OrgStoreData = json
    if (json.code !== 200) {
      if (callback)
        callback(json);
      else
        dispatch(genAction('PLATFORM_DATA_USER_LOGIN_FAILURE', { errorMsg: json.message }));
      closeAwaitModal()
      return;
    }
    cb.rest.AppContext.user = json.data;
    config = {
      url: 'tenant/find',
      method: 'GET',
    };
    json = await proxy(config);
    cacheLoginData.TenantData = json

    if (json.code === 200) {
      cb.rest.AppContext.user.logo = json.data.logo;
      cb.rest.AppContext.user.tenant = json.data;
      const cacheTenantId = localStorage.getItem('tenantId')
      if (!cacheTenantId)
        localStorage.setItem('tenantId', json.data.id)
      else if (json.data.id != cacheTenantId) {
        localStorage.setItem('tenantId', json.data.id)
        localStorage.removeItem('billing_posCode')
        localStorage.removeItem('billing_serialNo')
      }
    }
    if (env.INTERACTIVE_MODE !== 'touch' && env.INTERACTIVE_MODE !== 'self') {
      dispatch(genAction('PLATFORM_DATA_USER_LOGIN_SUCCEED', cb.rest.AppContext.user));
      if (cb.rest.terminalType === 3) {
        if (callback)
          callback();
        else
          cb.route.replacePage('/');
      } else {
        cb.route.pushPage('/portal');
        closeAwaitModal();
      }
    }
    if (json.code === 200)
      cb.rest.AppContext.tenant = json.data;
    // config = {
    //   url: 'option/getOptionData',
    //   method: 'POST',
    //   params: {
    //     optionId: 'sys_option'
    //   }
    // };
    // json = await proxy(config);
    // const option = {};
    // if (json.code === 200)
    //   Object.assign(option, json.data);
    // config = {
    //   url: 'option/getOptionData',
    //   method: 'POST',
    //   params: {
    //     optionId: 'business_option'
    //   }
    // };
    // json = await proxy(config);
    // if (json.code === 200)
    //   Object.assign(option, json.data);
    // cb.rest.AppContext.option = option;
    const showOptions = await getMenuTree(dispatch, { cacheDBData: cacheLoginData });
    Object.assign(cb.rest.AppContext.user, showOptions);
    dispatch(init(cb.rest.AppContext.user, async function () {
      if (!callback) {
        if (data) {
          if (data.rememberUser) {
            const rememberAccount = { username: data.username };
            localStorage.setItem('rememberAccount', JSON.stringify(rememberAccount));
          } else {
            if (localStorage.getItem('rememberAccount')) localStorage.removeItem('rememberAccount')
          }
          clearCache();
        }
      }
      if (env.INTERACTIVE_MODE === 'touch') {
        if (cb.rest.AppContext.user.userType === 0) {
          cb.route.pushPage('/portal');
          closeAwaitModal()
          cacheLoginData.attrKey = 1
          cb.events.execute('offlineLogin', cacheLoginData)
          return
        }
        if (env.INTERACTIVE_MODE === 'touch')
          localStorage.setItem('touchUser', JSON.stringify(data))
        if (showOptions.canBilling) {
          const canOpen = await judge(cb.rest.AppContext.user);
          if (!canOpen) {
            closeAwaitModal()
            return;
          }
        }
        config = {
          url: 'billTemplateSet/getGradeAndEmployee',
          method: 'GET'
        };
        let json
        json = await proxy(config);
        cacheLoginData.EmployeeData = json
        if (json.data && json.data.operatorInfo)
          dispatch(genAction('PLATFORM_UI_BILLING_SALES_CLERK_INIT', json.data.operatorInfo));

        const posCode = localStorage.getItem('billing_posCode');
        const deviceInfo = cb.utils.getDevicesInfo();
        cb.rest.AppContext.device = deviceInfo;
        if (!posCode && deviceInfo) {
          if (!deviceInfo.macaddress && !cb.utils.isIos()) {
            cb.utils.alert('mac地址未取到，请退出程序重新登录！')
            closeAwaitModal()
            return;
          }
          config = {
            url: 'bill/getposnum',
            method: 'GET',
            params: deviceInfo
          }
          json = await proxy(config);
          cacheLoginData.PosCodeData = json
          processPosCode(json);
        }

        let posInfo = null;
        config = {
          url: 'bill/getcabinetgroup',
          method: 'GET',
          params: { posnum: localStorage.getItem('billing_posCode')}
        }
        json = await proxy(config);
        cacheLoginData.CabinetgroupData = json
        if (json.code == 200) {
          const { id = '', cabinetgroup = '' } = json.data;
          posInfo = cabinetgroup
          localStorage.setItem('pos_id', id);
          Cookies.set('pos_cabinetgroup', cabinetgroup, { expires: Infinity })
        }

        config = {
          url: 'billTemplateSet/getBelongTemplate',
          method: 'GET',
          params: {counterId: posInfo || ''}
        };
        json = await proxy(config);
        cacheLoginData.TemplateData = json
        const printSource = json // 提供给放在最后的打印
        const initConfigSource = json.data
        if (json.code !== 200) {
          alert(`获取开单设置失败：${json.message}`);
          closeAwaitModal()
          return;
        }
        const touchRoutePC = json.data && json.data.touchBillData && json.data.touchBillData.basicSettingData && json.data.touchBillData.basicSettingData.selectType === '2';
        const routePortal = !!((json.data && json.data.touchBillData && json.data.touchBillData.touchSettingData && json.data.touchBillData.touchSettingData.cLoginDefaultPage === '2'));
        dispatch(genAction('PLATFORM_UI_BILLING_CONFIG_SET_OPTIONS', { touchRoutePC }))

        // if (env.INTERACTIVE_MODE === 'touch' && cb.rest.cache.isOpenDBCache === null)
        //   cb.rest.cache.isOpenDBCache = {key: 'DEFAULT', value: !!cb.rest.AppContext.option.billCacheToApp}
        await cb.rest.cache.changeVersion(process.env.SCRIPT_VERSION)
        await proxyTool('billMeta', 'rm_retailvouch', cacheLoginData)
        await proxyTool('billMeta', 'rm_gatheringvouch', cacheLoginData)

        config = {
          url: 'billTemplateSet/getCurrentStoreWarehouse',
          method: 'GET',
          params: { storeId: cb.rest.AppContext.user.storeId }
        };
        if (posInfo)
          config.params.cabinetGroup = posInfo
        if (cb.rest.AppContext.user.storeId) {
          json = await proxy(config)
          cacheLoginData.WarehouseData = json
          if (json.code !== 200) {
            cb.utils.alert(json.message, 'error');
          }
        }

        config = {
          url: 'mall/bill/preferential/querylinemutexstrategy',
          method: 'GET'
        };
        json = await proxy(config)
        cacheLoginData.PromotionMutexData = json
        if (json.code !== 200) {
          cb.utils.alert(json.message, 'error');
        }

        dispatch(genAction('PLATFORM_UI_BILLING_CONFIG_INIT', { jsonData: initConfigSource, cacheData: cacheLoginData }));
        // dispatch(genAction('PLATFORM_DATA_USER_LOGIN_SUCCEED', cb.rest.AppContext.user));
        dispatch(genAction('PLATFORM_DATA_USER_LOGIN_SUCCEED', cb.rest.AppContext.user));
        // dispatch(initConfig(json.data, {cacheDBData: cacheLoginData}));

        config = {
          url: 'membercenter/bill/getOperatorData',
          method: 'GET',
          params: { iStoreId: cb.rest.AppContext.user.storeId }
        };
        json = await proxy(config);
        cacheLoginData.SaleList = json
        if (json.code !== 200) {
          cb.utils.alert(json.message, 'error');
          closeAwaitModal()
          return
        }
        dispatch(genAction('PLATFORM_UI_BILLING_SALES_SET_CACHEDATE', json));

        config = {
          url: 'mall/bill/mobile/queryproductsku.do',
          method: 'POST',
          params: {
            externalData: { isPage: false, showType: 'N' }
          }
        }
        if (!touchRoutePC) {
          json = await proxy(config);
          cacheLoginData.ReferData = json
          if (json.code !== 200) {
            cb.utils.alert(json.message, 'error');
            closeAwaitModal()
            return
          }
          dispatch(genAction('PLATFORM_UI_TOUCH_RIGHT_LOGIN_CACHE_REFER_DATA', json))
        }

        config = {
          url: 'region/getAllregion',
          method: 'POST',
          params: {}
        }
        json = await proxy(config);
        cacheLoginData.RegionData = json
        dispatch(genAction('PLATFORM_UI_BILLING_RESERVE_CACHE_REGION', json))

        config = touch_getDefaultBusinessTypeConfig(cb.rest.AppContext.user, dispatch)
        json = await proxy(config)
        cacheLoginData.DefaultBusinessTypeData = json
        dispatch(genAction('PLATFORM_UI_BILLING_CACHE_DEFAULT_BUSINESSTYPE', json))

        config = {
          url: 'user/getUserListByStoreid',
          method: 'POST',
          params: { storeid: cb.rest.AppContext.user.storeId }
        };
        json = await proxy(config);
        cacheLoginData.OperatorsData = json
        dispatch(genAction('PLATFORM_UI_BILLING_PENDING_LOGIN_CACHE_DATA', json))

        config = {
          url: 'intelPeripheral/getPosDeviceSetting',
          method: 'GET',
          params: { billno: 'aa_posdevicesetting' }
        }
        json = await proxy(config);
        cacheLoginData.DualScreenSettingData = json

        localStorage.setItem('DualScreenSettingData', JSON.stringify(json.data));

        await autoDeleteDB()

        /* 暂先放最后 */
        window.__cacheLoginData = cacheLoginData
        const obj = { OptionData: cb.rest.AppContext.option };
        obj.DualScreenSettingData = cacheLoginData.DualScreenSettingData ? cacheLoginData.DualScreenSettingData.data : {};
        if (window.plus && plus.JavaToJs) {
          plus.JavaToJs.HardwareInterface('login', JSON.stringify({ token: cb.rest.AppContext.token, data: obj }));
        } else if (cb.electron.getSharedObject()) {
          cb.electron.sendOrder('refreshSecondaryScreen', { type: 'login', message: JSON.stringify({ token: cb.rest.AppContext.token, data: obj }) });
        }
        cb.route.pushPage(showOptions.canBilling ? (routePortal ? '/portal' : '/billing') : '/portal');
        // await cb.rest.cache.changeVersion(process.env.SCRIPT_VERSION || uuid())
        closeAwaitModal()

        cacheLoginData.attrKey = 'loginData'
        cb.events.execute('offlineLogin', cacheLoginData)

        const templateOption = printSource.data.optionData.find(item => {
          return item.name === 'billdefaulttype';
        });
        const templateCode = templateOption && templateOption.value;
        if (cb.utils.isEmpty(templateCode)) {
          cb.utils.alert('没有设置打印模板，请检查', 'error');
        }
        config = {
          url: 'print/getTemplateContent',
          method: 'POST',
          params: {
            billno: 'rm_retailvouch',
            templateCode
          }
        };
        json = await proxy(config);
        // cacheLoginData.PrintData = json
        if (json.code !== 200) {
          cb.utils.alert(`获取打印模板失败：${json.message}`, 'error');
        } else {
          localStorage.setItem('billing_printTemplate', JSON.stringify(json.data));
        }
      }
      if (env.INTERACTIVE_MODE === 'self') {
        if (showOptions.canBilling) {
          const canOpen = await judge(cb.rest.AppContext.user);
          if (!canOpen) return;
        }
        localStorage.setItem('selfUser', JSON.stringify({ username: data.username, password: data.password }));
        dispatch(genAction('PLATFORM_DATA_USER_LOGIN_SUCCEED', cb.rest.AppContext.user));
        config = {
          url: 'billTemplateSet/getGradeAndEmployee',
          method: 'GET'
        };
        json = await proxy(config);
        if (json.data && json.data.operatorInfo)
          dispatch(genAction('PLATFORM_UI_BILLING_SALES_CLERK_INIT', json.data.operatorInfo));
        config = {
          url: 'commonSetService/getSelfScreenTemplate.do',
          method: 'GET'
        }
        json = await proxy(config)
        if (json.code !== 200)
          cb.utils.alert(`获取大屏开单设置失败：${json.message}`, 'error')
        dispatch(genAction('PLATFORM_UI_BILLING_SELF_GET_SELF_TEMPLATE', { selfOptionData: json.data }))
        config = {
          url: 'billTemplateSet/getBelongTemplate',
          method: 'GET'
        };
        json = await proxy(config);
        if (json.code !== 200) {
          alert(`获取开单设置失败：${json.message}`);
          return;
        }
        dispatch(genAction('PLATFORM_UI_BILLING_CONFIG_INIT', json.data));
        dispatch(initConfig(json.data));

        const posCode = localStorage.getItem('billing_posCode');
        const deviceInfo = cb.utils.getDevicesInfo();
        // let deviceInfo = { macaddress: '123456', uuid:'1248456543', imsi:'98789', imei:'56787789', model:'9879', vendor:'345678765' }
        cb.rest.AppContext.device = deviceInfo;
        if (!posCode && deviceInfo) {
          config = {
            url: 'bill/getposnum',
            method: 'GET',
            params: deviceInfo
          }
          json = await proxy(config);
          processPosCode(json);
        }

        // dispatch(initConfig(json.data));
        // dispatch(genAction('PLATFORM_DATA_USER_LOGIN_SUCCEED', cb.rest.AppContext.user));
        // /*add by jinzh1*/
        // if (window.plus) plus.JavaToJs.HardwareInterface('onLogin', cb.rest.AppContext.token);
        dispatch(getDefaultBusinessType(1));
        cb.route.pushPage(showOptions.canBilling ? '/billing/self' : '/portal');
        const templateOption = json.data.optionData.find(item => {
          return item.name === 'billdefaulttype';
        });
        const templateCode = templateOption && templateOption.value;
        if (cb.utils.isEmpty(templateCode)) {
          cb.utils.alert('没有设置打印模板，请检查', 'error');
          return;
        }
        config = {
          url: 'print/getTemplateContent',
          method: 'POST',
          params: {
            billno: 'rm_retailvouch',
            templateCode
          }
        };
        json = await proxy(config);
        if (json.code !== 200) {
          cb.utils.alert(`获取打印模板失败：${json.message}`, 'error');
          return;
        }
        localStorage.setItem('billing_printTemplate', JSON.stringify(json.data));
        dispatch(getSalesList(''))
      }
      if (cb.rest.terminalType === 3) {
        if (showOptions.canBilling) {
          const canOpen = await judge(cb.rest.AppContext.user);
          if (!canOpen) return;
        }
        config = {
          url: 'billTemplateSet/getGradeAndEmployee',
          method: 'GET'
        };
        json = await proxy(config);
        if (json.data && json.data.operatorInfo)
          dispatch(genAction('PLATFORM_UI_BILLING_SALES_CLERK_INIT', json.data.operatorInfo));
        config = {
          url: 'billTemplateSet/getBelongTemplate',
          method: 'GET'
        };
        json = await proxy(config);
        if (json.code !== 200) {
          alert(`获取开单设置失败：${json.message}`);
          return;
        }
        const deviceInfo = cb.utils.getDevicesInfo();
        cb.rest.AppContext.device = deviceInfo;
        dispatch(genAction('PLATFORM_UI_BILLING_CONFIG_INIT', json.data));
        // dispatch(genAction('PLATFORM_DATA_USER_LOGIN_SUCCEED', cb.rest.AppContext.user));
        dispatch(initConfig(json.data));
      }
    }));
  }
}

const processPosCode = function (json) {
  if (json.code !== 200) {
    cb.utils.alert(`获取POS编号失败：${json.message}`, 'error');
  } else {
    if (json.data && typeof json.data === 'object') {
      const { posnum, billnum } = json.data;
      localStorage.setItem('billing_posCode', posnum);
      if (billnum) {
        const serialNoObj = {}; const dateCode = moment().format('YYMMDD');
        serialNoObj[dateCode] = billnum;
        localStorage.setItem('billing_serialNo', JSON.stringify(serialNoObj));
      }
    } else {
      localStorage.setItem('billing_posCode', json.data);
    }
  }
}

export function changeModalState (modalVisible) {
  return function (dispatch) {
    dispatch(genAction('LOGIN_SHOW_MODAL', modalVisible));
  }
}

export function chooseAcc (currentId) {
  return function (dispatch) {
    dispatch(_chooseAcc(currentId));
  }
}

const _chooseAcc = function (currentId) {
  return async function (dispatch, getState) {
    const data = { userId: currentId };
    const config = {
      url: env.HTTP_USER_SELECTACC,
      method: 'POST',
      params: data
    };
    const json = await proxy(config);

    if (json.code !== 200) {
      cb.utils.alert(json.message, 'warning');
      return;
    }

    localStorage.setItem('userId', currentId);
    getState().user.toJS().afterLoginCallBack();
  }
}

export function changeAcc (currentId) {
  return function (dispatch) {
    cb.utils.confirm('确定要切换账号吗？该操作将重新刷新页面！', function () {
      dispatch(_changeAcc(currentId, function () {
        clearCache();
        localStorage.setItem('userId', currentId);
        location.reload();
      }));
    });
  }
}

const _changeAcc = function (currentId, callback) {
  return function (dispatch) {
    const data = { userId: currentId };
    const config = {
      url: env.HTTP_USER_SELECTACC,
      method: 'POST',
      params: data
    };
    proxy(config)
      .then(json => {
        if (json.code !== 200) {
          cb.utils.alert(json.message, 'warning');
          return;
        }
        localStorage.setItem('userId', currentId);
        callback();
      });
  }
}

export function closeModal (visible) {
  return function (dispatch) {
    dispatch(genAction('LOGIN_SHOW_MODAL', visible));
  }
}

/* 触屏登陆数据处理 */
export const initTouchLogin = async (dispatch, { cacheLoginData = {} }) => {
  /** *处理分发数据开始***/
  let json = cacheLoginData.OrgStoreData
  if (json.code !== 200) {
    // callback未定义，因此将下面的代码注释
    // if (callback)
    // callback();
    // else
    dispatch(genAction('PLATFORM_DATA_USER_LOGIN_FAILURE', { errorMsg: json.message }));
    closeAwaitModal()
    return;
  }
  cb.rest.AppContext.user = json.data;
  if (cb.rest.AppContext.user.userType === 0) {
    cb.route.pushPage('/portal');
    closeAwaitModal()
    return
  }

  json = cacheLoginData.TenantData
  if (json.code === 200) {
    cb.rest.AppContext.user.logo = json.data.logo;
    cb.rest.AppContext.tenant = json.data;
  }
  const showOptions = await getMenuTree(dispatch, { cacheData: cacheLoginData.MenuTreeData });
  Object.assign(cb.rest.AppContext.user, showOptions);
  // dispatch(init(cb.rest.AppContext.user));

  json = cacheLoginData.OptionData
  const option = {};
  if (json.code === 200) {
    json.data.forEach(item => {
      const { name, value } = item;
      option[name] = value;
    });
  }
  cb.rest.AppContext.option = option;

  json = cacheLoginData.EmployeeData
  if (json.data && json.data.operatorInfo)
    dispatch(genAction('PLATFORM_UI_BILLING_SALES_CLERK_INIT', json.data.operatorInfo));

  json = cacheLoginData.TemplateData
  const touchRoutePC = json.data && json.data.touchBillData && json.data.touchBillData.basicSettingData && json.data.touchBillData.basicSettingData.selectType === '2';
  dispatch(genAction('PLATFORM_UI_BILLING_CONFIG_SET_OPTIONS', { touchRoutePC }))
  dispatch(genAction('PLATFORM_UI_BILLING_CONFIG_INIT', { jsonData: json.data, cacheData: cacheLoginData }));
  dispatch(genAction('PLATFORM_DATA_USER_LOGIN_SUCCEED', cb.rest.AppContext.user));
  if (cb.rest.terminalType === 3) {
    dispatch(initConfig(json.data));
    // cb.route.pushPage('/');
    cb.route.replacePage('/');
  } else {
    // dispatch(initConfig(json.data, {cacheData: cacheLoginData}))
    /* add by jinzh1 */
    // if (window.plus) plus.JavaToJs.HardwareInterface('onLogin', cb.rest.AppContext.token);
    // cb.route.pushPage(showOptions.canBilling ? '/billing' : '/portal');

    // json = cacheLoginData.PrintData
    // localStorage.setItem('billing_printTemplate', JSON.stringify(json.data));
  }

  json = cacheLoginData.SaleList
  dispatch(genAction('PLATFORM_UI_BILLING_SALES_SET_CACHEDATE', json));

  if (!touchRoutePC) {
    json = cacheLoginData.ReferData
    dispatch(genAction('PLATFORM_UI_TOUCH_RIGHT_LOGIN_CACHE_REFER_DATA', json))
  }

  json = cacheLoginData.RegionData
  dispatch(genAction('PLATFORM_UI_BILLING_RESERVE_CACHE_REGION', json))

  json = cacheLoginData.DefaultBusinessTypeData
  dispatch(genAction('PLATFORM_UI_BILLING_CACHE_DEFAULT_BUSINESSTYPE', json))

  json = cacheLoginData.OperatorsData
  dispatch(genAction('PLATFORM_UI_BILLING_PENDING_LOGIN_CACHE_DATA', json))

  if (cb.rest.terminalType !== 3) {
    // localStorage.setItem('billing_printTemplate', JSON.stringify(json.data));
    json = cacheLoginData.PosCodeData
    if (json)
      processPosCode(json);

    window.__cacheLoginData = cacheLoginData
    const obj = { OptionData: cb.rest.AppContext.option };
    obj.DualScreenSettingData = cacheLoginData.DualScreenSettingData ? cacheLoginData.DualScreenSettingData.data : {};
    if (window.plus && plus.JavaToJs) {
      plus.JavaToJs.HardwareInterface('login', JSON.stringify({ token: cb.rest.AppContext.token, data: obj }));
    } else if (cb.electron.getSharedObject()) {
      cb.electron.sendOrder('refreshSecondaryScreen', { type: 'login', message: JSON.stringify({ token: cb.rest.AppContext.token, data: obj }) });
    }
    cb.route.pushPage(showOptions.canBilling ? '/billing' : '/portal');
    closeAwaitModal()
  }
}

const closeAwaitModal = () => {
  if (window.__getLoginTouchMask) {
    window.__getLoginTouchMask.destroy()
    window.__getLoginTouchMask = null
  }
}

/* 构造config */
export const configConstructor = (type, billNo) => {
  switch (type) {
    case 'billMeta':
      return {
        url: 'billmeta/getbill',
        method: 'GET',
        params: {
          billno: billNo,
          bIncludeView: false,
          bIncludeViewModel: true
        }
      }
  }
}

export const proxyTool = async (type, billNo, cacheLoginData) => {
  const config = configConstructor(type, billNo)
  const json = await proxy(config);
  cacheLoginData[`BillMetaData_${billNo}`] = json
  if (json.code !== 200) {
    cb.utils.alert(json.message, 'error');
  }
}

const loadOption = async function () {
  const config = {
    url: 'option/getOptionsByParams',
    method: 'POST'
  };
  const json = await proxy(config);
  cacheLoginData.OptionData = json;
  localStorage.setItem('OptionData', JSON.stringify(json.data));
  const option = {};
  if (json.code === 200) {
    json.data && json.data.forEach(item => {
      const { name, value } = item;
      option[name] = value;
    });
  }
  cb.rest.AppContext.option = option;
  perfectOption()
}

const afterStoreLoaded = function (callback, showStore) {
  return async function (dispatch) {
    const { menuId } = cb.rest.AppContext.user;
    if (!menuId)
      getMenuTree(dispatch);
    await loadOption();
    if (showStore !== false)
      dispatch(getGrades(menuId));
    if (callback)
      callback();
    if (cb.rest.terminalType !== 1 || menuId) return;
    dispatch(addItem({
      key: 'PORTAL',
      title: '首页',
      closable: false,
      content: {
        type: 'platform',
        url: 'home'
      }
    }));
    dispatch(getLayOut());
  }
}

const getGrades = function (menuId) {
  return async function (dispatch) {
    const config = {
      url: 'billTemplateSet/getGradeAndEmployee',
      method: 'GET'
    }
    const json = await proxy(config);
    if (json.code !== 200) {
      if (!menuId)
        cb.utils.alert(json.message, 'error');
      return;
    }
    const userGrades = json.data.gradeInfo;
    // if (!userGrades.length) return;
    dispatch(genAction('PLATFORM_DATA_USER_ACCOUNT_MERGE_INFO', { userGrades }));
    const defaultGrade = userGrades.find(item => {
      const { startTime, endTime, bNextDay } = item;
      if (startTime && endTime) {
        // const endMoment = bNextDay ? moment(`${moment().add(1, 'days').format('YYYY-MM-DD')} ${endTime}`, 'YYYY-MM-DD HH:mm:ss') : moment(endTime, 'HH:mm:ss');
        const startMoment = moment(startTime, 'HH:mm:ss');
        const endMoment = moment(endTime, 'HH:mm:ss');
        if (!bNextDay)
          return moment().isBetween(startMoment, endMoment);
        return moment().isBetween(startMoment, moment(`${moment().format('YYYY/MM/DD')} 23:59:59`, 'YYYY/MM/DD HH:mm:ss')) ||
          moment().isBetween(moment(`${moment().format('YYYY/MM/DD')} 00:00:00`, 'YYYY/MM/DD HH:mm:ss'), endMoment);
      }
      return false;
    });
    if (!defaultGrade) {
      if (!menuId)
        cb.utils.alert('没有可用的班次', 'error');
      return;
    }
    dispatch(changeGrade(defaultGrade.id, defaultGrade.name));
  }
}

export function init (loginUser, callback) {
  return function (dispatch, getState) {
    const { userOrgs, userStores, orgId, storeId, showOrg, showStore, menuId } = loginUser || getState().user.toJS();
    if (!userOrgs && !userStores && !orgId && !storeId && !showOrg && !showStore) return;
    if (menuId)
      return dispatch(afterStoreLoaded(callback, showStore));
    let defaultOrg, defaultStore;
    if (showStore) {
      const cacheStore = localStorage.getItem('defaultStore');
      if (cacheStore && cacheStore != storeId) {
        if (cacheStore === 'null') {
          defaultStore = { store: null };
        } else {
          defaultStore = userStores.find(item => {
            return item.store == cacheStore;
          });
          if (defaultStore) {
            const relatedOrgId = defaultStore.org_id;
            if (!relatedOrgId)
              localStorage.setItem('defaultOrg', null);
            else if (relatedOrgId != (localStorage.getItem('defaultOrg') || orgId))
              localStorage.setItem('defaultOrg', relatedOrgId);
          } else {
            const stores = userStores.filter(item => {
              return item.store === storeId;
            });
            if (stores && stores.length) {
              const relatedOrgId = stores[0].org_id;
              if (!relatedOrgId)
                localStorage.setItem('defaultOrg', null);
              else if (relatedOrgId != (localStorage.getItem('defaultOrg') || orgId))
                localStorage.setItem('defaultOrg', relatedOrgId);
            } else if (userStores.length) {
              defaultStore = userStores[0];
              localStorage.setItem('defaultStore', defaultStore.store);
              const relatedOrgId = defaultStore.org_id;
              if (!relatedOrgId)
                localStorage.setItem('defaultOrg', null);
              else if (relatedOrgId != (localStorage.getItem('defaultOrg') || orgId))
                localStorage.setItem('defaultOrg', relatedOrgId);
            }
          }
        }
      } else {
        const stores = userStores.filter(item => {
          return item.store === storeId;
        });
        if (stores && stores.length) {
          const relatedOrgId = stores[0].org_id;
          if (!relatedOrgId)
            localStorage.setItem('defaultOrg', null);
          else if (relatedOrgId != (localStorage.getItem('defaultOrg') || orgId))
            localStorage.setItem('defaultOrg', relatedOrgId);
        } else if (userStores.length) {
          defaultStore = userStores[0];
          localStorage.setItem('defaultStore', defaultStore.store);
          const relatedOrgId = defaultStore.org_id;
          if (!relatedOrgId)
            localStorage.setItem('defaultOrg', null);
          else if (relatedOrgId != (localStorage.getItem('defaultOrg') || orgId))
            localStorage.setItem('defaultOrg', relatedOrgId);
        }
      }
    }
    if (showOrg || showStore) {
      const cacheOrg = localStorage.getItem('defaultOrg');
      if (cacheOrg && cacheOrg != orgId) {
        if (cacheOrg === 'null') {
          defaultOrg = { org: null };
        } else {
          defaultOrg = userOrgs.find(item => {
            return item.org == cacheOrg;
          });
          if (defaultOrg && showStore && !defaultStore) {
            const stores = userStores.filter(item => {
              return item.store === storeId;
            });
            if (stores && stores.length) {
              defaultStore = stores[0];
            } else if (userStores.length) {
              defaultStore = userStores[0];
              localStorage.setItem('defaultStore', defaultStore.store);
            }
          }
        }
      }
    }
    if (defaultOrg && defaultStore)
      return dispatch(_changeOrgAndStore(defaultOrg.org, defaultOrg.org_name, defaultStore.store, defaultStore.store_name, callback));
    if (defaultOrg)
      return dispatch(changeOrg(defaultOrg.org, defaultOrg.org_name, callback, showStore));
    if (defaultStore)
      return dispatch(changeStore(defaultStore.store, defaultStore.store_name, callback));
    dispatch(afterStoreLoaded(callback, showStore));
  }
}

export function billingInit () {
  return function (dispatch, getState) {
    dispatch(getGrades());
  }
}

// 登出
export function logout (router) {
  return (dispatch) => {
    // dispatch({
    //   type: 'PLATFORM_DATA_LOGIN_OUT',
    // })
    if (cb.rest.interMode !== 'touch') {
      Cookies.expire('token');
      localStorage.removeItem('token');
    }
    router.push('/login');
    dispatch(genAction('LOGIN_SAVE_USERLIST', []))
    dispatch(clearMenu());
    dispatch(clear());
    dispatch(clearLayOut());
  }
}

// 账户中心
export function setAccountMsg (value) {
  return (dispatch) => {
    dispatch(genAction('PLATFORM_DATA_USER_ACCOUNT_SET_ACCOUNT_MSG', value));
  }
}

export function setAccountActiveKey (value) {
  return (dispatch) => {
    dispatch(genAction('PLATFORM_DATA_USER_ACCOUNT_SET_ACCOUNT_ACTIVE_KEY', value));
  }
}

export function getLoginUser () {
  return function (dispatch) {
    const config = {
      url: 'user/getLoginUserByToken',
      method: 'GET'
    }
    proxy(config)
      .then(json => {
        if (json.code !== 200) return;
        dispatch(genAction('PLATFORM_DATA_USER_ACCOUNT_SET_INFO', json.data));
      });
  }
}

export function changeOrg (value, name, inner, showStore) {
  return function (dispatch, getState) {
    if (inner) {
      dispatch(_changeOrg(value, name, function () {
        dispatch(afterStoreLoaded(inner, showStore));
      }));
    } else {
      cb.utils.confirm('确定要切换组织吗？该操作将重新刷新页面！', function () {
        dispatch(_changeOrg(value, name, function () {
          clearCache();
          const { userStores } = getState().user.toJS();
          const stores = userStores.filter(item => {
            return item.org_id === value;
          });
          if (stores && stores.length)
            localStorage.setItem('defaultStore', stores[0].store);
          else
            localStorage.setItem('defaultStore', null);
          location.reload();
        }));
      });
    }
  }
}

const _changeOrg = function (value, name, callback) {
  return function (dispatch) {
    const config = {
      url: 'user/changeOrgOrShop',
      method: 'POST',
      params: {
        orgId: value
      }
    }
    proxy(config)
      .then(json => {
        if (json.code !== 200) {
          cb.utils.alert(json.message, 'warning');
          return;
        }
        const info = { defaultOrgName: name, orgId: value };
        Object.assign(cb.rest.AppContext.user, info);
        dispatch(genAction('PLATFORM_DATA_USER_ACCOUNT_CHANGE_ORG', info));
        localStorage.setItem('defaultOrg', value);
        callback();
      });
  }
}

export function changeStore (value, name, inner) {
  return function (dispatch, getState) {
    if (inner) {
      dispatch(_changeStore(value, name, function () {
        dispatch(afterStoreLoaded(inner));
      }));
    } else {
      if (cb.rest.terminalType == 3) {
        dispatch(_changeStore(value, name, function () {
          // dispatch(getGrades());
          // dispatch(genAction('PLATFORM_DATA_USER_ACCOUNT_STORE_CHANGED'));
          clearCache();
          const { userStores } = getState().user.toJS();
          const stores = userStores.filter(item => {
            return item.store === value;
          });
          if (stores && stores.length)
            localStorage.setItem('defaultOrg', stores[0].org_id);
          dispatch(afterLogin());
        }));
      } else {
        cb.utils.confirm('确定要切换门店吗？该操作将重新刷新页面！', function () {
          dispatch(_changeStore(value, name, function () {
            // dispatch(getGrades());
            // dispatch(genAction('PLATFORM_DATA_USER_ACCOUNT_STORE_CHANGED'));
            clearCache();
            const { userStores } = getState().user.toJS();
            const stores = userStores.filter(item => {
              return item.store === value;
            });
            if (stores && stores.length)
              localStorage.setItem('defaultOrg', stores[0].org_id);
            location.reload();
          }));
        });
      }
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
        const info = { defaultStoreName: name, storeId: value };
        Object.assign(cb.rest.AppContext.user, info);
        dispatch(genAction('PLATFORM_DATA_USER_ACCOUNT_CHANGE_STORE', info));
        localStorage.setItem('defaultStore', value);
        callback();
      });
  }
}

const _changeOrgAndStore = function (orgId, orgName, storeId, storeName, callback) {
  return function (dispatch) {
    const config = {
      url: 'user/changeOrgOrShop',
      method: 'POST',
      params: {
        orgId,
        storeId
      }
    }
    proxy(config)
      .then(json => {
        if (json.code !== 200) {
          cb.utils.alert(json.message, 'warning');
          return;
        }
        const info = { defaultOrgName: orgName, orgId, defaultStoreName: storeName, storeId };
        Object.assign(cb.rest.AppContext.user, info);
        dispatch(genAction('PLATFORM_DATA_USER_ACCOUNT_MERGE_INFO', info));
        dispatch(afterStoreLoaded(callback));
      });
  }
}

export function changeGrade (value, name) {
  return function (dispatch) {
    const gradeInfo = { defaultGradeName: name, gradeId: value };
    dispatch(genAction('PLATFORM_DATA_USER_ACCOUNT_CHANGE_GRADE', gradeInfo));
    localStorage.setItem('defaultGrade', JSON.stringify(gradeInfo));
  }
}

export function weChatLogin () {
  return function (dispatch) {
    const config = {
      url: '/weChat/getWechatQrCode',
      method: 'GET'
    }
    if (process.env.NODE_ENV === 'development')
      config.params = { debug: true };
    proxy(config)
      .then(json => {
        if (json.code !== 200) {
          cb.utils.alert(json.message, 'warning');
          console.error(json.message)
          return;
        }
        window.open(json.data, '_self');
      })
  }
}

export function changeInterMode (mode) {
  return function (dispatch) {
    _interMode = mode;
  }
}

export function switchInterMode (mode) {
  return async function (dispatch) {
    const config = {
      url: 'user/switchInterMode',
      method: 'GET',
      options: { uniform: false },
      params: { mode }
    };
    const json = await proxy(config);
    if (json.code !== 200) {
      cb.utils.alert(json.message);
      return;
    }
    if (location.pathname !== '/login') {
      location.href = json.data.redirectUrl;
    } else {
      location.reload();
    }
  }
}

export function touchLogout () {
  return function (dispatch) {
    cb.utils.logout();
    cb.route.redirectLoginPage(false);
    dispatch({ type: 'PLATFORM_DATA_USER_ACCOUNT_SET_ACCOUNT_MSG', payload: { password: '' } })
    cb.events.execute('communication', { type: 'DUAL_SCREEN_CLEAR_SETTING' });
    dispatch({ type: 'PLATFORM_UI_BILLING_CLEAR' });
    dispatch({ type: 'PLATFORM_UI_BILLING_TOUCH_LOGOUT' });
    dispatch(timeTask('close'))
  }
}

export function touchExit () {
  return function (dispatch) {
    if (typeof Electron === 'undefined') {
      cb.utils.logout(true);
      cb.route.redirectLoginPage(false);
      dispatch({ type: 'PLATFORM_DATA_USER_ACCOUNT_SET_ACCOUNT_MSG', payload: { password: '' } })
      cb.events.execute('communication', { type: 'DUAL_SCREEN_CLEAR_SETTING' });
      dispatch({ type: 'PLATFORM_UI_BILLING_CLEAR' });
      dispatch({ type: 'PLATFORM_UI_BILLING_TOUCH_LOGOUT' });
    } else {
      Cookies.expire('token');
      // dispatch(clearMenu());
      // dispatch(clear());
      // dispatch(clearLayOut());
      // cb.events.execute('communication', {type: 'DUAL_SCREEN_CLEAR_SETTING'});
      // dispatch({type: 'PLATFORM_UI_BILLING_CLEAR'});
      // dispatch({type: 'PLATFORM_UI_BILLING_TOUCH_LOGOUT'});
      closeWindow();
    }
  }
}

function closeWindow () {
  setTimeout(function () {
    if (cb.utils.getCookie('token')) {
      closeWindow();
      return;
    }
    Electron.remote.getCurrentWindow().close();
  }, 1000);
}

export function windowClose () {
  return function (dispatch) {
    if (typeof Electron === 'undefined') return;
    Electron.remote.getCurrentWindow().close();
  }
}

export function windowMinimize () {
  return function (dispatch) {
    if (typeof Electron === 'undefined') return;
    Electron.remote.getCurrentWindow().minimize();
  }
}

export const getExperience = () => {
  return (dispatch) => {
    const config = {
      url: 'demoAccount/industryList',
      method: 'GET',
    }
    proxy(config).then(json => {
      if (json.code != 200) {
        cb.utils.alert(json.message, 'error')
        return
      }
      if (!json.data || !json.data.length) return
      dispatch(genAction('PLATFORM_DATA_SET_EXPERIENCE_ACCOUNT', { experienceList: json.data }))
    })
  }
}

export const demoLogin = (accout) => {
  return (dispatch) => {
    const config = {
      url: `/demoAccount/login?loginAccount=${accout}`,
      method: 'GET',
      options: { uniform: false }
    }
    proxy(config).then(json => {
      if (json.code != 200) {
        cb.utils.alert(json.message, 'error')
        return
      }
      location.href = location.origin
      // location.href = '/refer';
    })
  }
}
