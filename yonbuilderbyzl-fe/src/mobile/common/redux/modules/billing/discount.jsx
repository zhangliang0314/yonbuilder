import Immutable from 'immutable';
import { genAction, proxy } from '@mdf/cube/lib/helpers/util';
// import _ from 'lodash'

import { getRetailVoucherData, getOptions, getPromotionMutexMap } from './mix';
import { showOperator } from './operator';
import { getExchangeBillMapping } from './product';
import { setSearchBoxFocus } from './goodsRefer'
import { initData } from './editRow';
import { cancelClear } from './checkMsg';
import { getBillingViewModel } from './config';

let discountDataBackup = null;
let bSupperOperatorid = false;
let alertMsg = '';

// let cacheDiscoutData = null;
let isSendMsg = false;
// let cacheDiscoutKey = null;
let productsChildrenField = null;
const $$initialState = Immutable.fromJS({
  dhData: { dqPrices: 0, bhPrices: 0, zhPrices: 0, discount: 100.00 },
  zdData: { zdPrices: 0, jmPrices: 0, jhPrices: 0, discount: 100.00 },
  activeKey: 'dhzk',
  focusKey: '',
  changeRows: {},
  isExpand: false,
  operator: {},
  options: {},
  userdiscounts: null, /* 授权人  现场折扣权限 */
  nowOperator: {}, // 当前操作员
  nowUserdiscounts: null, // 当前操作员现场折扣权限
  doneActiveKey: '', /* 上次执行的折扣为 单行还是整单的标识 */
  applyAllRow: false, /* 适用所有行 默认不勾选 */
  cachOperator: {}, /* 缓存的上一次 折扣授权人 */
  cachUserdiscounts: null, /* 缓存的上一次 折扣授权人权限 */
  bCheckDiscountAuth: true, /* add by jinzh1 是否校验现场折扣权限 */
})

