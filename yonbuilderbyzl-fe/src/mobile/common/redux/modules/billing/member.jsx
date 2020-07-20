/**
 * 开单系统会员信息
 * @date     2017-10-07
 * @author   ZHUZIYI<zhuzyh@yonyou.com>
 */
import Immutable from 'immutable';
import { genAction, proxy } from '@mdf/cube/lib/helpers/util';
import { canExecute } from './mix';
import { execMemberPrice } from './product';
import { setSearchBoxFocus } from './goodsRefer';
import * as mixRedux from './mix';
import { getBillingViewModel } from '../billing/config';
import { ModifyReserve } from '../billing/uretailHeader';

const inputValue = '';
const keyMap = {};
/**
 * @disabled false 可编辑
 * @componentType 编辑状态组件类型
 * @field 字段名称
 */
let memberlistdoms = [
  { title: '姓名', field: 'realname', value: '', componentType: 'TextBox', disabled: false },
  { title: '性别', field: 'sex', value: '', componentType: 'Radio', disabled: false },
  { title: '手机号', field: 'phone', value: '', componentType: 'TextBox', disabled: false },
  { title: 'Email', field: 'email', value: '', componentType: 'TextBox', disabled: false },
  { title: '领卡时间', field: 'create_time', value: '', componentType: 'DateBox', disabled: true },
  { title: '生日', field: 'birthday', value: '', componentType: 'DateBox', disabled: false },
  { title: '注册来源', field: 'source_type_name', value: '', componentType: 'TextBox', disabled: true },
  { title: '归属门店', field: 'name', value: '', componentType: 'TextBox', disabled: true },
  { title: '会员卡号', field: 'card_no', value: '', componentType: 'TextBox', disabled: false },
  { title: '会员级别', field: 'level_name', refField: 'level_id', value: '', refData: {}, componentType: 'ComboBox', disabled: false },
  { title: '推荐人', field: 'rmrealname', value: '', componentType: 'TextBox', disabled: true },
  { title: '推荐人手机', field: 'rmphone', value: '', componentType: 'TextBox', disabled: false },
  { title: '默认收货地址', field: 'default_address', value: '', componentType: 'Cascader', disabled: false },
  { title: '详细地址', field: 'address', value: '', componentType: 'TextArea', disabled: false },

]

const defaultMemberListDomsLength = memberlistdoms.length;

const $$initialState = Immutable.fromJS({
  focus: false,
  userInfoStatus: false, // 顾客信息清空状态:false
  salesPermissions: true, // 营业员是否有「会员信息修改」权限、亦可作为是否显示编辑按钮
  memberListDoms: [], // 「会员信息修改」数据
  memberlistdomsCache: [],
  areaCodeCache: '86',
  editable: false,
  goodsTab_totalCount: null, // 会员订单 → 搜索 → 总数据量 clear
  goodsTab_currentPage: 1, // 会员订单 → 搜索 → 当前页码 clear
  inputValue, // 会员订单 → 搜索 → 关键字
  loading: true, // 会员订单 → 列表 → 页面加载中
  pageSize: 8, // 会员订单 → 列表 → 每页条数
  memberInfo: [], // 会员信息 → 数据
  realname: '', // 会员信息 → 数据  → 会员名称（特殊：实时修改）
  memberOrder: [], // 会员订单 → 数据
  tableClassName: '',
  couponInfo: [],
  activeKey: 'billing-member-information', /* 会员详情 active页签的key */

  visible: false, /* 会员详情 是否展现 */
  Region_DataSource: [], /* 省市区数据源 */
  MemberLevel_DataSource: [], /* 会员级别数据源 */
  responseData: {}, /* 会员信息数据  保存用 */
  isAdd: false,
  barcode: null,
  bHasMember: false,
  areaCode: '86',
  areaCodeList: [],
});

