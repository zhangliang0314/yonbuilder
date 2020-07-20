import Immutable from 'immutable'
import { genAction, proxy } from '@mdf/cube/lib/helpers/util';
import { initConfig } from './config';
import _ from 'lodash'

const initialState = {};

export default function ($$state = Immutable.fromJS(initialState), action) {
  switch (action.type) {
    case 'DUAL_SCREEN_SET_OPTIONS':
      return $$state.merge(action.payload)
    case 'DUAL_SCREEN_CLEAR_SETTING':
      return $$state.merge({dataSource: null})
    default:
      return $$state
  }
}

export function getDualScreenOption (cacheLoginData = {}) {
  return async function (dispatch) {
    let config = {
      url: 'user/getOrgsAndStores',
      method: 'GET',
    };
    let json = cacheLoginData.OrgStoreData ? cacheLoginData.OrgStoreData : await proxy(config);
    if (json.code === 200) {
      dispatch(genAction('PLATFORM_DATA_USER_LOGIN_SUCCEED', json.data));
      cb.rest.AppContext.user = json.data;
    }
    // config = {
    //     url: 'option/getOptionData',
    //     method: 'POST',
    //     params: {
    //         optionId: 'sys_option'
    //     }
    // };
    // json = await proxy(config);
    // const option = {};
    // if (json.code === 200)
    //     Object.assign(option, json.data);
    // config = {
    //     url: 'option/getOptionData',
    //     method: 'POST',
    //     params: {
    //         optionId: 'business_option'
    //     }
    // };
    // json = await proxy(config);
    // if (json.code === 200)
    //     Object.assign(option, json.data);
    // cb.rest.AppContext.option = option;
    config = {
      url: 'option/getOptionsByParams',
      method: 'POST',
      params: {}
    };
    json = cacheLoginData.OptionData ? cacheLoginData.OptionData : await proxy(config);
    const option = {};
    if (json.code === 200) {
      json.data.forEach(item => {
        const { name, value } = item;
        option[name] = value;
      });
    }
    cb.rest.AppContext.option = option;
    config = {
      url: 'billTemplateSet/getGradeAndEmployee',
      method: 'GET'
    };
    json = cacheLoginData.EmployeeData ? cacheLoginData.EmployeeData : await proxy(config);
    if (json.data && json.data.operatorInfo)
      dispatch(genAction('PLATFORM_UI_BILLING_SALES_CLERK_INIT', json.data.operatorInfo));
    config = {
      url: 'billTemplateSet/getBelongTemplate',
      method: 'GET'
    };
    json = cacheLoginData.TemplateData ? cacheLoginData.TemplateData : await proxy(config);
    if (json.code !== 200) {
      alert(`获取开单设置失败：${json.message}`);
      return;
    }
    const configData = json.data;
    config = {
      url: 'intelPeripheral/getPosDeviceSetting',
      method: 'GET',
      params: { billno: 'aa_posdevicesetting' }
    }
    json = cacheLoginData.DualScreenSettingData ? cacheLoginData.DualScreenSettingData : await proxy(config)
    if (json.code === 200) {
      const dualScreenSetting = json.data.dualScreenSetting[0];
      dispatch(genAction('DUAL_SCREEN_SET_OPTIONS', { dataSource: dualScreenSetting }))
    } else {
      cb.utils.alert(json.message, 'error')
    }
    _.isEmpty(cacheLoginData) ? dispatch(initConfig(configData)) : dispatch(initConfig(configData, {cacheData: cacheLoginData}));
  }
}