// reducer
export default ($$state = $$initialState, action) => {
  switch (action.type) {
    case 'PLATFORM_UI_BILLING_DISCOUNT_SET_COMMONDATA':
      return $$state.merge(action.payload);
    case 'PLATFORM_UI_BILLING_DISCOUNT_SET_OPERATOR':
      return $$state.merge({ operator: action.payload });

    case 'PLATFORM_CANCEL_DISCOUNT':
    case 'PLATFORM_UI_BILLING_CLEAR':
      discountDataBackup = null;
      // cacheDiscoutData = null;
      // cacheDiscoutKey = null;
      isSendMsg = false;
      return $$state.merge({
        operator: {}, changeRows: {}, doneActiveKey: '', isExpand: false,
        dhData: { dqPrices: 0, bhPrices: 0, zhPrices: 0, discount: 100.00 },
        zdData: { zdPrices: 0, jmPrices: 0, jhPrices: 0, discount: 100.00 },
        cachOperator: {}, cachUserdiscounts: null, bCheckDiscountAuth: true
      });
    // "activeKey": 'dhzk',"focusKey": '',新开单 不清 wjl提出 yh授权
    case 'PLATFORM_UI_BILLING_RESTORE_PREFERENTIAL_SCENE_BACKUP':
      discountDataBackup = action.payload.backData;
      return $$state.merge({ changeRows: action.payload.changeRows });
    /* add by jinzh1 是否校验现场折扣权限 */
    case 'PLATFORM_UI_BILLING_DISCOUNT_SET_CHECKDISCOUNTAUTH':
      return $$state.merge({ bCheckDiscountAuth: action.payload });
    case 'PLATFORM_UI_PRODUCT_SET_CHILDREN_FIELD':
      productsChildrenField = action.payload;
      return $$state;
    case 'PLATFORM_UI_BILLING_VIEWMODEL_INIT':
      return $$state.set('viewModel', action.payload.get(productsChildrenField).getEditRowModel())
        .set('discountMeta', action.payload.getViewMeta('rm_retailvouch_gift_discount_info'));
    default:
      return $$state;
  }
}
export function setData (val) {
  return function (dispatch) {
    dispatch(genAction('PLATFORM_UI_BILLING_DISCOUNT_SET_COMMONDATA', val));
  }
}
export function updateSuperOperator (operator, userdiscounts) {
  return function (dispatch) {
    const option = {
      operator: operator, userdiscounts: userdiscounts,
      cachOperator: operator, cachUserdiscounts: userdiscounts
    };
    dispatch(genAction('PLATFORM_UI_BILLING_DISCOUNT_SET_COMMONDATA', option));
  }
}
/* 获取当前操作员 */
export function getOperator () {
  return function (dispatch, getState) {
    const user = getState().user.toJS();
    const operator = {
      id: user.id,
      name: user.name,
      mobile: user.mobile
    };
    // const config = {
    //   url: 'bill/detail',
    //   method: 'GET',
    //   params: { 'id': userId, 'billnum': 'aa_user' }
    // };
    // proxy(config)
    //   .then(function (json) {
    //     if (json.code !== 200) {
    //       cb.utils.alert(json.message, 'error');
    //     }
    dispatch(genAction('PLATFORM_UI_BILLING_DISCOUNT_SET_OPERATOR', operator));
    dispatch(getUserDiscounts(operator));
    // });
  }
}
/* 获取当前操作员现场折扣权限 */
export function getUserDiscounts (operator) {
  return function (dispatch, getState) {
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
        dispatch(genAction('PLATFORM_UI_BILLING_DISCOUNT_SET_COMMONDATA', { userdiscounts: data, nowOperator: operator, nowUserdiscounts: data }));
      });
  }
}
/* 操作员现场折扣权限校验 */
const checkOperatorDiscoutAuth = (globalState) => {
  let { zdData, dhData, activeKey, isExpand, userdiscounts } = globalState.discount.toJS();
  // const member = globalState.member.toJS();
  if (!userdiscounts) userdiscounts = [];/* 操作员现场折扣权限列表 */
  if (userdiscounts.length == 0) {
    alertMsg = '此账号没有该折扣的权限';
    return false;
  }
  if (activeKey == 'dhzk') {
    if (dhData.discount == 100) return true;
    if (isExpand) {
      return checkAuthByIndustry(globalState);
    } else {
      return checkAuthByDH(globalState);
    }
  } else {
    if (zdData.discount == 100) return true;
    return checkAuthAll(globalState);
  }
}
/* 单行折扣 现场折扣权限校验 */
const checkAuthByDH = (globalState) => {
  const { dhData, userdiscounts, applyAllRow } = globalState.discount.toJS();
  const { focusedRow, products } = globalState.product.toJS();
  const member = globalState.member.toJS();
  const bExecMember = !!member.responseData.mid;
  alertMsg = '';
  if (applyAllRow) {
    for (var h = 0; h < products.length; h++) {
      let productClass = products[h].product_productClass_path;/* 行 商品分类id */
      productClass = productClass ? productClass.split('|') : [];
      const ds = dhData.discount;/* 行 折扣率 */
      let hasAuth = false; let isAuth = false;

      for (var j = 0; j < productClass.length; j++) {
        const cId = productClass[j];
        if (cId != '') {
          for (let i = 0; i < userdiscounts.length; i++) {
            const classId = userdiscounts[i].productclass;
            const userDs = userdiscounts[i].discountdlimit;
            let execdiscount = userdiscounts[i].execdiscount;/* 已执行会员折扣 */
            if (execdiscount == null || execdiscount == undefined) {
              execdiscount = bExecMember;
            }
            if ((classId == cId || classId == undefined || classId == '') && bExecMember == execdiscount) {
              hasAuth = true;
              if (ds < userDs && !isAuth) {
                alertMsg = '当前折扣率为(' + ds + '),不得低于当前操作员折扣率下限(' + userDs + ')';
                // return false;
              } else {
                isAuth = true;
                alertMsg = '';
              }
            }
          }
        }
      }
      if (!hasAuth) {
        alertMsg = '当前操作员没有设置此分类商品的现场折扣权限';
        return false;
      }
      if (!isAuth && alertMsg != '')
        return false;
    }
    return true;
  } else {
    let productClass = focusedRow.product_productClass_path;/* 行 商品分类id */
    productClass = productClass ? productClass.split('|') : [];
    const ds = dhData.discount;/* 行 折扣率 */
    for (let i = 0; i < userdiscounts.length; i++) {
      const classId = userdiscounts[i].productclass;
      const userDs = userdiscounts[i].discountdlimit;
      let execdiscount = userdiscounts[i].execdiscount;/* 已执行会员折扣 */
      if (execdiscount == null || execdiscount == undefined) {
        execdiscount = bExecMember;
      }
      for (let j = 0; j < productClass.length; j++) {
        const cId = productClass[j];
        if (cId != '' && (classId == cId || classId == undefined || classId == '') && bExecMember == execdiscount) {
          if (ds < userDs) {
            alertMsg = '当前折扣率为(' + ds + '),不得低于当前操作员折扣率下限(' + userDs + ')!';
            // return false;
          } else {
            return true;
          }
        }
      }
    }
    if (alertMsg == '')
      alertMsg = '当前操作员没有设置此分类商品的现场折扣权限';
    return false; // fangqg: 没有找着合适的分类，返回无权限
  }
}
/* 珠宝行业 金一现场折扣权限校验 */
const checkAuthByIndustry = (globalState) => {
  const { dhData, userdiscounts } = globalState.discount.toJS();
  const { focusedRow } = globalState.product.toJS();
  const member = globalState.member.toJS();
  const bExecMember = !!member.responseData.mid;

  let productClass = focusedRow.product_productClass_path;/* 行 商品分类id */
  productClass = productClass ? productClass.split('|') : [];
  alertMsg = '';
  for (var i = 0; i < userdiscounts.length; i++) {
    const golddiscountulimit = userdiscounts[i].golddiscountulimit;/* 金价折扣额 */
    const ratediscountdlimit = userdiscounts[i].ratediscountdlimit;/* 工费折扣率 */
    const discountdlimit = userdiscounts[i].discountdlimit;/* 折扣率 */
    let execdiscount = userdiscounts[i].execdiscount;/* 已执行会员折扣 */
    if (execdiscount == null || execdiscount == undefined) {
      execdiscount = bExecMember;
    }
    const classId = userdiscounts[i].productclass;

    /* 金价折扣额权限    工费折扣率权限  折扣率权限 */
    let gLimit = true; const rLimit = true; const dLimit = true;
    for (var j = 0; j < productClass.length; j++) {
      const cId = productClass[j];
      if (cId != '' && (classId == cId || classId == undefined || classId == '') && bExecMember == execdiscount) {
        if (golddiscountulimit && golddiscountulimit != '' && dhData.jjzke != 0) {
          if (dhData.mkjjzke > golddiscountulimit) {
            alertMsg = '当前每克金价折扣额为(' + dhData.mkjjzke + '),不得低于当前操作员金价折扣额上限(' + golddiscountulimit + ')';
            gLimit = false;
          }
        }
        if (ratediscountdlimit && ratediscountdlimit != '' && dhData.gfzke != 0) {
          if (dhData.gfzkl < ratediscountdlimit) {
            alertMsg = '当前工费折扣率为(' + dhData.gfzkl + '),不得低于当前操作员工费折扣率下限(' + ratediscountdlimit + ')';
            gLimit = false;
          }
        }
        if (discountdlimit && discountdlimit != '') {
          if (dhData.discount < discountdlimit) {
            alertMsg = '当前折扣率为(' + dhData.discount + '),不得低于当前操作员折扣率下限(' + discountdlimit + ')!';
            gLimit = false;
          }
        }
        if (gLimit === true && rLimit === true && dLimit === true)
          return true;
      }
    }
  }
  if (alertMsg == '')
    alertMsg = '当前操作员没有设置此分类商品的现场折扣权限';
  return false
}
/* 整单折扣  现场折扣权限校验 */
const checkAuthAll = (globalState) => {
  const { zdData, userdiscounts } = globalState.discount.toJS();
  const { products } = globalState.product.toJS();
  const member = globalState.member.toJS();
  const bExecMember = !!member.responseData.mid;

  for (var h = 0; h < products.length; h++) {
    let productClass = products[h].product_productClass_path;/* 行 商品分类id */
    productClass = productClass ? productClass.split('|') : [];
    const ds = zdData.discount;/* 折扣率 */
    let hasAuth = false; let isAuth = false;
    for (var j = 0; j < productClass.length; j++) {
      const cId = productClass[j];
      if (cId != '') {
        for (var i = 0; i < userdiscounts.length; i++) {
          const classId = userdiscounts[i].productclass;
          const userDs = userdiscounts[i].discountdlimit;
          let execdiscount = userdiscounts[i].execdiscount;/* 已执行会员折扣 */
          if (execdiscount == null || execdiscount == undefined) {
            execdiscount = bExecMember;
          }
          if ((classId == cId || classId == undefined || classId == '') && bExecMember == execdiscount) {
            hasAuth = true;
            if (ds < userDs) {
              alertMsg = '当前折扣率为(' + ds + '),不得低于当前操作员折扣率下限(' + userDs + ')';
              // return false;
            } else {
              isAuth = true;
              alertMsg = '';
            }
          }
        }
      }
    }
    if (!hasAuth) {
      alertMsg = '当前操作员没有设置此分类商品的现场折扣权限';
      return false;
    }
    if (!isAuth && alertMsg != '')
      return false;
  }
  return true;
}
export function cancelDiscount () {
  return function (dispatch, getState) {
    const { changeRows } = getState().discount.toJS();
    const options = getOptions();
    let data = getRetailVoucherData(getState());
    const oldVouch = discountDataBackup;
    const oldDetail = oldVouch ? oldVouch.retailVouchDetails : [];
    const details = data.retailVouchDetails;
    let fSceneDiscountSum = data.fSceneDiscountSum; let fMoneySum = data.fMoneySum;

    let hasChangeRs = false;/* 是否还存在折扣过的行 */
    for (var a in changeRows) { // eslint-disable-line no-unused-vars
      hasChangeRs = true;
      break;
    }
    if (hasChangeRs) {
      for (var key in changeRows) {
        let row = {};
        for (var i = 0; i < details.length; i++) {
          if (key == details[i].key) {
            for (var j = 0; j < oldDetail.length; j++) {
              if (key == oldDetail[j].key) {
                if (!oldDetail[j]) {
                  row = changeRows[key];
                } else {
                  row = oldDetail[j];
                }
                break;
              }
            }
            if (row.key) {
              fSceneDiscountSum = fSceneDiscountSum + (row.fSceneDiscount ? row.fSceneDiscount : 0) - details[i].fSceneDiscount;
              fSceneDiscountSum = parseFloat(fSceneDiscountSum.toFixed(options.amountofdecimal.value));
              fMoneySum = fMoneySum + row.fMoney - details[i].fMoney;
              details[i] = row;
            }
            break;
          }
        }
      }
      data.fSceneDiscountSum = fSceneDiscountSum;
      data.fMoneySum = fMoneySum;
    } else {
      if (discountDataBackup) data = discountDataBackup;
    }
    dispatch(genAction('PLATFORM_UI_BILLING_DISCOUNT_SET_COMMONDATA', { changeRows: {} }));
    discountDataBackup = null;
    data.doneActiveKey = 'dhzk';
    dispatch(genAction('PLATFORM_UI_BILLING_CANCEL_PREFERENTIAL_UPDATE_PRODUCTS', { key: 'Scene', value: data }));
    dispatch(genAction('PLATFORM_UI_BILLING_Action_HandleCancel'));
    dispatch(genAction('PLATFORM_CANCEL_DISCOUNT'));
    dispatch(cancelClear());
    if (cb.rest.terminalType == 3) dispatch(initDiscount());
  }
}
export function exec (bSuper) {
  return function (dispatch, getState) {
    const discount = getState().discount.toJS();
    const { zdData, dhData, activeKey, changeRows, isExpand, operator,
      nowOperator, applyAllRow, cachOperator, cachUserdiscounts, bCheckDiscountAuth, doneActiveKey } = discount;
    if (activeKey == 'dhzk' && doneActiveKey == 'zdzk') {
      cb.utils.alert('已经执行整单折扣，不能执行单行折扣，请取消折扣后重试！', 'error');
      return
    }
    const data = discountDataBackup || getRetailVoucherData(getState());
    const focusedRow = getState().product.toJS().focusedRow;
    const callback = (user) => {
      bSupperOperatorid = true;
      isSendMsg = false;
      dispatch(exec());
    }
    const sendMsgCallBack = (key) => {
      // cacheDiscoutKey = key;
      bSupperOperatorid = true;
      isSendMsg = true;
      dispatch(genAction('PLATFORM_UI_BILLING_OPERATOR_SET_COMMON_DATA', { waiting: true, errInfo: null }));
      dispatch(exec());
    }
    /* add by jinzh1 是否校验现场折扣权限 */
    if (bCheckDiscountAuth) {
      const checkAuth = checkOperatorDiscoutAuth(getState());
      if (!checkAuth) {
        if (cachOperator.id && cachUserdiscounts && !bSuper) {
          isSendMsg = true;
          bSupperOperatorid = true;
          dispatch(updateSuperOperator(cachOperator, cachUserdiscounts, true));
          dispatch(exec(true));
          return
        } else {
          cb.utils.confirm(`${alertMsg}，是否重新选择操作员？`, () => {
            dispatch(genAction('PLATFORM_UI_BILLING_Action_HandleCancel'));
            const params = getParams(getState());
            dispatch(showOperator(true, true, 'scenediscount', 'RM15', callback, params, sendMsgCallBack));
          }, () => {
            if (cb.rest.terminalType == 3) dispatch(initDiscount());
            dispatch(genAction('PLATFORM_UI_BILLING_Action_HandleCancel'));
          });
          alertMsg = '';
          return;
        }
      }
    }
    const config = {
      url: 'thirdparty/member/localediscount',
      method: 'POST',
      params: {
        discountdata: {},
        data: JSON.stringify(data)
      }
    };
    const retailData = cb.utils.extend(true, {}, data);
    const nowData = getRetailVoucherData(getState());
    const nowDetailData = nowData.retailVouchDetails;
    const detailData = retailData.retailVouchDetails;
    let emptData = [];
    if (activeKey == 'dhzk') {
      let noChange = false;
      if (isExpand) {
        if (dhData.gfzkl < 0 || dhData > 100) {
          cb.utils.alert('工费折扣率必须大于等于0小于等于100！', 'error');
          return
        }
        if (dhData.jjzke == 0 && dhData.gfzke == 0) {
          noChange = true;
        }
      } else {
        if (dhData.dqPrices - dhData.zhPrices == 0) noChange = true;
      }
      if (noChange) { /* 回滚 */
        const changeRs = changeRows;/* 执行过折扣的行 */
        let hasChangeRs = false;/* 是否还存在折扣过的行 */
        for (var a in changeRs) { // eslint-disable-line no-unused-vars
          hasChangeRs = true;
          break;
        }
        if (changeRs[focusedRow.key]) {
          delete changeRs[focusedRow.key];
          dispatch(genAction('PLATFORM_UI_BILLING_DISCOUNT_SET_COMMONDATA', { changeRows: changeRs }));
        } else {
          if (parseFloat(dhData.discount) == 100) {
            dispatch(genAction('PLATFORM_UI_BILLING_Action_HandleCancel'));
            return;
          }
        }
        if (!hasChangeRs) {
          discountDataBackup = null;
          data.doneActiveKey = 'dhzk';
          dispatch(genAction('PLATFORM_UI_BILLING_CANCEL_PREFERENTIAL_UPDATE_PRODUCTS', { key: 'Scene', value: data }));
        } else {
          const retailVouch = getRetailVoucherData(getState());
          const details = retailVouch.retailVouchDetails;
          let fSceneDiscountSum = 0; let fMoneySum = 0;
          for (var i = 0; i < data.retailVouchDetails.length; i++) {
            if (details[i]) {
              if (focusedRow.key == data.retailVouchDetails[i].key)
                details[i] = data.retailVouchDetails[i];
            }
          }
          details.map(detail => {
            fSceneDiscountSum += detail.fSceneDiscount ? detail.fSceneDiscount : 0;
            fMoneySum += detail.fMoney;
          })
          retailVouch.fMoneySum = fMoneySum;
          retailVouch.fSceneDiscountSum = fSceneDiscountSum;
          retailVouch.doneActiveKey = 'dhzk';
          dispatch(genAction('PLATFORM_UI_BILLING_HEADER_SET_COMMONDATA', { doneActiveKey: retailVouch.doneActiveKey }));
          dispatch(genAction('PLATFORM_UI_BILLING_EXECUTE_PREFERENTIAL_UPDATE_PRODUCTS', { key: 'Scene', value: retailVouch, backup: { backData: data, changeRows: changeRows } }));
        }
        dispatch(genAction('PLATFORM_UI_BILLING_Action_HandleCancel'));
        dispatch(genAction('PLATFORM_UI_BILLING_DISCOUNT_SET_COMMONDATA', { doneActiveKey: '' }));
        return;
      } else {
        /* 单行折扣 每次都带 当前表体行数据 */
        if (discount.applyAllRow)
          emptData = getInitRows(detailData, nowDetailData);
        else
          emptData = getDetailDataByNow(detailData, nowDetailData, focusedRow.key);
        nowData.retailVouchDetails = emptData;
        config.params.data = JSON.stringify(nowData);
        if (isExpand) {
          config.params.discountdata.dgoldprice = dhData.jjzke;
          config.params.discountdata.dsalepay = dhData.gfzke;
          config.url = 'thirdparty/member/golddiscount';
        } else {
          config.params.discountdata.money = (dhData.dqPrices - dhData.zhPrices) * dhData.quantity;
        }
        config.params.discountdata.rowkey = focusedRow.key;
      }
    } else {
      dispatch(genAction('PLATFORM_UI_BILLING_DISCOUNT_SET_COMMONDATA', { changeRows: {} }));
      if (zdData.discount == 100) {
        discountDataBackup = null;
        dispatch(genAction('PLATFORM_UI_BILLING_CANCEL_PREFERENTIAL_UPDATE_PRODUCTS', { key: 'Scene', value: data }));
        dispatch(genAction('PLATFORM_UI_BILLING_Action_HandleCancel'));
        dispatch(genAction('PLATFORM_UI_BILLING_DISCOUNT_SET_COMMONDATA', { doneActiveKey: '' }));
        return;
      }
      config.params.discountdata.money = zdData.jmPrices;
      emptData = getInitRows(detailData, nowDetailData);
      nowData.retailVouchDetails = emptData;
      config.params.data = JSON.stringify(nowData);
    }
    if (discount.applyAllRow && activeKey == 'dhzk') {
      config.params.discountdata = { rate: dhData.discount };
    }
    proxy(config)
      .then(json => {
        if (json.code !== 200) {
          cb.utils.alert(json.message, 'error');
          return;
        }
        var nowData, backDetail, dataDetail;
        if (!discountDataBackup) {
          discountDataBackup = data;
        } else {
          nowData = getRetailVoucherData(getState());
          backDetail = discountDataBackup.retailVouchDetails ? discountDataBackup.retailVouchDetails : [];
          dataDetail = nowData.retailVouchDetails ? nowData.retailVouchDetails : [];
          if (backDetail.length != dataDetail.length) {
            backDetail.map((backd, index) => {
              for (var i = 0; i < dataDetail.length; i++) {
                if (backd.key == dataDetail[i].key) {
                  dataDetail[i] = backd;
                }
              }
            });
            discountDataBackup.retailVouchDetails = dataDetail;
          }
        }
        const products = json.data;

        if ((activeKey == 'zdzk' || applyAllRow) && bSupperOperatorid == true) {
          products.retailVouchDetails.forEach(function (ele, index) {
            if (operator.id != nowOperator.id) {
              ele.iSupperOperatorid = operator.id;
              ele.iSupperOperatorid_name = operator.name;
              ele.cPriceReason = '现场折扣审批';
              /* modify  如果行上已经存在折扣授权人mphone 在赋一遍 */
              if (isSendMsg && (!bSuper || (dataDetail && dataDetail[index] && dataDetail[index].mphone == operator.mobile)))
                ele.mphone = operator.mobile;
            }
          }, this);
        }
        if (activeKey == 'dhzk' && !applyAllRow) {
          if (bSupperOperatorid == true) {
            products.retailVouchDetails.forEach(function (ele, index) {
              if (ele.key == focusedRow.key) {
                if (operator.id != nowOperator.id) {
                  ele.iSupperOperatorid = operator.id;
                  ele.iSupperOperatorid_name = operator.name;
                  ele.cPriceReason = '现场折扣审批';
                  /* modify  如果行上已经存在折扣授权人mphone 在赋一遍 */
                  if (isSendMsg && (!bSuper || (dataDetail && dataDetail[index] && dataDetail[index].mphone == operator.mobile)))
                    ele.mphone = operator.mobile;
                }
              }
            }, this);
          }
          const changeRs = changeRows;
          const retailData = products.retailVouchDetails;
          retailData.forEach(function (ele) {
            if (applyAllRow) {
              changeRs[ele.key] = ele;
            } else {
              // if (ele.key == focusedRow.key)
              if (ele.fSceneDiscount != undefined && ele.fSceneDiscount != 0)
                changeRs[ele.key] = ele;
            }
          }, this);
          dispatch(genAction('PLATFORM_UI_BILLING_DISCOUNT_SET_COMMONDATA', { changeRows: changeRs }));
        }
        if (isSendMsg) isSendMsg = false;
        products.doneActiveKey = activeKey;
        dispatch(genAction('PLATFORM_UI_BILLING_HEADER_SET_COMMONDATA', { doneActiveKey: products.doneActiveKey }));
        dispatch(genAction('PLATFORM_UI_BILLING_EXECUTE_PREFERENTIAL_UPDATE_PRODUCTS', { key: 'Scene', value: products, backup: { backData: data, changeRows: changeRows } }));
        dispatch(genAction('PLATFORM_UI_BILLING_Action_HandleCancel'));
        dispatch(genAction('PLATFORM_UI_BILLING_DISCOUNT_SET_COMMONDATA', { doneActiveKey: activeKey, operator: discount.nowOperator, userdiscounts: discount.nowUserdiscounts }));
        dispatch(setSearchBoxFocus(true));
        if (cb.rest.terminalType == 3) dispatch(initData());
      });
  }
}
/* 校验是否允许 现场折扣 */
export function checkOpen (focusedRow, bDeliveryModify, billingStatus) {
  const { key, retailPriceDimension, bCanDiscount, fPrice, fSceneDiscount } = focusedRow;

  const exchangeBillMapping = getExchangeBillMapping();
  if (exchangeBillMapping[key] && retailPriceDimension == 1) {
    cb.utils.alert('没有可以执行现场折扣的商品行', 'error');
    return false;
  }

  if (!bCanDiscount || (fPrice + (fSceneDiscount || 0)) == 0) {
    cb.utils.alert('当前行不参与折扣计算/金额为零，不能执行现场折扣', 'error');
    return false;
  }
  // if (false && billingStatus == 'PresellBill' && bDeliveryModify == true) {
  //   cb.utils.alert('预订状态且交货时可修改商品的情况下，不允许执行现场折扣', 'error');
  //   return false;
  // }
  return true;
}
export function canOpen (dispatch, globalState, callback) {
  /* 允许跳过折扣校验 */
  if (!beforeCheckDiscount()) {
    callback();
    return
  }
  const { focusedRow } = globalState.product.toJS();
  const { billingStatus, bDeliveryModify } = globalState.uretailHeader.toJS();
  const authData = globalState.actions.toJS().authData;/* 权限列表 */
  const allowOpen = checkOpen(focusedRow, bDeliveryModify, billingStatus);
  const data = getRetailVoucherData(globalState);
  const promotionMutexMap = getPromotionMutexMap();
  if (promotionMutexMap.iSpotDiscountEnable) {
    const fPromotionSum = data.fPromotionSum;
    if (fPromotionSum && fPromotionSum > 0) {
      cb.utils.alert('已经执行了促销活动，不允许执行现场折扣！', 'error');
      return
    }
  }
  if (!allowOpen) return;
  dispatch(initDiscount());
  authData.forEach(auth => {
    if (auth.command == 'SceneDiscount') {
      if (!auth.isHasAuth) {
        const params = getParams(globalState, true);
        dispatch(showOperator(true, true, 'scenediscount', 'RM15', callback, params, null, true));
        bSupperOperatorid = true;
      } else {
        const { operator, nowOperator } = globalState.discount.toJS();
        callback();
        if (!operator.id || operator.id != nowOperator.id) {
          dispatch(getOperator());
          bSupperOperatorid = false;
        } else {
          dispatch(getUserDiscounts(operator));
        }
      }
    }
  });
}
export function initDiscount () {
  return function (dispatch, getState) {
    const discount = getState().discount.toJS();
    const { focusedRow } = getState().product.toJS();
    let priceCalMode = focusedRow['product_productSkuProps!define4'];/* 销售计价方式 */
    if (!priceCalMode || priceCalMode == undefined || priceCalMode == null)
      priceCalMode = focusedRow['product_productProps!define1'];
    const options = getOptions();
    const { fMoney, fSceneDiscount, fQuantity, fSceneDiscountRate } = focusedRow;
    const industry = getState().user.toJS().tenant.industry;/* 所属行业 */
    const amountofdecimal = options.amountofdecimal.value;/* 金额小数位 */
    const monovalentdecimal = options.monovalentdecimal.value;/* 单价小数位 */
    const data = getRetailVoucherData(getState());
    if (industry == 17 && priceCalMode && (priceCalMode == '按克')) {
      // if (discount.dhData.discount == 100 || (fSceneDiscountRate ? fSceneDiscountRate : 100) == 100)) {
      let dqPrices = 0; let jjzke = 0; let gfzke = 0; let weight = 0; let mkjjzke = 0; let xsgfjjfs = 0; let xsgf = 0; let gfzkl = 0; let mkgfzke = 0; let zhPrices = 0; let discount1 = 100;
      // 售价计算方式为“按克”的，促销价＝零售价－金价折扣额－工费折扣额
      if (focusedRow['retailVouchDetailCustom!define4'])
        jjzke = focusedRow['retailVouchDetailCustom!define4'];/* 金价折扣额-表体自定义项4 */
      if (focusedRow['retailVouchDetailCustom!define5'])
        gfzke = focusedRow['retailVouchDetailCustom!define5'];/* 工费折扣额-表体自定义项5 */
      if (focusedRow['retailVouchDetailCustom!define1'])
        weight = focusedRow['retailVouchDetailCustom!define1'];/* 重量-表体自定义项1 */
      if (!isNaN(jjzke / weight))
        mkjjzke = parseFloat(jjzke / weight).toFixed(amountofdecimal);/* 每克金价折扣额-金价折扣额/重量 */
      if (!isNaN(gfzke / weight))
        mkgfzke = parseFloat(gfzke / weight).toFixed(amountofdecimal);/* 每克工费折扣额-工费折扣额/重量 */
      if (focusedRow['product_productSkuProps!define2'])
        xsgfjjfs = focusedRow['product_productSkuProps!define2'];/* 销售工费计价方式-SKU自定义项2 */
      if (focusedRow['retailVouchDetailCustom!define3'])
        xsgf = focusedRow['retailVouchDetailCustom!define3'];/* 销售工费-表体自定义项3 */
      dqPrices = (fMoney + (fSceneDiscount || 0)) / fQuantity;
      // zhPrices = dqPrices;
      zhPrices = parseFloat(dqPrices - ((fSceneDiscount || 0) / fQuantity)).toFixed(amountofdecimal);

      if (!isNaN(zhPrices / dqPrices))
        discount1 = zhPrices / dqPrices * 100;
      if (xsgfjjfs == '按克') {
        if (!isNaN((weight * xsgf - gfzke) / (weight * xsgf)))
          gfzkl = (weight * xsgf - gfzke) / (weight * xsgf) * 100;
      } else {
        if (!isNaN((xsgf - gfzke) / xsgf))
          gfzkl = (xsgf - gfzke) / xsgf * 100;
      }
      if (gfzkl == 0) gfzkl = 100;
      const dhData = { dqPrices, jjzke, gfzke, weight, mkjjzke, mkgfzke, xsgfjjfs, xsgf, gfzkl, zhPrices, discount: discount1 };
      let focusKey = discount.focusKey;
      if (focusKey != 'jjzke' && focusKey != 'gfzke' && focusKey != 'mkgfzke' && focusKey != 'mkjjzke') {
        focusKey = 'mkjjzke';
      }
      dispatch(genAction('PLATFORM_UI_BILLING_DISCOUNT_SET_COMMONDATA', { focusKey, dhData, isExpand: true, activeKey: 'dhzk', industry, options }));
      // }
      // dispatch(genAction('PLATFORM_UI_BILLING_DISCOUNT_SET_COMMONDATA', { isExpand: true, activeKey: 'dhzk', industry, options }));
      // callback();
    } else {
      /* 整单金额 */
      const zdData = discount.zdData;
      // if (zdData.discount == 100) {
      zdData.zdPrices = (data.fMoneySum + data.fSceneDiscountSum).toFixed(monovalentdecimal);
      zdData.jmPrices = (data.fSceneDiscountSum).toFixed(amountofdecimal);
      zdData.jhPrices = (data.fMoneySum).toFixed(amountofdecimal);
      zdData.discount = ((zdData.jhPrices / zdData.zdPrices) * 100).toFixed(2);
      // }
      /* 当前单价 */
      // let bdPrices = fMoney + (fSceneDiscount ? fSceneDiscount : 0);
      const dqPrices = (fMoney + (fSceneDiscount || 0)) / fQuantity;
      const zhPrices = parseFloat(dqPrices - ((fSceneDiscount || 0) / fQuantity)).toFixed(amountofdecimal);
      const bdPrices = zhPrices * fQuantity;
      const dhData = {
        quantity: fQuantity, money: fMoney,
        dqPrices: parseFloat(dqPrices).toFixed(monovalentdecimal),
        zhPrices: parseFloat(zhPrices).toFixed(monovalentdecimal),
        bdPrices: parseFloat(bdPrices).toFixed(amountofdecimal),
        discount: fSceneDiscountRate || 100
      };
      if (discount.activeKey == 'dhzk') {
        const focusKey = (discount.focusKey != 'discount' && discount.focusKey != 'zhPrices' && discount.focusKey != 'bdPrices') ? 'discount' : discount.focusKey;
        dispatch(genAction('PLATFORM_UI_BILLING_DISCOUNT_SET_COMMONDATA', { focusKey, dhData, zdData, isExpand: false, industry, options }));
      } else {
        dispatch(genAction('PLATFORM_UI_BILLING_DISCOUNT_SET_COMMONDATA', { zdData, dhData, isExpand: false, industry, options }));
      }
    }
  }
}
const getParams = (globalState, noAuth) => {
  const industry = globalState.user.toJS().tenant.industry;/* 所属行业 */
  const { dhData, zdData, activeKey } = globalState.discount.toJS();
  const { focusedRow, products } = globalState.product.toJS();
  const { responseData } = globalState.member.toJS();
  const { applyAllRow } = globalState.discount.toJS();
  let priceCalMode = focusedRow['product_productSkuProps!define4'];/* 销售计价方式 */
  if (!priceCalMode || priceCalMode == undefined || priceCalMode == null) {
    priceCalMode = focusedRow['product_productProps!define1'];
  }
  const memberid = responseData.mid;
  const params = {
    bdiscount: true, discount: 0, memberid: memberid,
    product: [], golddiscount: null, ratediscount: null
  };
  if (activeKey == 'dhzk') {
    /* 珠宝行业 且销售计价方式为按克 */
    if (industry == 17 && priceCalMode && (priceCalMode == '按克')) {
      params.discount = dhData.discount;
      params.golddiscount = dhData.mkjjzke;
      params.ratediscount = dhData.gfzkl;
    } else {
      params.discount = dhData.discount;
    }
    if (applyAllRow) {
      params.product = products;
    } else {
      params.product.push(focusedRow);
    }
  } else {
    params.discount = zdData.discount;
    params.product = products;
  }
  if (noAuth) params.discount = 100;
  return params;
}
export function getDetailDataByNow (old, now, focusKey) {
  const oldData = [];
  now.map(ele => {
    if (ele.key == focusKey && ele.fSceneDiscount && ele.fSceneDiscount != 0) {
      for (var i = 0; i < old.length; i++) {
        if (focusKey == old[i].key) {
          oldData.push(old[i]);
          break;
        }
      }
    } else {
      oldData.push(ele);
    }
  })
  return oldData;
}
export function getInitRows (old, now) {
  const oldData = [];
  now.map(ele => {
    if (ele.fSceneDiscount && ele.fSceneDiscount != 0) {
      for (var i = 0; i < old.length; i++) {
        if (ele.key == old[i].key) {
          oldData.push(old[i]);
          break;
        }
      }
    } else {
      oldData.push(ele);
    }
  });
  return oldData;
}
export function clearMsgInfo () {
  return function (dispatch, getState) {
    // cacheDiscoutData = null;
    isSendMsg = false;
    // cacheDiscoutKey = null;
  }
}
const beforeCheckDiscount = () => {
  const billingViewModel = getBillingViewModel();
  if (!billingViewModel) {
    cb.utils.alert('正在初始化，请稍后重试', 'error');
    return false
  }
  return billingViewModel.execute('beforeCheckDiscount', {})
}