// Reducer
export default ($$state = $$initialState, action) => {
  switch (action.type) {
    case 'PLATFORM_UI_BILLING_MEMBER_SET_OPTIONS':
      return $$state.merge(action.payload);
    // 查询顾客信息
    case 'PLATFORM_UI_BILLING_QUERY_MEMBER':
      return $$state.set('userInfoStatus', true)
        .set('bHasMember', true)
        .set('memberInfo', action.payload)
    case 'PLATFORM_UI_BILLING_MEMBER_DATA_DEAL':
      return $$state.merge(action.payload);
    // 查询顾客卡券
    case 'PLATFORM_UI_BILLING_QUERY_MemberCoupon':
      return $$state.set('couponInfo', action.payload)
    case 'PLATFORM_UI_BILLING_QUERY_ORDER':
      return $$state.merge(action.payload)
        .set('loading', false);
    case 'PLATFORM_UI_BILLING_CLEAR':
      return $$state.set('memberInfo', [])
        .set('inputValue', '')
        .set('realname', '')
        .set('isAdd', false)
        .set('responseData', {})
        .set('couponInfo', [])
        .set('bHasMember', false)
        .set('userInfoStatus', false);
    case 'PLATFORM_UI_MEMBER_CLEAR':
      return $$state.set('memberInfo', [])
        .set('inputValue', '')
        .set('realname', '')
        .set('isAdd', false)
        .set('responseData', {})
        .set('couponInfo', [])
        .set('userInfoStatus', false);
    case 'PLATFORM_UI_MEMBERBOX_CLEAR':
      return $$state.merge(action.payload);
    case 'PLATFORM_UI_BILLING_SAVE_MEMBER_INFO':
      return $$state.merge(action.payload);
    // 缓存保存提交改变状态
    case 'PLATFORM_UI_BILLING_CANCEL_SAVE_MEMBER_INFO':
      return $$state.merge(action.payload);
    // 编辑数据暂存
    case 'PLATFORM_UI_BILLING_CACHE_EDIT_MEMBER_INFO':
      return $$state.merge(action.payload);
    case 'PLATFORM_UI_BILLING_IS_EDIT_STATE':
      return $$state.merge(action.payload);
    /* 省市区数据源 */
    case 'PLATFORM_UI_BILLING_MEMBER_SET_REGION_DATASOURCE':
      getKeyMap(action.payload[0]);
      return $$state.set('Region_DataSource', action.payload);
    /* 会员级别数据源 */
    case 'PLATFORM_UI_BILLING_MEMBER_SET_MEMBERLEVEL_DATASOURCE':
      return $$state.set('MemberLevel_DataSource', action.payload);

    /* add by jinzh1 整合移动--扫码返回 */
    case 'PLATFORM_UI_MEMBER_SCAN_RETURN':
      return $$state.merge({ barcode: action.payload });
    case 'PLATFORM_UI_BILLING_EDIT_AREACODE':
      return $$state.set('areaCode', action.payload);
    case 'PLATFORM_UI_BILLING_SET_AREACODELIST':
      return $$state.set('areaCodeList', action.payload)
    default:
      return $$state;
  }
}

export function MemberBoxClear (inputValue) {
  return genAction('PLATFORM_UI_MEMBERBOX_CLEAR', { inputValue: inputValue });
}

export function cacheAreaCode (value) {
  return genAction('PLATFORM_UI_BILLING_EDIT_AREACODE', value);
}

export function getAreaCode () {
  return async function (dispatch) {
    const config = {
      url: 'enum/getEnumStrFetch',
      method: 'GET',
      params: {
        enumtype: 'aa_mpcountrycode'
      }
    };
    const json = await proxy(config);
    if (json.code !== 200) {
      cb.utils.alert(json.message, 'error');
      return;
    }
    const areaCodeList = JSON.parse(json.data);
    dispatch(genAction('PLATFORM_UI_BILLING_SET_AREACODELIST', areaCodeList));
  }
}

export function setMemberBoxFocus (focus) {
  return genAction('PLATFORM_UI_BILLING_MEMBER_SET_OPTIONS', { focus });
}

export function queryMemberCoupon (mid, storeid, data, dispatch) {
  const config = {
    url: 'thirdparty/member/queryallcoupon',
    method: 'POST',
    params: {
      mid,
      storeid
    }
  };

  proxy(config)
    .then(json => {
      if (json.code !== 200) {
        return;
      }
      dispatch(genAction('PLATFORM_UI_BILLING_QUERY_MemberCoupon', json.data));
    });
}
export function queryMemberById (mid) {
  return function (dispatch, getState) {
    const memberListDoms = memberlistdoms;
    dispatch(queryMember('', memberListDoms, mid));
  }
}

/**
 *
 * 查询顾客信息
 * @param {*} phone
 * @param {*} memberListDoms
 * API返回值说明，会员自定义项 responseData.defines
 * type 控件类型： TextBox 文本 | ComboBox 选择       | NumberBox 数字 | CheckBox 复选框
 * type 控件类型： DateBox 日期 | DateTimeBox 日期时间 | TimeBox 时间   | TextArea 备注
 * length 是 存储长度
 * precision 是 数值总长度 （控件类型为NumberBox才有）
 * scale 是 数值小数位（控件类型为NumberBox才有）
 */
export function queryMember (phone, memberListDoms, mid, isSelf, bHideAlert, isSelfScan) {
  return function (dispatch, getState) {
    if (!beforeInputMember(getState)) return
    if (!memberListDoms) memberListDoms = memberlistdoms;
    /* 清除barcode */
    dispatch(genAction('PLATFORM_UI_MEMBER_SCAN_RETURN', null));
    canExecute(getState(), 'Member', function () {
      if (!phone && !mid) {
        cb.utils.alert('请输入会员的卡号或手机号', 'error');
        return;
      }
      let products = getState().product.get('products');
      products = Immutable.Iterable.isIterable(products) ? products.toJS() : Immutable.Iterable.isIterable(products);
      let autoPromotion = false;
      for (var i = 0; i < products.length; i++) {
        if (products[i].autoPromotion) {
          autoPromotion = true;
          break;
        }
      }
      if (autoPromotion) {
        cb.utils.alert('已经执行了商品促销/秒杀，不能录入会员！', 'error');
        return;
      }
      const config = {
        url: 'thirdparty/member/querymember',
        method: 'GET',
        params: {
          phone: phone || 18010615182
        }
      }
      if (mid) config.params = { mid: mid };
      proxy(config)
        .then(json => {
          if (json.code === 200) {
            const responseData = json.data;
            const defines = responseData.defines;// 自定义项数据
            // 处理默认收获地址特殊情况，需拼接字符串
            const attach_address = responseData.attach_address ? responseData.attach_address : {};
            const default_address = attach_address.province === undefined ? '' : attach_address.province + attach_address.city + attach_address.area;
            // let regionCode = responseData.attach_address
            // 生日未定义，避免 NaN
            const birthday = responseData.birthday === '0' ? '' : responseData.birthday;
            memberlistdoms.map((memberlistdom, index) => {
              // 默认地址拼接而成，需要特殊处理
              if (memberlistdom.field === 'birthday') {
                memberlistdom.value = birthday;
              } else if (memberlistdom.field === 'default_address') {
                memberlistdom.value = default_address;

                const name = attach_address.province === undefined ? '' : '中国,' + attach_address.province + ',' + attach_address.city + ',' + attach_address.area;
                if (name == '') {
                  memberlistdom.id = [];
                } else {
                  let ids = [];
                  const regionCode = getRegionIdByName(name);
                  if (regionCode) {
                    ids.push(keyMap[regionCode].id);
                    ids = getRegionIdByParent(ids, keyMap[regionCode].parent);
                    ids = ids.reverse();
                    memberlistdom.id = ids;
                  }
                }
                memberlistdom.province = attach_address.province;
                memberlistdom.city = attach_address.city;
                memberlistdom.area = attach_address.area;
              } else if (memberlistdom.field == 'address') {
                memberlistdom.value = attach_address.address;
              } else {
                memberlistdom.value = responseData[memberlistdom.field];// 否者直接从返回数据读取插入
              }
            })
            if(memberListDoms.length <= defaultMemberListDomsLength) // 默认 9 条数据 memberlistdoms.length
              defines.map(function (data, index, arr) {
                memberlistdoms.push(
                  { title: data.name, field: data.code, value: data.value, componentType: data.type, disabled: false, enums: data.enums, refField: data.code }
                );
              })
            const realname = memberlistdoms['0'].value;
            dispatch(genAction('PLATFORM_UI_BILLING_QUERY_MEMBER', json));
            dispatch(genAction('PLATFORM_UI_BILLING_MEMBER_DATA_DEAL', {
              memberListDoms: memberlistdoms,
              memberlistdomsCache: memberlistdoms,
              realname: realname,
              responseData: responseData,
              areaCode: responseData.country_code,
              areaCodeCache: responseData.country_code,
            }));
            if (getState().product.toJS().products.length && !mid && extendFilter())
              dispatch(execMemberPrice(json.data.mid, json));
            dispatch(setSearchBoxFocus(true));
            const userState = getState().user.toJS();
            const storeId = userState.storeId || userState.stores[0].store;
            const data = mixRedux.getRetailVoucherData(getState());
            queryMemberCoupon(json.data.mid, storeId, data, dispatch);

            /* 添加会员 更新表头收货人，收货人手机号字段 */
            const { billingStatus, infoData } = getState().uretailHeader.toJS();
            if (billingStatus == 'PresellBill') {
              const data = infoData;
              if (data.contacts == '' && data.phone == '') {
                data.contacts = realname;
                data.phone = responseData.phone;
                dispatch(ModifyReserve(data));
              }
            }
            /* 赊销 */
            if (billingStatus !== 'OnlineBill' && billingStatus !== 'OnlineBackBill') {
              const storeType = getState().reserve.get('storeType')
              if (storeType == 1 || storeType == 3) {
                const isOwned = responseData.is_credit_sale_opened /* 0:否 1:是 */
                const customer = responseData.credit_assoc_customer/* 关联客户ID */
                const cust_name = responseData.cust_name /* 关联客户名称 */
                const infoData = getState().uretailHeader.toJS().infoData
                infoData.isControlCredit = responseData.is_control_credit /* 会员是否控制信用额度 */
                infoData.canCreditAmount = responseData.available_credit_amount /* 会员可用信用额度 */
                infoData.bCusCreCtl = responseData.responseData /* 客户是否控制信用额度 1控制，否则不控制 */
                infoData.creditBalance = responseData.creditBalance /* 客户信用余额 */
                if (isOwned == 1) {
                  infoData.iOwesState = 1
                }
                if (storeType == 1 && customer) {
                  infoData.iCustomerid = customer
                  infoData.iCustomerName = cust_name
                  dispatch(genAction('PLATFORM_UI_BILLING_RESERVE_SET_COMMON_DATA', { credit_assoc_customer: customer, cust_name }))
                }
                dispatch(genAction('PLATFORM_UI_BILLING_HEADER_SET_COMMONDATA', { infoData }))
                dispatch(genAction('BILLING_MEMBER_SET_MEMBERINFO', responseData));
              }
            }

            /* 自助大屏 */
            if (isSelf) {
              dispatch(genAction('PLATFORM_UI_BILLING_SELF_SET_COMMON', { memberVisible: false, memberNo: '', scanEntry: 'product' }))
              return
            }
          }
          if (json.code !== 200) {
            if (isSelf) {
              window.sendSef('noMemberAlarm', '')
              if (isSelfScan) {
                cb.utils.alert('无该会员信息', 'warning');
                // dispatch(queryMemberDefines(getState().member.get('inputValue')))
                return
              }
              dispatch(genAction('PLATFORM_UI_BILLING_SELF_SET_COMMON', { memberMsg: '无该会员信息' }))
              // dispatch(queryMemberDefines(getState().member.get('inputValue')))
              return
            }
            if (!bHideAlert) {
              cb.utils.alert('无该会员信息', 'warning');
              if (getState().member.get('inputValue')) {
                dispatch(queryMemberDefines(getState().member.get('inputValue')))
              }
            }
          }
        });
    });
  }
}

// 交易记录默认查询
export function orderDefaultQuery (mid) {
  return function (dispatch) {
    const config = {
      url: 'thirdparty/member/orderdefaultquery',
      method: 'GET',
      params: {
        mid: mid
      }
    }
    proxy(config)
      .then(json => {
        if (json.code === 200) {
          const goodsTab_totalCount = json.data.length;
          const tableClassName = goodsTab_totalCount > 0 ? 'table_search_noData' : '';
          json.data.map(item => { item.quantity = item.quantity ? parseFloat(item.quantity).toFixed(2) : 0 })
          dispatch(genAction('PLATFORM_UI_BILLING_QUERY_ORDER', { memberOrder: json, goodsTab_totalCount: goodsTab_totalCount, tableClassName: tableClassName }));
        }
        if (json.code !== 200) {
          cb.utils.alert(json.message, 'error');
        }
      });
  }
}

// 交易记录条件查询
// {“mid”:”1233”,” bdate”:”2017-01-01” ,” edate ”:”2017-01-21” ,” keyvalue”:”001”}
export function orderQuery (mid, bdate, edate, keyvalue) {
  return function (dispatch) {
    const config = {
      url: 'thirdparty/member/orderquery',
      method: 'POST',
      params: {
        mid: mid,
        bdate: bdate,
        edate: edate,
        keyvalue: keyvalue
      }
    }
    proxy(config)
      .then(json => {
        if (json.code === 200) {
          const goodsTab_totalCount = json.data.length;
          json.data.map(item => { item.quantity = item.quantity.toFixed(2) })
          dispatch(genAction('PLATFORM_UI_BILLING_QUERY_ORDER', { memberOrder: json, goodsTab_totalCount: goodsTab_totalCount }));
        }
        if (json.code !== 200) {
          cb.utils.alert(json.message, 'error');
        }
      });
  }
}

// 保存
export function saveMemberInfo (obj, callback) {
  return function (dispatch, getState) {
    const billingStatus = getState().uretailHeader.toJS().billingStatus;
    const config = {
      url: 'thirdparty/member/save',
      method: 'post',
      params: obj
    }
    proxy(config)
      .then(json => {
        if (callback) callback(json.code);
        if (json.code === 200) {
          const responseData = JSON.parse(json.data);
          const realname = memberlistdoms['0'].value;
          dispatch(genAction('PLATFORM_UI_BILLING_SAVE_MEMBER_INFO', {
            editable: false,
            memberListDoms: memberlistdoms,
            memberlistdomsCache: memberlistdoms,
            realname: realname
          }));
          if (billingStatus == 'CashSale' || billingStatus == 'PresellBill' || billingStatus == 'NoFormerBackBill') {
            dispatch(queryMember(responseData.phone, memberlistdoms));
          }
          cb.utils.alert('保存成功！', 'success');
        }
        if (json.code !== 200) {
          cb.utils.alert(json.message, 'error');
        }
      });
  }
}

// 是否编辑态
export function isEditState (e) {
  return genAction('PLATFORM_UI_BILLING_IS_EDIT_STATE', { editable: e });
}

// 取消保存
export function cancelSaveMemberInfo (memberlistdomsCache, areaCodeCache) {
  return genAction('PLATFORM_UI_BILLING_CANCEL_SAVE_MEMBER_INFO', { salesPermissions: true, memberListDoms: memberlistdomsCache, areaCode: areaCodeCache });
}

// 编辑缓存数据
export function cacheEditMemberInfo (id, value) {
  return function (dispatch, getState) {
    const { memberListDoms } = getState().member.toJS();
    if (value === undefined) return;
    memberListDoms.map((memberlistdom) => {
      if (memberlistdom.field === id) { memberlistdom.value = value; }
    })
    memberlistdoms = memberListDoms;
    dispatch(genAction('PLATFORM_UI_BILLING_CACHE_EDIT_MEMBER_INFO', { memberListDoms: memberListDoms }));
  }
}

export function setMemberOption (data) {
  return function (dispatch) {
    dispatch(genAction('PLATFORM_UI_BILLING_MEMBER_SET_OPTIONS', data));
  }
}

export function setDefaultAddress (field, ids, options) {
  return function (dispatch, getState) {
    const { memberListDoms } = getState().member.toJS();
    memberListDoms.map((dom, index) => {
      if (dom.field === field) {
        memberListDoms[index].id = ids;
        memberListDoms[index].province = options[1] ? options[1].label : null;
        memberListDoms[index].city = options[2] ? options[2].label : null;
        memberListDoms[index].area = options[3] ? options[3].label : null;
        memberListDoms[index].value = options[1] ? options[1].label + options[2].label + options[3].label : '';
      }
    });
    console.log('memberListDoms   member', memberListDoms)
    memberlistdoms = memberListDoms;
    dispatch(genAction('PLATFORM_UI_BILLING_CACHE_EDIT_MEMBER_INFO', { memberListDoms: memberListDoms }));
  }
}
export function setMemberLevel (value, refData) {
  return function (dispatch, getState) {
    const { memberListDoms } = getState().member.toJS();
    memberListDoms.map((dom, index) => {
      if (dom.field === 'level_name') {
        memberListDoms[index].value = value;
        memberListDoms[index].refData = refData;
      }
    });
    memberlistdoms = memberListDoms;
    dispatch(genAction('PLATFORM_UI_BILLING_CACHE_EDIT_MEMBER_INFO', { memberListDoms: memberListDoms }));
  }
}
export function setMemberDefine (value, type) {
  return function (dispatch, getState) {
    const { memberListDoms } = getState().member.toJS();
    memberListDoms.map((dom, index) => {
      if (dom.field === type) {
        memberListDoms[index].value = value;
      }
    });
    memberlistdoms = memberListDoms;
    dispatch(genAction('PLATFORM_UI_BILLING_CACHE_EDIT_MEMBER_INFO', { memberListDoms: memberListDoms }));
  }
}
// ---------------------------------------------------------------------------------------------------------//
/* 获取会员自定义项--- 适用于新增 */
export function queryMemberDefines (inputValue) {
  return function (dispatch, getState) {
    const config = {
      url: 'thirdparty/member/querymemberdefines',
      method: 'POST',
      params: {}
    };
    proxy(config)
      .then(function (json) {
        if (json.code !== 200) {
          cb.utils.alert(json.message, 'error');
        }
        const defines = json.data;
        const { storeId, defaultStoreName } = getState().user.toJS();
        memberlistdoms = [
          { title: '姓名', field: 'realname', value: '', componentType: 'TextBox', disabled: false },
          { title: '性别', field: 'sex', value: '', componentType: 'Radio', disabled: false },
          { title: '手机号', field: 'phone', value: inputValue || '', componentType: 'TextBox', disabled: false },
          { title: 'Email', field: 'email', value: '', componentType: 'TextBox', disabled: false },
          { title: '领卡时间', field: 'create_time', value: '', componentType: 'DateBox', disabled: true },
          { title: '生日', field: 'birthday', value: '', componentType: 'DateBox', disabled: false },
          { title: '注册来源', field: 'source_type_name', value: '', componentType: 'TextBox', disabled: true },
          { title: '归属门店', field: 'store_id', value: defaultStoreName, id: storeId, componentType: 'TextBox', disabled: true },
          { title: '会员卡号', field: 'card_no', value: '', componentType: 'TextBox', disabled: false },
          { title: '推荐人', field: 'rmrealname', value: '', componentType: 'TextBox', disabled: true },
          { title: '默认收货地址', field: 'default_address', value: '', componentType: 'Cascader', disabled: false },
          { title: '推荐人手机', field: 'rmphone', value: '', componentType: 'TextBox', disabled: false },
          { title: '详细地址', field: 'address', value: '', componentType: 'TextArea', disabled: false },
        ]
        defines.map(function (data, index, arr) {
          memberlistdoms.push(
            { title: data.name, field: data.code, value: data.value, componentType: data.type, disabled: false, enums: data.enums }
          );
        })
        dispatch(genAction('PLATFORM_UI_BILLING_MEMBER_DATA_DEAL', {
          memberListDoms: memberlistdoms,
          isAdd: true,
          visible: true,
          editable: true,
          areaCode: '86',
        }));
      });
  }
}
/* 获取地区数据源 */
export function getRegion () {
  return function (dispatch) {
    if (cb.rest.interMode === 'touch') return
    const config = {
      url: 'region/getAllregion',
      method: 'POST',
      params: {}
    };
    proxy(config)
      .then(function (json) {
        if (json.code !== 200) {
          cb.utils.alert(json.message, 'error');
        }
        getKeyMap(json.data[0]);
        dispatch(genAction('PLATFORM_UI_BILLING_MEMBER_SET_REGION_DATASOURCE', json.data));
      });
  }
}
export function setMemberListDoms (listDoms) {
  return function (dispatch) {
    if (listDoms) {
      memberlistdoms = listDoms;
    } else {
      memberlistdoms = [
        { title: '姓名', field: 'realname', value: '', componentType: 'TextBox', disabled: false },
        { title: '性别', field: 'sex', value: '', componentType: 'Radio', disabled: false },
        { title: '手机号', field: 'phone', value: '', componentType: 'TextBox', disabled: false },
        { title: 'Email', field: 'email', value: '', componentType: 'TextBox', disabled: false },
        { title: '领卡时间', field: 'create_time', value: '', componentType: 'DateBox', disabled: true },
        { title: '生日', field: 'birthday', value: '', componentType: 'DateBox', disabled: false },
        { title: '注册来源', field: 'source_type_name', value: '', componentType: 'TextBox', disabled: true },
        { title: '归属门店', field: 'name', value: '', componentType: 'TextBox', disabled: true },
        { title: '会员卡号', field: 'card_no', value: '', componentType: 'TextBox', disabled: false },
        { title: '会员级别', field: 'level_name', refField: 'level_id', value: '', componentType: 'ComboBox', disabled: false },
        { title: '推荐人', field: 'rmrealname', value: '', componentType: 'TextBox', disabled: true },
        { title: '推荐人手机', field: 'rmphone', value: '', componentType: 'TextBox', disabled: false },
        { title: '默认收货地址', field: 'default_address', value: '', componentType: 'Cascader', disabled: false },
        { title: '详细地址', field: 'address', value: '', componentType: 'TextArea', disabled: false },
      ]
    }
    dispatch(genAction('PLATFORM_UI_BILLING_MEMBER_DATA_DEAL', {
      memberListDoms: memberlistdoms,
    }));
  }
}
const getKeyMap = (node) => {
  if (node.id == null) return;
  keyMap[node.id] = node;
  if (!node.children || !node.children.length) return;
  node.children.forEach(function (item) {
    getKeyMap(item);
  }, this);
};
const getRegionIdByParent = (keys, parent) => {
  const id = keyMap[parent].id;
  keys.push(id);
  if (keyMap[parent].parent) {
    getRegionIdByParent(keys, keyMap[parent].parent)
  }
  return keys;
}
const getRegionIdByName = (name) => {
  for (var key in keyMap) {
    if (name == keyMap[key].mergername) return key;
  }
}
export function queryRecoMember (phone) {
  return function (dispatch, getState) {
    if (!phone || phone == '') return;
    const { memberListDoms, responseData } = getState().member.toJS();
    const config = {
      url: 'thirdparty/member/querymember',
      method: 'GET',
      params: {
        phone: phone
      }
    }
    proxy(config)
      .then(function (json) {
        if (json.code !== 200) {
          cb.utils.alert(json.message, 'error');
          memberListDoms.map((memberlistdom) => {
            if (memberlistdom.field === 'rmphone') { memberlistdom.value = ''; }
            if (memberlistdom.field === 'rmrealname') { memberlistdom.value = ''; }
          })
          memberlistdoms = memberListDoms;
          dispatch(genAction('PLATFORM_UI_BILLING_CACHE_EDIT_MEMBER_INFO', { memberListDoms: memberListDoms }));
          return
        }
        responseData.recommender = json.data.mid;
        memberListDoms.map((memberlistdom) => {
          if (memberlistdom.field === 'rmrealname') { memberlistdom.value = json.data.realname; }
        })
        memberlistdoms = memberListDoms;
        dispatch(genAction('PLATFORM_UI_BILLING_CACHE_EDIT_MEMBER_INFO', { memberListDoms: memberListDoms, responseData }));
      });
  }
}
/* 会员级别参照数据源 */
export function getMemberLevel () {
  return function (dispatch, getState) {
    const { responseData } = getState().member.toJS();
    const config = {
      url: 'membercenter/bill/ref/getRefData',
      method: 'POST',
      params: {
        page: { pageSize: 100, pageIndex: 1 },
        refCode: 'aa_memberlevel',
        key: 'iMemberid_cMemberLevelName',
        billnum: 'rm_saleanalysis',
        externalData: 'filter',
        dataType: 'grid',
      }
    }
    if (responseData.scope_id && responseData.scope_level) {
      config.params.condition = {
        isExtend: true, simpleVOs: [
          { field: 'iScopeLevel', op: 'eq', value1: responseData.scope_level },
          { field: ' iScopeID', op: 'eq', value1: responseData.scope_id },
        ]
      }
    }
    proxy(config)
      .then(function (json) {
        if (json.code !== 200) {
          cb.utils.alert(json.message, 'error');
        }
        dispatch(genAction('PLATFORM_UI_BILLING_MEMBER_SET_MEMBERLEVEL_DATASOURCE', json.data.recordList));
      });
  }
}

/* lz 录入会员扩展 */
const beforeInputMember = (getState) => {
  const billingViewModel = getBillingViewModel();
  if (billingViewModel) {
    return billingViewModel.execute('beforeInputMember', {})
  }
  return true
}

/* lz 录完会员之后是否执行会员价扩展 */
const extendFilter = () => {
  const billingViewModel = getBillingViewModel();
  if (billingViewModel) {
    return billingViewModel.execute('afterMemberGetMemberPrice', {})
  }
  return true
}
